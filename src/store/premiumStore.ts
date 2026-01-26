import { create } from "zustand";

type PremiumModalState = {
  isOpen: boolean;
  pendingRoute: string | null;
  pendingFeatureId: string | null;
  allowedFeatures: Record<string, boolean>;
  open: (payload?: { route?: string; featureId?: string }) => void;
  close: () => void;
  setOpen: (open: boolean) => void;
  allowFeature: (featureId: string) => void;
};

export const usePremiumModalStore = create<PremiumModalState>((set) => ({
  isOpen: false,
  pendingRoute: null,
  pendingFeatureId: null,
  allowedFeatures: {},
  open: (payload) =>
    set({
      isOpen: true,
      pendingRoute: payload?.route ?? null,
      pendingFeatureId: payload?.featureId ?? null,
    }),
  close: () =>
    set({
      isOpen: false,
      pendingRoute: null,
      pendingFeatureId: null,
    }),
  setOpen: (open) =>
    set((state) => ({
      isOpen: open,
      pendingRoute: open ? state.pendingRoute : null,
      pendingFeatureId: open ? state.pendingFeatureId : null,
    })),
  allowFeature: (featureId) =>
    set((state) => ({
      allowedFeatures: { ...state.allowedFeatures, [featureId]: true },
    })),
}));
