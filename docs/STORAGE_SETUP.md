# Supabase Storage Setup Guide

## Create Storage Bucket

The application requires a Supabase Storage bucket for file uploads (product images, RFQ attachments, etc.).

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `qkeeufeiaphqylsnfhza`

2. **Navigate to Storage**
   - Click on **Storage** in the left sidebar
   - Click **New bucket** button

3. **Create Bucket**
   - **Name**: `files`
   - **Public bucket**: ✅ **Enable this** (check the box)
   - **File size limit**: Leave default or set to your preference (e.g., 10MB)
   - **Allowed MIME types**: Leave empty for all types, or specify: `image/*,application/pdf`
   - Click **Create bucket**

4. **Set Storage Policies** (if needed)
   - Go to **Storage** → **Policies**
   - For the `files` bucket, ensure:
     - **SELECT policy**: Allow public read access
     - **INSERT policy**: Allow authenticated users to upload
     - **UPDATE policy**: Allow users to update their own files
     - **DELETE policy**: Allow users to delete their own files

### Quick Policy Setup (via SQL)

If you prefer SQL, run this in Supabase SQL Editor:

```sql
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'files');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'files' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Verify Setup

After creating the bucket, test file upload:
1. Go to any page that uploads files (Add Product, Create RFQ)
2. Try uploading an image
3. Check that the file appears in the Storage bucket

## Storage Structure

Files will be organized as:
- Product images: `files/product-images/{random-id}.jpg`
- RFQ attachments: `files/rfq-attachments/{random-id}.pdf`
- Company logos: `files/company-logos/{random-id}.png`

## Troubleshooting

**Issue**: "Storage bucket not found"
- Make sure the bucket is named exactly `files`
- Verify it's created in the correct Supabase project

**Issue**: "Permission denied"
- Check that the bucket is set to public
- Verify storage policies allow the operation

**Issue**: "File too large"
- Increase the file size limit in bucket settings
- Or compress images before upload

