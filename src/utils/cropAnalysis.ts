/**
 * Crop Analysis Utilities
 * Provides intelligent analysis for crops including pest/disease risks,
 * growth stage calculations, and weather alerts
 */

import { differenceInDays, differenceInWeeks } from "date-fns";
import { type Crop } from "@/services/firestore";

// Pest and disease risks by crop type
const cropRisks: Record<string, { pests: string[]; diseases: string[]; prevention: string[] }> = {
  Maize: {
    pests: ["Fall Armyworm", "Stem Borer", "Aphids", "Thrips"],
    diseases: ["Maize Lethal Necrosis", "Grey Leaf Spot", "Rust", "Ear Rot"],
    prevention: [
      "Use certified disease-free seeds",
      "Practice crop rotation",
      "Apply neem-based pesticides early",
      "Monitor for armyworm larvae weekly",
      "Maintain proper spacing (75cm x 25cm)",
      "Remove and destroy infected plants immediately"
    ],
  },
  Wheat: {
    pests: ["Aphids", "Rust Mites", "Hessian Fly", "Wheat Stem Sawfly"],
    diseases: ["Rust (Stem, Leaf, Stripe)", "Fusarium Head Blight", "Powdery Mildew", "Septoria"],
    prevention: [
      "Plant resistant varieties",
      "Avoid planting too early",
      "Apply fungicides at flag leaf stage",
      "Monitor for rust symptoms regularly",
      "Practice proper field sanitation",
      "Use balanced fertilization"
    ],
  },
  Beans: {
    pests: ["Bean Fly", "Aphids", "Bean Weevil", "Thrips"],
    diseases: ["Anthracnose", "Bean Rust", "Bacterial Blight", "Root Rot"],
    prevention: [
      "Use disease-free seeds",
      "Practice 3-year crop rotation",
      "Avoid overhead irrigation",
      "Apply copper-based fungicides preventively",
      "Remove infected leaves promptly",
      "Maintain good drainage"
    ],
  },
  Tomatoes: {
    pests: ["Tomato Fruitworm", "Whiteflies", "Aphids", "Spider Mites"],
    diseases: ["Early Blight", "Late Blight", "Bacterial Wilt", "Fusarium Wilt"],
    prevention: [
      "Use resistant varieties",
      "Practice crop rotation (3-4 years)",
      "Stake plants for better air circulation",
      "Apply fungicides preventively",
      "Remove lower leaves regularly",
      "Avoid working in fields when wet"
    ],
  },
  Potatoes: {
    pests: ["Potato Tuber Moth", "Aphids", "Colorado Potato Beetle"],
    diseases: ["Late Blight", "Early Blight", "Bacterial Wilt", "Viral Diseases"],
    prevention: [
      "Use certified seed potatoes",
      "Practice 4-year crop rotation",
      "Hill soil around plants",
      "Apply fungicides before disease appears",
      "Remove volunteer plants",
      "Store tubers in cool, dry conditions"
    ],
  },
  Sorghum: {
    pests: ["Sorghum Midge", "Stem Borer", "Aphids", "Head Bugs"],
    diseases: ["Anthracnose", "Rust", "Grain Mold", "Downy Mildew"],
    prevention: [
      "Plant early-maturing varieties",
      "Use resistant cultivars",
      "Practice field sanitation",
      "Apply insecticides at flowering",
      "Monitor for midge during heading",
      "Rotate with non-cereal crops"
    ],
  },
  Onions: {
    pests: ["Onion Thrips", "Onion Maggot", "Aphids"],
    diseases: ["Downy Mildew", "Purple Blotch", "White Rot", "Fusarium Basal Rot"],
    prevention: [
      "Use disease-free sets",
      "Practice 3-year rotation",
      "Avoid overhead irrigation",
      "Apply fungicides preventively",
      "Remove infected plants",
      "Ensure good field drainage"
    ],
  },
  Other: {
    pests: ["General Pests"],
    diseases: ["Common Diseases"],
    prevention: [
      "Use certified seeds",
      "Practice crop rotation",
      "Monitor regularly",
      "Maintain field hygiene",
      "Apply appropriate pesticides",
      "Consult agricultural extension services"
    ],
  },
};

/**
 * Calculate growth stage based on planting date and crop type
 */
export function calculateGrowthStage(crop: Crop): {
  stage: string;
  daysSincePlanting: number;
  weeksSincePlanting: number;
  progress: number;
} {
  const plantingDate = new Date(crop.plantingDate);
  const now = new Date();
  const daysSincePlanting = differenceInDays(now, plantingDate);
  const weeksSincePlanting = differenceInWeeks(now, plantingDate);

  // Growth stages vary by crop type
  const growthStages: Record<string, { stages: Array<{ name: string; days: number }> }> = {
    Maize: {
      stages: [
        { name: "Germination", days: 7 },
        { name: "Seedling", days: 21 },
        { name: "Vegetative", days: 60 },
        { name: "Tasseling", days: 80 },
        { name: "Silking", days: 90 },
        { name: "Grain Filling", days: 120 },
        { name: "Maturity", days: 150 },
      ],
    },
    Beans: {
      stages: [
        { name: "Germination", days: 7 },
        { name: "Vegetative", days: 30 },
        { name: "Flowering", days: 45 },
        { name: "Pod Development", days: 60 },
        { name: "Maturity", days: 90 },
      ],
    },
    Tomatoes: {
      stages: [
        { name: "Germination", days: 10 },
        { name: "Seedling", days: 30 },
        { name: "Vegetative", days: 60 },
        { name: "Flowering", days: 75 },
        { name: "Fruit Development", days: 100 },
        { name: "Harvest", days: 120 },
      ],
    },
    Wheat: {
      stages: [
        { name: "Germination", days: 7 },
        { name: "Tillering", days: 30 },
        { name: "Stem Elongation", days: 60 },
        { name: "Heading", days: 90 },
        { name: "Grain Filling", days: 120 },
        { name: "Maturity", days: 150 },
      ],
    },
  };

  const cropStages = growthStages[crop.type] || growthStages.Maize;
  let currentStage = cropStages.stages[0].name;
  let progress = 0;

  for (let i = 0; i < cropStages.stages.length; i++) {
    if (daysSincePlanting >= cropStages.stages[i].days) {
      currentStage = cropStages.stages[i].name;
      const nextStage = cropStages.stages[i + 1];
      if (nextStage) {
        const stageDuration = nextStage.days - cropStages.stages[i].days;
        const progressInStage = daysSincePlanting - cropStages.stages[i].days;
        progress = Math.min(100, (progressInStage / stageDuration) * 100);
      } else {
        progress = 100;
      }
    }
  }

  return {
    stage: currentStage,
    daysSincePlanting,
    weeksSincePlanting,
    progress: Math.min(100, progress),
  };
}

/**
 * Get pest and disease risks for a crop
 */
export function getCropRisks(crop: Crop): {
  pests: string[];
  diseases: string[];
  prevention: string[];
} {
  return cropRisks[crop.type] || cropRisks.Other;
}

/**
 * Get weather alerts based on location/field data
 */
export function getWeatherAlerts(crop: Crop): {
  alerts: Array<{ type: "warning" | "info" | "danger"; message: string }>;
} {
  const alerts: Array<{ type: "warning" | "info" | "danger"; message: string }> = [];

  // Check soil moisture
  if (crop.soilMoisture !== undefined) {
    if (crop.soilMoisture < 30) {
      alerts.push({
        type: "danger",
        message: "Low soil moisture detected. Irrigation recommended immediately.",
      });
    } else if (crop.soilMoisture < 50) {
      alerts.push({
        type: "warning",
        message: "Soil moisture is below optimal. Consider irrigation soon.",
      });
    }
  }

  // Check NDVI
  if (crop.ndvi !== undefined) {
    if (crop.ndvi < 0.3) {
      alerts.push({
        type: "danger",
        message: "Very low vegetation index. Crop may be stressed or unhealthy.",
      });
    } else if (crop.ndvi < 0.5) {
      alerts.push({
        type: "warning",
        message: "Vegetation index below optimal. Monitor crop health closely.",
      });
    }
  }

  // Check planting date for seasonal risks
  const plantingDate = new Date(crop.plantingDate);
  const month = plantingDate.getMonth(); // 0-11

  // Kenya weather patterns (approximate)
  if (month >= 3 && month <= 5) {
    // Long rains season
    alerts.push({
      type: "info",
      message: "Long rains season. Monitor for fungal diseases and ensure proper drainage.",
    });
  } else if (month >= 10 && month <= 12) {
    // Short rains season
    alerts.push({
      type: "info",
      message: "Short rains season. Watch for waterlogging and disease outbreaks.",
    });
  } else if (month >= 6 && month <= 9) {
    // Dry season
    alerts.push({
      type: "warning",
      message: "Dry season. Ensure adequate irrigation and monitor soil moisture.",
    });
  }

  // Field location-based alerts (if field name suggests location)
  if (crop.field) {
    const fieldLower = crop.field.toLowerCase();
    if (fieldLower.includes("lowland") || fieldLower.includes("valley")) {
      alerts.push({
        type: "info",
        message: "Lowland location. Monitor for waterlogging during heavy rains.",
      });
    } else if (fieldLower.includes("upland") || fieldLower.includes("hill")) {
      alerts.push({
        type: "info",
        message: "Upland location. May experience water stress during dry periods.",
      });
    }
  }

  return { alerts };
}

/**
 * Get comprehensive crop analysis
 */
export function analyzeCrop(crop: Crop): {
  growthStage: ReturnType<typeof calculateGrowthStage>;
  risks: ReturnType<typeof getCropRisks>;
  weatherAlerts: ReturnType<typeof getWeatherAlerts>;
} {
  return {
    growthStage: calculateGrowthStage(crop),
    risks: getCropRisks(crop),
    weatherAlerts: getWeatherAlerts(crop),
  };
}

