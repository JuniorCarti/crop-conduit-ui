import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Calendar, FileText, Mail, MapPin, Phone, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getCounties, getLocations, getSubCounties, getWards } from "@/data/kenyaLocations";
import { toast } from "sonner";
import { db, storage } from "@/lib/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const orgTypes = ["Cooperative", "Enterprise", "Bank", "NGO"] as const;

const bankBranches: Record<string, string[]> = {
  "Equity Bank": ["Kericho Branch", "Eldoret Branch", "Kisumu Branch", "Nairobi CBD"],
  "KCB Bank": ["Kericho Branch", "Eldoret Branch", "Kisumu Branch", "Nairobi CBD"],
  "Co-operative Bank": ["Kericho Branch", "Eldoret Branch", "Kisumu Branch", "Nairobi CBD"],
  "Absa Bank": ["Nairobi CBD", "Westlands Branch", "Mombasa Branch", "Kisumu Branch"],
  "NCBA Bank": ["Nairobi CBD", "Westlands Branch", "Upper Hill Branch", "Mombasa Branch"],
  "Family Bank": ["Nairobi CBD", "Kisumu Branch", "Eldoret Branch", "Thika Branch"],
  "DTB": ["Nairobi CBD", "Westlands Branch"],
  "I&M": ["Nairobi CBD", "Westlands Branch", "Mombasa Branch"],
  "Stanbic": ["Nairobi CBD", "Westlands Branch", "Mombasa Branch"],
  "Standard Chartered": ["Nairobi CBD", "Westlands Branch", "Mombasa Branch"],
  Other: [],
};

const documentChecklist = [
  "Certificate of Registration",
  "KRA PIN Certificate",
  "Business Permit (County)",
  "Directors/Officials ID list (optional)",
  "Proof of address (optional)",
  "Bank account proof / letter (optional)",
  "Tax compliance certificate (optional for later)",
];

const documentUploads = [
  { key: "registrationCert", label: "Certificate of Registration" },
  { key: "kraPin", label: "KRA PIN Certificate" },
  { key: "businessPermit", label: "Business Permit (County)" },
  { key: "directorsList", label: "Directors/Officials ID list (optional)" },
  { key: "proofOfAddress", label: "Proof of address (optional)" },
  { key: "bankLetter", label: "Bank account proof / letter (optional)" },
  { key: "taxCompliance", label: "Tax compliance certificate (optional for later)" },
] as const;

type DocumentKey = (typeof documentUploads)[number]["key"];

export default function OrgRegistration() {
  const navigate = useNavigate();
  const { currentUser, signup } = useAuth();
  const counties = useMemo(() => getCounties(), []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    orgType: "",
    orgName: "",
    bankName: "",
    bankBranch: "",
    otherBankName: "",
    otherBankBranch: "",
    cooperativeName: "",
    enterpriseName: "",
    ngoName: "",
    membershipSize: "",
    countiesServed: "",
    regionBranch: "",
    kraPin: "",
    registrationNumber: "",
    dateOfRegistration: "",
    yearsInOperation: "",
    contactPerson: "",
    contactPhone: "",
    email: "",
    password: "",
    confirmPassword: "",
    county: "",
    subCounty: "",
    ward: "",
    location: "",
  });

  const [docs, setDocs] = useState<Record<DocumentKey, File | null>>({
    registrationCert: null,
    kraPin: null,
    businessPermit: null,
    directorsList: null,
    proofOfAddress: null,
    bankLetter: null,
    taxCompliance: null,
  });

  const subCounties = useMemo(
    () => (formData.county ? getSubCounties(formData.county) : []),
    [formData.county]
  );
  const wards = useMemo(
    () => (formData.county && formData.subCounty ? getWards(formData.county, formData.subCounty) : []),
    [formData.county, formData.subCounty]
  );
  const locations = useMemo(() => {
    if (!formData.county || !formData.subCounty || !formData.ward) return [];
    return getLocations(formData.county, formData.subCounty, formData.ward);
  }, [formData.county, formData.subCounty, formData.ward]);

  const branches = formData.bankName ? bankBranches[formData.bankName] ?? [] : [];

  const computeYears = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return Math.max(0, new Date().getFullYear() - date.getFullYear()).toString();
  };

  const handleDocChange = (key: DocumentKey, file?: File | null) => {
    setDocs((prev) => ({ ...prev, [key]: file ?? null }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentUser && (!formData.email || !formData.password || !formData.confirmPassword)) {
      toast.error("Email and password are required.");
      return;
    }

    if (!currentUser && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!formData.orgType || !formData.contactPerson || !formData.contactPhone) {
      toast.error("Please complete required fields.");
      return;
    }

    if (!formData.kraPin || !formData.dateOfRegistration || !formData.yearsInOperation) {
      toast.error("Please complete compliance fields.");
      return;
    }

    if (!formData.county || !formData.subCounty || !formData.ward || !formData.location) {
      toast.error("Please complete location fields.");
      return;
    }

    if (formData.orgType === "Bank") {
      if (!formData.bankName) {
        toast.error("Please select a bank.");
        return;
      }
      if (formData.bankName === "Other" && (!formData.otherBankName || !formData.otherBankBranch)) {
        toast.error("Please enter the bank and branch name.");
        return;
      }
      if (formData.bankName !== "Other" && !formData.bankBranch) {
        toast.error("Please select a branch.");
        return;
      }
    }

    if (formData.orgType === "NGO" && !formData.orgName && !formData.ngoName) {
      toast.error("NGO name is required.");
      return;
    }

    if (formData.orgType === "Enterprise" && !formData.orgName && !formData.enterpriseName) {
      toast.error("Enterprise name is required.");
      return;
    }

    if (formData.orgType === "Cooperative" && !formData.orgName && !formData.cooperativeName) {
      toast.error("Cooperative name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userCredential = currentUser
        ? { user: currentUser }
        : await signup(formData.email, formData.password, formData.contactPerson);
      const uid = userCredential.user.uid;
      console.log("[OrgRegistration] uid:", uid);

      const uploadedDocs: Record<string, string | null> = {
        registrationCert: null,
        kraPin: null,
        businessPermit: null,
        directorsList: null,
        proofOfAddress: null,
        bankLetter: null,
        taxCompliance: null,
      };
      let uploadWarnings = 0;

      for (const key of Object.keys(docs) as DocumentKey[]) {
        const file = docs[key];
        if (!file) continue;
        const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
        try {
          const storageRef = ref(storage, `org_verification/${uid}/${Date.now()}_${key}.${extension}`);
          await uploadBytes(storageRef, file);
          uploadedDocs[key] = await getDownloadURL(storageRef);
        } catch (uploadError) {
          uploadWarnings += 1;
          console.warn("[OrgRegistration] document upload skipped", { key, error: uploadError });
        }
      }
      if (uploadWarnings > 0) {
        toast.warning("Some documents could not be uploaded. Registration will continue.");
      }

      const orgRef = doc(collection(db, "orgs"));
      const orgId = orgRef.id;

      const orgName =
        formData.orgType === "Bank"
          ? formData.bankName === "Other"
            ? formData.otherBankName
            : formData.bankName
          : formData.orgType === "NGO"
          ? formData.orgName || formData.ngoName
          : formData.orgType === "Enterprise"
          ? formData.orgName || formData.enterpriseName
          : formData.orgName || formData.cooperativeName;

      const branchName =
        formData.orgType === "Bank"
          ? formData.bankName === "Other"
            ? formData.otherBankBranch
            : formData.bankBranch
          : formData.regionBranch;

      const orgData = {
        orgType: formData.orgType.toLowerCase(),
        orgName,
        branchName: branchName || null,
        bankName: formData.orgType === "Bank" ? orgName : null,
        bankBranch: formData.orgType === "Bank" ? branchName || null : null,
        membershipSize: formData.membershipSize || null,
        countiesServed: formData.countiesServed || null,
        regionBranch: formData.regionBranch || null,
        kraPin: formData.kraPin,
        registrationNumber: formData.registrationNumber || null,
        dateOfRegistration: formData.dateOfRegistration,
        yearsInOperation: Number(formData.yearsInOperation),
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        email: formData.email || userCredential.user.email || null,
        county: formData.county,
        subCounty: formData.subCounty,
        ward: formData.ward,
        location: formData.location,
        status: "pending",
        verificationStatus: "pending",
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
        createdByUid: uid,
        createdAt: serverTimestamp(),
      };

      const trialEndsAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const subscriptionPayload = {
        planId: "coop_premium",
        status: "trialing",
        currency: "KES",
        billingCycle: "monthly",
        startAt: serverTimestamp(),
        trialEndsAt,
        renewAt: trialEndsAt,
        cancelAt: null,
        seats: { paidTotal: 5, sponsoredTotal: 2 },
        seatPricing: { perSeat: 250, sponsoredPerSeat: 250 },
        featureFlags: {
          marketOracle: true,
          climateInsights: true,
          harvestPlanner: true,
          groupPrices: true,
          marketplaceVerifiedTag: true,
          training: true,
          certificates: true,
          targetsRewards: true,
          csvOnboarding: true,
        },
        updatedAt: serverTimestamp(),
      };
      const billingSettingsPayload = {
        staffCanManageBilling: false,
        autoUnassignOnSuspension: false,
        autoUnassignSeatsOnSuspension: false,
        updatedAt: serverTimestamp(),
      };

      console.log("[OrgRegistration] create sequential core docs", orgId);
      console.log("[OrgRegistration] payload keys", {
        path: `orgs/${orgId}`,
        keys: Object.keys(orgData),
      });
      try {
        await setDoc(orgRef, orgData, { merge: true });
      } catch (writeError: any) {
        console.error("[OrgRegistration] write failed", {
          step: "org create",
          path: `orgs/${orgId}`,
          keys: Object.keys(orgData),
          error: writeError,
        });
        throw writeError;
      }

      const memberPayload = {
        uid,
        role: "org_admin",
        name: formData.contactPerson || userCredential.user.displayName || "",
        email: formData.email || userCredential.user.email || "",
        status: "active",
        createdAt: serverTimestamp(),
      };
      console.log("[OrgRegistration] payload keys", {
        path: `orgs/${orgId}/members/${uid}`,
        keys: Object.keys(memberPayload),
      });
      try {
        await setDoc(doc(db, "orgs", orgId, "members", uid), memberPayload, { merge: true });
      } catch (writeError: any) {
        console.error("[OrgRegistration] write failed", {
          step: "membership create",
          path: `orgs/${orgId}/members/${uid}`,
          keys: Object.keys(memberPayload),
          error: writeError,
        });
        throw writeError;
      }

      const userPayload = {
        role: "org_admin",
        orgId,
        orgType: formData.orgType.toLowerCase(),
        profileComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(doc(db, "users", uid), userPayload, { merge: true });
      } catch (writeError: any) {
        console.error("[OrgRegistration] write failed", {
          step: "user role update",
          path: `users/${uid}`,
          keys: Object.keys(userPayload),
          error: writeError,
        });
        throw writeError;
      }

      try {
        await setDoc(doc(db, "orgs", orgId, "subscription", "current"), subscriptionPayload, { merge: true });
      } catch (writeError: any) {
        console.error("[OrgRegistration] write failed", {
          step: "subscription create",
          path: `orgs/${orgId}/subscription/current`,
          keys: Object.keys(subscriptionPayload),
          error: writeError,
        });
        throw writeError;
      }

      try {
        await setDoc(doc(db, "orgs", orgId, "billing", "settings"), billingSettingsPayload, { merge: true });
      } catch (writeError: any) {
        console.error("[OrgRegistration] write failed", {
          step: "billing settings create",
          path: `orgs/${orgId}/billing/settings`,
          keys: Object.keys(billingSettingsPayload),
          error: writeError,
        });
        throw writeError;
      }
      console.log("[OrgRegistration] core org docs committed");

      try {
        console.log("[OrgRegistration] create legacy /organizations", orgId);
        await setDoc(doc(db, "organizations", orgId), {
          name: orgName,
          type: formData.orgType.toLowerCase(),
          createdByUid: uid,
          createdAt: serverTimestamp(),
          status: "active",
          joinEnabled: true,
        });

        console.log("[OrgRegistration] create legacy /organizations members", uid);
        await setDoc(doc(db, "organizations", orgId, "members", uid), {
          uid,
          role: "admin",
          memberType: "staff",
          joinedAt: serverTimestamp(),
          sponsored: false,
          status: "active",
        });
      } catch (legacyError) {
        console.warn("[OrgRegistration] legacy writes failed but core org setup succeeded", legacyError);
        toast.warning("Organization created, but legacy sync failed. You can continue.");
      }

      const normalizePhone = (value: string) => {
        const digits = value.replace(/\D/g, "");
        if (digits.startsWith("254")) return digits;
        if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
        return digits;
      };

      await setDoc(
        doc(db, "userDirectory", uid),
        {
          uid,
          emailLower: (formData.email || currentUser?.email || "").toLowerCase() || null,
          phoneE164: normalizePhone(formData.contactPhone),
          displayName: formData.contactPerson || formData.orgName,
          role: "org_admin",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast.success("Submitted for verification (1-2 business days)");
      navigate("/org");
    } catch (error: any) {
      console.error("[OrgRegistration] submit failed:", error);
      if (error?.code === "permission-denied") {
        console.error("[OrgRegistration] permission denied write details", {
          orgPath: "orgs/{orgId}",
          orgMemberPath: "orgs/{orgId}/members/{uid}",
          note: "Check createdByUid and member self-write constraints.",
        });
        toast.error("We couldn't complete your registration due to permissions. Please retry.");
      } else {
        toast.error(error?.message || "Failed to register organization.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card/95 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Organization Registration</h1>
          <p className="text-sm text-muted-foreground">Submit your organization details for verification.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="flex items-center gap-2 mb-2">Organization type *</Label>
              <Select
                value={formData.orgType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    orgType: value,
                    bankName: "",
                    bankBranch: "",
                    otherBankName: "",
                    otherBankBranch: "",
                  }))
                }
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {orgTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.orgType && formData.orgType !== "Bank" && (
              <div>
                <Label htmlFor="org-name" className="mb-2 block">
                  Organization name *
                </Label>
                <Input
                  id="org-name"
                  value={formData.orgName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, orgName: event.target.value }))}
                  placeholder="Organization name"
                />
              </div>
            )}
            {formData.orgType === "Bank" && (
              <div>
                <Label className="mb-2 block">Bank *</Label>
                <Select
                  value={formData.bankName}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, bankName: value, bankBranch: "" }))
                  }
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(bankBranches).map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {formData.orgType === "Bank" && formData.bankName && formData.bankName !== "Other" && (
            <div>
              <Label className="mb-2 block">Branch *</Label>
              <Select
                value={formData.bankBranch}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, bankBranch: value }))}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.orgType === "Bank" && formData.bankName === "Other" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="other-bank" className="mb-2 block">
                  Enter Bank Name *
                </Label>
                <Input
                  id="other-bank"
                  value={formData.otherBankName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, otherBankName: event.target.value }))}
                  placeholder="Bank name"
                />
              </div>
              <div>
                <Label htmlFor="other-branch" className="mb-2 block">
                  Enter Branch Name *
                </Label>
                <Input
                  id="other-branch"
                  value={formData.otherBankBranch}
                  onChange={(event) => setFormData((prev) => ({ ...prev, otherBankBranch: event.target.value }))}
                  placeholder="Branch name"
                />
              </div>
            </div>
          )}

          {formData.orgType === "Cooperative" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="coop-name" className="mb-2 block">
                  Cooperative name *
                </Label>
                <Input
                  id="coop-name"
                  value={formData.cooperativeName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, cooperativeName: event.target.value }))}
                  placeholder="Cooperative name"
                />
              </div>
              <div>
                <Label htmlFor="membership" className="mb-2 block">
                  Membership size (optional)
                </Label>
                <Input
                  id="membership"
                  value={formData.membershipSize}
                  onChange={(event) => setFormData((prev) => ({ ...prev, membershipSize: event.target.value }))}
                  placeholder="e.g. 120 members"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="counties-served" className="mb-2 block">
                  Counties served (optional)
                </Label>
                <Input
                  id="counties-served"
                  value={formData.countiesServed}
                  onChange={(event) => setFormData((prev) => ({ ...prev, countiesServed: event.target.value }))}
                  placeholder="e.g. Baringo, Nakuru"
                />
              </div>
            </div>
          )}

          {formData.orgType === "Enterprise" && (
            <div>
              <Label htmlFor="enterprise-name" className="mb-2 block">
                Enterprise name *
              </Label>
              <Input
                id="enterprise-name"
                value={formData.enterpriseName}
                onChange={(event) => setFormData((prev) => ({ ...prev, enterpriseName: event.target.value }))}
                placeholder="Enterprise name"
              />
            </div>
          )}

          {formData.orgType === "NGO" && (
            <div>
              <Label htmlFor="ngo-name" className="mb-2 block">
                NGO name *
              </Label>
              <Input
                id="ngo-name"
                value={formData.ngoName}
                onChange={(event) => setFormData((prev) => ({ ...prev, ngoName: event.target.value }))}
                placeholder="NGO name"
              />
            </div>
          )}

          {(formData.orgType === "Enterprise" || formData.orgType === "NGO") && (
            <div>
              <Label htmlFor="region" className="mb-2 block">
                Registration region / branch (optional)
              </Label>
              <Input
                id="region"
                value={formData.regionBranch}
                onChange={(event) => setFormData((prev) => ({ ...prev, regionBranch: event.target.value }))}
                placeholder="Region or branch"
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="kra-pin" className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                KRA PIN number *
              </Label>
              <Input
                id="kra-pin"
                value={formData.kraPin}
                onChange={(event) => setFormData((prev) => ({ ...prev, kraPin: event.target.value }))}
                placeholder="KRA PIN"
              />
            </div>
            <div>
              <Label htmlFor="reg-number" className="flex items-center gap-2 mb-2">
                Registration number (optional)
              </Label>
              <Input
                id="reg-number"
                value={formData.registrationNumber}
                onChange={(event) => setFormData((prev) => ({ ...prev, registrationNumber: event.target.value }))}
                placeholder="Registration number"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="reg-date" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Date of registration *
              </Label>
              <Input
                id="reg-date"
                type="date"
                value={formData.dateOfRegistration}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    dateOfRegistration: event.target.value,
                    yearsInOperation: computeYears(event.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="years" className="flex items-center gap-2 mb-2">
                Years in operation *
              </Label>
              <Input
                id="years"
                value={formData.yearsInOperation}
                onChange={(event) => setFormData((prev) => ({ ...prev, yearsInOperation: event.target.value }))}
                placeholder="Auto-calculated or manual"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="contact-person" className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                Contact person *
              </Label>
              <Input
                id="contact-person"
                value={formData.contactPerson}
                onChange={(event) => setFormData((prev) => ({ ...prev, contactPerson: event.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label htmlFor="contact-phone" className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4" />
                Contact phone *
              </Label>
              <Input
                id="contact-phone"
                value={formData.contactPhone}
                onChange={(event) => setFormData((prev) => ({ ...prev, contactPhone: event.target.value }))}
                placeholder="+254 7xx xxx xxx"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {!currentUser && (
              <>
                <div>
                  <Label htmlFor="org-email" className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    Email *
                  </Label>
                  <Input
                    id="org-email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="info@organization.org"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="org-password" className="flex items-center gap-2 mb-2">
                    Password *
                  </Label>
                  <Input
                    id="org-password"
                    type="password"
                    value={formData.password}
                    onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Create password"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="org-confirm" className="flex items-center gap-2 mb-2">
                    Confirm password *
                  </Label>
                  <Input
                    id="org-confirm"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                County HQ *
              </Label>
              <Select
                value={formData.county}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, county: value, subCounty: "", ward: "", location: "" }))
                }
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent>
                  {counties.map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">SubCounty HQ *</Label>
              <Select
                value={formData.subCounty}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subCounty: value, ward: "", location: "" }))}
              >
                <SelectTrigger className="w-full min-w-0" disabled={!formData.county}>
                  <SelectValue placeholder="Select subcounty" />
                </SelectTrigger>
                <SelectContent>
                  {subCounties.map((subCounty) => (
                    <SelectItem key={subCounty} value={subCounty}>
                      {subCounty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="flex items-center gap-2 mb-2">Ward HQ *</Label>
              <Select
                value={formData.ward}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, ward: value, location: "" }))}
              >
                <SelectTrigger className="w-full min-w-0" disabled={!formData.subCounty}>
                  <SelectValue placeholder="Select ward" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward} value={ward}>
                      {ward}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">Location HQ *</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
              >
                <SelectTrigger className="w-full min-w-0" disabled={!formData.ward}>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 p-4">
            <p className="text-sm font-semibold text-foreground">Documents for verification (optional for now)</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {documentChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="grid gap-4 sm:grid-cols-2">
              {documentUploads.map((docItem) => (
                <div key={docItem.key} className="rounded-lg border border-border/60 p-3">
                  <Label className="flex items-center gap-2 mb-2 text-sm">
                    <Upload className="h-4 w-4" />
                    {docItem.label}
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(event) => handleDocChange(docItem.key, event.target.files?.[0])}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate("/registration")}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Submitting..." : "Submit for verification"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
