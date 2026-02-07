import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, MapPin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { getCounties, getLocations, getSubCounties, getWards } from "@/data/kenyaLocations";
import { getSupportedMarkets } from "@/services/marketOracleService";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

const buyerTypes = ["Trader", "Retailer", "Offtaker"] as const;

export default function BuyerRegistration() {
  const navigate = useNavigate();
  const { currentUser, signup } = useAuth();

  const counties = useMemo(() => getCounties(), []);
  const markets = useMemo(() => getSupportedMarkets(), []);
  const crops = useMemo(
    () => [
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
    ],
    []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    county: "",
    subCounty: "",
    ward: "",
    location: "",
    buyerType: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferredMarkets: [] as string[],
    crops: [] as string[],
    businessName: "",
    marketStall: "",
    typicalVolume: "",
    buyingFrequency: "",
    paymentMethod: "",
    shopName: "",
    branchCount: "",
    monthlyDemand: "",
    storageCapability: "",
    companyName: "",
    contractPreference: "",
    qualityGrade: "",
    weeklyVolume: "",
    contractRequired: "",
    packagingRequirement: "",
    paymentTerms: "",
    deliveryDays: [] as string[],
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

  const toggleValue = (field: "preferredMarkets" | "crops", value: string) => {
    setFormData((prev) => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.county ||
      !formData.subCounty ||
      !formData.ward ||
      !formData.location ||
      !formData.buyerType ||
      (!currentUser && (!formData.email || !formData.password || !formData.confirmPassword))
    ) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (!currentUser && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (formData.crops.length === 0) {
      toast.error("Please select at least one commodity.");
      return;
    }

    if (formData.buyerType === "Retailer") {
      if (
        !formData.shopName ||
        !formData.monthlyDemand ||
        !formData.storageCapability ||
        !formData.qualityGrade ||
        !formData.contractPreference
      ) {
        toast.error("Please complete all retailer details.");
        return;
      }
    }

    if (formData.buyerType === "Trader") {
      if (
        !formData.businessName ||
        !formData.typicalVolume ||
        !formData.buyingFrequency ||
        !formData.paymentMethod ||
        formData.preferredMarkets.length === 0
      ) {
        toast.error("Please add preferred markets and typical volume.");
        return;
      }
    }

    if (formData.buyerType === "Offtaker") {
      if (
        !formData.companyName ||
        !formData.contractRequired ||
        !formData.qualityGrade ||
        !formData.weeklyVolume ||
        formData.deliveryDays.length === 0 ||
        !formData.packagingRequirement ||
        !formData.paymentTerms
      ) {
        toast.error("Please complete all offtaker details.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const userCredential = currentUser
        ? { user: currentUser }
        : await signup(formData.email, formData.password, formData.fullName);
      const uid = userCredential.user.uid;

      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          role: "buyer",
          displayName: formData.fullName,
          phone: formData.phone,
          county: formData.county,
          buyerProfileComplete: true,
          profileComplete: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          subCounty: formData.subCounty,
          ward: formData.ward,
          location: formData.location,
          buyerType: formData.buyerType.toLowerCase(),
          preferredMarkets: formData.preferredMarkets,
          interestedCrops: formData.crops,
          buyerDetails:
            formData.buyerType === "Trader"
              ? {
                  businessName: formData.businessName,
                  marketStall: formData.marketStall || null,
                  averageDailyVolumeKg: formData.typicalVolume,
                  mainCrops: formData.crops,
                  buyingFrequency: formData.buyingFrequency,
                  paymentMethod: formData.paymentMethod,
                }
              : formData.buyerType === "Retailer"
              ? {
                  shopName: formData.shopName,
                  branchCount: formData.branchCount || null,
                  weeklyVolume: formData.monthlyDemand,
                  deliveryPreference: formData.storageCapability,
                  qualityGradePreference: formData.qualityGrade,
                  contractPreference: formData.contractPreference,
                }
              : {
                  companyName: formData.companyName,
                  weeklyRequiredVolume: formData.weeklyVolume,
                  contractRequired: formData.contractRequired,
                  deliveryDays: formData.deliveryDays,
                  qualityStandards: formData.qualityGrade,
                  packagingRequirement: formData.packagingRequirement,
                  paymentTerms: formData.paymentTerms,
                },
          status: "active",
        },
        { merge: true }
      );

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
          phoneE164: normalizePhone(formData.phone),
          displayName: formData.fullName,
          role: "buyer",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "buyerProfiles", uid),
        {
          fullName: formData.fullName,
          phone: formData.phone,
          county: formData.county,
          subCounty: formData.subCounty,
          ward: formData.ward,
          location: formData.location,
          buyerType: formData.buyerType,
          markets: formData.preferredMarkets,
          crops: formData.crops,
          buyerTypeDetails:
            formData.buyerType === "Trader"
              ? {
                  businessName: formData.businessName || null,
                  typicalVolume: formData.typicalVolume || null,
                }
              : formData.buyerType === "Retailer"
              ? {
                  shopName: formData.shopName || null,
                  outletType: formData.outletType || null,
                  monthlyDemand: formData.monthlyDemand || null,
                  storageCapability: formData.storageCapability || null,
                }
              : {
                  companyName: formData.companyName || null,
                  contractPreference: formData.contractPreference || null,
                  qualityGrade: formData.qualityGrade || null,
                  weeklyVolume: formData.weeklyVolume || null,
                  deliverySchedule: formData.deliverySchedule || null,
                },
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast.success("Buyer profile created");
      navigate("/access-summary");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save buyer profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card/95 p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShoppingCart className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Buyer Registration</h1>
          <p className="text-sm text-muted-foreground">
            Tell us about your buying needs so we can tailor the marketplace experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="buyer-name" className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                Full name *
              </Label>
              <Input
                id="buyer-name"
                value={formData.fullName}
                onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
                placeholder="Enter your full name"
                className="w-full min-w-0"
                required
              />
            </div>
            <div>
              <Label htmlFor="buyer-phone" className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4" />
                Phone *
              </Label>
              <Input
                id="buyer-phone"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+254 7xx xxx xxx"
                className="w-full min-w-0"
                required
              />
            </div>
          </div>

          {!currentUser && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="buyer-email" className="flex items-center gap-2 mb-2">
                  Email *
                </Label>
                <Input
                  id="buyer-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="buyer-password" className="flex items-center gap-2 mb-2">
                  Password *
                </Label>
                <Input
                  id="buyer-password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Create a password"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="buyer-confirm" className="flex items-center gap-2 mb-2">
                  Confirm password *
                </Label>
                <Input
                  id="buyer-confirm"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="buyer-county" className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                County *
              </Label>
              <Select
                value={formData.county}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    county: value,
                    subCounty: "",
                    ward: "",
                    location: "",
                  }))
                }
              >
                <SelectTrigger id="buyer-county" className="w-full min-w-0">
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
              <Label className="flex items-center gap-2 mb-2">
                Buyer type *
              </Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {buyerTypes.map((type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      formData.buyerType === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="buyerType"
                      value={type}
                      checked={formData.buyerType === type}
                      onChange={() => setFormData((prev) => ({ ...prev, buyerType: type }))}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="buyer-subcounty" className="flex items-center gap-2 mb-2">
                SubCounty *
              </Label>
              <Select
                value={formData.subCounty}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, subCounty: value, ward: "", location: "" }))
                }
              >
                <SelectTrigger id="buyer-subcounty" className="w-full min-w-0" disabled={!formData.county}>
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
            <div>
              <Label htmlFor="buyer-ward" className="flex items-center gap-2 mb-2">
                Ward *
              </Label>
              <Select
                value={formData.ward}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, ward: value, location: "" }))
                }
              >
                <SelectTrigger id="buyer-ward" className="w-full min-w-0" disabled={!formData.subCounty}>
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
          </div>

          <div>
            <Label htmlFor="buyer-location" className="flex items-center gap-2 mb-2">
              Location *
            </Label>
            <Select
              value={formData.location}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
            >
              <SelectTrigger id="buyer-location" className="w-full min-w-0" disabled={!formData.ward}>
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

          <div>
            <Label className="flex items-center gap-2 mb-2">
              Preferred markets
            </Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {markets.map((market) => {
                const id = `market-${market}`;
                return (
                  <label key={market} htmlFor={id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id={id}
                      checked={formData.preferredMarkets.includes(market)}
                      onCheckedChange={() => toggleValue("preferredMarkets", market)}
                    />
                    <span className="whitespace-normal break-words">{market}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              Interested crops
            </Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {crops.map((crop) => {
                const id = `crop-${crop}`;
                return (
                  <label key={crop} htmlFor={id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id={id}
                      checked={formData.crops.includes(crop)}
                      onCheckedChange={() => toggleValue("crops", crop)}
                    />
                    <span className="whitespace-normal break-words">{crop}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {formData.buyerType === "Trader" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="trader-business" className="mb-2 block">
                  Business/Shop name *
                </Label>
                <Input
                  id="trader-business"
                  value={formData.businessName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, businessName: event.target.value }))}
                  placeholder="Business name"
                />
              </div>
              <div>
                <Label htmlFor="trader-stall" className="mb-2 block">
                  Market stall name/number (optional)
                </Label>
                <Input
                  id="trader-stall"
                  value={formData.marketStall}
                  onChange={(event) => setFormData((prev) => ({ ...prev, marketStall: event.target.value }))}
                  placeholder="Stall number"
                />
              </div>
              <div>
                <Label htmlFor="trader-volume" className="mb-2 block">
                  Average daily purchase volume (kg) *
                </Label>
                <Input
                  id="trader-volume"
                  value={formData.typicalVolume}
                  onChange={(event) => setFormData((prev) => ({ ...prev, typicalVolume: event.target.value }))}
                  placeholder="e.g. 1500"
                />
              </div>
              <div>
                <Label htmlFor="trader-frequency" className="mb-2 block">
                  Buying frequency *
                </Label>
                <Select
                  value={formData.buyingFrequency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, buyingFrequency: value }))}
                >
                  <SelectTrigger id="trader-frequency" className="w-full min-w-0">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Daily", "Weekly"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="trader-payment" className="mb-2 block">
                  Payment method *
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger id="trader-payment" className="w-full min-w-0">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Cash", "M-Pesa", "Bank"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formData.buyerType === "Retailer" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="retailer-shop" className="mb-2 block">
                  Shop/Supermarket name *
                </Label>
                <Input
                  id="retailer-shop"
                  value={formData.shopName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, shopName: event.target.value }))}
                  placeholder="Outlet name"
                />
              </div>
              <div>
                <Label htmlFor="retailer-branches" className="mb-2 block">
                  Number of branches (optional)
                </Label>
                <Input
                  id="retailer-branches"
                  value={formData.branchCount}
                  onChange={(event) => setFormData((prev) => ({ ...prev, branchCount: event.target.value }))}
                  placeholder="e.g. 3 branches"
                />
              </div>
              <div>
                <Label htmlFor="retailer-demand" className="mb-2 block">
                  Weekly required volume (kg/tons) *
                </Label>
                <Input
                  id="retailer-demand"
                  value={formData.monthlyDemand}
                  onChange={(event) => setFormData((prev) => ({ ...prev, monthlyDemand: event.target.value }))}
                  placeholder="e.g. 2 tons"
                />
              </div>
              <div>
                <Label htmlFor="retailer-storage" className="mb-2 block">
                  Delivery preference *
                </Label>
                <Select
                  value={formData.storageCapability}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, storageCapability: value }))}
                >
                  <SelectTrigger id="retailer-storage" className="w-full min-w-0">
                    <SelectValue placeholder="Select delivery preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Pickup", "Delivery"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="retailer-grade" className="mb-2 block">
                  Quality grade preference *
                </Label>
                <Select
                  value={formData.qualityGrade}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, qualityGrade: value }))}
                >
                  <SelectTrigger id="retailer-grade" className="w-full min-w-0">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="retailer-contract" className="mb-2 block">
                  Contract preference *
                </Label>
                <Select
                  value={formData.contractPreference}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, contractPreference: value }))}
                >
                  <SelectTrigger id="retailer-contract" className="w-full min-w-0">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Spot", "Contract"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formData.buyerType === "Offtaker" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="offtaker-company" className="mb-2 block">
                  Company name *
                </Label>
                <Input
                  id="offtaker-company"
                  value={formData.companyName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, companyName: event.target.value }))}
                  placeholder="Company name"
                />
              </div>
              <div>
                <Label htmlFor="offtaker-contract" className="mb-2 block">
                  Contract required *
                </Label>
                <Select
                  value={formData.contractRequired}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, contractRequired: value }))}
                >
                  <SelectTrigger id="offtaker-contract" className="w-full min-w-0">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Yes", "No"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="offtaker-grade" className="mb-2 block">
                  Quality standards (Grade A required?) *
                </Label>
                <Select
                  value={formData.qualityGrade}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, qualityGrade: value }))}
                >
                  <SelectTrigger id="offtaker-grade" className="w-full min-w-0">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Yes", "No"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="offtaker-volume" className="mb-2 block">
                  Weekly required volume (tons) *
                </Label>
                <Input
                  id="offtaker-volume"
                  value={formData.weeklyVolume}
                  onChange={(event) => setFormData((prev) => ({ ...prev, weeklyVolume: event.target.value }))}
                  placeholder="e.g. 10 tons"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="offtaker-schedule" className="mb-2 block">
                  Delivery schedule days *
                </Label>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
                    const id = `delivery-${day}`;
                    return (
                      <label key={day} htmlFor={id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          id={id}
                          checked={formData.deliveryDays.includes(day)}
                          onCheckedChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              deliveryDays: prev.deliveryDays.includes(day)
                                ? prev.deliveryDays.filter((d) => d !== day)
                                : [...prev.deliveryDays, day],
                            }))
                          }
                        />
                        {day}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="offtaker-packaging" className="mb-2 block">
                  Packaging requirement *
                </Label>
                <Select
                  value={formData.packagingRequirement}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, packagingRequirement: value }))}
                >
                  <SelectTrigger id="offtaker-packaging" className="w-full min-w-0">
                    <SelectValue placeholder="Select packaging" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Crates", "Sacks", "Net"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="offtaker-terms" className="mb-2 block">
                  Payment terms *
                </Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentTerms: value }))}
                >
                  <SelectTrigger id="offtaker-terms" className="w-full min-w-0">
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    {["On delivery", "7 days", "14 days"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate("/registration")}>Back</Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Saving..." : "Save buyer profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
