create policy "KYC owners can upload own files"
on storage.objects for insert to authenticated
with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "KYC owners can read own files"
on storage.objects for select to authenticated
using (bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin')));

create policy "KYC owners can update own files"
on storage.objects for update to authenticated
using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "KYC owners can delete own files"
on storage.objects for delete to authenticated
using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);