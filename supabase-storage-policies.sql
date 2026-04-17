-- Run this in the Supabase SQL editor for the project that backs this app.
-- The frontend uploads directly with the anon key, so Storage needs an anon
-- INSERT policy for the GPX bucket.

create policy "Allow public GPX uploads"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'gpx-files'
  and lower(storage.extension(name)) = 'gpx'
);

-- Optional: allow public reads from the same bucket if GPX files will be listed
-- or downloaded directly from the browser later.
create policy "Allow public GPX reads"
on storage.objects
for select
to anon
using (bucket_id = 'gpx-files');
