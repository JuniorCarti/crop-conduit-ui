import { create } from "zustand";
import type { Plan, UserFeatureFlags } from "@/types/climate";

interface ClimateStoreState {
  selectedFarmId: string | null;
  plan: Plan;
  features: UserFeatureFlags;
  setSelectedFarmId: (id: string | null) => void;
  setUserPlan: (plan: Plan, features: UserFeatureFlags) => void;
}

const defaultFeatures: UserFeatureFlags = {
  climateBasic: true,
  climatePremium: false,
  frostAlerts: false,
  rain14: false,
  smsAlerts: false,
};

export const useClimateStore = create<ClimateStoreState>((set) => ({
  selectedFarmId: null,
  plan: "free",
  features: defaultFeatures,
  setSelectedFarmId: (id) => set({ selectedFarmId: id }),
  setUserPlan: (plan, features) => set({ plan, features }),
}));
