-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix auto-archive function search path
CREATE OR REPLACE FUNCTION public.auto_archive_notices()
RETURNS void AS $$
BEGIN
  UPDATE public.notices 
  SET is_archived = TRUE 
  WHERE is_archived = FALSE 
    AND created_at < (now() - INTERVAL '1 year');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;