export type AshaRole = "user" | "assistant";

export type AshaIntent = "general" | "marketplace" | "climate" | "orders" | "profile";

export type AshaActionType =
  | "NAVIGATE"
  | "OPEN_LISTING"
  | "ADD_TO_CART"
  | "OPEN_CART"
  | "CHECKOUT"
  | "PREFILL_CHECKOUT";

export type AshaAction =
  | { type: "NAVIGATE"; to: string }
  | { type: "OPEN_LISTING"; listingId: string }
  | { type: "ADD_TO_CART"; listing: Record<string, any> }
  | { type: "OPEN_CART" }
  | { type: "CHECKOUT" }
  | { type: "PREFILL_CHECKOUT"; buyer: Record<string, any> };

export type AshaUiHint = {
  navigateTo?: string;
  highlightId?: string;
  openModal?: string;
};

export type AshaCardType = "climate" | "market" | "logistics";

export type AshaCard = {
  type: AshaCardType;
  title: string;
  subtitle?: string;
  items?: string[];
  listing?: {
    title: string;
    price?: number;
    unit?: string;
    county?: string;
  };
};

export type AshaMessage = {
  id: string;
  role: AshaRole;
  text: string;
  createdAt: number;
  status?: "sent" | "pending" | "error";
  intent?: AshaIntent;
  actions?: AshaAction[];
  uiHint?: AshaUiHint | null;
  toolResult?: any;
  cards?: AshaCard[];
  autoPlay?: boolean;
};

export type AshaChatRequest = {
  sessionId: string;
  message: string;
  language: "en" | "sw";
  farm: {
    lat?: number;
    lon?: number;
    county?: string;
    ward?: string;
    crops?: string[];
  };
  context: {
    userId?: string;
    displayName?: string;
    email?: string;
  };
  clientContext?: {
    activeFarmId?: string;
    activeTab?: "marketplace" | "climate" | "asha" | "orders" | "profile";
    cartCount?: number;
  };
};

export type AshaResponse = {
  ok: boolean;
  reply: string;
  intent?: AshaIntent;
  actions?: AshaAction[];
  uiHint?: AshaUiHint | null;
  toolResult?: any;
  error?: string;
  [key: string]: any;
};
