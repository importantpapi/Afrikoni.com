-- ============================================
-- SMILE ID VERIFICATION INTEGRATION
-- ============================================
-- This migration adds verification fields to support automated
-- KYC/KYB verification through Smile ID for African businesses.

-- ============================================
-- 1. CREATE VERIFICATION STATUS ENUM
-- ============================================

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'PENDING',
        'IN_PROGRESS',
        'VERIFIED',
        'REJECTED',
        'REQUIRES_REVIEW'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. ADD VERIFICATION FIELDS TO COMPANIES TABLE
-- ============================================

-- Add verification status
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'PENDING';

-- Add Smile ID job tracking
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS smile_id_job_id TEXT;

-- Add verification timestamps
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS verification_initiated_at TIMESTAMPTZ;

-- Add verification type
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS verification_type TEXT;

-- Add verification result details
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS verification_result_code TEXT;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS verification_result_text TEXT;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS verification_actions JSONB;

-- Add business registration details for verification
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS business_registration_number TEXT;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS business_registration_country TEXT;

-- ============================================
-- 3. ADD KYC FIELDS TO PROFILES TABLE
-- ============================================

-- Add KYC status for individual verification
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kyc_status verification_status DEFAULT 'PENDING';

-- Add Smile ID job ID for individual verification
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS smile_id_job_id TEXT;

-- Add KYC timestamps
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kyc_initiated_at TIMESTAMPTZ;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;

-- Add KYC result details
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kyc_result_code TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kyc_result_text TEXT;

-- ============================================
-- 4. CREATE VERIFICATION_JOBS TABLE
-- ============================================
-- Tracks all verification attempts for audit and retry purposes

CREATE TABLE IF NOT EXISTS public.verification_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL UNIQUE,
    job_type TEXT NOT NULL, -- 'business_verification' or 'identity_verification'
    status verification_status DEFAULT 'PENDING',
    country_code TEXT,
    id_type TEXT,
    id_number TEXT, -- Encrypted/hashed for security
    request_payload JSONB,
    response_payload JSONB,
    result_code TEXT,
    result_text TEXT,
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for job lookups
CREATE INDEX IF NOT EXISTS idx_verification_jobs_job_id ON public.verification_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_verification_jobs_company_id ON public.verification_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_verification_jobs_profile_id ON public.verification_jobs(profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_jobs_status ON public.verification_jobs(status);

-- ============================================
-- 5. CREATE INDEXES FOR VERIFICATION LOOKUPS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON public.companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_companies_smile_id_job_id ON public.companies(smile_id_job_id);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_smile_id_job_id ON public.profiles(smile_id_job_id);

-- ============================================
-- 6. RLS POLICIES FOR VERIFICATION_JOBS TABLE
-- ============================================

ALTER TABLE public.verification_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view verification jobs for their own company/profile
CREATE POLICY "verification_jobs_select_own"
ON public.verification_jobs
FOR SELECT
USING (
    -- Admin can see all
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
    OR
    -- Users can see jobs for their company
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR
    -- Users can see their own profile verification jobs
    profile_id = auth.uid()
);

-- Only admins can insert/update/delete (verification jobs are system-managed)
CREATE POLICY "verification_jobs_insert_admin"
ON public.verification_jobs
FOR INSERT
WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "verification_jobs_update_admin"
ON public.verification_jobs
FOR UPDATE
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "verification_jobs_delete_admin"
ON public.verification_jobs
FOR DELETE
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to update company verification status (called by webhook)
CREATE OR REPLACE FUNCTION update_company_verification(
    p_job_id TEXT,
    p_status verification_status,
    p_result_code TEXT,
    p_result_text TEXT,
    p_actions JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update the company
    UPDATE public.companies
    SET
        verification_status = p_status,
        verified_at = CASE WHEN p_status = 'VERIFIED' THEN NOW() ELSE NULL END,
        verification_result_code = p_result_code,
        verification_result_text = p_result_text,
        verification_actions = p_actions
    WHERE smile_id_job_id = p_job_id;

    -- Update the verification job record
    UPDATE public.verification_jobs
    SET
        status = p_status,
        result_code = p_result_code,
        result_text = p_result_text,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE job_id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update profile KYC status (called by webhook)
CREATE OR REPLACE FUNCTION update_profile_kyc(
    p_job_id TEXT,
    p_status verification_status,
    p_result_code TEXT,
    p_result_text TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Update the profile
    UPDATE public.profiles
    SET
        kyc_status = p_status,
        kyc_verified_at = CASE WHEN p_status = 'VERIFIED' THEN NOW() ELSE NULL END,
        kyc_result_code = p_result_code,
        kyc_result_text = p_result_text
    WHERE smile_id_job_id = p_job_id;

    -- Update the verification job record
    UPDATE public.verification_jobs
    SET
        status = p_status,
        result_code = p_result_code,
        result_text = p_result_text,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE job_id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_verification_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verification_jobs_updated_at ON public.verification_jobs;
CREATE TRIGGER trigger_verification_jobs_updated_at
    BEFORE UPDATE ON public.verification_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_jobs_updated_at();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.companies.verification_status IS 'Current verification status from Smile ID: PENDING, IN_PROGRESS, VERIFIED, REJECTED, REQUIRES_REVIEW';
COMMENT ON COLUMN public.companies.smile_id_job_id IS 'Unique job ID from Smile ID verification request';
COMMENT ON COLUMN public.companies.verified_at IS 'Timestamp when business verification was completed successfully';
COMMENT ON TABLE public.verification_jobs IS 'Audit trail of all verification attempts through Smile ID';
