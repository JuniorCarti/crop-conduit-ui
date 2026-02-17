import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, MapPin, Phone, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { getCounties, getLocations, getSubCounties, getWards } from "@/data/kenyaLocations";
import { getSupportedMarkets } from "@/services/marketOracleService";
import { uploadToR2 } from "@/services/marketplaceService";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { createBuyerProfile } from "@/services/buyerAccountService";

const BUYER_CATEGORIES = ["Trader", "Retailer", "Offtaker"] as const;
const BUYER_SCOPE = ["LOCAL", "INTERNATIONAL"] as const;
const DOC_KEYS = [
  { key: "certificateOfIncorporation", label: "Certificate of incorporation (optional)" },
  { key: "importLicense", label: "Import license (optional)" },
  { key: "businessPremisesVideo", label: "Business premises video (optional)", accept: "video/*" },
  { key: "bankReferenceLetter", label: "Bank reference letter (optional)" },
  { key: "companyProfile", label: "Company profile / brochure (optional)" },
] as const;
const STEP_COUNT = 3;

type BuyerCategory = (typeof BUYER_CATEGORIES)[number];
type BuyerScope = (typeof BUYER_SCOPE)[number];
type DocKey = (typeof DOC_KEYS)[number]["key"];

const CROP_OPTIONS = [
  "Tomatoes",
  "Kale (Sukuma wiki)",
  "Cabbage",
  "Onion",
  "Irish Potatoes",
  "Maize",
  "Beans",
  "Carrots",
  "Peas",
  "Bananas",
  "Avocado",
  "Mangoes",
];
const COUNTRY_OPTIONS = ["Kenya", "Uganda", "Tanzania", "Rwanda", "Burundi", "DR Congo", "Ethiopia", "South Sudan", "Somalia", "Zambia", "Nigeria", "Ghana", "South Africa", "United Kingdom", "United States", "Netherlands", "Germany", "France", "UAE", "India", "China"];
const PORT_OPTIONS = ["Mombasa Port", "JKIA", "Other"];
const INCOTERMS_OPTIONS = ["EXW", "FOB", "CIF", "DDP"];
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "KES"];
const SHIPPING_OPTIONS = ["Sea", "Air", "Road"];

export default function BuyerRegistration() {
  const navigate = useNavigate();
  const { currentUser, signup } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    buyerCategory: "" as BuyerCategory | "",
    buyerScope: "LOCAL" as BuyerScope,
    buyerCountry: "",
    buyerRegion: "",
    destinationsText: "",
    preferredPort: "",
    incoterms: "",
    preferredCurrency: "",
    shippingMethod: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    county: "",
    subCounty: "",
    ward: "",
    location: "",
    preferredMarkets: [] as string[],
    crops: [] as string[],
    businessName: "",
    paymentMethod: "",
    monthlyDemand: "",
    storageCapability: "",
    contractPreference: "",
    qualityGrade: "",
    weeklyVolume: "",
    packagingRequirement: "",
    paymentTerms: "",
    deliveryDays: [] as string[],
    companyName: "",
    yearsInBusiness: "",
    monthlyPurchaseVolume: "",
    companyRegistrationNumber: "",
    taxIdOrImportLicense: "",
    importCountries: "",
    companyWebsite: "",
    annualRevenueRange: "",
    numberOfEmployees: "",
    linkedInUrl: "",
    facebookUrl: "",
    twitterHandle: "",
    youtubeUrl: "",
    activeOfficePhone: "",
    activeWhatsapp: "",
    roleInCompany: "",
    docs: {
      certificateOfIncorporation: null as File | null,
      importLicense: null as File | null,
      businessPremisesVideo: null as File | null,
      bankReferenceLetter: null as File | null,
      companyProfile: null as File | null,
    },
  });

  const counties = useMemo(() => getCounties(), []);
  const markets = useMemo(() => getSupportedMarkets(), []);
  const subCounties = useMemo(() => (form.county ? getSubCounties(form.county) : []), [form.county]);
  const wards = useMemo(() => (form.county && form.subCounty ? getWards(form.county, form.subCounty) : []), [form.county, form.subCounty]);
  const locations = useMemo(() => (form.county && form.subCounty && form.ward ? getLocations(form.county, form.subCounty, form.ward) : []), [form.county, form.subCounty, form.ward]);

  const setField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleList = (field: "preferredMarkets" | "crops" | "deliveryDays", value: string) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((v: string) => v !== value) : [...prev[field], value],
    }));
  const setDocFile = (key: DocKey, file: File | null) => setForm((prev) => ({ ...prev, docs: { ...prev.docs, [key]: file } }));

  const validStep1 = () => {
    if (!form.fullName || !form.phone || !form.buyerCategory) return false;
    if (!currentUser && (!form.email || !form.password || !form.confirmPassword)) return false;
    return true;
  };
  const validStep2 = () => {
    if (form.crops.length === 0) return false;
    if (form.buyerScope === "LOCAL") {
      if (!form.county || !form.subCounty || !form.ward || !form.location) return false;
      if (form.preferredMarkets.length === 0) return false;
      return true;
    }
    if (form.buyerScope === "INTERNATIONAL") {
      return !!(form.buyerCountry && form.buyerRegion && form.destinationsText && form.companyName && form.yearsInBusiness && form.monthlyPurchaseVolume && form.companyRegistrationNumber && form.taxIdOrImportLicense && form.importCountries);
    }
    return false;
  };
  const validStep3 = () => {
    const categoryOk =
      form.buyerCategory === "Trader"
        ? !!(form.businessName && form.paymentMethod)
        : form.buyerCategory === "Retailer"
          ? !!(form.monthlyDemand && form.storageCapability && form.contractPreference && form.qualityGrade)
          : !!(form.weeklyVolume && form.packagingRequirement && form.paymentTerms && form.deliveryDays.length > 0 && form.companyName);
    const internationalOk = form.buyerScope === "INTERNATIONAL" ? !!(form.activeOfficePhone && form.activeWhatsapp && form.roleInCompany) : true;
    return categoryOk && internationalOk;
  };
  const canProceed = step === 1 ? validStep1() : step === 2 ? validStep2() : validStep3();

  const uploadDocs = async () => {
    if (form.buyerScope !== "INTERNATIONAL") return [];
    const docs: Array<{ type: string; name: string; url: string | null; uploadedAt: string; uploadStatus: "uploaded" | "failed" }> = [];
    for (const docDef of DOC_KEYS) {
      const file = form.docs[docDef.key];
      if (!file) continue;
      try {
        const [url] = await uploadToR2([file]);
        docs.push({ type: docDef.key, name: file.name, url, uploadedAt: new Date().toISOString(), uploadStatus: "uploaded" });
      } catch {
        docs.push({ type: docDef.key, name: file.name, url: null, uploadedAt: new Date().toISOString(), uploadStatus: "failed" });
        toast.warning(`${docDef.label} upload failed; continuing without blocking registration.`);
      }
    }
    return docs;
  };

  const handleSubmit = async () => {
    if (!validStep1() || !validStep2() || !validStep3()) return toast.error("Please complete required fields.");
    if (!currentUser && form.password !== form.confirmPassword) return toast.error("Passwords do not match.");
    setSubmitting(true);
    try {
      const userCredential = currentUser ? { user: currentUser } : await signup(form.email, form.password, form.fullName);
      const uid = userCredential.user.uid;
      const uploadedDocs = await uploadDocs();
      const destinations = form.destinationsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const internationalLocation =
        form.buyerScope === "INTERNATIONAL"
          ? {
              buyerCountry: form.buyerCountry,
              buyerRegion: form.buyerRegion,
              destinations,
              preferredPort: form.preferredPort || null,
              incoterms: form.incoterms || null,
              currency: form.preferredCurrency || null,
              shippingMethod: form.shippingMethod || null,
              timezone: form.timezone || null,
            }
          : null;
      const persistedCounty = form.buyerScope === "LOCAL" ? form.county : null;
      const persistedSubCounty = form.buyerScope === "LOCAL" ? form.subCounty : null;
      const persistedWard = form.buyerScope === "LOCAL" ? form.ward : null;
      const persistedLocation = form.buyerScope === "LOCAL" ? form.location : null;
      const persistedMarkets = form.buyerScope === "LOCAL" ? form.preferredMarkets : [];
      const internationalProfile =
        form.buyerScope === "INTERNATIONAL"
          ? {
              companyName: form.companyName || null,
              yearsInBusiness: form.yearsInBusiness || null,
              monthlyPurchaseVolume: form.monthlyPurchaseVolume || null,
              companyRegistrationNumber: form.companyRegistrationNumber || null,
              taxIdOrImportLicense: form.taxIdOrImportLicense || null,
              importCountries: form.importCountries || null,
              companyWebsite: form.companyWebsite || null,
              annualRevenueRange: form.annualRevenueRange || null,
              numberOfEmployees: form.numberOfEmployees || null,
              socialMedia: {
                linkedInUrl: form.linkedInUrl || null,
                facebookUrl: form.facebookUrl || null,
                twitterHandle: form.twitterHandle || null,
                youtubeUrl: form.youtubeUrl || null,
              },
              contacts: {
                activeOfficePhone: form.activeOfficePhone || null,
                activeWhatsapp: form.activeWhatsapp || null,
                roleInCompany: form.roleInCompany || null,
              },
              internationalLocation,
              documents: uploadedDocs,
            }
          : null;

      const buyerDetails =
        form.buyerCategory === "Trader"
          ? { businessName: form.businessName, paymentMethod: form.paymentMethod, mainCrops: form.crops }
          : form.buyerCategory === "Retailer"
            ? { monthlyDemand: form.monthlyDemand, deliveryPreference: form.storageCapability, contractPreference: form.contractPreference, qualityGradePreference: form.qualityGrade }
            : { companyName: form.companyName, weeklyRequiredVolume: form.weeklyVolume, deliveryDays: form.deliveryDays, packagingRequirement: form.packagingRequirement, paymentTerms: form.paymentTerms };
      const trialEndDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const buyerAccountDefaults = {
        approvalStatus: "PENDING",
        verifiedBuyer: false,
        buyerTier: "BRONZE",
        premiumPlan: "NONE",
        premiumStatus: "TRIAL",
        trialStartAt: serverTimestamp(),
        trialEndAt: trialEndDate,
        metrics: {
          successfulPurchasesCount: 0,
          totalSpendKes: 0,
          disputesCount: 0,
        },
        billing: {
          currency: "KES",
          monthlyPriceKes: 0,
          nextBillingDate: null,
          lastPaymentAt: null,
          paymentStatus: "ACTIVE",
        },
      };

      await setDoc(doc(db, "users", uid), {
        uid,
        role: "buyer",
        displayName: form.fullName,
        phone: form.phone,
        county: persistedCounty,
        subCounty: persistedSubCounty,
        ward: persistedWard,
        location: persistedLocation,
        buyerProfileComplete: true,
        profileComplete: true,
        buyerType: form.buyerCategory.toLowerCase(),
        buyerRegistrationType: form.buyerScope,
        preferredMarkets: persistedMarkets,
        interestedCrops: form.crops,
        ...(internationalLocation ? { internationalLocation } : {}),
        buyerDetails,
        ...(internationalProfile ? { internationalProfile } : {}),
        status: "active",
        ...buyerAccountDefaults,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, "userDirectory", uid), {
        uid,
        emailLower: (form.email || currentUser?.email || "").toLowerCase() || null,
        phoneE164: form.phone.replace(/\D/g, ""),
        displayName: form.fullName,
        role: "buyer",
        createdAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, "buyerProfiles", uid), {
        fullName: form.fullName,
        phone: form.phone,
        county: persistedCounty,
        subCounty: persistedSubCounty,
        ward: persistedWard,
        location: persistedLocation,
        buyerType: form.buyerCategory,
        buyerRegistrationType: form.buyerScope,
        markets: persistedMarkets,
        crops: form.crops,
        ...(internationalLocation ? { internationalLocation } : {}),
        buyerTypeDetails: buyerDetails,
        ...(internationalProfile ? { internationalProfile } : {}),
        ...buyerAccountDefaults,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, "buyers", uid, "profile", "v1"), {
        displayName: form.fullName,
        companyName: form.companyName || internationalProfile?.companyName || null,
        buyerType: form.buyerScope,
        ...buyerAccountDefaults,
        crops: form.crops,
        markets: persistedMarkets,
        ...(internationalLocation ? { internationalLocation } : {}),
        ...(internationalProfile ? { internationalProfile } : {}),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, "buyers", uid, "billing", "v1"), {
        currency: "KES",
        monthlyPriceKes: 0,
        paymentStatus: "ACTIVE",
        nextBillingDate: null,
        lastPaymentAt: null,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      createBuyerProfile({
        displayName: form.fullName,
        companyName: form.companyName || internationalProfile?.companyName || form.businessName || null,
        buyerType: form.buyerScope,
        phone: form.phone,
        email: form.email || currentUser?.email || null,
        county: persistedCounty,
        subCounty: persistedSubCounty,
        ward: persistedWard,
        location: persistedLocation,
        preferredMarkets: persistedMarkets,
        crops: form.crops,
        internationalLocation: internationalLocation || null,
        internationalProfile: internationalProfile || null,
      }).catch((error) => {
        console.warn("Buyer Worker profile sync failed", error);
      });

      toast.success("Buyer profile created. Verification is pending SuperAdmin review.");
      navigate("/buyer/verification-pending");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save buyer profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const onNext = () => {
    if (step < STEP_COUNT) {
      if (!canProceed) return toast.error("Please complete required fields.");
      if (!currentUser && form.password !== form.confirmPassword) return toast.error("Passwords do not match.");
      return setStep((s) => s + 1);
    }
    return handleSubmit();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="border-border/60 shadow-xl">
          <div className="flex max-h-[85vh] flex-col">
            <CardHeader className="border-b border-border/60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Buyer Registration</CardTitle>
                  <p className="text-sm text-muted-foreground">Step {step} of {STEP_COUNT} - {step === 1 ? "Identity" : step === 2 ? "Business details" : "Contacts & review"}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><ShoppingCart className="h-6 w-6 text-primary" /></div>
              </div>
              <div className="space-y-2 pt-2">
                <Progress value={(step / STEP_COUNT) * 100} className="h-2" />
                <div className="grid grid-cols-3 text-xs text-muted-foreground">
                  <span className={step === 1 ? "font-semibold text-foreground" : ""}>1. Identity</span>
                  <span className={`text-center ${step === 2 ? "font-semibold text-foreground" : ""}`}>2. Business</span>
                  <span className={`text-right ${step === 3 ? "font-semibold text-foreground" : ""}`}>3. Review</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto pb-24 pt-4">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label className="mb-2 flex items-center gap-2"><User className="h-4 w-4" />Full name *</Label><Input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} /></div>
                    <div><Label className="mb-2 flex items-center gap-2"><Phone className="h-4 w-4" />Phone *</Label><Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} /></div>
                  </div>
                  {!currentUser && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><Label className="mb-2 flex items-center gap-2"><Mail className="h-4 w-4" />Email *</Label><Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} /></div>
                      <div><Label className="mb-2 block">Password *</Label><Input type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} /></div>
                      <div className="sm:col-span-2"><Label className="mb-2 block">Confirm password *</Label><Input type="password" value={form.confirmPassword} onChange={(e) => setField("confirmPassword", e.target.value)} /></div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <Label>Buyer type *</Label>
                    <div className="inline-flex rounded-lg border border-border p-1">
                      {BUYER_SCOPE.map((scope) => (
                        <button key={scope} type="button" className={`rounded-md px-4 py-2 text-sm font-medium ${form.buyerScope === scope ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`} onClick={() => setField("buyerScope", scope)}>
                          {scope === "LOCAL" ? "Local Buyer" : "International Buyer"}
                        </button>
                      ))}
                    </div>
                    {form.buyerScope === "INTERNATIONAL" && <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">International buyers need additional company details. Documents are optional.</p>}
                  </div>
                  <div>
                    <Label className="mb-2 block">Buyer category *</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {BUYER_CATEGORIES.map((category) => (
                        <label key={category} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${form.buyerCategory === category ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                          <input type="radio" name="buyerCategory" checked={form.buyerCategory === category} onChange={() => setField("buyerCategory", category)} />
                          {category}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {form.buyerScope === "LOCAL" ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div><Label className="mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" />County *</Label><Select value={form.county} onValueChange={(value) => setForm((p) => ({ ...p, county: value, subCounty: "", ward: "", location: "" }))}><SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger><SelectContent>{counties.map((county) => <SelectItem key={county} value={county}>{county}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label className="mb-2 block">SubCounty *</Label><Select value={form.subCounty} onValueChange={(value) => setForm((p) => ({ ...p, subCounty: value, ward: "", location: "" }))}><SelectTrigger disabled={!form.county}><SelectValue placeholder="Select subcounty" /></SelectTrigger><SelectContent>{subCounties.map((subCounty) => <SelectItem key={subCounty} value={subCounty}>{subCounty}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label className="mb-2 block">Ward *</Label><Select value={form.ward} onValueChange={(value) => setForm((p) => ({ ...p, ward: value, location: "" }))}><SelectTrigger disabled={!form.subCounty}><SelectValue placeholder="Select ward" /></SelectTrigger><SelectContent>{wards.map((ward) => <SelectItem key={ward} value={ward}>{ward}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label className="mb-2 block">Location *</Label><Select value={form.location} onValueChange={(value) => setField("location", value)}><SelectTrigger disabled={!form.ward}><SelectValue placeholder="Select location" /></SelectTrigger><SelectContent>{locations.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}</SelectContent></Select></div>
                      </div>
                      <div><Label className="mb-2 block">Preferred markets *</Label><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{markets.map((market) => <label key={market} className="flex items-center gap-2 text-sm"><Checkbox checked={form.preferredMarkets.includes(market)} onCheckedChange={() => toggleList("preferredMarkets", market)} />{market}</label>)}</div></div>
                    </>
                  ) : (
                    <Card className="border-border/60">
                      <CardHeader><CardTitle className="text-base">International location details</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                          International buyers: We only need your country and destinations. Kenya county details are not required.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="mb-2 block">Buyer country *</Label>
                            <Select value={form.buyerCountry} onValueChange={(value) => setField("buyerCountry", value)}>
                              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                              <SelectContent>{COUNTRY_OPTIONS.map((country) => <SelectItem key={country} value={country}>{country}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div><Label className="mb-2 block">City/Region/State *</Label><Input value={form.buyerRegion} onChange={(e) => setField("buyerRegion", e.target.value)} /></div>
                          <div className="sm:col-span-2"><Label className="mb-2 block">Countries/Destinations you import to *</Label><Textarea value={form.destinationsText} onChange={(e) => setField("destinationsText", e.target.value)} placeholder="e.g. UAE, Netherlands, India" /></div>
                          <div><Label className="mb-2 block">Preferred port/airport (optional)</Label><Select value={form.preferredPort || "none"} onValueChange={(value) => setField("preferredPort", value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{PORT_OPTIONS.map((port) => <SelectItem key={port} value={port}>{port}</SelectItem>)}</SelectContent></Select></div>
                          <div><Label className="mb-2 block">Incoterms preference (optional)</Label><Select value={form.incoterms || "none"} onValueChange={(value) => setField("incoterms", value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Select incoterm" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{INCOTERMS_OPTIONS.map((term) => <SelectItem key={term} value={term}>{term}</SelectItem>)}</SelectContent></Select><p className="mt-1 text-xs text-muted-foreground">EXW, FOB, CIF and DDP define shipping responsibility and risk handoff.</p></div>
                          <div><Label className="mb-2 block">Preferred currency (optional)</Label><Select value={form.preferredCurrency || "none"} onValueChange={(value) => setField("preferredCurrency", value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{CURRENCY_OPTIONS.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent></Select></div>
                          <div><Label className="mb-2 block">Preferred shipping method (optional)</Label><Select value={form.shippingMethod || "none"} onValueChange={(value) => setField("shippingMethod", value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Select shipping" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{SHIPPING_OPTIONS.map((method) => <SelectItem key={method} value={method}>{method}</SelectItem>)}</SelectContent></Select></div>
                          <div className="sm:col-span-2"><Label className="mb-2 block">Timezone (optional)</Label><Input value={form.timezone} onChange={(e) => setField("timezone", e.target.value)} /></div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <div><Label className="mb-2 block">Preferred crops/categories *</Label><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{CROP_OPTIONS.map((crop) => <label key={crop} className="flex items-center gap-2 text-sm"><Checkbox checked={form.crops.includes(crop)} onCheckedChange={() => toggleList("crops", crop)} />{crop}</label>)}</div></div>
                  {form.buyerScope === "INTERNATIONAL" && (
                    <Card className="border-border/60">
                      <CardHeader><CardTitle className="text-base">International company details</CardTitle></CardHeader>
                      <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div><Label className="mb-2 block">Company name *</Label><Input value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Years in business *</Label><Input value={form.yearsInBusiness} onChange={(e) => setField("yearsInBusiness", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Monthly purchase volume *</Label><Input value={form.monthlyPurchaseVolume} onChange={(e) => setField("monthlyPurchaseVolume", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Company registration number *</Label><Input value={form.companyRegistrationNumber} onChange={(e) => setField("companyRegistrationNumber", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Tax ID / Import license *</Label><Input value={form.taxIdOrImportLicense} onChange={(e) => setField("taxIdOrImportLicense", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Company website (optional)</Label><Input value={form.companyWebsite} onChange={(e) => setField("companyWebsite", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Annual revenue range (optional)</Label><Input value={form.annualRevenueRange} onChange={(e) => setField("annualRevenueRange", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Number of employees (optional)</Label><Input value={form.numberOfEmployees} onChange={(e) => setField("numberOfEmployees", e.target.value)} /></div>
                        <div className="sm:col-span-2"><Label className="mb-2 block">Import countries / destinations *</Label><Textarea value={form.importCountries} onChange={(e) => setField("importCountries", e.target.value)} /></div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  {form.buyerCategory === "Trader" && <div className="grid gap-4 sm:grid-cols-2"><div><Label className="mb-2 block">Business name *</Label><Input value={form.businessName} onChange={(e) => setField("businessName", e.target.value)} /></div><div><Label className="mb-2 block">Payment method *</Label><Select value={form.paymentMethod} onValueChange={(v) => setField("paymentMethod", v)}><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger><SelectContent>{["Cash","M-Pesa","Bank"].map((v)=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div></div>}
                  {form.buyerCategory === "Retailer" && <div className="grid gap-4 sm:grid-cols-2"><div><Label className="mb-2 block">Monthly demand *</Label><Input value={form.monthlyDemand} onChange={(e) => setField("monthlyDemand", e.target.value)} /></div><div><Label className="mb-2 block">Delivery preference *</Label><Select value={form.storageCapability} onValueChange={(v) => setField("storageCapability", v)}><SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger><SelectContent>{["Pickup","Delivery"].map((v)=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div><div><Label className="mb-2 block">Contract preference *</Label><Select value={form.contractPreference} onValueChange={(v) => setField("contractPreference", v)}><SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger><SelectContent>{["Spot","Contract"].map((v)=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div><div><Label className="mb-2 block">Quality grade *</Label><Select value={form.qualityGrade} onValueChange={(v) => setField("qualityGrade", v)}><SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger><SelectContent>{["A","B","C"].map((v)=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div></div>}
                  {form.buyerCategory === "Offtaker" && <div className="grid gap-4 sm:grid-cols-2"><div><Label className="mb-2 block">Company name *</Label><Input value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} /></div><div><Label className="mb-2 block">Weekly volume *</Label><Input value={form.weeklyVolume} onChange={(e) => setField("weeklyVolume", e.target.value)} /></div><div><Label className="mb-2 block">Packaging requirement *</Label><Select value={form.packagingRequirement} onValueChange={(v) => setField("packagingRequirement", v)}><SelectTrigger><SelectValue placeholder="Select packaging" /></SelectTrigger><SelectContent>{["Crates","Sacks","Net"].map((v)=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div><div><Label className="mb-2 block">Payment terms *</Label><Select value={form.paymentTerms} onValueChange={(v) => setField("paymentTerms", v)}><SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger><SelectContent>{["On delivery","7 days","14 days"].map((v)=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div><div className="sm:col-span-2"><Label className="mb-2 block">Delivery days *</Label><div className="flex flex-wrap gap-3">{["Mon","Tue","Wed","Thu","Fri","Sat"].map((day)=><label key={day} className="flex items-center gap-2 text-sm"><Checkbox checked={form.deliveryDays.includes(day)} onCheckedChange={() => toggleList("deliveryDays", day)} />{day}</label>)}</div></div></div>}
                  {form.buyerScope === "INTERNATIONAL" && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div><Label className="mb-2 block">LinkedIn URL (optional)</Label><Input value={form.linkedInUrl} onChange={(e) => setField("linkedInUrl", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Facebook URL (optional)</Label><Input value={form.facebookUrl} onChange={(e) => setField("facebookUrl", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Twitter/X (optional)</Label><Input value={form.twitterHandle} onChange={(e) => setField("twitterHandle", e.target.value)} /></div>
                        <div><Label className="mb-2 block">YouTube URL (optional)</Label><Input value={form.youtubeUrl} onChange={(e) => setField("youtubeUrl", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Active office phone *</Label><Input value={form.activeOfficePhone} onChange={(e) => setField("activeOfficePhone", e.target.value)} /></div>
                        <div><Label className="mb-2 block">Active WhatsApp number *</Label><Input value={form.activeWhatsapp} onChange={(e) => setField("activeWhatsapp", e.target.value)} /></div>
                        <div className="sm:col-span-2"><Label className="mb-2 block">Your role in company *</Label><Input value={form.roleInCompany} onChange={(e) => setField("roleInCompany", e.target.value)} /></div>
                      </div>
                      <Card className="border-border/60">
                        <CardHeader><CardTitle className="text-base">Document uploads</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-xs text-muted-foreground">Optional - upload if available.</p>
                          {DOC_KEYS.map((docDef) => <div key={docDef.key}><Label className="mb-2 block">{docDef.label}</Label><Input type="file" accept={docDef.accept} onChange={(e) => setDocFile(docDef.key, e.target.files?.[0] ?? null)} /></div>)}
                        </CardContent>
                      </Card>
                    </>
                  )}
                  <Card className="border-border/60">
                    <CardHeader><CardTitle className="text-base">Review summary</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                      <div><p className="text-xs text-muted-foreground">Buyer type</p><p className="font-semibold">{form.buyerScope}</p></div>
                      <div><p className="text-xs text-muted-foreground">Buyer category</p><p className="font-semibold">{form.buyerCategory || "-"}</p></div>
                      {form.buyerScope === "LOCAL" ? (
                        <>
                          <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Location</p><p className="font-semibold">{[form.location, form.ward, form.subCounty, form.county].filter(Boolean).join(", ") || "-"}</p></div>
                          <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Preferred markets</p><p className="font-semibold">{form.preferredMarkets.join(", ") || "-"}</p></div>
                        </>
                      ) : (
                        <>
                          <div><p className="text-xs text-muted-foreground">Buyer country</p><p className="font-semibold">{form.buyerCountry || "-"}</p></div>
                          <div><p className="text-xs text-muted-foreground">Region</p><p className="font-semibold">{form.buyerRegion || "-"}</p></div>
                          <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Destinations</p><p className="font-semibold">{form.destinationsText || "-"}</p></div>
                          <div><p className="text-xs text-muted-foreground">Shipping method</p><p className="font-semibold">{form.shippingMethod || "-"}</p></div>
                          <div><p className="text-xs text-muted-foreground">Currency</p><p className="font-semibold">{form.preferredCurrency || "-"}</p></div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>

            <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={() => (step === 1 ? navigate("/registration") : setStep((s) => s - 1))} className="w-full gap-2 sm:w-auto"><ArrowLeft className="h-4 w-4" />{step === 1 ? "Cancel" : "Back"}</Button>
                <Button onClick={onNext} disabled={!canProceed || submitting} className="w-full gap-2 sm:w-auto">{step === STEP_COUNT ? (submitting ? "Saving..." : "Save buyer profile") : "Next"}<ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
