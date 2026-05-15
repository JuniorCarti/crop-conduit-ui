# Resources Page Setup Guide

This guide will help you set up Firebase Firestore for the Resources (Quartermaster Agent) page.

## Prerequisites

- Firebase project created
- Firebase Authentication already configured
- Firestore Database enabled (as per previous setup)

## Step 1: Firestore Collections

The Resources page uses the following collections:

### Collections Structure

1. **`resources`** - Main resource documents
   - Fields:
     - `name` (string, required)
     - `type` (string: "fertilizer" | "seeds" | "pesticide" | "water" | "other", required)
     - `recommendedQuantity` (number, required)
     - `unit` (string, required) - e.g., "kg", "L", "bags", "units", "acres"
     - `unitCost` (number, required) - Cost per unit in Ksh
     - `totalCost` (number, required) - Calculated: unitCost * recommendedQuantity
     - `cropId` (string, optional) - Link to specific crop
     - `cropName` (string, optional) - For display purposes
     - `supplier` (string, optional)
     - `supplierContact` (string, optional)
     - `applicationDate` (timestamp, optional)
     - `stockLevel` (number, optional) - Current stock
     - `reorderLevel` (number, optional) - Alert threshold
     - `lastRestocked` (timestamp, optional)
     - `notes` (string, optional)
     - `userId` (string, required) - Links resource to authenticated user
     - `createdAt` (timestamp, auto-generated)
     - `updatedAt` (timestamp, auto-generated)

2. **`resourceUsage`** - Resource usage tracking (for charts)
   - Fields:
     - `resourceId` (string, required) - Reference to resource document
     - `date` (timestamp, required)
     - `quantity` (number, required)
     - `unit` (string, required)
     - `cost` (number, required)
     - `cropId` (string, optional)
     - `notes` (string, optional)
     - `createdAt` (timestamp, auto-generated)

3. **`suppliers`** - Supplier information
   - Fields:
     - `name` (string, required)
     - `contact` (string, required)
     - `email` (string, optional)
     - `address` (string, optional)
     - `products` (array of strings, optional) - Types of products they supply
     - `rating` (number, optional)
     - `notes` (string, optional)
     - `userId` (string, required)
     - `createdAt` (timestamp, auto-generated)

## Step 2: Update Firestore Security Rules

Add these rules to your existing Firestore security rules:

```javascript
// Resources collection
match /resources/{resourceId} {
  // Users can read their own resources
  allow read: if isOwner(resource.data.userId);
  // Users can create resources with their own userId
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  // Users can update their own resources
  allow update: if isOwner(resource.data.userId);
  // Users can delete their own resources
  allow delete: if isOwner(resource.data.userId);
}

// Resource Usage collection
match /resourceUsage/{usageId} {
  // Users can read usage for their resources
  allow read: if isAuthenticated() && 
    exists(/databases/$(database)/documents/resources/$(resource.data.resourceId)) &&
    get(/databases/$(database)/documents/resources/$(resource.data.resourceId)).data.userId == request.auth.uid;
  // Users can create usage for their resources
  allow create: if isAuthenticated() && 
    exists(/databases/$(database)/documents/resources/$(request.resource.data.resourceId)) &&
    get(/databases/$(database)/documents/resources/$(request.resource.data.resourceId)).data.userId == request.auth.uid;
}

// Suppliers collection
match /suppliers/{supplierId} {
  // Users can read their own suppliers
  allow read: if isOwner(resource.data.userId);
  // Users can create suppliers with their own userId
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  // Users can update their own suppliers
  allow update: if isOwner(resource.data.userId);
  // Users can delete their own suppliers
  allow delete: if isOwner(resource.data.userId);
}
```

## Step 3: Create Firestore Indexes (Optional but Recommended)

For better query performance, create composite indexes:

1. Go to **Firestore Database** > **Indexes**
2. Click **Create Index**

### Index 1: Resources by userId and type
- Collection ID: `resources`
- Fields:
  - `userId` (Ascending)
  - `type` (Ascending)
  - `name` (Ascending)

### Index 2: Resources by userId and cropId
- Collection ID: `resources`
- Fields:
  - `userId` (Ascending)
  - `cropId` (Ascending)
  - `applicationDate` (Ascending)

### Index 3: Resource Usage by resourceId and date
- Collection ID: `resourceUsage`
- Fields:
  - `resourceId` (Ascending)
  - `date` (Descending)

**Note:** Firebase will automatically prompt you to create indexes when you run queries that require them.

## Step 4: Features Overview

### Main Features

1. **Resource Management**
   - Add, edit, and delete resources
   - Track quantities, costs, and suppliers
   - Link resources to specific crops
   - Set stock levels and reorder alerts

2. **Tabs**
   - All Resources
   - Fertilizers
   - Seeds
   - Pesticides
   - Water
   - Cost Optimizer

3. **Filters & Search**
   - Search by name, type, crop, or supplier
   - Filter by crop
   - Sort by name, cost, quantity, or date

4. **Charts & Analytics**
   - Usage trends over time (line chart)
   - Cost breakdown by type (bar chart)
   - Water usage over time (bar chart)

5. **Cost Optimizer**
   - Compares suppliers for the same resource
   - Suggests cheaper alternatives
   - Calculates potential savings

6. **Calendar View**
   - Visual calendar of application dates
   - Color-coded by resource type
   - Shows multiple resources per day

7. **Alerts & Notifications**
   - Low stock alerts
   - Upcoming application reminders
   - Visual indicators on resource cards

8. **Export**
   - Export to CSV
   - Export to PDF (print-friendly)

## Step 5: Test the Setup

1. Start your development server: `npm run dev`
2. Log in to your application
3. Navigate to the **Resources** page (`/resources`)
4. Click **Add Resource** and create a test resource
5. Test the following:
   - Add resources of different types
   - Edit a resource
   - Delete a resource
   - Filter and search
   - View charts
   - Check cost optimizer (add multiple suppliers for same resource)
   - View calendar
   - Export data

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Check that your Firestore security rules are correctly set up
- Ensure the user is authenticated
- Verify the `userId` field matches `request.auth.uid`

### Error: "The query requires an index"
- Click the link in the error message to create the required index
- Wait for the index to build (can take a few minutes)

### Charts not showing data
- Ensure you have resources with application dates
- Check that resources have valid cost data

### Cost Optimizer not showing suggestions
- Add multiple resources with the same name and type but different suppliers
- Ensure resources have `unitCost` and `supplier` fields populated

### Calendar not showing resources
- Ensure resources have `applicationDate` set
- Check that dates are valid Date objects or Firestore Timestamps

## Usage Tips

1. **Stock Management**: Set `stockLevel` and `reorderLevel` to get low stock alerts
2. **Cost Optimization**: Add the same resource from different suppliers to see cost savings
3. **Crop Linking**: Link resources to crops for better organization and filtering
4. **Application Dates**: Set application dates to use the calendar view and get reminders
5. **Export**: Use CSV for data analysis, PDF for printing

## Next Steps

- Add automated stock level updates from inventory systems
- Integrate with supplier APIs for real-time pricing
- Set up notifications for low stock and upcoming applications
- Add barcode scanning for quick resource entry
- Integrate with accounting systems for cost tracking

