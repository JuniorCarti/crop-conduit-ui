# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for the Crop Conduit UI application.

## Prerequisites

- A Google account
- Node.js and npm installed

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter project name (e.g., "crop-conduit")
   - Enable/disable Google Analytics (optional)
   - Click "Create project"

## Step 2: Register Your Web App

1. In Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Register your app:
   - App nickname: "Crop Conduit Web"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"
3. Copy the Firebase configuration object

## Step 3: Enable Authentication Methods

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - **Email/Password**: Click "Enable" and save
   - **Phone**: Click "Enable", configure reCAPTCHA verifier, and save
   - **Google**: Click "Enable", enter support email, and save

## Step 4: Configure Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`)
2. Add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Step 5: Configure Authorized Domains (for Production)

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your production domain (e.g., `yourdomain.com`)
3. Localhost is automatically authorized for development

## Step 6: Set Up reCAPTCHA for Phone Authentication

1. Firebase automatically handles reCAPTCHA for phone authentication
2. The app uses invisible reCAPTCHA (configured in `AuthContext.tsx`)
3. No additional setup needed - Firebase handles it automatically

## Step 7: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/login` or `/signup`
3. Try creating an account with:
   - Email/Password
   - Google Sign-in
   - Phone number (OTP)

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that your `.env` file has the correct API key
- Restart the dev server after changing `.env` file

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to Firebase Console > Authentication > Settings > Authorized domains

### Phone Authentication Not Working
- Ensure Phone authentication is enabled in Firebase Console
- Check browser console for reCAPTCHA errors
- Make sure you're using a valid phone number format (+254...)

### Google Sign-in Not Working
- Ensure Google provider is enabled in Firebase Console
- Check that you've configured OAuth consent screen (if required)
- Verify authorized domains include your domain

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use environment variables** - Never hardcode Firebase config
3. **Enable Firebase App Check** (optional) - For additional security
4. **Set up Firebase Security Rules** - For Firestore database protection
5. **Use HTTPS in production** - Required for secure authentication

## Next Steps

After setting up authentication, you may want to:

1. **Store user data in Firestore** - Save farmer registration data
2. **Set up Cloud Functions** - For server-side logic
3. **Configure Storage** - For farm photo uploads
4. **Set up Analytics** - Track user behavior

## Support

For Firebase-specific issues, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Support](https://firebase.google.com/support)

