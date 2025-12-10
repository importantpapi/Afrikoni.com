-- ============================================
-- Logistics Tracking & Customs Clearance
-- Real-time tracking, customs, and cross-border shipping
-- ============================================

-- 1. Create shipment_tracking_events table for real-time tracking
CREATE TABLE IF NOT EXISTS public.shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'picked_up', 'in_transit', 'arrived_at_facility', 
    'departed_facility', 'in_customs', 'customs_cleared', 
    'out_for_delivery', 'delivery_attempted', 'delivered', 
    'exception', 'delay', 'returned'
  )),
  status TEXT NOT NULL,
  location TEXT, -- City, Country or Facility name
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  
  -- Description and notes
  description TEXT,
  notes TEXT,
  
  -- Timestamps
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create customs_clearance table
CREATE TABLE IF NOT EXISTS public.customs_clearance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Border crossing info
  origin_country TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  border_crossing_point TEXT, -- e.g., "Lagos Port", "Tema Port"
  
  -- Customs status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'submitted', 'under_review', 'requires_documents',
    'requires_payment', 'cleared', 'rejected', 'held'
  )),
  
  -- Documents
  commercial_invoice_url TEXT,
  packing_list_url TEXT,
  certificate_of_origin_url TEXT,
  export_license_url TEXT,
  import_license_url TEXT,
  other_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Duties and taxes
  declared_value NUMERIC(15, 2),
  duties_amount NUMERIC(15, 2) DEFAULT 0,
  taxes_amount NUMERIC(15, 2) DEFAULT 0,
  total_customs_fees NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Customs broker info
  customs_broker_name TEXT,
  customs_broker_contact TEXT,
  broker_fee NUMERIC(10, 2) DEFAULT 0,
  
  -- Dates
  submitted_at TIMESTAMP WITH TIME ZONE,
  cleared_at TIMESTAMP WITH TIME ZONE,
  estimated_clearance_date TIMESTAMP WITH TIME ZONE,
  
  -- Notes and issues
  customs_notes TEXT,
  rejection_reason TEXT,
  hold_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhance shipments table with cross-border fields
DO $$ 
BEGIN
  -- Add cross-border shipping fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'is_cross_border') THEN
    ALTER TABLE public.shipments ADD COLUMN is_cross_border BOOLEAN DEFAULT false;
    ALTER TABLE public.shipments ADD COLUMN origin_country TEXT;
    ALTER TABLE public.shipments ADD COLUMN destination_country TEXT;
    ALTER TABLE public.shipments ADD COLUMN shipping_method TEXT CHECK (shipping_method IN ('air', 'sea', 'road', 'rail', 'express'));
    ALTER TABLE public.shipments ADD COLUMN estimated_transit_days INTEGER;
    ALTER TABLE public.shipments ADD COLUMN actual_transit_days INTEGER;
    ALTER TABLE public.shipments ADD COLUMN customs_clearance_id UUID REFERENCES public.customs_clearance(id);
    ALTER TABLE public.shipments ADD COLUMN last_tracking_update TIMESTAMP WITH TIME ZONE;
    ALTER TABLE public.shipments ADD COLUMN current_location TEXT;
    ALTER TABLE public.shipments ADD COLUMN next_milestone TEXT;
  END IF;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON public.shipment_tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON public.shipment_tracking_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_customs_clearance_shipment_id ON public.customs_clearance(shipment_id);
CREATE INDEX IF NOT EXISTS idx_customs_clearance_status ON public.customs_clearance(status);
CREATE INDEX IF NOT EXISTS idx_shipments_cross_border ON public.shipments(is_cross_border);
CREATE INDEX IF NOT EXISTS idx_shipments_countries ON public.shipments(origin_country, destination_country);

-- 5. Enable RLS
ALTER TABLE public.shipment_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customs_clearance ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for tracking_events
CREATE POLICY "Users can view tracking events for their shipments"
  ON public.shipment_tracking_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.orders o ON s.order_id = o.id
      WHERE s.id = shipment_tracking_events.shipment_id
      AND (
        o.buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
        OR o.seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
        OR s.logistics_partner_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Logistics partners can insert tracking events"
  ON public.shipment_tracking_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_tracking_events.shipment_id
      AND s.logistics_partner_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
    )
  );

-- 7. RLS Policies for customs_clearance
CREATE POLICY "Users can view customs for their shipments"
  ON public.customs_clearance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.orders o ON s.order_id = o.id
      WHERE s.id = customs_clearance.shipment_id
      AND (
        o.buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
        OR o.seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
        OR s.logistics_partner_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
      )
    )
  );

CREATE POLICY "Logistics partners can manage customs"
  ON public.customs_clearance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = customs_clearance.shipment_id
      AND s.logistics_partner_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
    )
  );

-- 8. Function to auto-update shipment status from tracking events
CREATE OR REPLACE FUNCTION update_shipment_from_tracking()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shipments
  SET 
    status = NEW.status,
    last_tracking_update = NEW.event_timestamp,
    current_location = NEW.location,
    updated_at = NOW()
  WHERE id = NEW.shipment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger to auto-update shipment on tracking event
CREATE TRIGGER update_shipment_on_tracking_event
  AFTER INSERT ON public.shipment_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_shipment_from_tracking();

-- 10. Function to detect cross-border shipments
CREATE OR REPLACE FUNCTION detect_cross_border_shipment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if origin and destination countries are different
  IF NEW.origin_country IS NOT NULL 
     AND NEW.destination_country IS NOT NULL 
     AND NEW.origin_country != NEW.destination_country THEN
    NEW.is_cross_border = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger to auto-detect cross-border
CREATE TRIGGER detect_cross_border
  BEFORE INSERT OR UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION detect_cross_border_shipment();

-- 12. Comments
COMMENT ON TABLE public.shipment_tracking_events IS 'Real-time tracking events for shipments';
COMMENT ON TABLE public.customs_clearance IS 'Customs clearance information for cross-border shipments';
COMMENT ON COLUMN public.shipments.is_cross_border IS 'Indicates if shipment crosses international borders';
COMMENT ON COLUMN public.shipments.customs_clearance_id IS 'Reference to customs clearance record';

