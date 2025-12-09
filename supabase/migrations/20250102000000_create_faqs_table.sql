-- Create the 'faqs' table for FAQ management
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  published boolean DEFAULT FALSE NOT NULL,
  display_order integer DEFAULT 0 NOT NULL
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public can view published FAQs
CREATE POLICY "Public FAQs are viewable by everyone." ON public.faqs
  FOR SELECT USING (published = TRUE);

-- Create index for faster queries
CREATE INDEX idx_faqs_published_order ON public.faqs(published, display_order, created_at);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


