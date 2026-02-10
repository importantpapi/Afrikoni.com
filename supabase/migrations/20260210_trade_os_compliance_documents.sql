-- ============================================================================
-- COMPLIANCE DOCUMENTS (AfCFTA v1)
-- Date: 2026-02-10
-- Purpose: Store and validate trade compliance documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  document_type varchar(100) NOT NULL,
  document_name varchar(255),
  file_url text,
  validation_status varchar(30) DEFAULT 'pending', -- pending, approved, rejected
  metadata jsonb DEFAULT '{}'::jsonb,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_documents_trade_id ON public.compliance_documents(trade_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_type ON public.compliance_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_status ON public.compliance_documents(validation_status);

ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_documents_select" ON public.compliance_documents;
CREATE POLICY "compliance_documents_select"
ON public.compliance_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = compliance_documents.trade_id
      AND (t.buyer_id = current_company_id() OR t.seller_id = current_company_id())
  )
);

DROP POLICY IF EXISTS "compliance_documents_insert" ON public.compliance_documents;
CREATE POLICY "compliance_documents_insert"
ON public.compliance_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = compliance_documents.trade_id
      AND (t.buyer_id = current_company_id() OR t.seller_id = current_company_id())
  )
);
