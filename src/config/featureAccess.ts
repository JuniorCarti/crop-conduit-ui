import type { LucideIcon } from "lucide-react";
import {
  Home,
  TrendingUp,
  Leaf,
  Package,
  Droplets,
  Truck,
  Wallet,
  Store,
  Users,
  CloudSun,
  Mic,
} from "lucide-react";

export const FREE_FEATURES = ["market", "climate", "harvest", "asha"] as const;
export const PREMIUM_PREVIEW_ENABLED = true;

export type FeatureTier = "free" | "premium";

export type FeatureItem = {
  id: string;
  labelKey: string;
  navDescriptionKey: string;
  route: string;
  icon: LucideIcon;
  tier: FeatureTier;
  taglineKey: string;
  tagline: string;
  descriptionKey: string;
  description: string;
};

export const FEATURES: FeatureItem[] = [
  {
    id: "dashboard",
    labelKey: "nav.dashboard",
    navDescriptionKey: "navDescriptions.dashboard",
    route: "/",
    icon: Home,
    tier: "free",
    taglineKey: "features.dashboard.tagline",
    tagline: "Overview",
    descriptionKey: "features.dashboard.description",
    description: "Your farm summary, alerts, and quick actions in one place.",
  },
  {
    id: "market",
    labelKey: "nav.market",
    navDescriptionKey: "navDescriptions.market",
    route: "/market",
    icon: TrendingUp,
    tier: "free",
    taglineKey: "features.market.tagline",
    tagline: "Oracle Agent",
    descriptionKey: "features.market.description",
    description:
      "Predicts market prices and highlights unusual price movements so you can decide when to sell.",
  },
  {
    id: "climate",
    labelKey: "nav.climate",
    navDescriptionKey: "navDescriptions.climate",
    route: "/climate",
    icon: CloudSun,
    tier: "free",
    taglineKey: "features.climate.tagline",
    tagline: "Forecasts & Alerts",
    descriptionKey: "features.climate.description",
    description:
      "7-day forecast, rain/frost risk, and smart guidance tailored to your farm location.",
  },
  {
    id: "asha",
    labelKey: "nav.asha",
    navDescriptionKey: "navDescriptions.asha",
    route: "/asha",
    icon: Mic,
    tier: "free",
    taglineKey: "features.asha.tagline",
    tagline: "Voice Assistant",
    descriptionKey: "features.asha.description",
    description:
      "Talk or type to Asha for quick, friendly farming guidance delivered by voice.",
  },
  {
    id: "harvest",
    labelKey: "nav.harvest",
    navDescriptionKey: "navDescriptions.harvest",
    route: "/harvest",
    icon: Truck,
    tier: "free",
    taglineKey: "features.harvest.tagline",
    tagline: "Foreman Agent",
    descriptionKey: "features.harvest.description",
    description:
      "Plan harvest schedules, coordinate workers, and prepare delivery logistics efficiently.",
  },
  {
    id: "crops",
    labelKey: "nav.crops",
    navDescriptionKey: "navDescriptions.crops",
    route: "/crops",
    icon: Leaf,
    tier: "premium",
    taglineKey: "features.crops.tagline",
    tagline: "Sentinel Agent",
    descriptionKey: "features.crops.description",
    description:
      "Monitors crop health signals and suggests actions for pests, disease risks, and growth progress.",
  },
  {
    id: "resources",
    labelKey: "nav.resources",
    navDescriptionKey: "navDescriptions.resources",
    route: "/resources",
    icon: Package,
    tier: "premium",
    taglineKey: "features.resources.tagline",
    tagline: "Quartermaster",
    descriptionKey: "features.resources.description",
    description:
      "Track farm inputs, tools, and usage so you never run out of essentials at critical times.",
  },
  {
    id: "irrigation",
    labelKey: "nav.irrigation",
    navDescriptionKey: "navDescriptions.irrigation",
    route: "/irrigation",
    icon: Droplets,
    tier: "premium",
    taglineKey: "features.irrigation.tagline",
    tagline: "Scheduler",
    descriptionKey: "features.irrigation.description",
    description:
      "Build watering routines based on weather and crop stage to reduce waste and boost yield.",
  },
  {
    id: "finance",
    labelKey: "nav.finance",
    navDescriptionKey: "navDescriptions.finance",
    route: "/finance",
    icon: Wallet,
    tier: "premium",
    taglineKey: "features.finance.tagline",
    tagline: "Chancellor",
    descriptionKey: "features.finance.description",
    description:
      "Estimate costs, profits, and cash flow to keep farm decisions financially healthy.",
  },
  {
    id: "marketplace",
    labelKey: "nav.marketplace",
    navDescriptionKey: "navDescriptions.marketplace",
    route: "/marketplace",
    icon: Store,
    tier: "premium",
    taglineKey: "features.marketplace.tagline",
    tagline: "Buy & Sell",
    descriptionKey: "features.marketplace.description",
    description:
      "Connect with buyers and sellers, compare offers, and manage listings in one place.",
  },
  {
    id: "community",
    labelKey: "nav.community",
    navDescriptionKey: "navDescriptions.community",
    route: "/community",
    icon: Users,
    tier: "premium",
    taglineKey: "features.community.tagline",
    tagline: "Connect",
    descriptionKey: "features.community.description",
    description:
      "Share experiences, learn from other farmers, and get practical tips from the community.",
  },
];

export const getFeatureById = (id: string): FeatureItem | undefined =>
  FEATURES.find((feature) => feature.id === id);

export const isPremiumFeature = (id: string): boolean =>
  getFeatureById(id)?.tier === "premium";
