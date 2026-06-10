
REVOKE EXECUTE ON FUNCTION public.recalc_monthly_km(uuid, text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_recalc_km() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
