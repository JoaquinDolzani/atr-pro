
REVOKE EXECUTE ON FUNCTION public.recalc_monthly_km(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_recalc_km() FROM PUBLIC, anon, authenticated;
