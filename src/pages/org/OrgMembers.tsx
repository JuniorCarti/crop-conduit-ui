import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { getCounties, getLocations, getSubCounties, getWards } from "@/data/kenyaLocations";
import { generateMemberId, getOrgProfile } from "@/services/cooperativeService";
import {
  buildJoinDeepLink,
  buildJoinWebLink,
  createJoinCode,
  listOrgJoinCodes,
  updateOrgJoinCodeStatus,
  type JoinCodeDoc,
} from "@/services/joinCodeService";
import { uploadOrgMemberDoc } from "@/services/orgMemberDocsUploadService";
import { getOrgFeatureFlags, type OrgFeatureFlags } from "@/services/orgFeaturesService";
import { createUserNotification } from "@/services/notificationService";
import { assignSponsorSeatFromPool, listSponsorPools } from "@/services/phase3Service";


type UploadMeta = {
  url: string;
  key: string;
  uploadedAt: string;
  fileName: string;
  size: number;
  contentType: string;
};

type VerificationChecklist = {
  idFront: boolean;
  idBack: boolean;
  mpesaStatement: boolean;
  farmProof?: boolean;
  other?: boolean;
};

type AuditLog = {
  id: string;
  action: string;
  byName?: string;
  byUid?: string;
  timestamp?: any;
  notes?: string | null;
};

type SeatType = "none" | "paid" | "sponsored";

type SubscriptionSeats = {
  paidSeatsTotal: number;
  sponsoredSeatsTotal: number;
  paidSeatsUsed: number;
  sponsoredSeatsUsed: number;
};

type MemberApplication = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  memberUniqueId: string;
  memberUid?: string | null;
  submittedByUid: string;
  submittedByName: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
  updatedAt?: any;
  approvedByUid?: string | null;
  approvedAt?: any;
  rejectedByUid?: string | null;
  rejectedAt?: any;
  rejectionReason?: string | null;
  memberPayload?: any;
};

type OrgJoinRequest = {
  id: string;
  uid: string;
  orgId: string;
  joinCode: string;
  status: "submitted" | "approved" | "rejected";
  createdAt?: any;
  updatedAt?: any;
  approvedByUid?: string | null;
  approvedAt?: any;
  rejectedByUid?: string | null;
  rejectedAt?: any;
  rejectionReason?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
};

type SponsorPoolOption = {
  id: string;
  title?: string;
  partnerId?: string | null;
  remaining: number;
};


type ProductionRow = { crop: string; amountKg: string };

type MemberFormState = {
  fullName: string;
  phone: string;
  nationalIdNumber: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  membershipRole: "member" | "group_leader" | "committee_member" | "field_agent_member";
  county: string;
  subcounty: string;
  ward: string;
  location: string;
  farmSizeAcres: string;
  landOwnershipType: string;
  mainCrops: string[];
  secondaryCrops: string[];
  seasonalProductionEstimate: ProductionRow[];
  irrigationAvailable: boolean;
  storageAvailable: boolean;
  mpesaNumber: string;
  averageMonthlySales: string;
  buyerHistory: string;
};

const CROPS = [
  "Maize",
  "Beans",
  "Tomatoes",
  "Onion",
  "Cabbage",
  "Kale (Sukuma wiki)",
  "Irish Potatoes",
  "Avocado",
  "Mangoes",
  "Bananas",
];

const MEMBERSHIP_ROLES: MemberFormState["membershipRole"][] = [
  "member",
  "group_leader",
  "committee_member",
  "field_agent_member",
];

const OWNERSHIP_TYPES = ["Owner", "Tenant", "Family land", "Lease", "Other"];

const steps = [
  "Identity",
  "Location",
  "Farm",
  "Financial",
  "Documents",
  "Review",
];

const createTempId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const initialFormState: MemberFormState = {
  fullName: "",
  phone: "",
  nationalIdNumber: "",
  nextOfKinName: "",
  nextOfKinPhone: "",
  membershipRole: "member",
  county: "",
  subcounty: "",
  ward: "",
  location: "",
  farmSizeAcres: "",
  landOwnershipType: "",
  mainCrops: [],
  secondaryCrops: [],
  seasonalProductionEstimate: [{ crop: "", amountKg: "" }],
  irrigationAvailable: false,
  storageAvailable: false,
  mpesaNumber: "",
  averageMonthlySales: "",
  buyerHistory: "",
};

const getSeatValue = (member: any): SeatType => {
  const raw = member.seatType ?? member.seatStatus ?? member.premiumSeatType ?? "none";
  return raw === "paid" || raw === "sponsored" ? raw : "none";
};

const parseCsv = (text: string) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = (values[index] ?? "").trim();
      return acc;
    }, {});
  });
  return { headers, rows };
};

export default function OrgMembers() {
  const accountQuery = useUserAccount();
  const { currentUser } = useAuth();
  const orgId = accountQuery.data?.orgId ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const verifierName =
    accountQuery.data?.displayName ||
    currentUser?.displayName ||
    currentUser?.email ||
    "User";

  const [orgName, setOrgName] = useState("Cooperative");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [joinCodeOpen, setJoinCodeOpen] = useState(false);
  const [joinCodeValue, setJoinCodeValue] = useState<string | null>(null);
  const [joinCodeLoading, setJoinCodeLoading] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<JoinCodeDoc[]>([]);
  const [inviteCodesLoading, setInviteCodesLoading] = useState(false);
  const [togglingCodeId, setTogglingCodeId] = useState<string | null>(null);
  const [featureFlags, setFeatureFlags] = useState<OrgFeatureFlags>({
    invitesV2: false,
    analyticsV2: false,
    notificationsV2: false,
    membershipsMirrorV2: false,
    phase3Partners: false,
    phase3Sponsorships: false,
    phase3RevenueShare: false,
    phase3SellOnBehalf: false,
    phase3Impact: false,
    phase3Reports: false,
    phase3DonorExports: false,
  });
  const [joinCodeForm, setJoinCodeForm] = useState({
    type: "farmer" as "farmer" | "staff" | "buyer",
    maxUses: "50",
    expiresAt: "",
  });
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTargetMember, setLinkTargetMember] = useState<any | null>(null);
  const [linkQuery, setLinkQuery] = useState("");
  const [linkResults, setLinkResults] = useState<any[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [memberDocId, setMemberDocId] = useState<string | null>(null);
  const [tempMemberRef, setTempMemberRef] = useState(createTempId());
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<MemberFormState>({ ...initialFormState });
  const [idFront, setIdFront] = useState<UploadMeta | null>(null);
  const [idBack, setIdBack] = useState<UploadMeta | null>(null);
  const [mpesaUploads, setMpesaUploads] = useState<UploadMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [seatFilter, setSeatFilter] = useState<"all" | SeatType>("all");
  const [seatMember, setSeatMember] = useState<any | null>(null);
  const [seatTypeChoice, setSeatTypeChoice] = useState<"paid" | "sponsored">("paid");
  const [sponsorPools, setSponsorPools] = useState<SponsorPoolOption[]>([]);
  const [selectedSponsoredPool, setSelectedSponsoredPool] = useState<string>("general");
  const [seatSaving, setSeatSaving] = useState(false);
  const [subscriptionSeats, setSubscriptionSeats] = useState<SubscriptionSeats>({
    paidSeatsTotal: 0,
    sponsoredSeatsTotal: 0,
    paidSeatsUsed: 0,
    sponsoredSeatsUsed: 0,
  });
  const canVerify = ["org_admin", "admin", "superadmin"].includes(accountQuery.data?.role ?? "");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [profileLogs, setProfileLogs] = useState<AuditLog[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [reviewMember, setReviewMember] = useState<any | null>(null);
  const [reviewChecklist, setReviewChecklist] = useState<VerificationChecklist>({
    idFront: false,
    idBack: false,
    mpesaStatement: false,
    farmProof: false,
    other: false,
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewLogs, setReviewLogs] = useState<AuditLog[]>([]);
  const [reviewSections, setReviewSections] = useState({ checklist: true, documents: true, audit: false });
  const [showAllAudit, setShowAllAudit] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [verifierNames, setVerifierNames] = useState<Record<string, string>>({});
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvSaving, setCsvSaving] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<MemberApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [approvingApplicationId, setApprovingApplicationId] = useState<string | null>(null);
  const [rejectingApplicationId, setRejectingApplicationId] = useState<string | null>(null);
  const [rejectApplication, setRejectApplication] = useState<MemberApplication | null>(null);
  const [rejectApplicationReason, setRejectApplicationReason] = useState("");
  const [pendingJoinRequests, setPendingJoinRequests] = useState<OrgJoinRequest[]>([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [approvingJoinRequestId, setApprovingJoinRequestId] = useState<string | null>(null);
  const [rejectJoinRequest, setRejectJoinRequest] = useState<OrgJoinRequest | null>(null);
  const [rejectJoinRequestReason, setRejectJoinRequestReason] = useState("");
  const [rejectingJoinRequestId, setRejectingJoinRequestId] = useState<string | null>(null);
  const [qrPreviewCode, setQrPreviewCode] = useState<string | null>(null);

  const actorRole = accountQuery.data?.role ?? "";
  const isOrgAdmin = ["org_admin", "admin", "superadmin"].includes(actorRole);
  const isOrgStaff = actorRole === "org_staff";

  useEffect(() => {
    if (!orgId) return;
    const loadOrg = async () => {
      const profile = await getOrgProfile(orgId);
      setOrgName(profile?.name ?? profile?.orgName ?? "Cooperative");
      const flags = await getOrgFeatureFlags(orgId).catch(() => ({
        invitesV2: false,
        analyticsV2: false,
        notificationsV2: false,
        membershipsMirrorV2: false,
        phase3Partners: false,
        phase3Sponsorships: false,
        phase3RevenueShare: false,
        phase3SellOnBehalf: false,
        phase3Impact: false,
        phase3Reports: false,
        phase3DonorExports: false,
      }));
      setFeatureFlags(flags);
    };
    loadOrg().catch(() => setOrgName("Cooperative"));
  }, [orgId]);

  const loadMembers = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "orgs", orgId, "members"));
      setMembers(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    } catch (error) {
      toast.error("Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingApplications = async () => {
    if (!orgId || !isOrgAdmin) {
      setPendingApplications([]);
      return;
    }
    setApplicationsLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, "orgs", orgId, "memberApplications"),
          where("status", "==", "pending")
        )
      );
      const rows = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) } as MemberApplication));
      rows.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      setPendingApplications(rows);
    } catch (error) {
      console.error("[OrgMembers] Failed to load member applications", {
        orgId,
        uid: currentUser?.uid,
        role: accountQuery.data?.role,
        error,
      });
      setPendingApplications([]);
      toast.error("Failed to load member applications.");
    } finally {
      setApplicationsLoading(false);
    }
  };

  const loadInviteCodes = async () => {
    if (!orgId || !featureFlags.invitesV2 || !isOrgAdmin) {
      setInviteCodes([]);
      return;
    }
    setInviteCodesLoading(true);
    try {
      const rows = await listOrgJoinCodes(orgId);
      rows.sort((a, b) => {
        const aTime = (a as any)?.createdAt?.toMillis?.() ?? 0;
        const bTime = (b as any)?.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      setInviteCodes(rows);
    } catch {
      setInviteCodes([]);
    } finally {
      setInviteCodesLoading(false);
    }
  };

  const loadPendingJoinRequests = async () => {
    if (!orgId || !isOrgAdmin) {
      setPendingJoinRequests([]);
      return;
    }
    setJoinRequestsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "orgJoinRequests"), where("orgId", "==", orgId), limit(200)));
      const rows = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const row = { id: docSnap.id, ...(docSnap.data() as any) } as OrgJoinRequest;
          let userName: string | null = null;
          let userEmail: string | null = null;
          let userPhone: string | null = null;
          try {
            const userSnap = await getDoc(doc(db, "users", row.uid));
            if (userSnap.exists()) {
              const userData = userSnap.data() as any;
              userName = userData.displayName ?? null;
              userEmail = userData.email ?? null;
              userPhone = userData.phone ?? null;
            }
          } catch {
            // best effort enrichment
          }
          return { ...row, userName, userEmail, userPhone };
        })
      );
      const pendingOnly = rows.filter((row) => row.status === "submitted");
      pendingOnly.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      setPendingJoinRequests(pendingOnly);
    } catch (error) {
      console.error("[OrgMembers] Failed to load pending join requests", { orgId, error });
      setPendingJoinRequests([]);
      toast.error("Failed to load pending join requests.");
    } finally {
      setJoinRequestsLoading(false);
    }
  };

  const loadSubscriptionSeats = async () => {
    if (!orgId) return;
    const toNum = (value: unknown) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };

    const mapSeatState = (data: any): SubscriptionSeats => ({
      paidSeatsTotal: toNum(
        data?.seats?.paidTotal ??
          data?.paidSeatsTotal ??
          data?.seatLimitPaid ??
          data?.subscription?.seats?.paidTotal ??
          data?.subscription?.paidSeatsTotal ??
          data?.subscription?.seatLimitPaid
      ),
      sponsoredSeatsTotal: toNum(
        data?.seats?.sponsoredTotal ??
          data?.sponsoredSeatsTotal ??
          data?.seatLimitSponsored ??
          data?.subscription?.seats?.sponsoredTotal ??
          data?.subscription?.sponsoredSeatsTotal ??
          data?.subscription?.seatLimitSponsored
      ),
      paidSeatsUsed: toNum(
        data?.seats?.paidUsed ?? data?.paidSeatsUsed ?? data?.subscription?.seats?.paidUsed ?? data?.subscription?.paidSeatsUsed
      ),
      sponsoredSeatsUsed: toNum(
        data?.seats?.sponsoredUsed ??
          data?.sponsoredSeatsUsed ??
          data?.subscription?.seats?.sponsoredUsed ??
          data?.subscription?.sponsoredSeatsUsed
      ),
    });

    try {
      let loadedFromSubscription = false;
      try {
        const subscriptionSnap = await getDoc(doc(db, "orgs", orgId, "subscription", "current"));
        if (subscriptionSnap.exists()) {
          setSubscriptionSeats(mapSeatState(subscriptionSnap.data() as any));
          loadedFromSubscription = true;
        }
      } catch {
        // Fall back to org doc when subscription/current is not readable in current rule context.
      }

      if (loadedFromSubscription) return;

      const orgSnap = await getDoc(doc(db, "orgs", orgId));
      if (orgSnap.exists()) {
        setSubscriptionSeats(mapSeatState(orgSnap.data() as any));
        return;
      }

      setSubscriptionSeats({
        paidSeatsTotal: 0,
        sponsoredSeatsTotal: 0,
        paidSeatsUsed: 0,
        sponsoredSeatsUsed: 0,
      });
    } catch (error) {
      setSubscriptionSeats({
        paidSeatsTotal: 0,
        sponsoredSeatsTotal: 0,
        paidSeatsUsed: 0,
        sponsoredSeatsUsed: 0,
      });
    }
  };

  useEffect(() => {
    loadMembers().catch(() => undefined);
  }, [orgId]);

  useEffect(() => {
    loadPendingApplications().catch(() => undefined);
  }, [orgId, isOrgAdmin]);

  useEffect(() => {
    loadPendingJoinRequests().catch(() => undefined);
  }, [orgId, isOrgAdmin]);

  useEffect(() => {
    loadSubscriptionSeats().catch(() => undefined);
  }, [orgId]);

  useEffect(() => {
    if (!orgId || !featureFlags.phase3Sponsorships) {
      setSponsorPools([]);
      setSelectedSponsoredPool("general");
      return;
    }
    listSponsorPools(orgId)
      .then((rows) => {
        setSponsorPools(
          rows.map((row: any) => ({
            id: row.id,
            title: row.title ?? null,
            partnerId: row.partnerId ?? null,
            remaining: Number(row.remaining ?? 0),
          }))
        );
      })
      .catch(() => setSponsorPools([]));
  }, [orgId, featureFlags.phase3Sponsorships]);

  useEffect(() => {
    loadInviteCodes().catch(() => undefined);
  }, [orgId, isOrgAdmin, featureFlags.invitesV2]);

  useEffect(() => {
    if (!seatMember) {
      setSelectedSponsoredPool("general");
    }
  }, [seatMember]);

  useEffect(() => {
    const loadVerifiers = async () => {
      const uids = Array.from(new Set(members.map((member) => member.verifiedBy ?? member.verifiedByUid).filter(Boolean)));
      if (!uids.length) return;
      const entries = await Promise.all(
        uids.map(async (uid) => {
          const snap = await getDoc(doc(db, "users", uid));
          const data = snap.exists() ? (snap.data() as any) : null;
          const name = data?.displayName || data?.email || uid;
          return [uid, name] as const;
        })
      );
      setVerifierNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };
    loadVerifiers().catch(() => undefined);
  }, [members]);

  useEffect(() => {
    const loadProfileLogs = async () => {
      if (!orgId || !selectedMember) return;
      setProfileLoading(true);
      try {
        const memberKey = selectedMember.memberUniqueId || selectedMember.memberId || selectedMember.id;
        const auditQuery = query(
          collection(db, "orgs", orgId, "memberAudit"),
          where("memberId", "==", memberKey),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        const snap = await getDocs(auditQuery);
        setProfileLogs(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })));
      } catch (error) {
        setProfileLogs([]);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfileLogs().catch(() => undefined);
  }, [orgId, selectedMember]);

  useEffect(() => {
    const loadReviewLogs = async () => {
      if (!orgId || !reviewMember) return;
      setReviewLoading(true);
      try {
        const memberKey = reviewMember.memberUniqueId || reviewMember.memberId || reviewMember.id;
        const auditQuery = query(
          collection(db, "orgs", orgId, "memberAudit"),
          where("memberId", "==", memberKey),
          orderBy("timestamp", "desc"),
          limit(5)
        );
        const snap = await getDocs(auditQuery);
        setReviewLogs(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })));
        setReviewChecklist({
          idFront: Boolean(reviewMember.idFrontUrl),
          idBack: Boolean(reviewMember.idBackUrl),
          mpesaStatement: Array.isArray(reviewMember.mpesaStatementUploads) && reviewMember.mpesaStatementUploads.length > 0,
          farmProof: Boolean(reviewMember.verificationChecklist?.farmProof),
          other: Boolean(reviewMember.verificationChecklist?.other),
        });
        setRejectionReason(reviewMember.rejectionReason ?? "");
      } catch (error) {
        setReviewLogs([]);
      } finally {
        setReviewLoading(false);
      }
    };
    loadReviewLogs().catch(() => undefined);
  }, [orgId, reviewMember]);

  const resetWizard = () => {
    setForm({ ...initialFormState });
    setIdFront(null);
    setIdBack(null);
    setMpesaUploads([]);
    setMemberDocId(null);
    setTempMemberRef(createTempId());
    setStepIndex(0);
  };

  const handleWizardOpen = (open: boolean) => {
    setWizardOpen(open);
    if (!open) {
      resetWizard();
      clearOpenParam();
    }
  };

  const handleJoinCodeOpen = (open: boolean) => {
    setJoinCodeOpen(open);
    if (!open) {
      setJoinCodeValue(null);
      clearOpenParam();
    }
  };

  const clearOpenParam = () => {
    if (!searchParams.get("open")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("open");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const open = searchParams.get("open");
    if (open === "add") {
      setWizardOpen(true);
    } else if (open === "joinCode") {
      setJoinCodeOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const memberStatus = member.status ?? member.verificationStatus ?? "draft";
      const matchesStatus = statusFilter === "all" ? true : memberStatus === statusFilter;
      const memberSeat = getSeatValue(member);
      const matchesSeat = seatFilter === "all" ? true : memberSeat === seatFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch = !term
        ? true
        : [member.fullName, member.phone, member.memberId, member.memberUniqueId]
            .filter(Boolean)
            .some((value: string) => value.toLowerCase().includes(term));
      return matchesStatus && matchesSeat && matchesSearch;
    });
  }, [members, search, statusFilter, seatFilter]);

  const pendingApprovalMembers = useMemo(
    () =>
      members
        .filter((member) => (member.status ?? member.verificationStatus) === "submitted")
        .sort((a, b) => {
          const aTime = a.submittedAt?.toMillis?.() ?? 0;
          const bTime = b.submittedAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        }),
    [members]
  );

  const counties = getCounties();
  const subCounties = getSubCounties(form.county);
  const wards = getWards(form.county, form.subcounty);
  const locations = getLocations(form.county, form.subcounty, form.ward);

  const requiredDocsMissing = () => {
    const missing: string[] = [];
    if (!idFront) missing.push("National ID front");
    if (!idBack) missing.push("National ID back");
    if (mpesaUploads.length === 0) missing.push("Mpesa statement");
    return missing;
  };

  const validateStep = (index: number) => {
    if (index === 0) {
      return (
        form.fullName &&
        form.phone &&
        form.nationalIdNumber &&
        form.nextOfKinName &&
        form.nextOfKinPhone &&
        form.membershipRole
      );
    }
    if (index === 1) {
      return form.county && form.subcounty && form.ward && form.location;
    }
    if (index === 2) {
      return form.farmSizeAcres && form.landOwnershipType && form.mainCrops.length > 0;
    }
    if (index === 3) {
      return form.mpesaNumber;
    }
    if (index === 4) {
      return requiredDocsMissing().length === 0;
    }
    return true;
  };

  const buildPayload = (status: "draft" | "submitted") => {
    const checklist: VerificationChecklist = {
      idFront: Boolean(idFront?.url),
      idBack: Boolean(idBack?.url),
      mpesaStatement: mpesaUploads.length > 0,
      farmProof: false,
      other: false,
    };
    return {
      fullName: form.fullName,
      phone: form.phone,
      nationalIdNumber: form.nationalIdNumber,
      nextOfKinName: form.nextOfKinName,
      nextOfKinPhone: form.nextOfKinPhone,
      membershipRole: form.membershipRole,
      county: form.county,
      subcounty: form.subcounty,
      ward: form.ward,
      location: form.location,
      farmSizeAcres: Number(form.farmSizeAcres || 0),
      landOwnershipType: form.landOwnershipType,
      mainCrops: form.mainCrops,
      secondaryCrops: form.secondaryCrops,
      seasonalProductionEstimate: form.seasonalProductionEstimate
        .filter((row) => row.crop && row.amountKg)
        .map((row) => ({ crop: row.crop, amountKg: Number(row.amountKg) })),
      irrigationAvailable: form.irrigationAvailable,
      storageAvailable: form.storageAvailable,
      mpesaNumber: form.mpesaNumber,
      mpesaStatementUploads: mpesaUploads,
      idFrontUrl: idFront?.url ?? null,
      idFrontKey: idFront?.key ?? null,
      idBackUrl: idBack?.url ?? null,
      idBackKey: idBack?.key ?? null,
      status,
      verificationStatus: status,
      submittedAt: status === "submitted" ? serverTimestamp() : null,
      verificationChecklist: checklist,
      verificationNotes: null,
      verifiedBy: null,
      verifiedByUid: null,
      verifiedAt: null,
      rejectionReason: null,
      linkedUserUid: null,
      seatStatus: "none",
      premiumSeatType: "none",
      seatAssignedAt: null,
      premiumFeaturesUnlocked: {},
      averageMonthlySales: form.averageMonthlySales,
      buyerHistory: form.buyerHistory,
      createdByUid: currentUser?.uid ?? null,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  };

  const ensureMemberDocId = () => {
    if (memberDocId) return memberDocId;
    const ref = doc(collection(db, "orgs", orgId, "members"));
    setMemberDocId(ref.id);
    return ref.id;
  };

  const logAudit = async (memberUniqueId: string, action: string, notes?: string | null) => {
    if (!orgId) return;
    await addDoc(collection(db, "orgs", orgId, "memberAudit"), {
      memberId: memberUniqueId,
      action,
      byUid: currentUser?.uid ?? null,
      byName: accountQuery.data?.displayName || currentUser?.displayName || currentUser?.email || "User",
      timestamp: serverTimestamp(),
      notes: notes ?? null,
    });
  };

  const updateCoopVerification = async (
    member: any,
    status: "active" | "rejected" | "suspended"
  ) => {
    if (!orgId || !member) return;
    const userUid = member.userUid || member.linkedUserUid;
    if (!userUid) return;
    await setDoc(
      doc(db, "users", userUid, "coopVerification", "status"),
      {
        verified: status === "active",
        status,
        orgId,
        orgName,
        verifiedAt: serverTimestamp(),
        verifiedBy: currentUser?.uid ?? null,
        verifiedByName: verifierName,
      },
      { merge: true }
    );
  };

  const handleOpenLinkModal = (member: any) => {
    setLinkTargetMember(member);
    setLinkQuery("");
    setLinkResults([]);
    setLinkError(null);
    setLinkModalOpen(true);
  };

  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("254")) return digits;
    if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
    return digits;
  };

  const handleSearchLink = async () => {
    if (!linkQuery.trim()) {
      setLinkError("Enter a phone number or email to search.");
      return;
    }
    setLinkLoading(true);
    setLinkError(null);
    try {
      const isEmail = linkQuery.includes("@");
      const directoryRef = collection(db, "userDirectory");
      const value = isEmail ? linkQuery.trim().toLowerCase() : normalizePhone(linkQuery.trim());
      const field = isEmail ? "emailLower" : "phoneE164";
      const q = query(directoryRef, where(field, "==", value));
      const snap = await getDocs(q);
      const results = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));
      setLinkResults(results);
      if (results.length === 0) {
        setLinkError("No matching user found.");
      }
    } catch (error) {
      setLinkError("Failed to search users.");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleLinkUser = async (user: any) => {
    if (!orgId || !linkTargetMember) return;
    try {
      await setDoc(
        doc(db, "orgs", orgId, "members", linkTargetMember.id),
        {
          userUid: user.id,
          linkedUserUid: user.id,
          linkedAccount: true,
          linkedAt: serverTimestamp(),
          linkedBy: currentUser?.uid ?? null,
          linkedByName: verifierName,
          fullName: linkTargetMember.fullName || user.displayName || "Farmer",
          phone: linkTargetMember.phone || user.phone || "",
        },
        { merge: true }
      );
      await setDoc(
        doc(db, "users", user.id, "memberships", orgId),
        {
          orgId,
          role: "member",
          status: linkTargetMember.status ?? linkTargetMember.verificationStatus ?? "submitted",
          coopName: orgName ?? null,
          seatType:
            linkTargetMember.seatType ??
            linkTargetMember.seatStatus ??
            linkTargetMember.premiumSeatType ??
            "none",
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await addDoc(collection(db, "orgs", orgId, "members", linkTargetMember.id, "audit"), {
        action: "linked",
        actorUid: currentUser?.uid ?? null,
        actorName: verifierName,
        targetUserUid: user.id,
        createdAt: serverTimestamp(),
      });
      toast.success("Member linked to farmer account.");
      setLinkModalOpen(false);
      setLinkTargetMember(null);
      await loadMembers();
    } catch (error: any) {
      console.error("[OrgMembers] link member failed", {
        orgId,
        memberId: linkTargetMember.id,
        targetUserUid: user?.id,
        code: error?.code,
        message: error?.message,
      });
      toast.error("Failed to link member.");
    }
  };

  const saveDraft = async () => {
    if (!orgId) return;
    const id = ensureMemberDocId();
    try {
      await setDoc(doc(db, "orgs", orgId, "members", id), buildPayload("draft"), { merge: true });
      toast.success("Draft saved.");
      await loadMembers();
    } catch (error) {
      toast.error("Failed to save draft.");
    }
  };

  const submitMember = async () => {
    if (!orgId) return;
    const missingDocs = requiredDocsMissing();
    if (missingDocs.length) {
      toast.error(`Missing required documents: ${missingDocs.join(", ")}`);
      return;
    }
    const allStepsValid = steps.slice(0, 5).every((_, index) => validateStep(index));
    if (!allStepsValid) {
      toast.error("Please complete all required fields before submitting.");
      return;
    }

    const id = ensureMemberDocId();
    try {
      const memberUniqueId = await generateMemberId(orgId, orgName);
      const submittedPayload = {
        ...buildPayload("submitted"),
        memberUniqueId,
        memberId: memberUniqueId,
        status: "submitted",
        verificationStatus: "submitted",
      };

      if (isOrgStaff) {
        await addDoc(collection(db, "orgs", orgId, "memberApplications"), {
          fullName: form.fullName,
          phone: form.phone,
          email: null,
          memberUniqueId,
          memberUid: null,
          submittedByUid: currentUser?.uid ?? "",
          submittedByName: verifierName,
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          approvedByUid: null,
          approvedAt: null,
          rejectedByUid: null,
          rejectedAt: null,
          rejectionReason: null,
          memberPayload: submittedPayload,
        });
        toast.success("Application submitted for org_admin approval.");
        handleWizardOpen(false);
        await loadPendingApplications();
        return;
      }

      await setDoc(
        doc(db, "orgs", orgId, "members", id),
        submittedPayload,
        { merge: true }
      );
      await logAudit(memberUniqueId, "submitted", null);
      toast.success("Member submitted for verification.");
      handleWizardOpen(false);
      await loadMembers();
    } catch (error) {
      toast.error("Failed to submit member.");
    }
  };

  const handleApproveApplication = async (application: MemberApplication) => {
    if (!orgId || !currentUser?.uid || !isOrgAdmin) return;
    setApprovingApplicationId(application.id);
    try {
      await runTransaction(db, async (tx) => {
        const appRef = doc(db, "orgs", orgId, "memberApplications", application.id);
        const appSnap = await tx.get(appRef);
        if (!appSnap.exists()) throw new Error("Application not found.");
        const appData = appSnap.data() as MemberApplication;
        if (appData.status !== "pending") throw new Error("Application already processed.");

        const memberId = appData.memberUid || appData.memberUniqueId;
        const memberRef = doc(db, "orgs", orgId, "members", memberId);
        const baseMemberPayload = appData.memberPayload ?? {};

        tx.set(
          appRef,
          {
            status: "approved",
            approvedByUid: currentUser.uid,
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            rejectionReason: null,
          },
          { merge: true }
        );

        tx.set(
          memberRef,
          {
            ...baseMemberPayload,
            fullName: appData.fullName ?? baseMemberPayload.fullName ?? "",
            phone: appData.phone ?? baseMemberPayload.phone ?? "",
            role: "member",
            status: "active",
            verificationStatus: "active",
            verifiedBy: currentUser.uid,
            verifiedByUid: currentUser.uid,
            verifiedByName: verifierName,
            verifiedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        if (appData.memberUid) {
          tx.set(
            doc(db, "users", appData.memberUid),
            {
              orgId,
              role: "farmer",
              orgRole: "member",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          if (featureFlags.membershipsMirrorV2) {
            tx.set(
              doc(db, "users", appData.memberUid, "memberships", orgId),
              {
                orgId,
                role: "member",
                status: "active",
                seatType: "none",
                joinedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        }
      });

      if (featureFlags.notificationsV2 && application.memberUid) {
        await createUserNotification({
          uid: application.memberUid,
          orgId,
          type: "membership_approved",
          title: "Membership approved",
          message: `${orgName} approved your membership.`,
        }).catch(() => undefined);
      }

      toast.success("Application approved and member activated.");
      await Promise.all([loadMembers(), loadPendingApplications()]);
    } catch (error: any) {
      toast.error(error?.message || "Failed to approve application.");
    } finally {
      setApprovingApplicationId(null);
    }
  };

  const handleRejectApplication = async () => {
    if (!orgId || !currentUser?.uid || !isOrgAdmin || !rejectApplication) return;
    if (!rejectApplicationReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    setRejectingApplicationId(rejectApplication.id);
    try {
      await setDoc(
        doc(db, "orgs", orgId, "memberApplications", rejectApplication.id),
        {
          status: "rejected",
          rejectedByUid: currentUser.uid,
          rejectedAt: serverTimestamp(),
          rejectionReason: rejectApplicationReason.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("Application rejected.");
      setRejectApplication(null);
      setRejectApplicationReason("");
      await loadPendingApplications();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject application.");
    } finally {
      setRejectingApplicationId(null);
    }
  };

  const handleApproveJoinRequest = async (joinRequest: OrgJoinRequest) => {
    if (!orgId || !currentUser?.uid || !isOrgAdmin) return;
    setApprovingJoinRequestId(joinRequest.id);
    try {
      const generatedMemberUniqueId = await generateMemberId(orgId, orgName);
      let seatAssigned = false;
      await runTransaction(db, async (tx) => {
        const requestRef = doc(db, "orgJoinRequests", joinRequest.id);
        const requestSnap = await tx.get(requestRef);
        if (!requestSnap.exists()) throw new Error("Join request not found.");
        const requestData = requestSnap.data() as OrgJoinRequest;
        if (requestData.status !== "submitted") throw new Error("Join request already processed.");

        const memberRef = doc(db, "orgs", orgId, "members", requestData.uid);
        const memberSnap = await tx.get(memberRef);
        const existing = memberSnap.exists() ? (memberSnap.data() as any) : {};
        const memberUniqueId =
          existing.memberUniqueId ??
          existing.memberId ??
          generatedMemberUniqueId;
        const resolvedName =
          existing.fullName ??
          joinRequest.userName ??
          requestData.userName ??
          (joinRequest.userEmail || requestData.userEmail
            ? String(joinRequest.userEmail || requestData.userEmail).split("@")[0]
            : `Farmer ${requestData.uid.slice(0, 6)}`);

        const subscriptionRef = doc(db, "orgs", orgId, "subscription", "current");
        const subscriptionSnap = await tx.get(subscriptionRef);
        const subscription = subscriptionSnap.exists() ? (subscriptionSnap.data() as any) : {};
        const paidTotal = Number(subscription?.seats?.paidTotal ?? subscription?.paidSeatsTotal ?? 0);
        const sponsoredTotal = Number(subscription?.seats?.sponsoredTotal ?? subscription?.sponsoredSeatsTotal ?? 0);
        const paidUsed = Number(subscription?.seats?.paidUsed ?? subscription?.paidSeatsUsed ?? 0);
        const sponsoredUsed = Number(subscription?.seats?.sponsoredUsed ?? subscription?.sponsoredSeatsUsed ?? 0);
        const sponsoredRemaining = Math.max(0, sponsoredTotal - sponsoredUsed);
        const assignedSeatType: SeatType = sponsoredRemaining > 0 ? "sponsored" : "none";
        seatAssigned = assignedSeatType === "sponsored";
        const nextSponsoredUsed = assignedSeatType === "sponsored" ? sponsoredUsed + 1 : sponsoredUsed;

        tx.set(
          memberRef,
          {
            memberUid: requestData.uid,
            userUid: requestData.uid,
            linkedUserUid: requestData.uid,
            memberUniqueId,
            memberId: memberUniqueId,
            role: "member",
            membershipRole: existing.membershipRole ?? "member",
            roleInOrg: existing.roleInOrg ?? "member",
            fullName: resolvedName,
            phone: existing.phone ?? joinRequest.userPhone ?? "",
            email: existing.email ?? joinRequest.userEmail ?? null,
            coopName: existing.coopName ?? orgName,
            status: "active",
            verificationStatus: "active",
            seatType: assignedSeatType,
            seatStatus: assignedSeatType,
            premiumSeatType: assignedSeatType,
            seatAssignedAt: assignedSeatType === "none" ? null : serverTimestamp(),
            seatAssignedBy: assignedSeatType === "none" ? null : currentUser.uid,
            seatAssignedByName: assignedSeatType === "none" ? null : verifierName,
            verifiedAt: serverTimestamp(),
            verifiedByUid: currentUser.uid,
            verifiedByName: verifierName,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          subscriptionRef,
          {
            seats: {
              paidTotal,
              sponsoredTotal,
              paidUsed,
              sponsoredUsed: nextSponsoredUsed,
            },
            paidSeatsTotal: paidTotal,
            sponsoredSeatsTotal: sponsoredTotal,
            paidSeatsUsed: paidUsed,
            sponsoredSeatsUsed: nextSponsoredUsed,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          requestRef,
          {
            status: "approved",
            approvedByUid: currentUser.uid,
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            rejectionReason: null,
            rejectedByUid: null,
            rejectedAt: null,
          },
          { merge: true }
        );

        if (featureFlags.membershipsMirrorV2) {
          tx.set(
            doc(db, "users", requestData.uid, "memberships", orgId),
            {
              orgId,
              role: "member",
              status: "active",
              seatType: assignedSeatType,
              joinedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      });

      await setDoc(
        doc(db, "users", joinRequest.uid, "coopVerification", "status"),
        {
          verified: true,
          status: "active",
          orgId,
          orgName,
          verifiedAt: serverTimestamp(),
          verifiedBy: currentUser.uid,
          verifiedByName: verifierName,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Best-effort profile mirror update. Some Firestore rule sets disallow org admins
      // from updating /users/{uid}; approval flow should still succeed without it.
      await setDoc(
        doc(db, "users", joinRequest.uid),
        {
          orgId,
          role: "farmer",
          orgRole: "member",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => undefined);

      if (featureFlags.notificationsV2) {
        await createUserNotification({
          uid: joinRequest.uid,
          orgId,
          type: "membership_approved",
          title: "Cooperative request approved",
          message:
            "Your cooperative membership is active." +
            (seatAssigned
              ? " A sponsored seat has been assigned."
              : " Seat will activate when available."),
        }).catch(() => undefined);
      }

      toast.success(
        seatAssigned
          ? "Join request approved and sponsored seat assigned."
          : "Join request approved. Seat will activate when available."
      );
      await Promise.all([loadPendingJoinRequests(), loadMembers()]);
    } catch (error: any) {
      toast.error(error?.message || "Failed to approve join request.");
    } finally {
      setApprovingJoinRequestId(null);
    }
  };

  const handleRejectJoinRequest = async () => {
    if (!orgId || !currentUser?.uid || !isOrgAdmin || !rejectJoinRequest) return;
    if (!rejectJoinRequestReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    setRejectingJoinRequestId(rejectJoinRequest.id);
    try {
      await setDoc(
        doc(db, "orgJoinRequests", rejectJoinRequest.id),
        {
          status: "rejected",
          rejectedByUid: currentUser.uid,
          rejectedAt: serverTimestamp(),
          rejectionReason: rejectJoinRequestReason.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await setDoc(
        doc(db, "users", rejectJoinRequest.uid, "coopVerification", "status"),
        {
          verified: false,
          status: "rejected",
          orgId,
          orgName,
          rejectionReason: rejectJoinRequestReason.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("Join request rejected.");
      setRejectJoinRequest(null);
      setRejectJoinRequestReason("");
      await loadPendingJoinRequests();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject join request.");
    } finally {
      setRejectingJoinRequestId(null);
    }
  };

  const handleApprovePendingMember = async (member: any) => {
    if (!orgId || !currentUser?.uid || !isOrgAdmin || !member?.id) return;
    try {
      await runTransaction(db, async (tx) => {
        const memberRef = doc(db, "orgs", orgId, "members", member.id);
        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists()) throw new Error("Member request not found.");
        const row = memberSnap.data() as any;
        const rowStatus = row.status ?? row.verificationStatus ?? "draft";
        if (rowStatus !== "submitted") throw new Error("Request is no longer pending.");
        const userUid = row.memberUid ?? row.userUid ?? row.linkedUserUid ?? null;

        tx.set(
          memberRef,
          {
            role: "member",
            status: "active",
            verificationStatus: "active",
            verifiedAt: serverTimestamp(),
            verifiedBy: currentUser.uid,
            verifiedByUid: currentUser.uid,
            verifiedByName: verifierName,
            rejectionReason: null,
            coopName: row.coopName ?? orgName,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        if (userUid) {
          tx.set(
            doc(db, "users", userUid),
            {
              orgId,
              role: "farmer",
              orgRole: "member",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          tx.set(
            doc(db, "users", userUid, "coopVerification", "status"),
            {
              verified: true,
              status: "active",
              orgId,
              orgName: row.coopName ?? orgName,
              verifiedAt: serverTimestamp(),
              verifiedBy: currentUser.uid,
              verifiedByName: verifierName,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      });

      const memberUniqueId = member.memberUniqueId || member.memberId || member.id;
      await logAudit(memberUniqueId, "approved", "Approved from pending approvals");
      toast.success("Member approved.");
      await loadMembers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to approve member.");
    }
  };

  const handleApprove = async () => {
    if (!orgId || !reviewMember) return;
    try {
      const memberUniqueId = reviewMember.memberUniqueId || reviewMember.memberId || reviewMember.id;
      await setDoc(
        doc(db, "orgs", orgId, "members", reviewMember.id),
        {
          status: "active",
          verificationStatus: "active",
          verifiedAt: serverTimestamp(),
          verifiedBy: currentUser?.uid ?? null,
          verifiedByUid: currentUser?.uid ?? null,
          verifiedByName: verifierName,
          rejectionReason: null,
          verificationChecklist: reviewChecklist,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await updateCoopVerification(reviewMember, "active");
      await logAudit(memberUniqueId, "approved", null);
      toast.success("Member approved.");
      setReviewMember(null);
      setRejectionReason("");
      await loadMembers();
    } catch (error) {
      toast.error("Failed to approve member.");
    }
  };

  const handleSuspend = async () => {
    if (!orgId || !selectedMember) return;
    try {
      const memberUniqueId = selectedMember.memberUniqueId || selectedMember.memberId || selectedMember.id;
      await setDoc(
        doc(db, "orgs", orgId, "members", selectedMember.id),
        {
          status: "suspended",
          verificationStatus: "suspended",
          verifiedAt: serverTimestamp(),
          verifiedBy: currentUser?.uid ?? null,
          verifiedByUid: currentUser?.uid ?? null,
          verifiedByName: verifierName,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await updateCoopVerification(selectedMember, "suspended");
      await logAudit(memberUniqueId, "suspended", null);
      toast.success("Member suspended.");
      setSelectedMember((prev) => prev ? { ...prev, status: "suspended", verificationStatus: "suspended" } : prev);
      await loadMembers();
    } catch (error) {
      toast.error("Failed to suspend member.");
    }
  };

  const handleReject = async () => {
    if (!orgId || !reviewMember) return;
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    try {
      const memberUniqueId = reviewMember.memberUniqueId || reviewMember.memberId || reviewMember.id;
      await setDoc(
        doc(db, "orgs", orgId, "members", reviewMember.id),
        {
          status: "rejected",
          verificationStatus: "rejected",
          verifiedAt: serverTimestamp(),
          verifiedBy: currentUser?.uid ?? null,
          verifiedByUid: currentUser?.uid ?? null,
          verifiedByName: verifierName,
          rejectionReason: rejectionReason.trim(),
          verificationChecklist: reviewChecklist,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await updateCoopVerification(reviewMember, "rejected");
      await logAudit(memberUniqueId, "rejected", rejectionReason.trim());
      toast.success("Member rejected.");
      setReviewMember(null);
      setRejectionReason("");
      await loadMembers();
    } catch (error) {
      toast.error("Failed to reject member.");
    }
  };

  const handleAssignSeat = async () => {
    if (!orgId || !seatMember || !currentUser?.uid) return;
    setSeatSaving(true);
    try {
      const useSponsorPool =
        featureFlags.phase3Sponsorships &&
        seatTypeChoice === "sponsored" &&
        selectedSponsoredPool !== "general";

      if (useSponsorPool) {
        const currentSeat = getSeatValue(seatMember);
        if (currentSeat === "sponsored") {
          toast.info("Member already has a sponsored seat.");
          setSeatMember(null);
          return;
        }
        const sponsorResult = await assignSponsorSeatFromPool({
          orgId,
          sponsorshipId: selectedSponsoredPool,
          memberDocId: seatMember.id,
          actorUid: currentUser.uid,
        });
        if (!sponsorResult.assigned) {
          if (sponsorResult.reason === "no_remaining") {
            throw new Error("Selected sponsor pool has no seats remaining.");
          }
          throw new Error("Failed to assign sponsor seat.");
        }
        await logAudit(seatMember.memberUniqueId || seatMember.memberId || seatMember.id, "seat_assigned", "sponsored");
        const targetUid = seatMember.memberUid ?? seatMember.userUid ?? seatMember.linkedUserUid ?? null;
        if (featureFlags.notificationsV2 && targetUid) {
          await createUserNotification({
            uid: targetUid,
            orgId,
            type: "seat_assigned",
            title: "Seat assigned",
            message: `You have been assigned a sponsored seat in ${orgName}.`,
          }).catch(() => undefined);
        }
        toast.success("Sponsor-funded seat assigned.");
        setSeatMember(null);
        setSelectedSponsoredPool("general");
        await Promise.all([loadMembers(), loadSubscriptionSeats()]);
        return;
      }

      const memberRef = doc(db, "orgs", orgId, "members", seatMember.id);
      const subscriptionRef = doc(db, "orgs", orgId, "subscription", "current");
      const orgRef = doc(db, "orgs", orgId);

      await runTransaction(db, async (tx) => {
        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists()) {
          throw new Error("Member not found.");
        }
        const memberData = memberSnap.data() as any;
        const currentSeat = getSeatValue(memberData);

        const subSnap = await tx.get(subscriptionRef);
        const orgSnap = await tx.get(orgRef);
        const orgData = orgSnap.exists() ? (orgSnap.data() as any) : {};
        const subData = subSnap.exists() ? (subSnap.data() as any) : {};
        const fallback = orgData.subscription ?? {};

        const toNum = (value: unknown) => {
          const n = Number(value);
          return Number.isFinite(n) ? n : 0;
        };
        const paidTotal = toNum(
          subData?.seats?.paidTotal ??
            subData.paidSeatsTotal ??
            fallback?.seats?.paidTotal ??
            fallback.paidSeatsTotal ??
            fallback.seatLimitPaid
        );
        const sponsoredTotal = toNum(
          subData?.seats?.sponsoredTotal ??
            subData.sponsoredSeatsTotal ??
            fallback?.seats?.sponsoredTotal ??
            fallback.sponsoredSeatsTotal ??
            fallback.seatLimitSponsored
        );
        let paidUsed = toNum(
          subData?.seats?.paidUsed ??
            subData.paidSeatsUsed ??
            fallback?.seats?.paidUsed ??
            fallback.paidSeatsUsed
        );
        let sponsoredUsed = toNum(
          subData?.seats?.sponsoredUsed ??
            subData.sponsoredSeatsUsed ??
            fallback?.seats?.sponsoredUsed ??
            fallback.sponsoredSeatsUsed
        );

        if (currentSeat === seatTypeChoice) {
          return;
        }

        if (currentSeat === "paid") paidUsed = Math.max(0, paidUsed - 1);
        if (currentSeat === "sponsored") sponsoredUsed = Math.max(0, sponsoredUsed - 1);

        if (seatTypeChoice === "paid") {
          if (paidUsed >= paidTotal) throw new Error("No paid seats remaining.");
          paidUsed += 1;
        } else {
          if (sponsoredUsed >= sponsoredTotal) throw new Error("No sponsored seats remaining.");
          sponsoredUsed += 1;
        }

        tx.set(
          memberRef,
          {
            seatType: seatTypeChoice,
            seatStatus: seatTypeChoice,
            premiumSeatType: seatTypeChoice,
            seatAssignedAt: serverTimestamp(),
            seatAssignedBy: currentUser.uid,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          subscriptionRef,
          {
            paidSeatsTotal: paidTotal,
            sponsoredSeatsTotal: sponsoredTotal,
            paidSeatsUsed: paidUsed,
            sponsoredSeatsUsed: sponsoredUsed,
            seats: {
              paidTotal,
              sponsoredTotal,
              paidUsed,
              sponsoredUsed,
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      await logAudit(seatMember.memberUniqueId || seatMember.memberId || seatMember.id, "seat_assigned", seatTypeChoice);
      const targetUid = seatMember.memberUid ?? seatMember.userUid ?? seatMember.linkedUserUid ?? null;
      if (featureFlags.notificationsV2 && targetUid) {
        await createUserNotification({
          uid: targetUid,
          orgId,
          type: "seat_assigned",
          title: "Seat assigned",
          message: `You have been assigned a ${seatTypeChoice} seat in ${orgName}.`,
        }).catch(() => undefined);
      }
      toast.success(`Seat assigned: ${seatTypeChoice}.`);
      setSeatMember(null);
      setSelectedSponsoredPool("general");
      await Promise.all([loadMembers(), loadSubscriptionSeats()]);
    } catch (error: any) {
      toast.error(error?.message || "Failed to assign seat.");
    } finally {
      setSeatSaving(false);
    }
  };

  const handleRemoveSeat = async (member: any) => {
    if (!orgId || !member || !currentUser?.uid) return;
    try {
      const memberRef = doc(db, "orgs", orgId, "members", member.id);
      const subscriptionRef = doc(db, "orgs", orgId, "subscription", "current");
      const orgRef = doc(db, "orgs", orgId);

      await runTransaction(db, async (tx) => {
        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists()) {
          throw new Error("Member not found.");
        }
        const memberData = memberSnap.data() as any;
        const currentSeat = getSeatValue(memberData);
        if (currentSeat === "none") return;

        const subSnap = await tx.get(subscriptionRef);
        const orgSnap = await tx.get(orgRef);
        const orgData = orgSnap.exists() ? (orgSnap.data() as any) : {};
        const subData = subSnap.exists() ? (subSnap.data() as any) : {};
        const fallback = orgData.subscription ?? {};

        const toNum = (value: unknown) => {
          const n = Number(value);
          return Number.isFinite(n) ? n : 0;
        };
        const paidTotal = toNum(
          subData?.seats?.paidTotal ??
            subData.paidSeatsTotal ??
            fallback?.seats?.paidTotal ??
            fallback.paidSeatsTotal ??
            fallback.seatLimitPaid
        );
        const sponsoredTotal = toNum(
          subData?.seats?.sponsoredTotal ??
            subData.sponsoredSeatsTotal ??
            fallback?.seats?.sponsoredTotal ??
            fallback.sponsoredSeatsTotal ??
            fallback.seatLimitSponsored
        );
        let paidUsed = toNum(
          subData?.seats?.paidUsed ??
            subData.paidSeatsUsed ??
            fallback?.seats?.paidUsed ??
            fallback.paidSeatsUsed
        );
        let sponsoredUsed = toNum(
          subData?.seats?.sponsoredUsed ??
            subData.sponsoredSeatsUsed ??
            fallback?.seats?.sponsoredUsed ??
            fallback.sponsoredSeatsUsed
        );

        if (currentSeat === "paid") paidUsed = Math.max(0, paidUsed - 1);
        if (currentSeat === "sponsored") sponsoredUsed = Math.max(0, sponsoredUsed - 1);

        tx.set(
          memberRef,
          {
            seatType: "none",
            seatStatus: "none",
            premiumSeatType: "none",
            seatAssignedAt: null,
            seatAssignedBy: null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          subscriptionRef,
          {
            paidSeatsTotal: paidTotal,
            sponsoredSeatsTotal: sponsoredTotal,
            paidSeatsUsed: paidUsed,
            sponsoredSeatsUsed: sponsoredUsed,
            seats: {
              paidTotal,
              sponsoredTotal,
              paidUsed,
              sponsoredUsed,
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      await logAudit(member.memberUniqueId || member.memberId || member.id, "seat_removed", null);
      toast.success("Seat removed.");
      await Promise.all([loadMembers(), loadSubscriptionSeats()]);
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove seat.");
    }
  };

  const handleUpload = async (docType: "id_front" | "id_back" | "mpesa_statement", files: FileList | null) => {
    if (!orgId || !files || files.length === 0) return;
    try {
      setUploading(true);
      const ref = memberDocId ?? tempMemberRef;
      if (docType === "mpesa_statement") {
        const newUploads: UploadMeta[] = [];
        for (const file of Array.from(files)) {
          const result = await uploadOrgMemberDoc({ orgId, memberRef: ref, docType, file });
          newUploads.push(result as UploadMeta);
        }
        setMpesaUploads((prev) => [...prev, ...newUploads]);
      } else {
        const file = files[0];
        const result = await uploadOrgMemberDoc({ orgId, memberRef: ref, docType, file });
        if (docType === "id_front") setIdFront(result as UploadMeta);
        if (docType === "id_back") setIdBack(result as UploadMeta);
      }
      toast.success("Upload complete");
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCsvUpload = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    setCsvPreview(parsed.rows);
    setCsvFileName(file.name);
  };

  const handleCreateJoinCode = async () => {
    if (!orgId || !currentUser?.uid) return;
    try {
      setJoinCodeLoading(true);
      let expiresAt: Date | null = null;
      if (joinCodeForm.expiresAt) {
        if (joinCodeForm.expiresAt.includes("T")) {
          expiresAt = new Date(joinCodeForm.expiresAt);
        } else {
          const [year, month, day] = joinCodeForm.expiresAt.split("-").map((value) => Number(value));
          if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
            // Store date-only expiries at local end-of-day to avoid accidental early expiry.
            expiresAt = new Date(year, month - 1, day, 23, 59, 59, 999);
          }
        }
      }
      const maxUses = Number(joinCodeForm.maxUses || 0) || 50;
      const code = await createJoinCode({
        orgId,
        type: joinCodeForm.type,
        createdByUid: currentUser.uid,
        maxUses,
        expiresAt,
        orgName,
      });
      setJoinCodeValue(code);
      toast.success("Join code created.");
      await loadInviteCodes();
    } catch (error) {
      toast.error("Failed to create join code.");
    } finally {
      setJoinCodeLoading(false);
    }
  };

  const handleToggleInviteCode = async (code: string, isActive: boolean) => {
    if (!orgId || !isOrgAdmin) return;
    setTogglingCodeId(code);
    try {
      await updateOrgJoinCodeStatus(orgId, code, !isActive);
      toast.success(!isActive ? "Code enabled." : "Code disabled.");
      await loadInviteCodes();
    } catch {
      toast.error("Failed to update code status.");
    } finally {
      setTogglingCodeId(null);
    }
  };

  const saveCsvMembers = async () => {
    if (!orgId || csvPreview.length === 0) return;
    setCsvSaving(true);
    try {
      for (const row of csvPreview) {
        const memberUniqueId = await generateMemberId(orgId, orgName);
        await addDoc(collection(db, "orgs", orgId, "members"), {
          memberUniqueId,
          memberId: memberUniqueId,
          status: "draft",
          verificationStatus: "draft",
          verificationChecklist: { idFront: false, idBack: false, mpesaStatement: false },
          seatStatus: "none",
          premiumSeatType: "none",
          fullName: row.fullName || row.name || "",
          phone: row.phone || "",
          nationalIdNumber: row.nationalIdNumber || "",
          nextOfKinName: row.nextOfKinName || "",
          nextOfKinPhone: row.nextOfKinPhone || "",
          membershipRole: row.membershipRole || "member",
          county: row.county || "",
          subcounty: row.subcounty || "",
          ward: row.ward || "",
          location: row.location || "",
          farmSizeAcres: Number(row.farmSizeAcres || 0),
          landOwnershipType: row.landOwnershipType || "",
          mainCrops: row.mainCrops ? row.mainCrops.split("|") : [],
          secondaryCrops: row.secondaryCrops ? row.secondaryCrops.split("|") : [],
          seasonalProductionEstimate: [],
          irrigationAvailable: row.irrigationAvailable === "true",
          storageAvailable: row.storageAvailable === "true",
          mpesaNumber: row.mpesaNumber || "",
          mpesaStatementUploads: [],
          idFrontUrl: null,
          idBackUrl: null,
          createdByUid: currentUser?.uid ?? null,
          joinedAt: serverTimestamp(),
        });
      }
      toast.success("CSV members saved.");
      setCsvPreview([]);
      setCsvFileName("");
      await loadMembers();
    } catch (error) {
      toast.error("Failed to save CSV members.");
    } finally {
      setCsvSaving(false);
    }
  };

  const updateProductionRow = (index: number, field: keyof ProductionRow, value: string) => {
    setForm((prev) => {
      const next = [...prev.seasonalProductionEstimate];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, seasonalProductionEstimate: next };
    });
  };

  const addProductionRow = () => {
    setForm((prev) => ({
      ...prev,
      seasonalProductionEstimate: [...prev.seasonalProductionEstimate, { crop: "", amountKg: "" }],
    }));
  };

  const removeProductionRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      seasonalProductionEstimate: prev.seasonalProductionEstimate.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Member management</CardTitle>
            <p className="text-sm text-muted-foreground">Onboard, verify, and track cooperative members.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={wizardOpen} onOpenChange={handleWizardOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Add member</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
                <DialogHeader className="px-6 py-4 border-b border-border/60">
                  <DialogTitle>New member onboarding</DialogTitle>
                </DialogHeader>
                <div className="flex flex-1 flex-col min-h-0">
                  <div className="space-y-3 border-b border-border/60 px-6 pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Step {stepIndex + 1} of {steps.length}</p>
                      <Badge variant="secondary">{steps[stepIndex]}</Badge>
                    </div>
                    <Progress value={((stepIndex + 1) / steps.length) * 100} />
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {steps.map((step, index) => (
                        <span key={step} className={index === stepIndex ? "text-foreground font-semibold" : ""}>
                          {index + 1}. {step}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pb-28 pt-4 scroll-pb-28">
                    {stepIndex === 0 && (
                      <div className="grid gap-4 pt-4 sm:grid-cols-2">
                        <div>
                          <Label>Full name *</Label>
                          <Input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Phone *</Label>
                          <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                        </div>
                        <div>
                          <Label>National ID number *</Label>
                          <Input value={form.nationalIdNumber} onChange={(e) => setForm((prev) => ({ ...prev, nationalIdNumber: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Membership role *</Label>
                          <Select value={form.membershipRole} onValueChange={(value) => setForm((prev) => ({ ...prev, membershipRole: value as MemberFormState["membershipRole"] }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {MEMBERSHIP_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>{role.replace("_", " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Next of kin name *</Label>
                          <Input value={form.nextOfKinName} onChange={(e) => setForm((prev) => ({ ...prev, nextOfKinName: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Next of kin phone *</Label>
                          <Input value={form.nextOfKinPhone} onChange={(e) => setForm((prev) => ({ ...prev, nextOfKinPhone: e.target.value }))} />
                        </div>
                      </div>
                    )}

                    {stepIndex === 1 && (
                      <div className="grid gap-4 pt-4 sm:grid-cols-2">
                        <div>
                          <Label>County *</Label>
                          <Select value={form.county} onValueChange={(value) => setForm((prev) => ({ ...prev, county: value, subcounty: "", ward: "", location: "" }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select county" />
                            </SelectTrigger>
                            <SelectContent>
                              {counties.map((county) => (
                                <SelectItem key={county} value={county}>{county}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Subcounty *</Label>
                          <Select value={form.subcounty} onValueChange={(value) => setForm((prev) => ({ ...prev, subcounty: value, ward: "", location: "" }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subcounty" />
                            </SelectTrigger>
                            <SelectContent>
                              {subCounties.map((sub) => (
                                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Ward *</Label>
                          <Select value={form.ward} onValueChange={(value) => setForm((prev) => ({ ...prev, ward: value, location: "" }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ward" />
                            </SelectTrigger>
                            <SelectContent>
                              {wards.map((ward) => (
                                <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Location *</Label>
                          <Select value={form.location} onValueChange={(value) => setForm((prev) => ({ ...prev, location: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((loc) => (
                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {stepIndex === 2 && (
                      <div className="space-y-4 pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label>Farm size (acres) *</Label>
                            <Input value={form.farmSizeAcres} onChange={(e) => setForm((prev) => ({ ...prev, farmSizeAcres: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Land ownership *</Label>
                            <Select value={form.landOwnershipType} onValueChange={(value) => setForm((prev) => ({ ...prev, landOwnershipType: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {OWNERSHIP_TYPES.map((item) => (
                                  <SelectItem key={item} value={item}>{item}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label>Main crops *</Label>
                            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 p-3">
                              {CROPS.map((crop) => (
                                <label key={crop} className="flex items-center gap-2 text-xs">
                                  <Checkbox
                                    checked={form.mainCrops.includes(crop)}
                                    onCheckedChange={(checked) =>
                                      setForm((prev) => ({
                                        ...prev,
                                        mainCrops: checked
                                          ? [...prev.mainCrops, crop]
                                          : prev.mainCrops.filter((item) => item !== crop),
                                      }))
                                    }
                                  />
                                  <span>{crop}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label>Secondary crops</Label>
                            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 p-3">
                              {CROPS.map((crop) => (
                                <label key={crop} className="flex items-center gap-2 text-xs">
                                  <Checkbox
                                    checked={form.secondaryCrops.includes(crop)}
                                    onCheckedChange={(checked) =>
                                      setForm((prev) => ({
                                        ...prev,
                                        secondaryCrops: checked
                                          ? [...prev.secondaryCrops, crop]
                                          : prev.secondaryCrops.filter((item) => item !== crop),
                                      }))
                                    }
                                  />
                                  <span>{crop}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Seasonal production estimate</Label>
                          {form.seasonalProductionEstimate.map((row, index) => (
                            <div key={`production-${index}`} className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
                              <Input
                                placeholder="Crop"
                                value={row.crop}
                                onChange={(e) => updateProductionRow(index, "crop", e.target.value)}
                              />
                              <Input
                                placeholder="Amount (kg)"
                                value={row.amountKg}
                                onChange={(e) => updateProductionRow(index, "amountKg", e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProductionRow(index)}
                                disabled={form.seasonalProductionEstimate.length === 1}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={addProductionRow}>
                            Add crop estimate
                          </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.irrigationAvailable}
                              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, irrigationAvailable: Boolean(checked) }))}
                            />
                            Irrigation available
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.storageAvailable}
                              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, storageAvailable: Boolean(checked) }))}
                            />
                            Storage available
                          </label>
                        </div>
                      </div>
                    )}

                    {stepIndex === 3 && (
                      <div className="grid gap-4 pt-4 sm:grid-cols-2">
                        <div>
                          <Label>Mpesa number *</Label>
                          <Input value={form.mpesaNumber} onChange={(e) => setForm((prev) => ({ ...prev, mpesaNumber: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Average monthly sales (KES)</Label>
                          <Input value={form.averageMonthlySales} onChange={(e) => setForm((prev) => ({ ...prev, averageMonthlySales: e.target.value }))} />
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Buyer history (optional)</Label>
                          <Textarea value={form.buyerHistory} onChange={(e) => setForm((prev) => ({ ...prev, buyerHistory: e.target.value }))} />
                        </div>
                      </div>
                    )}

                    {stepIndex === 4 && (
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>National ID front *</Label>
                          <Input type="file" accept="image/*,application/pdf" onChange={(e) => handleUpload("id_front", e.target.files)} disabled={uploading} />
                          {idFront && <p className="text-xs text-muted-foreground">Uploaded: {idFront.fileName}</p>}
                        </div>
                        <div>
                          <Label>National ID back *</Label>
                          <Input type="file" accept="image/*,application/pdf" onChange={(e) => handleUpload("id_back", e.target.files)} disabled={uploading} />
                          {idBack && <p className="text-xs text-muted-foreground">Uploaded: {idBack.fileName}</p>}
                        </div>
                        <div>
                          <Label>Mpesa statement(s) *</Label>
                          <Input type="file" accept="image/*,application/pdf" multiple onChange={(e) => handleUpload("mpesa_statement", e.target.files)} disabled={uploading} />
                          {mpesaUploads.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {mpesaUploads.map((upload) => (
                                <li key={upload.key}>{upload.fileName}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {requiredDocsMissing().length > 0 && (
                          <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3 text-xs text-amber-700">
                            Missing: {requiredDocsMissing().join(", ")}
                          </div>
                        )}
                      </div>
                    )}

                    {stepIndex === 5 && (
                      <div className="space-y-4 pt-4 text-sm">
                        <div className="rounded-lg border border-border/60 p-3">
                          <p className="font-semibold">Identity</p>
                          <p>{form.fullName}  {form.phone}</p>
                          <p>ID: {form.nationalIdNumber}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 p-3">
                          <p className="font-semibold">Farm details</p>
                          <p>{form.farmSizeAcres} acres  {form.landOwnershipType}</p>
                          <p>Main crops: {form.mainCrops.join(", ") || "--"}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 p-3">
                          <p className="font-semibold">Location</p>
                          <p>{form.location}, {form.ward}, {form.subcounty}, {form.county}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 p-3">
                          <p className="font-semibold">Documents</p>
                          <p>ID front: {idFront ? "Uploaded" : "Missing"}</p>
                          <p>ID back: {idBack ? "Uploaded" : "Missing"}</p>
                          <p>Mpesa statements: {mpesaUploads.length}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background/95 backdrop-blur px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        disabled={stepIndex === 0}
                        onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
                      >
                        Back
                      </Button>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={saveDraft}>Save draft</Button>
                        {stepIndex < steps.length - 1 ? (
                          <Button
                            onClick={() => {
                              if (!validateStep(stepIndex)) {
                                toast.error("Please complete required fields before continuing.");
                                return;
                              }
                              setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
                            }}
                          >
                            Next
                          </Button>
                        ) : (
                          <Button onClick={submitMember}>
                            {isOrgStaff ? "Submit application" : "Submit for verification"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={joinCodeOpen} onOpenChange={handleJoinCodeOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Generate join code</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate join code</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Member type</Label>
                    <Select
                      value={joinCodeForm.type}
                      onValueChange={(value) => setJoinCodeForm((prev) => ({ ...prev, type: value as "farmer" | "staff" | "buyer" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="farmer">Farmer</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="buyer">Buyer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Max uses</Label>
                    <Input
                      value={joinCodeForm.maxUses}
                      onChange={(event) => setJoinCodeForm((prev) => ({ ...prev, maxUses: event.target.value }))}
                      type="number"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Expires on</Label>
                    <Input
                      type="date"
                      value={joinCodeForm.expiresAt}
                      onChange={(event) => setJoinCodeForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
                    />
                  </div>
                  {joinCodeValue && (
                    <div className="rounded-lg border border-border/60 p-3 text-sm space-y-2">
                      <p className="text-xs text-muted-foreground">Share this join code with members:</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold tracking-widest">{joinCodeValue}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(joinCodeValue)}
                        >
                          Copy
                        </Button>
                      </div>
                      {featureFlags.invitesV2 && (
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Deep link: {buildJoinDeepLink(joinCodeValue)}</p>
                          <p>Web fallback: {`${window.location.origin}${buildJoinWebLink(joinCodeValue)}`}</p>
                          <img
                            className="mt-2 h-32 w-32 rounded border border-border/60 bg-white p-1"
                            src={`https://quickchart.io/qr?text=${encodeURIComponent(`${window.location.origin}${buildJoinWebLink(joinCodeValue)}`)}&size=180`}
                            alt={`QR for ${joinCodeValue}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <Button onClick={handleCreateJoinCode} disabled={joinCodeLoading}>
                    {joinCodeLoading ? "Creating..." : "Create join code"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Link existing farmer</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Search by phone or email to link a registered farmer to this member.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Phone or email"
                      value={linkQuery}
                      onChange={(event) => setLinkQuery(event.target.value)}
                    />
                    <Button onClick={handleSearchLink} disabled={linkLoading}>
                      {linkLoading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                  {linkError && <p className="text-xs text-destructive">{linkError}</p>}
                  {linkResults.length > 0 && (
                    <div className="space-y-2">
                      {linkResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                          <div>
                            <p className="text-sm font-semibold">{user.displayName || user.emailLower || "User"}</p>
                            <p className="text-xs text-muted-foreground">{user.phoneE164 || user.emailLower || user.id}</p>
                          </div>
                          <Button size="sm" onClick={() => handleLinkUser(user)}>
                            Link
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={!!seatMember} onOpenChange={(open) => { if (!open) setSeatMember(null); }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Assign seat</DialogTitle>
                </DialogHeader>
                {seatMember && (
                    <div className="space-y-4">
                    <div className="rounded-lg border border-border/60 p-3 text-sm">
                      <p className="font-semibold">{seatMember.fullName || "Member"}</p>
                      <p className="text-xs text-muted-foreground">
                        Current seat: {getSeatValue(seatMember)}
                      </p>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>Paid remaining: {Math.max(0, subscriptionSeats.paidSeatsTotal - subscriptionSeats.paidSeatsUsed)}</p>
                      <p>Sponsored remaining: {Math.max(0, subscriptionSeats.sponsoredSeatsTotal - subscriptionSeats.sponsoredSeatsUsed)}</p>
                    </div>
                    <div>
                      <Label>Seat type</Label>
                      <Select value={seatTypeChoice} onValueChange={(value) => setSeatTypeChoice(value as "paid" | "sponsored")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select seat type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="paid"
                            disabled={subscriptionSeats.paidSeatsUsed >= subscriptionSeats.paidSeatsTotal}
                          >
                            Paid
                          </SelectItem>
                          <SelectItem
                            value="sponsored"
                            disabled={subscriptionSeats.sponsoredSeatsUsed >= subscriptionSeats.sponsoredSeatsTotal}
                          >
                            Sponsored
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {featureFlags.phase3Sponsorships && seatTypeChoice === "sponsored" && (
                      <div>
                        <Label>Sponsor pool</Label>
                        <Select value={selectedSponsoredPool} onValueChange={setSelectedSponsoredPool}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sponsor pool" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General sponsored pool</SelectItem>
                            {sponsorPools.map((pool) => (
                              <SelectItem key={pool.id} value={pool.id} disabled={pool.remaining <= 0}>
                                Sponsor: {pool.title || pool.partnerId || pool.id} (Remaining {pool.remaining})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSeatMember(null)} disabled={seatSaving}>
                        Cancel
                      </Button>
                      <Button onClick={handleAssignSeat} disabled={seatSaving}>
                        {seatSaving ? "Saving..." : "Assign seat"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search by name, phone, or member ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={seatFilter} onValueChange={(value) => setSeatFilter(value as "all" | SeatType)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter seat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All seats</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="sponsored">Sponsored</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Seats: Paid {subscriptionSeats.paidSeatsUsed}/{subscriptionSeats.paidSeatsTotal} • Sponsored {subscriptionSeats.sponsoredSeatsUsed}/{subscriptionSeats.sponsoredSeatsTotal}
            </div>
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">CSV import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="file" accept=".csv" onChange={(e) => handleCsvUpload(e.target.files?.[0] ?? null)} />
              {csvFileName && <p className="text-xs text-muted-foreground">Preview from {csvFileName}</p>}
              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="rounded-lg border border-border/60 p-2 text-xs text-muted-foreground">
                    {csvPreview.length} rows ready to import.
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>County</TableHead>
                        <TableHead>Ward</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.slice(0, 5).map((row, index) => (
                        <TableRow key={`csv-${index}`}>
                          <TableCell>{row.fullName || row.name || "-"}</TableCell>
                          <TableCell>{row.phone || "-"}</TableCell>
                          <TableCell>{row.county || "-"}</TableCell>
                          <TableCell>{row.ward || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button onClick={saveCsvMembers} disabled={csvSaving}>
                    {csvSaving ? "Saving..." : "Save CSV members"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isOrgAdmin && featureFlags.invitesV2 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Invite Codes (V2)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-x-hidden">
                {inviteCodesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading invite codes...</p>
                ) : inviteCodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invite codes yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inviteCodes.map((row) => {
                        const code = (row.code ?? row.id ?? "").toUpperCase();
                        const active = row.isActive === undefined ? row.status !== "disabled" : row.isActive;
                        const used = Number(row.usedCount ?? row.uses ?? 0);
                        const max = Number(row.maxUses ?? 0);
                        const webLink = `${window.location.origin}${buildJoinWebLink(code)}`;
                        const qrDeepLink = buildJoinDeepLink(code);
                        return (
                          <TableRow key={code}>
                            <TableCell className="font-semibold tracking-widest">{code}</TableCell>
                            <TableCell>{row.type}</TableCell>
                            <TableCell>{used}/{max || "--"}</TableCell>
                            <TableCell>
                              {(() => {
                                const expiresAtDate =
                                  typeof row.expiresAt?.toDate === "function"
                                    ? row.expiresAt.toDate()
                                    : row.expiresAt
                                    ? new Date(row.expiresAt)
                                    : null;
                                if (!expiresAtDate || Number.isNaN(expiresAtDate.getTime())) return "Never";
                                return expiresAtDate.toLocaleString();
                              })()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={active ? "secondary" : "outline"}>
                                {active ? "active" : "disabled"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="ml-auto flex max-w-[320px] flex-wrap justify-end gap-1">
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => navigator.clipboard.writeText(code)}>
                                  Copy
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => navigator.clipboard.writeText(webLink)}>
                                  Copy link
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() =>
                                    window.open(`https://wa.me/?text=${encodeURIComponent(`Join ${orgName}: ${webLink}`)}`, "_blank")
                                  }
                                >
                                  WhatsApp
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setQrPreviewCode(code)}>
                                  Show QR
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => navigator.clipboard.writeText(qrDeepLink)}>
                                  QR link
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleToggleInviteCode(code, active)}
                                  disabled={togglingCodeId === code}
                                >
                                  {togglingCodeId === code ? "Saving..." : active ? "Disable" : "Enable"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Dialog open={!!qrPreviewCode} onOpenChange={(open) => { if (!open) setQrPreviewCode(null); }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Invite QR Code</DialogTitle>
              </DialogHeader>
              {qrPreviewCode && (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <img
                      className="h-52 w-52 rounded border border-border/60 bg-white p-2"
                      src={`https://quickchart.io/qr?text=${encodeURIComponent(`${window.location.origin}${buildJoinWebLink(qrPreviewCode)}`)}&size=320`}
                      alt={`QR for ${qrPreviewCode}`}
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">{`${window.location.origin}${buildJoinWebLink(qrPreviewCode)}`}</p>
                  <div className="flex justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(buildJoinDeepLink(qrPreviewCode))}>
                      Copy deep link
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}${buildJoinWebLink(qrPreviewCode)}`)}>
                      Copy web link
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {isOrgAdmin && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Member ID</TableHead>
                      <TableHead>Submitted by</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicationsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6}>Loading applications...</TableCell>
                      </TableRow>
                    ) : pendingApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>No pending applications.</TableCell>
                      </TableRow>
                    ) : (
                      pendingApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>{application.fullName || "-"}</TableCell>
                          <TableCell>{application.phone || "-"}</TableCell>
                          <TableCell>{application.memberUniqueId || "-"}</TableCell>
                          <TableCell>{application.submittedByName || application.submittedByUid || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{application.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveApplication(application)}
                                disabled={approvingApplicationId === application.id || rejectingApplicationId === application.id}
                              >
                                {approvingApplicationId === application.id ? "Approving..." : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectApplication(application);
                                  setRejectApplicationReason("");
                                }}
                                disabled={approvingApplicationId === application.id || rejectingApplicationId === application.id}
                              >
                                {rejectingApplicationId === application.id ? "Rejecting..." : "Reject"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {isOrgAdmin && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Pending member approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Member ID</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovalMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>No pending members.</TableCell>
                      </TableRow>
                    ) : (
                      pendingApprovalMembers.map((member) => (
                        <TableRow key={`pending-${member.id}`}>
                          <TableCell>{member.fullName || "-"}</TableCell>
                          <TableCell>{member.phone || "-"}</TableCell>
                          <TableCell>{member.memberUniqueId || member.memberId || member.id}</TableCell>
                          <TableCell>{member.submittedAt?.toDate?.()?.toLocaleString?.() || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => handleApprovePendingMember(member)}>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReviewMember(member);
                                  setRejectionReason("");
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {isOrgAdmin && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm">Pending join requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Farmer</TableHead>
                      <TableHead>Email / Phone</TableHead>
                      <TableHead>Join code</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {joinRequestsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5}>Loading join requests...</TableCell>
                      </TableRow>
                    ) : pendingJoinRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>No pending join requests.</TableCell>
                      </TableRow>
                    ) : (
                      pendingJoinRequests.map((joinRequest) => (
                        <TableRow key={joinRequest.id}>
                          <TableCell>{joinRequest.userName || joinRequest.uid}</TableCell>
                          <TableCell>{joinRequest.userEmail || joinRequest.userPhone || "-"}</TableCell>
                          <TableCell>{joinRequest.joinCode}</TableCell>
                          <TableCell>{joinRequest.createdAt?.toDate?.()?.toLocaleString?.() || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveJoinRequest(joinRequest)}
                                disabled={approvingJoinRequestId === joinRequest.id || rejectingJoinRequestId === joinRequest.id}
                              >
                                {approvingJoinRequestId === joinRequest.id ? "Approving..." : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectJoinRequest(joinRequest);
                                  setRejectJoinRequestReason("");
                                }}
                                disabled={approvingJoinRequestId === joinRequest.id || rejectingJoinRequestId === joinRequest.id}
                              >
                                {rejectingJoinRequestId === joinRequest.id ? "Rejecting..." : "Reject"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>County</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Verified by</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>Loading members...</TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>No members yet.</TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const statusValue = member.status ?? member.verificationStatus ?? "draft";
                  const seatValue = getSeatValue(member);
                  const verifierUid = member.verifiedBy ?? member.verifiedByUid;
                  const verifierName =
                    member.verifiedByName ||
                    (verifierUid ? (verifierNames[verifierUid] ?? verifierUid) : "-");
                  const isLinked = Boolean(member.userUid || member.linkedUserUid);
                  const isSubmitted = statusValue === "submitted";
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{member.fullName || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{member.memberUniqueId || member.memberId || "No ID"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{member.phone || "-"}</TableCell>
                      <TableCell>{member.county || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{statusValue}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={seatValue === "paid" ? "default" : seatValue === "sponsored" ? "secondary" : "outline"}
                        >
                          {seatValue}
                        </Badge>
                      </TableCell>
                      <TableCell>{verifierName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {isSubmitted && canVerify ? (
                            <Button size="sm" onClick={() => setReviewMember(member)}>Review</Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setSelectedMember(member)}>View</Button>
                          )}
                          {!isLinked && canVerify && (
                            <Button size="sm" variant="secondary" onClick={() => handleOpenLinkModal(member)}>
                              Link farmer
                            </Button>
                          )}
                          {canVerify && statusValue === "active" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSeatMember(member);
                                  setSeatTypeChoice(seatValue === "sponsored" ? "sponsored" : "paid");
                                }}
                              >
                                Assign seat
                              </Button>
                              {seatValue !== "none" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveSeat(member)}
                                >
                                  Remove seat
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!rejectApplication}
        onOpenChange={(open) => {
          if (!open) {
            setRejectApplication(null);
            setRejectApplicationReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Provide a reason for rejecting {rejectApplication?.fullName || "this application"}.
            </p>
            <div className="space-y-2">
              <Label>Rejection reason *</Label>
              <Textarea
                value={rejectApplicationReason}
                onChange={(event) => setRejectApplicationReason(event.target.value)}
                placeholder="Explain why this application is rejected."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectApplication(null);
                  setRejectApplicationReason("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleRejectApplication} disabled={rejectingApplicationId === rejectApplication?.id}>
                {rejectingApplicationId === rejectApplication?.id ? "Rejecting..." : "Reject application"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rejectJoinRequest}
        onOpenChange={(open) => {
          if (!open) {
            setRejectJoinRequest(null);
            setRejectJoinRequestReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject join request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Provide a reason for rejecting {rejectJoinRequest?.userName || rejectJoinRequest?.uid || "this request"}.
            </p>
            <div className="space-y-2">
              <Label>Rejection reason *</Label>
              <Textarea
                value={rejectJoinRequestReason}
                onChange={(event) => setRejectJoinRequestReason(event.target.value)}
                placeholder="Explain why this join request is rejected."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectJoinRequest(null);
                  setRejectJoinRequestReason("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleRejectJoinRequest} disabled={rejectingJoinRequestId === rejectJoinRequest?.id}>
                {rejectingJoinRequestId === rejectJoinRequest?.id ? "Rejecting..." : "Reject request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewMember} onOpenChange={() => { setReviewMember(null); setReviewLogs([]); setRejectionReason(""); setShowAllAudit(false); }}>
        <DialogContent className="w-[95vw] sm:max-w-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-border/60">
            <DialogTitle>Review member</DialogTitle>
          </DialogHeader>
          {reviewMember && (
            <div className="flex flex-1 flex-col min-h-0 text-sm">
              <div className="flex-1 overflow-y-auto px-6 py-4 pb-24 scroll-pb-24 space-y-3">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="font-semibold">{reviewMember.fullName}</p>
                <p>{reviewMember.phone}</p>
                <p>Member ID: {reviewMember.memberUniqueId || reviewMember.memberId || "Pending"}</p>
                <p>Status: {reviewMember.status ?? reviewMember.verificationStatus}</p>
              </div>
              <div className="rounded-lg border border-border/60">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-semibold flex items-center justify-between"
                  onClick={() => setReviewSections((prev) => ({ ...prev, checklist: !prev.checklist }))}
                >
                  Verification checklist
                  <span className="text-xs text-muted-foreground">{reviewSections.checklist ? "Hide" : "Show"}</span>
                </button>
                {reviewSections.checklist && (
                  <div className="px-4 pb-4 space-y-2">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={reviewChecklist.idFront}
                        onCheckedChange={(checked) => setReviewChecklist((prev) => ({ ...prev, idFront: Boolean(checked) }))}
                      />
                      ID front uploaded
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={reviewChecklist.idBack}
                        onCheckedChange={(checked) => setReviewChecklist((prev) => ({ ...prev, idBack: Boolean(checked) }))}
                      />
                      ID back uploaded
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={reviewChecklist.mpesaStatement}
                        onCheckedChange={(checked) => setReviewChecklist((prev) => ({ ...prev, mpesaStatement: Boolean(checked) }))}
                      />
                      Mpesa statement uploaded
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={reviewChecklist.farmProof}
                        onCheckedChange={(checked) => setReviewChecklist((prev) => ({ ...prev, farmProof: Boolean(checked) }))}
                      />
                      Farm proof provided
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={reviewChecklist.other}
                        onCheckedChange={(checked) => setReviewChecklist((prev) => ({ ...prev, other: Boolean(checked) }))}
                      />
                      Other supporting documents
                    </label>
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-border/60">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-semibold flex items-center justify-between"
                  onClick={() => setReviewSections((prev) => ({ ...prev, documents: !prev.documents }))}
                >
                  Documents
                  <span className="text-xs text-muted-foreground">{reviewSections.documents ? "Hide" : "Show"}</span>
                </button>
                {reviewSections.documents && (
                  <div className="px-4 pb-4">
                    <div className="flex flex-col gap-2 text-sm">
                  {reviewMember.idFrontUrl ? (
                    <a className="text-primary underline" href={reviewMember.idFrontUrl} target="_blank" rel="noreferrer">View ID front</a>
                  ) : (
                    <span className="text-muted-foreground">ID front missing</span>
                  )}
                  {reviewMember.idBackUrl ? (
                    <a className="text-primary underline" href={reviewMember.idBackUrl} target="_blank" rel="noreferrer">View ID back</a>
                  ) : (
                    <span className="text-muted-foreground">ID back missing</span>
                  )}
                  {Array.isArray(reviewMember.mpesaStatementUploads) && reviewMember.mpesaStatementUploads.length > 0 ? (
                    reviewMember.mpesaStatementUploads.map((upload: UploadMeta | string, index: number) => (
                      typeof upload === "string" ? (
                        <a key={`review-mpesa-${index}`} className="text-primary underline" href={upload} target="_blank" rel="noreferrer">
                          Mpesa statement {index + 1}
                        </a>
                      ) : (
                        <a key={`${upload.key}-${index}`} className="text-primary underline" href={upload.url} target="_blank" rel="noreferrer">
                          Mpesa statement {index + 1}
                        </a>
                      )
                    ))
                  ) : (
                    <span className="text-muted-foreground">No Mpesa statements uploaded</span>
                  )}
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-border/60">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-semibold flex items-center justify-between"
                  onClick={() => setReviewSections((prev) => ({ ...prev, audit: !prev.audit }))}
                >
                  Audit log
                  <span className="text-xs text-muted-foreground">{reviewSections.audit ? "Hide" : "Show"}</span>
                </button>
                {reviewSections.audit && (
                  <div className="px-4 pb-4">
                    {reviewLoading ? (
                      <p className="text-xs text-muted-foreground">Loading logs...</p>
                    ) : reviewLogs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No audit history yet.</p>
                    ) : (
                      <>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {(showAllAudit ? reviewLogs : reviewLogs.slice(0, 3)).map((log) => {
                            const when = log.timestamp?.toDate?.()?.toLocaleString?.() ?? "";
                            return (
                              <li key={log.id}>
                                {log.action} by {log.byName || log.byUid || "User"}{when ? ` - ${when}` : ""}
                              </li>
                            );
                          })}
                        </ul>
                        {reviewLogs.length > 3 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllAudit((prev) => !prev)}
                          >
                            {showAllAudit ? "View less" : "View more"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Rejection reason (required if rejecting)</Label>
                <Textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
              </div>
            </div>
            <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background/95 backdrop-blur px-6 py-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setReviewMember(null)}>Close</Button>
              <Button variant="outline" onClick={handleReject} disabled={!canVerify}>
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={!canVerify}>
                Approve
              </Button>
            </div>
            {!canVerify && (
              <div className="px-6 pb-4 text-xs text-destructive">
                You do not have permission to verify members.
              </div>
            )}
          </div>
        )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMember} onOpenChange={() => { setSelectedMember(null); setProfileLogs([]); }}>
        <DialogContent className="w-[95vw] sm:max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-border/60">
            <DialogTitle>Member profile</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="flex flex-1 flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4 pb-24 scroll-pb-24 space-y-3 text-sm">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="font-semibold">{selectedMember.fullName}</p>
                  <p>{selectedMember.phone}</p>
                  <p>Member ID: {selectedMember.memberUniqueId || selectedMember.memberId || "Pending"}</p>
                  <p>Status: {selectedMember.status ?? selectedMember.verificationStatus}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 space-y-2">
                  <p className="font-semibold">Status history</p>
                  {profileLoading ? (
                    <p className="text-xs text-muted-foreground">Loading history...</p>
                  ) : profileLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No status history yet.</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {profileLogs.map((log) => {
                        const when = log.timestamp?.toDate?.()?.toLocaleString?.() ?? "";
                        return (
                          <li key={log.id}>
                            {log.action} by {log.byName || log.byUid || "User"}{when ? ` - ${when}` : ""}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="font-semibold">Documents</p>
                  <div className="flex flex-col gap-2">
                    {selectedMember.idFrontUrl ? (
                      <a className="text-primary underline" href={selectedMember.idFrontUrl} target="_blank" rel="noreferrer">View ID front</a>
                    ) : (
                      <span className="text-muted-foreground">ID front missing</span>
                    )}
                    {selectedMember.idBackUrl ? (
                      <a className="text-primary underline" href={selectedMember.idBackUrl} target="_blank" rel="noreferrer">View ID back</a>
                    ) : (
                      <span className="text-muted-foreground">ID back missing</span>
                    )}
                    {Array.isArray(selectedMember.mpesaStatementUploads) && selectedMember.mpesaStatementUploads.length > 0 ? (
                      selectedMember.mpesaStatementUploads.map((upload: UploadMeta | string, index: number) => (
                        typeof upload === "string" ? (
                          <a
                            key={`mpesa-${index}`}
                            className="text-primary underline"
                            href={upload}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Mpesa statement {index + 1}
                          </a>
                        ) : (
                          <a
                            key={`${upload.key}-${index}`}
                            className="text-primary underline"
                            href={upload.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Mpesa statement {index + 1}
                          </a>
                        )
                      ))
                    ) : (
                      <span className="text-muted-foreground">No Mpesa statements uploaded</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background/95 backdrop-blur px-6 py-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => setSelectedMember(null)}>Close</Button>
                <Button
                  variant="outline"
                  disabled={!canVerify || (selectedMember.status ?? selectedMember.verificationStatus) === "suspended"}
                  onClick={handleSuspend}
                >
                  Suspend member
                </Button>
              </div>
              {!canVerify && (
                <div className="px-6 pb-4 text-xs text-destructive">
                  You do not have permission to change member status.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
