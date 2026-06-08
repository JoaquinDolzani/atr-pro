
-- Path convention: <bucket>/<user_id>/...
CREATE POLICY "athlete read own certs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'medical-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "athlete write own certs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'medical-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "athlete update own certs" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'medical-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "athlete delete own certs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'medical-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "coach read all certs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'medical-certificates' AND public.has_role(auth.uid(),'coach'));

CREATE POLICY "athlete read own photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'report-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "athlete write own photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "athlete delete own photos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'report-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "coach read all photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'report-photos' AND public.has_role(auth.uid(),'coach'));
