set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_archive_notices()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.notices 
  SET is_archived = TRUE 
  WHERE is_archived = FALSE 
    AND created_at < (now() - INTERVAL '1 year');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;


