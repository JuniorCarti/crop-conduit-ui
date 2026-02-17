export type TradeListingStatus = "active" | "paused" | "sold";

export type TradeListing = {
  id: string;
  crop: string;
  quantityKg: number;
  grade: string;
  location: string;
  harvestDate: string;
  pricePerKg: number;
  status: TradeListingStatus;
  views: number;
  bids: number;
};

export type TradeRowStatus = "pending" | "paid" | "in_transit" | "delivered";

export type TradeRow = {
  id: string;
  crop: string;
  buyer: string;
  quantityKg: number;
  agreedPrice: number;
  deliveryDate: string;
  status: TradeRowStatus;
};

export type ContractStatus = "pending" | "accepted" | "declined";

export type ContractRow = {
  id: string;
  crop: string;
  lockedPrice: number;
  quantityKg: number;
  deliveryWindow: string;
  buyer: string;
  status: ContractStatus;
};
