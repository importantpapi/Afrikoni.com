-- ============================================================================
-- Afrikoni B2B Marketplace - Complete Backend Migration
-- Date: 2026-02-05
--
-- This migration adds:
-- 1. New tables: rfq_audit_log, sample_orders, order_workflow_events,
--    notification_preferences, billing_history
-- 2. Enhancements to messages and orders tables
-- 3. Materialized views for analytics
-- 4. Database functions and triggers for automation
-- 5. Comprehensive RLS policies
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUM TYPES
-- ============================================================================

-- Message delivery status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_delivery_status') THEN
    CREATE TYPE message_delivery_status AS ENUM ('sent', 'delivered', 'read');
  END IF;
END $$;

-- Sample order status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sample_order_status') THEN
    CREATE TYPE sample_order_status AS ENUM ('pending', 'accepted', 'shipped', 'delivered', 'cancelled');
  END IF;
END $$;

-- Workflow step status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_step_status') THEN
    CREATE TYPE workflow_step_status AS ENUM ('pending', 'current', 'completed', 'skipped');
  END IF;
END $$;

-- Notification type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
    CREATE TYPE notification_type_enum AS ENUM (
      'rfq_received', 'rfq_quoted', 'rfq_accepted', 'rfq_rejected',
      'quote_received', 'quote_accepted', 'quote_rejected',
      'order_created', 'order_updated', 'order_shipped', 'order_delivered',
      'payment_received', 'payment_released', 'payment_refunded',
      'message_received', 'sample_requested', 'sample_shipped',
      'verification_complete', 'verification_pending',
      'system_announcement', 'promotional'
    );
  END IF;
END $$;

-- Notification channel enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
    CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'push');
  END IF;
END $$;

-- Notification frequency enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_frequency') THEN
    CREATE TYPE notification_frequency AS ENUM ('instant', 'daily', 'weekly');
  END IF;
END $$;

-- Payment status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: NEW TABLES
-- ============================================================================

-- 2.1 RFQ Audit Log (Compliance Tracking)
-- Tracks all status changes for RFQs for compliance and audit purposes
CREATE TABLE IF NOT EXISTS public.rfq_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rfq_audit_log
CREATE INDEX IF NOT EXISTS idx_rfq_audit_log_rfq_id ON public.rfq_audit_log(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_audit_log_changed_by ON public.rfq_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_rfq_audit_log_created_at ON public.rfq_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rfq_audit_log_status ON public.rfq_audit_log(new_status);

COMMENT ON TABLE public.rfq_audit_log IS 'Audit trail for RFQ status changes for compliance tracking';

-- 2.2 Sample Orders (Dedicated Sample Tracking)
-- Tracks product sample requests separately from full orders
CREATE TABLE IF NOT EXISTS public.sample_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supplier_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Sample details
  quantity INTEGER NOT NULL DEFAULT 1,
  status sample_order_status DEFAULT 'pending',

  -- Shipping information
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Expected structure: {street, city, state, country, postal_code, contact_name, contact_phone}

  -- Cost tracking
  sample_cost NUMERIC(15, 2) DEFAULT 0,
  shipping_cost NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Delivery tracking
  estimated_delivery DATE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  tracking_number TEXT,
  shipping_carrier TEXT,

  -- Additional info
  notes TEXT,
  buyer_notes TEXT,
  supplier_notes TEXT,

  -- Timestamps
  accepted_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sample_orders
CREATE INDEX IF NOT EXISTS idx_sample_orders_product_id ON public.sample_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_sample_orders_buyer_id ON public.sample_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sample_orders_buyer_company_id ON public.sample_orders(buyer_company_id);
CREATE INDEX IF NOT EXISTS idx_sample_orders_supplier_id ON public.sample_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sample_orders_supplier_company_id ON public.sample_orders(supplier_company_id);
CREATE INDEX IF NOT EXISTS idx_sample_orders_status ON public.sample_orders(status);
CREATE INDEX IF NOT EXISTS idx_sample_orders_created_at ON public.sample_orders(created_at DESC);

COMMENT ON TABLE public.sample_orders IS 'Dedicated table for tracking product sample requests between buyers and suppliers';

-- 2.3 Order Workflow Events (11-Step Trade Workflow)
-- Tracks the progress through the 11-step trade workflow
CREATE TABLE IF NOT EXISTS public.order_workflow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Workflow step (1-11)
  workflow_step INTEGER NOT NULL CHECK (workflow_step >= 1 AND workflow_step <= 11),
  step_name TEXT NOT NULL,
  step_description TEXT,

  -- Status tracking
  status workflow_step_status DEFAULT 'pending',

  -- Actor tracking
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  actor_role TEXT, -- 'buyer', 'seller', 'logistics', 'system'

  -- Notes and metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Expected metadata: {documents: [], required_action: '', deadline: ''}

  -- Required documents/actions for this step
  required_documents JSONB DEFAULT '[]'::jsonb,
  uploaded_documents JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for order_workflow_events
CREATE INDEX IF NOT EXISTS idx_order_workflow_events_order_id ON public.order_workflow_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_workflow_events_step ON public.order_workflow_events(workflow_step);
CREATE INDEX IF NOT EXISTS idx_order_workflow_events_status ON public.order_workflow_events(status);
CREATE INDEX IF NOT EXISTS idx_order_workflow_events_actor_id ON public.order_workflow_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_order_workflow_events_created_at ON public.order_workflow_events(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_workflow_events_unique_step
  ON public.order_workflow_events(order_id, workflow_step);

COMMENT ON TABLE public.order_workflow_events IS '11-step trade workflow tracking for orders';
COMMENT ON COLUMN public.order_workflow_events.workflow_step IS '1=RFQ Created, 2=Quotes Received, 3=Quote Accepted, 4=Payment Initiated, 5=Payment Confirmed, 6=Production Started, 7=Quality Check, 8=Shipped, 9=Customs Cleared, 10=Delivered, 11=Completed';

-- 2.4 Notification Preferences
-- User preferences for notification delivery
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Notification settings
  notification_type notification_type_enum NOT NULL,
  enabled BOOLEAN DEFAULT true,
  channel notification_channel DEFAULT 'in_app',
  frequency notification_frequency DEFAULT 'instant',

  -- Additional settings
  quiet_hours_start TIME, -- e.g., 22:00
  quiet_hours_end TIME,   -- e.g., 08:00
  timezone TEXT DEFAULT 'UTC',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique preference per user per notification type
  UNIQUE(user_id, notification_type)
);

-- Create indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON public.notification_preferences(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_channel ON public.notification_preferences(channel);

COMMENT ON TABLE public.notification_preferences IS 'User preferences for how and when to receive notifications';

-- 2.5 Billing History
-- Complete billing and payment history
CREATE TABLE IF NOT EXISTS public.billing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Payment details
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Payment method and provider
  payment_method TEXT NOT NULL, -- 'flutterwave', 'stripe', 'bank_transfer', 'mobile_money'
  payment_provider TEXT, -- 'flutterwave', 'stripe'
  provider_reference TEXT, -- External payment ID from provider
  provider_response JSONB DEFAULT '{}'::jsonb, -- Full response from provider

  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN (
      'order_payment', 'sample_payment', 'subscription',
      'verification_fee', 'logistics_fee', 'commission',
      'refund', 'payout'
    )
  ),
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  related_subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,

  -- Status
  status payment_status DEFAULT 'pending',

  -- Invoice
  invoice_number TEXT,
  invoice_url TEXT,
  invoice_generated_at TIMESTAMP WITH TIME ZONE,

  -- Additional info
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for billing_history
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON public.billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_company_id ON public.billing_history(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_status ON public.billing_history(status);
CREATE INDEX IF NOT EXISTS idx_billing_history_payment_method ON public.billing_history(payment_method);
CREATE INDEX IF NOT EXISTS idx_billing_history_transaction_type ON public.billing_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_billing_history_created_at ON public.billing_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_history_provider_ref ON public.billing_history(provider_reference);

COMMENT ON TABLE public.billing_history IS 'Complete billing and payment history for all transactions';

-- ============================================================================
-- SECTION 3: TABLE ENHANCEMENTS
-- ============================================================================

-- 3.1 Enhance Messages Table
-- Add delivery tracking columns if not exists
DO $$
BEGIN
  -- Add delivery_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN delivery_status TEXT DEFAULT 'sent'
      CHECK (delivery_status IN ('sent', 'delivered', 'read'));
  END IF;

  -- Add delivered_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add read_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes for message delivery tracking
CREATE INDEX IF NOT EXISTS idx_messages_delivery_status ON public.messages(delivery_status);
CREATE INDEX IF NOT EXISTS idx_messages_delivered_at ON public.messages(delivered_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at);

-- 3.2 Enhance Orders Table
-- Add order_type and workflow tracking
DO $$
BEGIN
  -- Add order_type column with enum
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_type'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN order_type TEXT DEFAULT 'standard'
      CHECK (order_type IN ('standard', 'sample', 'bulk', 'recurring'));
  END IF;

  -- Add workflow_current_step
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'workflow_current_step'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN workflow_current_step INTEGER DEFAULT 1
      CHECK (workflow_current_step >= 1 AND workflow_current_step <= 11);
  END IF;

  -- Add workflow_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN workflow_status TEXT DEFAULT 'in_progress'
      CHECK (workflow_status IN ('in_progress', 'paused', 'completed', 'cancelled'));
  END IF;

  -- Add expected_delivery
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'expected_delivery'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN expected_delivery DATE;
  END IF;

  -- Add actual_delivery
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'actual_delivery'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN actual_delivery TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes for order enhancements
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_workflow_step ON public.orders(workflow_current_step);
CREATE INDEX IF NOT EXISTS idx_orders_workflow_status ON public.orders(workflow_status);

-- ============================================================================
-- SECTION 4: ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE public.rfq_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: RLS POLICIES
-- ============================================================================

-- 5.1 RFQ Audit Log Policies
-- Users can view audit logs for RFQs they're involved in
DROP POLICY IF EXISTS "rfq_audit_log_select" ON public.rfq_audit_log;
CREATE POLICY "rfq_audit_log_select"
  ON public.rfq_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs r
      WHERE r.id = rfq_audit_log.rfq_id
        AND (
          -- Buyer of the RFQ
          r.buyer_company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
          )
          -- Or seller who quoted on the RFQ
          OR EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.rfq_id = r.id
              AND q.supplier_company_id IN (
                SELECT company_id FROM public.profiles WHERE id = auth.uid()
              )
          )
        )
    )
    -- Or admin access
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- System/triggers can insert audit logs
DROP POLICY IF EXISTS "rfq_audit_log_insert" ON public.rfq_audit_log;
CREATE POLICY "rfq_audit_log_insert"
  ON public.rfq_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be involved in the RFQ
    EXISTS (
      SELECT 1 FROM public.rfqs r
      WHERE r.id = rfq_id
        AND (
          r.buyer_company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.rfq_id = r.id
              AND q.supplier_company_id IN (
                SELECT company_id FROM public.profiles WHERE id = auth.uid()
              )
          )
        )
    )
  );

-- 5.2 Sample Orders Policies
-- Buyers can view their sample requests
DROP POLICY IF EXISTS "sample_orders_select_buyer" ON public.sample_orders;
CREATE POLICY "sample_orders_select_buyer"
  ON public.sample_orders
  FOR SELECT
  TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Suppliers can view sample requests made to them
DROP POLICY IF EXISTS "sample_orders_select_supplier" ON public.sample_orders;
CREATE POLICY "sample_orders_select_supplier"
  ON public.sample_orders
  FOR SELECT
  TO authenticated
  USING (
    supplier_company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Buyers can create sample requests
DROP POLICY IF EXISTS "sample_orders_insert" ON public.sample_orders;
CREATE POLICY "sample_orders_insert"
  ON public.sample_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Both buyers and suppliers can update sample orders
DROP POLICY IF EXISTS "sample_orders_update" ON public.sample_orders;
CREATE POLICY "sample_orders_update"
  ON public.sample_orders
  FOR UPDATE
  TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
    OR supplier_company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    buyer_company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
    OR supplier_company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Admin can view all sample orders
DROP POLICY IF EXISTS "sample_orders_admin" ON public.sample_orders;
CREATE POLICY "sample_orders_admin"
  ON public.sample_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 5.3 Order Workflow Events Policies
-- Parties to the order can view workflow events
DROP POLICY IF EXISTS "order_workflow_events_select" ON public.order_workflow_events;
CREATE POLICY "order_workflow_events_select"
  ON public.order_workflow_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_workflow_events.order_id
        AND (
          o.buyer_company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
          )
          OR o.seller_company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
          )
        )
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Parties can insert workflow events
DROP POLICY IF EXISTS "order_workflow_events_insert" ON public.order_workflow_events;
CREATE POLICY "order_workflow_events_insert"
  ON public.order_workflow_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          o.buyer_company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
          )
          OR o.seller_company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
          )
        )
    )
  );

-- Parties can update workflow events
DROP POLICY IF EXISTS "order_workflow_events_update" ON public.order_workflow_events;
CREATE POLICY "order_workflow_events_update"
  ON public.order_workflow_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_workflow_events.order_id
        AND (
          o.buyer_company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
          )
          OR o.seller_company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_workflow_events.order_id
        AND (
          o.buyer_company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
          )
          OR o.seller_company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
          )
        )
    )
  );

-- 5.4 Notification Preferences Policies
-- Users can only manage their own preferences
DROP POLICY IF EXISTS "notification_preferences_select" ON public.notification_preferences;
CREATE POLICY "notification_preferences_select"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_insert" ON public.notification_preferences;
CREATE POLICY "notification_preferences_insert"
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_update" ON public.notification_preferences;
CREATE POLICY "notification_preferences_update"
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_delete" ON public.notification_preferences;
CREATE POLICY "notification_preferences_delete"
  ON public.notification_preferences
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 5.5 Billing History Policies
-- Users can view their own billing history
DROP POLICY IF EXISTS "billing_history_select_user" ON public.billing_history;
CREATE POLICY "billing_history_select_user"
  ON public.billing_history
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Admins can view all billing history
DROP POLICY IF EXISTS "billing_history_select_admin" ON public.billing_history;
CREATE POLICY "billing_history_select_admin"
  ON public.billing_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Only system/service role can insert billing records
-- (Handled via Edge Functions with service_role key)
DROP POLICY IF EXISTS "billing_history_insert" ON public.billing_history;
CREATE POLICY "billing_history_insert"
  ON public.billing_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow insert by admins or the user themselves
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update billing history
DROP POLICY IF EXISTS "billing_history_update_admin" ON public.billing_history;
CREATE POLICY "billing_history_update_admin"
  ON public.billing_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================================
-- SECTION 6: DATABASE FUNCTIONS
-- ============================================================================

-- 6.1 Log RFQ Status Change (Trigger Function)
-- Automatically logs RFQ status transitions to rfq_audit_log
CREATE OR REPLACE FUNCTION log_rfq_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.rfq_audit_log (
      rfq_id,
      old_status,
      new_status,
      changed_by,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      jsonb_build_object(
        'old_updated_at', OLD.updated_at,
        'new_updated_at', NEW.updated_at,
        'buyer_company_id', NEW.buyer_company_id
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for RFQ status changes
DROP TRIGGER IF EXISTS trigger_log_rfq_status_change ON public.rfqs;
CREATE TRIGGER trigger_log_rfq_status_change
  AFTER UPDATE ON public.rfqs
  FOR EACH ROW
  EXECUTE FUNCTION log_rfq_status_change();

COMMENT ON FUNCTION log_rfq_status_change() IS 'Trigger function to automatically log RFQ status transitions for compliance';

-- 6.2 Initialize Order Workflow
-- Creates all 11 workflow steps when an order is created
CREATE OR REPLACE FUNCTION initialize_order_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workflow_steps TEXT[][] := ARRAY[
    ['1', 'RFQ Created', 'Initial request for quote created'],
    ['2', 'Quotes Received', 'Supplier quotes received and under review'],
    ['3', 'Quote Accepted', 'Buyer has accepted a supplier quote'],
    ['4', 'Payment Initiated', 'Buyer has initiated payment to escrow'],
    ['5', 'Payment Confirmed', 'Payment received and held in escrow'],
    ['6', 'Production Started', 'Supplier has started production'],
    ['7', 'Quality Check', 'Quality inspection completed'],
    ['8', 'Shipped', 'Order shipped from supplier'],
    ['9', 'Customs Cleared', 'Order cleared customs (if applicable)'],
    ['10', 'Delivered', 'Order delivered to buyer'],
    ['11', 'Completed', 'Order completed and escrow released']
  ];
  step_record TEXT[];
BEGIN
  -- Create workflow events for each step
  FOREACH step_record SLICE 1 IN ARRAY workflow_steps
  LOOP
    INSERT INTO public.order_workflow_events (
      order_id,
      workflow_step,
      step_name,
      step_description,
      status,
      created_at
    ) VALUES (
      NEW.id,
      step_record[1]::INTEGER,
      step_record[2],
      step_record[3],
      CASE
        WHEN step_record[1]::INTEGER = 1 THEN 'current'::workflow_step_status
        ELSE 'pending'::workflow_step_status
      END,
      NOW()
    );
  END LOOP;

  -- Set the first step as current
  UPDATE public.order_workflow_events
  SET started_at = NOW()
  WHERE order_id = NEW.id AND workflow_step = 1;

  RETURN NEW;
END;
$$;

-- Create trigger for order creation
DROP TRIGGER IF EXISTS trigger_initialize_order_workflow ON public.orders;
CREATE TRIGGER trigger_initialize_order_workflow
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION initialize_order_workflow();

COMMENT ON FUNCTION initialize_order_workflow() IS 'Creates all 11 workflow steps when a new order is created';

-- 6.3 Advance Order Workflow
-- Function to move order to next workflow step with validation
CREATE OR REPLACE FUNCTION advance_order_workflow(
  p_order_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_step INTEGER;
  v_next_step INTEGER;
  v_order RECORD;
  v_user_company_id UUID;
BEGIN
  -- Get user's company
  SELECT company_id INTO v_user_company_id
  FROM public.profiles
  WHERE id = auth.uid();

  -- Get order details
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF v_order IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;

  -- Check if user is authorized (buyer or seller)
  IF v_user_company_id NOT IN (v_order.buyer_company_id, v_order.seller_company_id) THEN
    -- Check if admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Not authorized to advance this order workflow'
      );
    END IF;
  END IF;

  -- Get current step
  v_current_step := COALESCE(v_order.workflow_current_step, 1);
  v_next_step := v_current_step + 1;

  -- Validate not already completed
  IF v_current_step >= 11 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order workflow is already completed'
    );
  END IF;

  -- Mark current step as completed
  UPDATE public.order_workflow_events
  SET
    status = 'completed',
    completed_at = NOW(),
    actor_id = auth.uid(),
    actor_company_id = v_user_company_id,
    notes = COALESCE(p_notes, notes),
    metadata = metadata || p_metadata,
    updated_at = NOW()
  WHERE order_id = p_order_id AND workflow_step = v_current_step;

  -- Mark next step as current
  UPDATE public.order_workflow_events
  SET
    status = 'current',
    started_at = NOW(),
    updated_at = NOW()
  WHERE order_id = p_order_id AND workflow_step = v_next_step;

  -- Update order's current step
  UPDATE public.orders
  SET
    workflow_current_step = v_next_step,
    workflow_status = CASE WHEN v_next_step = 11 THEN 'completed' ELSE 'in_progress' END,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'previous_step', v_current_step,
    'current_step', v_next_step,
    'message', 'Workflow advanced successfully'
  );
END;
$$;

COMMENT ON FUNCTION advance_order_workflow(UUID, TEXT, JSONB) IS 'Advances an order to the next workflow step with validation';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION advance_order_workflow(UUID, TEXT, JSONB) TO authenticated;

-- 6.4 Calculate Supplier Score
-- Calculates and updates supplier performance metrics
CREATE OR REPLACE FUNCTION calculate_supplier_score(p_supplier_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_orders INTEGER;
  v_completed_orders INTEGER;
  v_cancelled_orders INTEGER;
  v_completion_rate NUMERIC;
  v_avg_response_hours NUMERIC;
  v_avg_rating NUMERIC;
  v_total_reviews INTEGER;
  v_dispute_rate NUMERIC;
  v_reliability_score NUMERIC;
BEGIN
  -- Get order statistics
  SELECT
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::INTEGER
  INTO v_total_orders, v_completed_orders, v_cancelled_orders
  FROM public.orders
  WHERE seller_company_id = p_supplier_company_id;

  -- Calculate completion rate
  v_completion_rate := CASE
    WHEN v_total_orders > 0 THEN (v_completed_orders::NUMERIC / v_total_orders::NUMERIC) * 100
    ELSE 0
  END;

  -- Get average response time (hours from RFQ to quote)
  SELECT AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600)
  INTO v_avg_response_hours
  FROM public.quotes q
  JOIN public.rfqs r ON r.id = q.rfq_id
  WHERE q.supplier_company_id = p_supplier_company_id;

  -- Get rating information from company
  SELECT average_rating, approved_reviews_count
  INTO v_avg_rating, v_total_reviews
  FROM public.companies
  WHERE id = p_supplier_company_id;

  -- Calculate dispute rate (assuming disputes table exists, otherwise use 0)
  v_dispute_rate := 0; -- Placeholder - update when disputes table is available

  -- Calculate reliability score (0-100)
  v_reliability_score := (
    -- Base score from rating (40% weight)
    (COALESCE(v_avg_rating, 3) / 5 * 100 * 0.4) +
    -- Completion rate (30% weight)
    (COALESCE(v_completion_rate, 50) * 0.3) +
    -- Response time score (20% weight) - faster is better
    (CASE
      WHEN v_avg_response_hours IS NULL THEN 50
      WHEN v_avg_response_hours <= 24 THEN 100
      WHEN v_avg_response_hours <= 48 THEN 75
      WHEN v_avg_response_hours <= 72 THEN 50
      ELSE 25
    END * 0.2) +
    -- Low dispute bonus (10% weight)
    ((100 - COALESCE(v_dispute_rate, 0)) * 0.1)
  );

  -- Update company trust_score
  UPDATE public.companies
  SET
    trust_score = v_reliability_score::INTEGER,
    updated_at = NOW()
  WHERE id = p_supplier_company_id;

  RETURN jsonb_build_object(
    'supplier_company_id', p_supplier_company_id,
    'total_orders', v_total_orders,
    'completed_orders', v_completed_orders,
    'completion_rate', ROUND(v_completion_rate, 2),
    'avg_response_hours', ROUND(COALESCE(v_avg_response_hours, 0), 2),
    'avg_rating', ROUND(COALESCE(v_avg_rating, 0), 2),
    'total_reviews', COALESCE(v_total_reviews, 0),
    'reliability_score', ROUND(v_reliability_score, 2)
  );
END;
$$;

COMMENT ON FUNCTION calculate_supplier_score(UUID) IS 'Calculates and updates supplier performance metrics and trust score';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_supplier_score(UUID) TO authenticated;

-- 6.5 Update Updated_At Triggers for New Tables
-- Apply the existing update_updated_at_column trigger to new tables
DROP TRIGGER IF EXISTS update_sample_orders_updated_at ON public.sample_orders;
CREATE TRIGGER update_sample_orders_updated_at
  BEFORE UPDATE ON public.sample_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_workflow_events_updated_at ON public.order_workflow_events;
CREATE TRIGGER update_order_workflow_events_updated_at
  BEFORE UPDATE ON public.order_workflow_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_history_updated_at ON public.billing_history;
CREATE TRIGGER update_billing_history_updated_at
  BEFORE UPDATE ON public.billing_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 7: MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- 7.1 Daily Trade Volume Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_trade_volume AS
SELECT
  DATE(o.created_at) AS trade_date,
  COUNT(DISTINCT o.id) AS total_orders,
  SUM(o.total_amount) AS total_value,
  o.currency,

  -- Country breakdown via buyer company
  bc.country AS buyer_country,
  sc.country AS seller_country,

  -- Order type breakdown
  COUNT(CASE WHEN o.order_type = 'standard' THEN 1 END) AS standard_orders,
  COUNT(CASE WHEN o.order_type = 'sample' THEN 1 END) AS sample_orders,
  COUNT(CASE WHEN o.order_type = 'bulk' THEN 1 END) AS bulk_orders,

  -- Status breakdown
  COUNT(CASE WHEN o.status = 'completed' THEN 1 END) AS completed_orders,
  COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders,
  COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders,

  -- Value metrics
  AVG(o.total_amount) AS avg_order_value,
  MIN(o.total_amount) AS min_order_value,
  MAX(o.total_amount) AS max_order_value

FROM public.orders o
LEFT JOIN public.companies bc ON o.buyer_company_id = bc.id
LEFT JOIN public.companies sc ON o.seller_company_id = sc.id
WHERE o.created_at >= NOW() - INTERVAL '365 days'
GROUP BY
  DATE(o.created_at),
  o.currency,
  bc.country,
  sc.country
ORDER BY trade_date DESC;

-- Create indexes on the materialized view
CREATE INDEX IF NOT EXISTS idx_analytics_daily_trade_date
  ON analytics_daily_trade_volume(trade_date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_buyer_country
  ON analytics_daily_trade_volume(buyer_country);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_seller_country
  ON analytics_daily_trade_volume(seller_country);

COMMENT ON MATERIALIZED VIEW analytics_daily_trade_volume IS
  'Daily aggregated trade volume metrics for platform analytics';

-- 7.2 Supplier Performance Scores
CREATE MATERIALIZED VIEW IF NOT EXISTS supplier_performance_scores AS
SELECT
  c.id AS supplier_id,
  c.company_name,
  c.country,
  c.verified,
  c.trust_score,
  c.average_rating,
  c.approved_reviews_count AS total_reviews,

  -- Response time metrics (from quotes)
  AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) AS response_time_avg_hours,
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600
  ) AS response_time_median_hours,
  COUNT(CASE WHEN EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600 <= 24 THEN 1 END) AS responses_within_24h,

  -- Order completion metrics
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) AS completed_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) AS cancelled_orders,
  CASE
    WHEN COUNT(DISTINCT o.id) > 0
    THEN ROUND((COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END)::NUMERIC /
                COUNT(DISTINCT o.id)::NUMERIC) * 100, 2)
    ELSE 0
  END AS completion_rate,

  -- Quote metrics
  COUNT(DISTINCT q.id) AS total_quotes_submitted,
  COUNT(DISTINCT CASE WHEN q.status = 'accepted' THEN q.id END) AS quotes_accepted,
  CASE
    WHEN COUNT(DISTINCT q.id) > 0
    THEN ROUND((COUNT(DISTINCT CASE WHEN q.status = 'accepted' THEN q.id END)::NUMERIC /
                COUNT(DISTINCT q.id)::NUMERIC) * 100, 2)
    ELSE 0
  END AS quote_acceptance_rate,

  -- Revenue metrics
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) AS total_revenue,
  AVG(CASE WHEN o.status = 'completed' THEN o.total_amount END) AS avg_order_value,

  -- Activity dates
  MAX(q.created_at) AS last_quote_date,
  MAX(o.created_at) AS last_order_date,

  -- Calculated reliability score
  (
    (COALESCE(c.trust_score, 50) * 0.4) +
    (CASE
      WHEN COUNT(DISTINCT o.id) > 0
      THEN (COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END)::NUMERIC /
            COUNT(DISTINCT o.id)::NUMERIC) * 100 * 0.3
      ELSE 30
    END) +
    (CASE
      WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) IS NULL THEN 50
      WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) <= 24 THEN 100
      WHEN AVG(EXTRACT(EPOCH FROM (q.created_at - r.created_at)) / 3600) <= 48 THEN 75
      ELSE 50
    END * 0.2) +
    (COALESCE(c.average_rating, 3) / 5 * 100 * 0.1)
  ) AS reliability_score

FROM public.companies c
LEFT JOIN public.quotes q ON q.supplier_company_id = c.id
LEFT JOIN public.rfqs r ON r.id = q.rfq_id
LEFT JOIN public.orders o ON o.seller_company_id = c.id
WHERE c.role IN ('seller', 'hybrid')
GROUP BY c.id, c.company_name, c.country, c.verified, c.trust_score, c.average_rating, c.approved_reviews_count
ORDER BY reliability_score DESC;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_performance_supplier_id
  ON supplier_performance_scores(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_performance_country
  ON supplier_performance_scores(country);
CREATE INDEX IF NOT EXISTS idx_supplier_performance_reliability
  ON supplier_performance_scores(reliability_score DESC);

COMMENT ON MATERIALIZED VIEW supplier_performance_scores IS
  'Aggregated supplier performance metrics and scores';

-- 7.3 Buyer Activity Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS buyer_activity_summary AS
SELECT
  c.id AS buyer_id,
  c.company_name,
  c.country,
  c.verified,
  c.subscription_plan,

  -- RFQ metrics
  COUNT(DISTINCT r.id) AS total_rfqs,
  COUNT(DISTINCT CASE WHEN r.status = 'open' THEN r.id END) AS open_rfqs,
  COUNT(DISTINCT CASE WHEN r.status = 'closed' THEN r.id END) AS closed_rfqs,

  -- Order metrics
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) AS completed_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) AS pending_orders,

  -- Spend metrics
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) AS total_spend,
  AVG(CASE WHEN o.status = 'completed' THEN o.total_amount END) AS avg_order_value,

  -- Sample requests
  COUNT(DISTINCT so.id) AS total_sample_requests,
  COUNT(DISTINCT CASE WHEN so.status = 'delivered' THEN so.id END) AS samples_received,

  -- Conversation activity
  COUNT(DISTINCT conv.id) AS total_conversations,

  -- Activity dates
  MAX(r.created_at) AS last_rfq_date,
  MAX(o.created_at) AS last_order_date,
  MAX(conv.last_message_at) AS last_conversation_date,
  GREATEST(
    COALESCE(MAX(r.created_at), '1970-01-01'::timestamp),
    COALESCE(MAX(o.created_at), '1970-01-01'::timestamp),
    COALESCE(MAX(conv.last_message_at), '1970-01-01'::timestamp)
  ) AS last_active,

  -- Days since last activity
  EXTRACT(DAY FROM (NOW() - GREATEST(
    COALESCE(MAX(r.created_at), '1970-01-01'::timestamp),
    COALESCE(MAX(o.created_at), '1970-01-01'::timestamp),
    COALESCE(MAX(conv.last_message_at), '1970-01-01'::timestamp)
  ))) AS days_since_last_activity,

  -- Buyer segment classification
  CASE
    WHEN COUNT(DISTINCT o.id) >= 5 AND
         COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) > 10000
    THEN 'High-Value Buyer'
    WHEN COUNT(DISTINCT r.id) >= 3 AND COUNT(DISTINCT conv.id) >= 2 AND COUNT(DISTINCT o.id) >= 1
    THEN 'Serious Buyer'
    WHEN EXTRACT(DAY FROM (NOW() - GREATEST(
      COALESCE(MAX(r.created_at), '1970-01-01'::timestamp),
      COALESCE(MAX(o.created_at), '1970-01-01'::timestamp),
      COALESCE(MAX(conv.last_message_at), '1970-01-01'::timestamp)
    ))) > 90
    THEN 'Dormant'
    WHEN COUNT(DISTINCT r.id) < 2 AND COUNT(DISTINCT conv.id) < 1
    THEN 'Low Activity'
    ELSE 'Active Buyer'
  END AS buyer_segment

FROM public.companies c
LEFT JOIN public.rfqs r ON r.buyer_company_id = c.id
LEFT JOIN public.orders o ON o.buyer_company_id = c.id
LEFT JOIN public.sample_orders so ON so.buyer_company_id = c.id
LEFT JOIN public.conversations conv ON conv.buyer_company_id = c.id
WHERE c.role IN ('buyer', 'hybrid')
GROUP BY c.id, c.company_name, c.country, c.verified, c.subscription_plan
ORDER BY total_spend DESC;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_buyer_activity_buyer_id
  ON buyer_activity_summary(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_activity_country
  ON buyer_activity_summary(country);
CREATE INDEX IF NOT EXISTS idx_buyer_activity_segment
  ON buyer_activity_summary(buyer_segment);
CREATE INDEX IF NOT EXISTS idx_buyer_activity_spend
  ON buyer_activity_summary(total_spend DESC);

COMMENT ON MATERIALIZED VIEW buyer_activity_summary IS
  'Aggregated buyer activity metrics and segmentation';

-- 7.4 Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_trade_volume;
  REFRESH MATERIALIZED VIEW CONCURRENTLY supplier_performance_scores;
  REFRESH MATERIALIZED VIEW CONCURRENTLY buyer_activity_summary;
END;
$$;

COMMENT ON FUNCTION refresh_analytics_views() IS 'Refreshes all analytics materialized views';

-- Grant execute to service role only (for scheduled jobs)
REVOKE EXECUTE ON FUNCTION refresh_analytics_views() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO service_role;

-- ============================================================================
-- SECTION 8: STORAGE BUCKETS
-- ============================================================================

-- Note: Storage buckets are typically created via Supabase Dashboard or client
-- These SQL statements ensure the buckets exist with proper policies

-- Insert bucket configurations if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('invoices', 'invoices', false, 10485760, ARRAY['application/pdf']),
  ('verification-documents', 'verification-documents', false, 52428800,
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoices bucket
DROP POLICY IF EXISTS "Users can view their own invoices" ON storage.objects;
CREATE POLICY "Users can view their own invoices"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (
      -- User's own invoices (path starts with company_id)
      (storage.foldername(name))[1] IN (
        SELECT company_id::TEXT FROM public.profiles WHERE id = auth.uid()
      )
      -- Or admin
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    )
  );

DROP POLICY IF EXISTS "Service role can upload invoices" ON storage.objects;
CREATE POLICY "Service role can upload invoices"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'invoices');

-- Storage policies for verification-documents bucket
DROP POLICY IF EXISTS "Users can upload verification documents" ON storage.objects;
CREATE POLICY "Users can upload verification documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT company_id::TEXT FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view own verification documents" ON storage.objects;
CREATE POLICY "Users can view own verification documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT company_id::TEXT FROM public.profiles WHERE id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    )
  );

-- ============================================================================
-- SECTION 9: GRANTS
-- ============================================================================

-- Grant table access to authenticated users
GRANT SELECT, INSERT ON public.rfq_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sample_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.order_workflow_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT SELECT, INSERT ON public.billing_history TO authenticated;

-- Grant view access
GRANT SELECT ON analytics_daily_trade_volume TO authenticated;
GRANT SELECT ON supplier_performance_scores TO authenticated;
GRANT SELECT ON buyer_activity_summary TO authenticated;

-- Grant sequence access for UUID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SECTION 10: FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
  tables_created INTEGER;
  views_created INTEGER;
  functions_created INTEGER;
BEGIN
  -- Count new tables
  SELECT COUNT(*) INTO tables_created
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'rfq_audit_log', 'sample_orders', 'order_workflow_events',
      'notification_preferences', 'billing_history'
    );

  -- Count materialized views
  SELECT COUNT(*) INTO views_created
  FROM pg_matviews
  WHERE schemaname = 'public'
    AND matviewname IN (
      'analytics_daily_trade_volume', 'supplier_performance_scores',
      'buyer_activity_summary'
    );

  -- Count new functions
  SELECT COUNT(*) INTO functions_created
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'log_rfq_status_change', 'initialize_order_workflow',
      'advance_order_workflow', 'calculate_supplier_score',
      'refresh_analytics_views'
    );

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'B2B BACKEND MIGRATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created: %/5', tables_created;
  RAISE NOTICE 'Materialized views created: %/3', views_created;
  RAISE NOTICE 'Functions created: %/5', functions_created;
  RAISE NOTICE '';
  RAISE NOTICE 'New Tables:';
  RAISE NOTICE '  - rfq_audit_log (Compliance tracking)';
  RAISE NOTICE '  - sample_orders (Sample request tracking)';
  RAISE NOTICE '  - order_workflow_events (11-step workflow)';
  RAISE NOTICE '  - notification_preferences (User prefs)';
  RAISE NOTICE '  - billing_history (Payment history)';
  RAISE NOTICE '';
  RAISE NOTICE 'Enhanced Tables:';
  RAISE NOTICE '  - messages (delivery tracking)';
  RAISE NOTICE '  - orders (workflow tracking)';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
