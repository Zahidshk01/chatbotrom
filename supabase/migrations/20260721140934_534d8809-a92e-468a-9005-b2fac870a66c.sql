CREATE POLICY "Owner reads own export files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'database_export_21_07_26' AND owner = auth.uid());

CREATE POLICY "Owner uploads own export files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'database_export_21_07_26' AND owner = auth.uid());

CREATE POLICY "Owner updates own export files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'database_export_21_07_26' AND owner = auth.uid())
WITH CHECK (bucket_id = 'database_export_21_07_26' AND owner = auth.uid());

CREATE POLICY "Owner deletes own export files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'database_export_21_07_26' AND owner = auth.uid());