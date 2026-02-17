import {
  collection,
  collectionGroup,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type FarmerBidOffer = {
  id: string;
  pricePerUnit: number;
  currency: string;
  buyerLabel: string;
  createdAt?: any;
  status?: string;
};

export type FarmerBid = {
  orgId: string;
  bidId: string;
  orgName: string;
  commodity: string;
  category: "crop" | "livestock";
  requestedQty: number;
  unit: string;
  status: "open" | "closed" | "cancelled";
  opensAt?: any;
  closesAt?: any;
  createdAt?: any;
  visibilityMode?: "eligible_only" | "all_members";
  transparencyMode?: "top_only" | "full_list";
  winningPrice?: number | null;
  winningBuyerLabel?: string | null;
  bidderCount: number;
  topPrices: number[];
  myContributionQty: number;
  myContributionUnit: string;
  eligible: boolean;
};

export type FarmerContribution = {
  orgId: string;
  commodity: string;
  qty: number;
  unit: string;
  source: "contributions" | "collections" | "marketplace";
  createdAt?: any;
};

type ContributionMap = Record<string, Record<string, { qty: number; unit: string }>>;

const ninetyDaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 90);
  return date;
};

const toDate = (value: any) => value?.toDate?.() ?? (value ? new Date(value) : null);

const inWindow = (value: any) => {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return true;
  return date.getTime() >= ninetyDaysAgo().getTime();
};

const normalizeCommodity = (value: any) => String(value || "").trim().toLowerCase();

const addContribution = (
  map: ContributionMap,
  list: FarmerContribution[],
  input: FarmerContribution
) => {
  const commodity = normalizeCommodity(input.commodity);
  if (!commodity) return;
  if (!map[input.orgId]) map[input.orgId] = {};
  if (!map[input.orgId][commodity]) {
    map[input.orgId][commodity] = { qty: 0, unit: input.unit || "kg" };
  }
  map[input.orgId][commodity].qty += Number(input.qty || 0);
  list.push(input);
};

async function resolveOrgMemberships(uid: string) {
  const orgIds = new Set<string>();
  try {
    const memberSnap = await getDocs(
      query(collectionGroup(db, "members"), where(documentId(), "==", uid))
    );
    memberSnap.forEach((snap) => {
      const segments = snap.ref.path.split("/");
      const orgIndex = segments.findIndex((segment) => segment === "orgs");
      const orgId = orgIndex >= 0 ? segments[orgIndex + 1] : null;
      if (!orgId) return;
      const data = snap.data() as any;
      const status = data?.status ?? data?.verificationStatus;
      if (!status || status === "active" || status === "approved") {
        orgIds.add(orgId);
      }
    });
  } catch {
    // ignore and continue with alternative source
  }

  try {
    const membershipSnap = await getDocs(collection(db, "users", uid, "memberships"));
    membershipSnap.forEach((snap) => {
      const data = snap.data() as any;
      if ((data?.status ?? "active") === "active") {
        orgIds.add(snap.id);
      }
    });
  } catch {
    // ignore and continue
  }

  return Array.from(orgIds);
}

async function loadContributionMap(uid: string, orgIds: string[]) {
  const map: ContributionMap = {};
  const list: FarmerContribution[] = [];

  await Promise.all(
    orgIds.map(async (orgId) => {
      try {
        const contributionsSnap = await getDocs(
          query(collection(db, "orgs", orgId, "contributions"), where("uid", "==", uid))
        );
        contributionsSnap.forEach((snap) => {
          const data = snap.data() as any;
          if (!inWindow(data?.createdAt)) return;
          addContribution(map, list, {
            orgId,
            commodity: data?.commodity,
            qty: Number(data?.quantity ?? data?.qty ?? 0),
            unit: data?.unit ?? "kg",
            source: "contributions",
            createdAt: data?.createdAt,
          });
        });
      } catch {
        // ignore missing path or permission limits
      }

      try {
        const collectionSnap = await getDocs(collection(db, "orgs", orgId, "collections"));
        collectionSnap.forEach((snap) => {
          const data = snap.data() as any;
          if (!inWindow(data?.collectionDate ?? data?.createdAt)) return;

          const commitment = data?.commitments?.[uid];
          if (commitment) {
            addContribution(map, list, {
              orgId,
              commodity: data?.commodity,
              qty: Number(commitment?.qty ?? commitment?.quantity ?? 0),
              unit: commitment?.unit ?? data?.unit ?? "kg",
              source: "collections",
              createdAt: data?.collectionDate ?? data?.createdAt,
            });
          }
        });
      } catch {
        // ignore
      }
    })
  );

  try {
    const listingsSnap = await getDocs(query(collection(db, "marketplaceListings"), where("uid", "==", uid)));
    listingsSnap.forEach((snap) => {
      const data = snap.data() as any;
      if (!data?.orgId || !inWindow(data?.createdAt ?? data?.updatedAt)) return;
      addContribution(map, list, {
        orgId: data.orgId,
        commodity: data?.commodity,
        qty: Number(data?.quantity ?? data?.quantityAvailable ?? 0),
        unit: data?.unit ?? "kg",
        source: "marketplace",
        createdAt: data?.createdAt ?? data?.updatedAt,
      });
    });
  } catch {
    // ignore
  }

  return { map, list };
}

const maskBuyer = (rawLabel: string, index: number) => {
  if (!rawLabel) return `Buyer ${String.fromCharCode(65 + index)}`;
  if (rawLabel.startsWith("Buyer ")) return rawLabel;
  return `Buyer ${rawLabel.slice(0, 1).toUpperCase()}`;
};

async function resolveOffers(orgId: string, bidId: string, transparencyMode?: string) {
  try {
    const offerSnap = await getDocs(collection(db, "orgs", orgId, "bids", bidId, "offers"));
    const rows = offerSnap.docs
      .map((snap, index) => {
        const data = snap.data() as any;
        const rawLabel = data?.buyerLabel ?? data?.buyerId ?? data?.buyerName ?? "";
        return {
          id: snap.id,
          pricePerUnit: Number(data?.pricePerUnit ?? 0),
          currency: data?.currency ?? "KES",
          buyerLabel: maskBuyer(rawLabel, index),
          createdAt: data?.createdAt,
          status: data?.status ?? "active",
        } as FarmerBidOffer;
      })
      .filter((row) => Number.isFinite(row.pricePerUnit) && row.pricePerUnit > 0)
      .sort((a, b) => b.pricePerUnit - a.pricePerUnit);

    if (transparencyMode === "full_list") {
      return { offers: rows, topPrices: rows.slice(0, 3).map((row) => row.pricePerUnit), bidderCount: rows.length };
    }

    return {
      offers: rows.slice(0, 3),
      topPrices: rows.slice(0, 3).map((row) => row.pricePerUnit),
      bidderCount: rows.length,
    };
  } catch {
    return { offers: [] as FarmerBidOffer[], topPrices: [] as number[], bidderCount: 0 };
  }
}

export async function listFarmerBids(uid: string) {
  const orgIds = await resolveOrgMemberships(uid);
  if (!orgIds.length) {
    return { activeBids: [] as FarmerBid[], closedBids: [] as FarmerBid[], contributions: [] as FarmerContribution[] };
  }

  const { map: contributionMap, list: contributions } = await loadContributionMap(uid, orgIds);
  const activeBids: FarmerBid[] = [];
  const closedBids: FarmerBid[] = [];

  await Promise.all(
    orgIds.map(async (orgId) => {
      try {
        const orgSnap = await getDoc(doc(db, "orgs", orgId));
        const orgData = orgSnap.exists() ? (orgSnap.data() as any) : {};
        const orgName = orgData?.orgName ?? orgData?.name ?? "Cooperative";

        const bidSnap = await getDocs(collection(db, "orgs", orgId, "bids"));
        await Promise.all(
          bidSnap.docs.map(async (snap) => {
            const data = snap.data() as any;
            const commodityKey = normalizeCommodity(data?.commodity);
            const contribution = contributionMap[orgId]?.[commodityKey];
            const isAllMembers = data?.visibilityMode === "all_members";
            const eligible = Boolean(isAllMembers || contribution);
            if (!eligible) return;

            const offerSummary = await resolveOffers(orgId, snap.id, data?.transparencyMode);
            const bid: FarmerBid = {
              orgId,
              bidId: snap.id,
              orgName,
              commodity: data?.commodity ?? "Commodity",
              category: (data?.category ?? "crop") as "crop" | "livestock",
              requestedQty: Number(data?.requestedQty ?? 0),
              unit: data?.unit ?? "kg",
              status: data?.status ?? "open",
              opensAt: data?.opensAt,
              closesAt: data?.closesAt,
              createdAt: data?.createdAt,
              visibilityMode: data?.visibilityMode ?? "eligible_only",
              transparencyMode: data?.transparencyMode ?? "top_only",
              winningPrice: data?.winningPrice ?? null,
              winningBuyerLabel: data?.winningBuyerLabel ?? null,
              bidderCount: offerSummary.bidderCount,
              topPrices: offerSummary.topPrices,
              myContributionQty: Number(contribution?.qty ?? 0),
              myContributionUnit: contribution?.unit ?? "kg",
              eligible: true,
            };

            if (bid.status === "open") activeBids.push(bid);
            if (bid.status === "closed") closedBids.push(bid);
          })
        );
      } catch {
        // skip inaccessible orgs
      }
    })
  );

  const sortByClose = (a: FarmerBid, b: FarmerBid) =>
    (toDate(a.closesAt)?.getTime() || 0) - (toDate(b.closesAt)?.getTime() || 0);
  const sortByClosed = (a: FarmerBid, b: FarmerBid) =>
    (toDate(b.closesAt)?.getTime() || 0) - (toDate(a.closesAt)?.getTime() || 0);

  return {
    activeBids: activeBids.sort(sortByClose),
    closedBids: closedBids.sort(sortByClosed),
    contributions: contributions.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)),
  };
}

export async function getFarmerBidDetails(uid: string, orgId: string, bidId: string) {
  const data = await listFarmerBids(uid);
  const target = [...data.activeBids, ...data.closedBids].find((row) => row.orgId === orgId && row.bidId === bidId);
  if (!target) return null;

  const offers = await resolveOffers(orgId, bidId, target.transparencyMode);
  return {
    bid: target,
    offers: offers.offers,
  };
}

