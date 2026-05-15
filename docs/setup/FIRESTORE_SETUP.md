# Firestore Setup Guide for Crops Page

This guide will help you set up Firebase Firestore for the Crops Dashboard feature.

## Prerequisites

- Firebase project created
- Firebase Authentication already configured (as per previous setup)
- Firestore Database enabled

## Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** in the left sidebar
4. Click **Create Database**
5. Choose **Start in test mode** (for development) or **Start in production mode** (for production)
6. Select a location for your database (choose the closest to your users)

## Step 2: Create Firestore Collections

The Crops page uses the following collections:

### Collections Structure

1. **`crops`** - Main crop documents
   - Fields:
     - `name` (string, required)
     - `type` (string, required)
     - `plantingDate` (timestamp, required)
     - `harvestDate` (timestamp, required)
     - `field` (string, required)
     - `estimatedYield` (number, required)
     - `status` (string: "Healthy" | "Needs Attention" | "Pest Alert" | "Harvest Ready")
     - `alerts` (array of strings, optional)
     - `soilMoisture` (number, optional)
     - `ndvi` (number, optional)
     - `growthStage` (string, optional)
     - `userId` (string, required) - Links crop to authenticated user
     - `createdAt` (timestamp, auto-generated)
     - `updatedAt` (timestamp, auto-generated)

2. **`cropActivities`** - Crop management activities
   - Fields:
     - `cropId` (string, required) - Reference to crop document
     - `type` (string: "irrigation" | "fertilization" | "pesticide" | "other")
     - `date` (timestamp, required)
     - `description` (string, required)
     - `amount` (number, optional)
     - `unit` (string, optional)
     - `createdAt` (timestamp, auto-generated)

3. **`cropRecommendations`** - AI/System recommendations for crops
   - Fields:
     - `cropId` (string, required) - Reference to crop document
     - `type` (string: "irrigation" | "fertilization" | "pesticide" | "harvest")
     - `priority` (string: "high" | "medium" | "low")
     - `message` (string, required)
     - `action` (string, optional)
     - `createdAt` (timestamp, auto-generated)

4. **`cropGrowthData`** - Historical growth metrics for charts
   - Fields:
     - `cropId` (string, required) - Reference to crop document
     - `date` (timestamp, required)
     - `ndvi` (number, optional)
     - `height` (number, optional)
     - `moisture` (number, optional)
     - `notes` (string, optional)

## Step 3: Set Up Firestore Security Rules

Go to **Firestore Database** > **Rules** and add the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Crops collection
    match /crops/{cropId} {
      // Users can read their own crops
      allow read: if isOwner(resource.data.userId);
      // Users can create crops with their own userId
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      // Users can update their own crops
      allow update: if isOwner(resource.data.userId);
      // Users can delete their own crops
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Crop Activities collection
    match /cropActivities/{activityId} {
      // Users can read activities for crops they own
      allow read: if isAuthenticated() && 
        exists(/databases/$(database)/documents/crops/$(resource.data.cropId)) &&
        get(/databases/$(database)/documents/crops/$(resource.data.cropId)).data.userId == request.auth.uid;
      // Users can create activities for their crops
      allow create: if isAuthenticated() && 
        exists(/databases/$(database)/documents/crops/$(request.resource.data.cropId)) &&
        get(/databases/$(database)/documents/crops/$(request.resource.data.cropId)).data.userId == request.auth.uid;
    }
    
    // Crop Recommendations collection
    match /cropRecommendations/{recId} {
      // Users can read recommendations for crops they own
      allow read: if isAuthenticated() && 
        exists(/databases/$(database)/documents/crops/$(resource.data.cropId)) &&
        get(/databases/$(database)/documents/crops/$(resource.data.cropId)).data.userId == request.auth.uid;
      // System can create recommendations (or users can create for their crops)
      allow create: if isAuthenticated() && 
        exists(/databases/$(database)/documents/crops/$(request.resource.data.cropId)) &&
        get(/databases/$(database)/documents/crops/$(request.resource.data.cropId)).data.userId == request.auth.uid;
    }
    
    // Crop Growth Data collection
    match /cropGrowthData/{dataId} {
      // Users can read growth data for crops they own
      allow read: if isAuthenticated() && 
        exists(/databases/$(database)/documents/crops/$(resource.data.cropId)) &&
        get(/databases/$(database)/documents/crops/$(resource.data.cropId)).data.userId == request.auth.uid;
      // Users can create growth data for their crops
      allow create: if isAuthenticated() && 
        exists(/databases/$(database)/documents/crops/$(request.resource.data.cropId)) &&
        get(/databases/$(database)/documents/crops/$(request.resource.data.cropId)).data.userId == request.auth.uid;
    }
  }
}
```

## Step 4: Create Firestore Indexes (Optional but Recommended)

For better query performance, create composite indexes:

1. Go to **Firestore Database** > **Indexes**
2. Click **Create Index**

### Index 1: Crops by userId and status
- Collection ID: `crops`
- Fields:
  - `userId` (Ascending)
  - `status` (Ascending)
  - `plantingDate` (Descending)

### Index 2: Crops by userId and type
- Collection ID: `crops`
- Fields:
  - `userId` (Ascending)
  - `type` (Ascending)
  - `plantingDate` (Descending)

### Index 3: Crop Activities by cropId and date
- Collection ID: `cropActivities`
- Fields:
  - `cropId` (Ascending)
  - `date` (Descending)

### Index 4: Crop Growth Data by cropId and date
- Collection ID: `cropGrowthData`
- Fields:
  - `cropId` (Ascending)
  - `date` (Ascending)

**Note:** Firebase will automatically prompt you to create indexes when you run queries that require them. You can click the link in the error message to create the index.

## Step 5: Test the Setup

1. Start your development server: `npm run dev`
2. Log in to your application
3. Navigate to the **Crops** page (`/crops`)
4. Click **Add Crop** and create a test crop
5. Verify the crop appears in your Firestore console

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Check that your Firestore security rules are correctly set up
- Ensure the user is authenticated (`request.auth != null`)
- Verify the `userId` field matches `request.auth.uid`

### Error: "The query requires an index"
- Click the link in the error message to create the required index
- Wait for the index to build (can take a few minutes)
- Alternatively, create the indexes manually as described in Step 4

### Data not appearing in real-time
- Check that you're using `onSnapshot` listeners (already implemented)
- Verify your Firestore rules allow read access
- Check browser console for any errors

### Charts not showing data
- Ensure you've added growth data points using the "Manage Crop" feature
- Check that the `cropGrowthData` collection has documents with the correct `cropId`

## Next Steps

- Add sample data manually through Firebase Console for testing
- Set up automated data collection (e.g., IoT sensors, satellite data)
- Configure Cloud Functions to generate recommendations automatically
- Set up Firestore triggers for notifications and alerts

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Check Firebase Console > Firestore Database > Usage for query errors
3. Review Firestore security rules for permission issues
4. Verify your Firebase configuration in `.env` file

