# Supabase Storage Setup Guide

This project uses Supabase Storage instead of Firebase Storage for file uploads. Follow these steps to set up Supabase Storage.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - Name: `crop-conduit` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose the closest region to your users
4. Wait for the project to be created (takes ~2 minutes)

## 2. Get Your Supabase Credentials

1. In your Supabase Dashboard, go to **Project Settings** > **API**
2. Copy the following values:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

## 3. Create the Storage Bucket

1. In your Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Configure the bucket:
   - **Name**: `uploads`
   - **Public bucket**: ✅ Enable (so files can be accessed via public URLs)
   - **File size limit**: 10MB (or your preferred limit)
   - **Allowed MIME types**: Leave empty to allow all types, or specify:
     - `image/*` for images only
     - `application/pdf` for PDFs
     - etc.
4. Click **Create bucket**

## 4. Set Up Storage Policies (Security Rules)

1. In the Storage section, click on your `uploads` bucket
2. Go to the **Policies** tab
3. Click **New Policy** and create the following policies:

### Policy 1: Allow authenticated users to upload files
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**:
```sql
(
  bucket_id = 'uploads'::text
  AND auth.role() = 'authenticated'::text
)
```

### Policy 2: Allow authenticated users to update their own files
- **Policy name**: `Allow authenticated updates`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
```sql
(
  bucket_id = 'uploads'::text
  AND auth.role() = 'authenticated'::text
  AND (storage.foldername(name))[1] = auth.uid()::text
)
```

### Policy 3: Allow public read access
- **Policy name**: `Allow public reads`
- **Allowed operation**: `SELECT`
- **Policy definition**:
```sql
(
  bucket_id = 'uploads'::text
)
```

### Policy 4: Allow authenticated users to delete their own files
- **Policy name**: `Allow authenticated deletes`
- **Allowed operation**: `DELETE`
- **Policy definition**:
```sql
(
  bucket_id = 'uploads'::text
  AND auth.role() = 'authenticated'::text
  AND (storage.foldername(name))[1] = auth.uid()::text
)
```

**Note**: Since we're using Firebase Auth (not Supabase Auth), you may need to adjust these policies. For now, you can use a simpler policy that allows all authenticated operations:

```sql
-- Allow all operations for authenticated users
bucket_id = 'uploads'::text
```

Or, if you want to use Row Level Security (RLS) with Firebase Auth, you'll need to set up a custom authentication function or use service role key for server-side operations.

## 5. Configure Environment Variables

1. Copy `.env.example` to `.env` (if it doesn't exist)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 6. Test the Integration

1. Start your development server: `npm run dev`
2. Go to the Farmer Registration page
3. Fill in the form and upload a farm photo
4. Check your Supabase Storage dashboard to see if the file was uploaded
5. Verify that the file URL is saved in Firestore

## File Organization

Files are organized in Supabase Storage as follows:
```
uploads/
  ├── farm-photos/
  │   └── {userId}/
  │       └── {timestamp}-{filename}
  ├── crop-photos/
  │   └── {userId}/
  │       └── {timestamp}-{filename}
  ├── documents/
  │   └── {userId}/
  │       └── {timestamp}-{filename}
  └── profile-pictures/
      └── {userId}/
          └── {timestamp}-{filename}
```

## Troubleshooting

### Files not uploading
- Check that your Supabase credentials are correct in `.env`
- Verify the bucket name is exactly `uploads`
- Check browser console for error messages
- Ensure the bucket is set to public

### Permission denied errors
- Verify your storage policies are set up correctly
- Check that the bucket exists and is accessible
- If using Firebase Auth, you may need to use service role key for server-side operations

### Files not accessible via URL
- Ensure the bucket is set to public
- Check that the file path is correct
- Verify the public URL is being generated correctly

## Migration from Firebase Storage

If you're migrating from Firebase Storage:

1. **Update all file references**: Change any Firebase Storage paths to Supabase Storage URLs
2. **Migrate existing files**: Use a script to download files from Firebase Storage and upload them to Supabase Storage
3. **Update Firestore documents**: Update all documents that reference Firebase Storage paths to use Supabase URLs instead

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage JavaScript SDK](https://supabase.com/docs/reference/javascript/storage)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)

