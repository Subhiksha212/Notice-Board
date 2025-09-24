drop extension if exists "pg_net";

revoke delete on table "public"."app_settings" from "anon";

revoke insert on table "public"."app_settings" from "anon";

revoke references on table "public"."app_settings" from "anon";

revoke select on table "public"."app_settings" from "anon";

revoke trigger on table "public"."app_settings" from "anon";

revoke truncate on table "public"."app_settings" from "anon";

revoke update on table "public"."app_settings" from "anon";

revoke delete on table "public"."app_settings" from "authenticated";

revoke insert on table "public"."app_settings" from "authenticated";

revoke references on table "public"."app_settings" from "authenticated";

revoke select on table "public"."app_settings" from "authenticated";

revoke trigger on table "public"."app_settings" from "authenticated";

revoke truncate on table "public"."app_settings" from "authenticated";

revoke update on table "public"."app_settings" from "authenticated";

revoke delete on table "public"."app_settings" from "service_role";

revoke insert on table "public"."app_settings" from "service_role";

revoke references on table "public"."app_settings" from "service_role";

revoke select on table "public"."app_settings" from "service_role";

revoke trigger on table "public"."app_settings" from "service_role";

revoke truncate on table "public"."app_settings" from "service_role";

revoke update on table "public"."app_settings" from "service_role";

revoke delete on table "public"."notices" from "anon";

revoke insert on table "public"."notices" from "anon";

revoke references on table "public"."notices" from "anon";

revoke select on table "public"."notices" from "anon";

revoke trigger on table "public"."notices" from "anon";

revoke truncate on table "public"."notices" from "anon";

revoke update on table "public"."notices" from "anon";

revoke delete on table "public"."notices" from "authenticated";

revoke insert on table "public"."notices" from "authenticated";

revoke references on table "public"."notices" from "authenticated";

revoke select on table "public"."notices" from "authenticated";

revoke trigger on table "public"."notices" from "authenticated";

revoke truncate on table "public"."notices" from "authenticated";

revoke update on table "public"."notices" from "authenticated";

revoke delete on table "public"."notices" from "service_role";

revoke insert on table "public"."notices" from "service_role";

revoke references on table "public"."notices" from "service_role";

revoke select on table "public"."notices" from "service_role";

revoke trigger on table "public"."notices" from "service_role";

revoke truncate on table "public"."notices" from "service_role";

revoke update on table "public"."notices" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

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


