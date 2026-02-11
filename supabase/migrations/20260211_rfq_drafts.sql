-- MIGRATE: 20260211_rfq_drafts.sql
-- DESCRIPTION: Establish rfq_drafts table for high-velocity trade saving

CREATE TABLE IF NOT EXISTS public.rfq_drafts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    current_step INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- RLS
ALTER TABLE public.rfq_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own drafts"
    ON public.rfq_drafts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own drafts"
    ON public.rfq_drafts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own drafts"
    ON public.rfq_drafts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own drafts"
    ON public.rfq_drafts FOR DELETE
    USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER handle_updated_at_rfq_drafts
    BEFORE UPDATE ON public.rfq_drafts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.rfq_drafts IS 'Temporary storage for RFQ drafts in the Quick Trade Wizard.';
