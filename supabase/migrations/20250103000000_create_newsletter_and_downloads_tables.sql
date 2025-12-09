-- Create newsletter_subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  email text NOT NULL UNIQUE,
  source text,
  subscribed_at timestamp with time zone DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  is_active boolean DEFAULT TRUE NOT NULL
);

-- Enable RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public can insert (subscribe)
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Create downloadable_resources table
CREATE TABLE public.downloadable_resources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size text,
  published boolean DEFAULT FALSE NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  download_count integer DEFAULT 0 NOT NULL
);

-- Enable RLS
ALTER TABLE public.downloadable_resources ENABLE ROW LEVEL SECURITY;

-- Public can view published resources
CREATE POLICY "Public can view published resources" ON public.downloadable_resources
  FOR SELECT USING (published = TRUE);

-- Create index for faster queries
CREATE INDEX idx_downloadable_resources_published ON public.downloadable_resources(published, display_order, created_at);
CREATE INDEX idx_downloadable_resources_category ON public.downloadable_resources(category);

-- Add trigger to update updated_at
CREATE TRIGGER update_downloadable_resources_updated_at BEFORE UPDATE ON public.downloadable_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

