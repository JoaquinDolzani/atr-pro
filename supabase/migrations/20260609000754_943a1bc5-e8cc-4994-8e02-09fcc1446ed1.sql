
CREATE POLICY "Avatars: owner all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id='avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id='avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatars: coach read all" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='avatars' AND public.has_role(auth.uid(),'coach'));
