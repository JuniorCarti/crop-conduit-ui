export const ORG_CAPABILITIES = {
  cooperative: ["members", "aggregation", "prices", "training", "certificates", "targets", "billing"],
  enterprise: [],
  bank: [],
  ngo: [],
  government_national: [],
  gov_national: [],
} as const;

export type OrgType = keyof typeof ORG_CAPABILITIES;
export type OrgCapability = (typeof ORG_CAPABILITIES)[OrgType][number];

export const hasOrgCapability = (orgType: OrgType | null | undefined, capability: OrgCapability) => {
  if (!orgType) return false;
  return ORG_CAPABILITIES[orgType]?.includes(capability) ?? false;
};
