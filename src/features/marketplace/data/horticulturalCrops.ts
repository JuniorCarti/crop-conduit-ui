/**
 * Horticultural Crops Seed Data
 * Sample data for common horticultural crops in Kenya
 */

import type { Listing } from "../models/types";

// Common horticultural crops in Kenya
export const HORTICULTURAL_CROPS = [
  {
    cropType: "Tomato",
    varieties: ["Rio Grande", "Cal J", "Money Maker", "Moneymaker"],
    commonUnits: ["kg", "crates", "bags"],
    avgPriceRange: { min: 40, max: 120 }, // KSh per kg
  },
  {
    cropType: "Kale (Sukuma Wiki)",
    varieties: ["Collard Greens", "Kale"],
    commonUnits: ["kg", "bundles"],
    avgPriceRange: { min: 20, max: 60 },
  },
  {
    cropType: "Spinach",
    varieties: ["African Spinach", "English Spinach"],
    commonUnits: ["kg", "bundles"],
    avgPriceRange: { min: 30, max: 80 },
  },
  {
    cropType: "Onion",
    varieties: ["Red Onion", "White Onion", "Yellow Onion"],
    commonUnits: ["kg", "bags"],
    avgPriceRange: { min: 50, max: 150 },
  },
  {
    cropType: "Capsicum (Bell Pepper)",
    varieties: ["Green Pepper", "Red Pepper", "Yellow Pepper"],
    commonUnits: ["kg"],
    avgPriceRange: { min: 80, max: 200 },
  },
  {
    cropType: "Carrot",
    varieties: ["Nantes", "Chantenay"],
    commonUnits: ["kg", "bags"],
    avgPriceRange: { min: 40, max: 100 },
  },
  {
    cropType: "Lettuce",
    varieties: ["Iceberg", "Romaine", "Butterhead"],
    commonUnits: ["kg", "heads"],
    avgPriceRange: { min: 60, max: 150 },
  },
  {
    cropType: "Cabbage",
    varieties: ["Copenhagen Market", "Golden Acre"],
    commonUnits: ["kg", "heads"],
    avgPriceRange: { min: 30, max: 80 },
  },
  {
    cropType: "Herbs",
    varieties: ["Basil", "Coriander", "Parsley", "Mint", "Rosemary"],
    commonUnits: ["kg", "bundles"],
    avgPriceRange: { min: 100, max: 300 },
  },
];

// Sample listings data for seeding
export const SAMPLE_LISTINGS: Omit<Listing, "id" | "createdAt" | "updatedAt" | "sellerId">[] = [
  {
    title: "Fresh Tomatoes - Rio Grande Variety",
    cropType: "Tomato",
    variety: "Rio Grande",
    quantity: 500,
    unit: "kg",
    pricePerUnit: 80,
    currency: "KES",
    location: {
      lat: -1.2921, // Nairobi
      lng: 36.8219,
      county: "Nairobi",
      address: "Kasarani, Nairobi",
    },
    images: [],
    description: "Fresh, high-quality tomatoes from our farm. Harvested daily. Perfect for market and restaurants.",
    tags: ["fresh", "organic", "daily-harvest"],
    status: "active",
    metadata: {
      harvestDate: new Date(),
      quality: "Grade A",
      organic: true,
    },
  },
  {
    title: "Sukuma Wiki (Kale) - Fresh Bundles",
    cropType: "Kale (Sukuma Wiki)",
    variety: "Collard Greens",
    quantity: 200,
    unit: "bundles",
    pricePerUnit: 30,
    currency: "KES",
    location: {
      lat: -0.3031, // Nakuru
      lng: 36.0800,
      county: "Nakuru",
      address: "Njoro, Nakuru",
    },
    images: [],
    description: "Fresh sukuma wiki bundles, pesticide-free. Ready for market.",
    tags: ["fresh", "pesticide-free"],
    status: "active",
    metadata: {
      quality: "Fresh",
      organic: false,
    },
  },
  {
    title: "Red Onions - Premium Quality",
    cropType: "Onion",
    variety: "Red Onion",
    quantity: 1000,
    unit: "kg",
    pricePerUnit: 90,
    currency: "KES",
    location: {
      lat: -1.0332, // Kiambu
      lng: 37.0692,
      county: "Kiambu",
      address: "Thika, Kiambu",
    },
    images: [],
    description: "Premium red onions, well-cured and ready for storage. Bulk orders welcome.",
    tags: ["premium", "bulk-available"],
    status: "active",
    metadata: {
      quality: "Premium",
      organic: false,
    },
  },
  {
    title: "Green Bell Peppers - Fresh Harvest",
    cropType: "Capsicum (Bell Pepper)",
    variety: "Green Pepper",
    quantity: 300,
    unit: "kg",
    pricePerUnit: 120,
    currency: "KES",
    location: {
      lat: -0.0917, // Naivasha
      lng: 36.4340,
      county: "Nakuru",
      address: "Naivasha, Nakuru",
    },
    images: [],
    description: "Fresh green bell peppers, crisp and flavorful. Ideal for restaurants and markets.",
    tags: ["fresh", "restaurant-grade"],
    status: "active",
    metadata: {
      quality: "Grade A",
      organic: true,
    },
  },
  {
    title: "Carrots - Nantes Variety",
    cropType: "Carrot",
    variety: "Nantes",
    quantity: 400,
    unit: "kg",
    pricePerUnit: 70,
    currency: "KES",
    location: {
      lat: -0.1022, // Nyandarua
      lng: 36.4167,
      county: "Nyandarua",
      address: "Ol Kalou, Nyandarua",
    },
    images: [],
    description: "Sweet, crunchy carrots. Perfect for juicing and cooking.",
    tags: ["sweet", "fresh"],
    status: "active",
    metadata: {
      quality: "Grade A",
      organic: false,
    },
  },
  {
    title: "Fresh Herbs Bundle - Mixed",
    cropType: "Herbs",
    variety: "Mixed",
    quantity: 100,
    unit: "bundles",
    pricePerUnit: 150,
    currency: "KES",
    location: {
      lat: -1.2921, // Nairobi
      lng: 36.8219,
      county: "Nairobi",
      address: "Karen, Nairobi",
    },
    images: [],
    description: "Fresh mixed herbs: basil, coriander, parsley. Perfect for restaurants and home cooking.",
    tags: ["fresh", "mixed", "restaurant-grade"],
    status: "active",
    metadata: {
      quality: "Premium",
      organic: true,
    },
  },
];

/**
 * Generate more sample listings with random locations in Kenya
 */
export function generateSampleListings(count: number = 20): Omit<Listing, "id" | "createdAt" | "updatedAt" | "sellerId">[] {
  const listings: Omit<Listing, "id" | "createdAt" | "updatedAt" | "sellerId">[] = [];
  
  // Kenyan counties with approximate coordinates
  const locations = [
    { lat: -1.2921, lng: 36.8219, county: "Nairobi" },
    { lat: -0.3031, lng: 36.0800, county: "Nakuru" },
    { lat: -1.0332, lng: 37.0692, county: "Kiambu" },
    { lat: -0.0917, lng: 36.4340, county: "Naivasha" },
    { lat: -0.1022, lng: 36.4167, county: "Nyandarua" },
    { lat: -0.4167, lng: 36.9500, county: "Nyeri" },
    { lat: 0.5167, lng: 35.2833, county: "Uasin Gishu" },
    { lat: -0.1000, lng: 34.7500, county: "Kisumu" },
  ];

  for (let i = 0; i < count; i++) {
    const crop = HORTICULTURAL_CROPS[Math.floor(Math.random() * HORTICULTURAL_CROPS.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const variety = crop.varieties[Math.floor(Math.random() * crop.varieties.length)];
    const unit = crop.commonUnits[Math.floor(Math.random() * crop.commonUnits.length)];
    const price = Math.floor(
      Math.random() * (crop.avgPriceRange.max - crop.avgPriceRange.min) + crop.avgPriceRange.min
    );

    listings.push({
      title: `${crop.cropType} - ${variety}`,
      cropType: crop.cropType,
      variety,
      quantity: Math.floor(Math.random() * 500) + 50,
      unit: unit as any,
      pricePerUnit: price,
      currency: "KES",
      location: {
        lat: location.lat + (Math.random() - 0.5) * 0.1, // Add some variation
        lng: location.lng + (Math.random() - 0.5) * 0.1,
        county: location.county,
      },
      images: [],
      description: `Fresh ${crop.cropType.toLowerCase()} from ${location.county}. High quality produce.`,
      tags: ["fresh", "horticultural"],
      status: "active",
      metadata: {
        quality: "Grade A",
        organic: Math.random() > 0.5,
      },
    });
  }

  return listings;
}
