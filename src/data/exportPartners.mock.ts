export type ExportPartner = {
  id: string;
  companyName: string;
  cropsAccepted: string[];
  targetMarkets: string[];
  moqKg: number;
  certifications: string[];
  leadTimeDays: number;
  packaging: string;
  contactLabel: string;
};

export const exportPartnersMock: ExportPartner[] = [
  {
    id: "partner_1",
    companyName: "East Africa Fresh Exports",
    cropsAccepted: ["Tomatoes", "Onions", "Cabbage"],
    targetMarkets: ["UAE", "Regional"],
    moqKg: 2500,
    certifications: ["GlobalGAP", "Phytosanitary"],
    leadTimeDays: 10,
    packaging: "Crates 15kg, barcoded labels",
    contactLabel: "Contact sourcing desk",
  },
  {
    id: "partner_2",
    companyName: "GreenBridge Produce Ltd",
    cropsAccepted: ["Kale", "Cabbage", "Tomatoes"],
    targetMarkets: ["EU", "Regional"],
    moqKg: 1800,
    certifications: ["GlobalGAP", "HACCP/ISO"],
    leadTimeDays: 14,
    packaging: "Ventilated cartons, pre-cooling required",
    contactLabel: "Request onboarding call",
  },
  {
    id: "partner_3",
    companyName: "Nile Corridor Commodities",
    cropsAccepted: ["Maize", "Onions"],
    targetMarkets: ["India", "Regional"],
    moqKg: 5000,
    certifications: ["Phytosanitary", "ICO"],
    leadTimeDays: 21,
    packaging: "50kg woven sacks, moisture-tested",
    contactLabel: "Share supply profile",
  },
];
