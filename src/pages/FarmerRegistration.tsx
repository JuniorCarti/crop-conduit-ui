import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  MapPin,
  User,
  Phone,
  Calendar,
  Package,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCard } from "@/components/shared/AlertCard";
import { toast } from "sonner";
import { getCounties, getConstituencies, getWards } from "@/utils/kenyaAdminData";
import { useAuth } from "@/contexts/AuthContext";
import { uploadToR2 } from "@/services/marketplaceService";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

const farmingTypes = ["Crop", "Livestock", "Mixed"];

const commonCrops = [
  "Maize", "Wheat", "Sorghum", "Beans", "Tomatoes", "Potatoes", "Onions",
  "Cabbages", "Carrots", "Green Beans", "Peas", "Rice", "Millet", "Groundnuts"
];

const commonLivestock = [
  "Cattle", "Goats", "Sheep", "Chicken", "Pigs", "Rabbits", "Ducks", "Turkeys"
];

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export default function FarmerRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const initialData = location.state?.farmerData;
  const isEditing = Boolean(currentUser && initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName ?? "",
    county: initialData?.county ?? "",
    constituency: initialData?.constituency ?? "",
    ward: initialData?.ward ?? "",
    village: initialData?.village ?? "",
    farmSize: initialData?.farmSize ?? (initialData?.farmSizeAcres ? String(initialData.farmSizeAcres) : ""),
    farmingType:
      initialData?.farmingType ??
      (initialData?.typeOfFarming
        ? `${initialData.typeOfFarming.charAt(0).toUpperCase()}${initialData.typeOfFarming.slice(1)}`
        : ""),
    crops: initialData?.crops ?? [],
    livestock: initialData?.livestock ?? [],
    experience:
      initialData?.experience ??
      (initialData?.farmExperienceYears ? String(initialData.farmExperienceYears) : ""),
    tools: initialData?.tools ?? initialData?.toolsOrEquipment ?? "",
    challenges: initialData?.challenges ?? initialData?.primaryChallenges ?? "",
    monthlyProduction: initialData?.monthlyProduction ?? initialData?.estimatedMonthlyProduction ?? "",
    phone: initialData?.phone ?? "",
    farmPhoto: null as File | null,
    farmPhotoUrl: initialData?.farmPhotoUrl ?? null,
  });

  const countyOptions = useMemo(() => getCounties(), []);
  const adminDataAvailable = countyOptions.length > 0;
  const constituencyOptions = useMemo(
    () => (formData.county ? getConstituencies(formData.county) : []),
    [formData.county]
  );
  const wardOptions = useMemo(
    () => (formData.county && formData.constituency ? getWards(formData.county, formData.constituency) : []),
    [formData.county, formData.constituency]
  );

  const totalSteps = 3;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCountyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      county: value,
      constituency: "",
      ward: "",
    }));
  };

  const handleConstituencyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      constituency: value,
      ward: "",
    }));
  };

  const handleMultiSelect = (field: "crops" | "livestock", value: string) => {
    setFormData(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const isTypeAllowed =
        ALLOWED_IMAGE_TYPES.has(file.type) || ALLOWED_IMAGE_EXTENSIONS.has(extension);

      if (!isTypeAllowed) {
        toast.error("Only JPG, JPEG, PNG, or WEBP images are allowed.");
        e.target.value = "";
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error("Farm photo must be 5MB or smaller.");
        e.target.value = "";
        return;
      }

      setFormData(prev => ({ ...prev, farmPhoto: file }));
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    if (!currentUser) {
      navigate("/signup", { state: { farmerData: formData } });
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    const DEBUG_SAVE = import.meta.env.DEV && import.meta.env.VITE_DEBUG_PROFILE === "true";
    const logDebug = (...args: any[]) => {
      if (DEBUG_SAVE) {
        console.log("[FarmerRegistration]", ...args);
      }
    };

    const docRef = doc(db, "farmers", currentUser.uid);
    const farmSizeValue = formData.farmSize ? parseFloat(formData.farmSize) : undefined;
    const experienceValue = formData.experience ? parseInt(formData.experience, 10) : undefined;
    const safeFarmSize = Number.isNaN(farmSizeValue) ? undefined : farmSizeValue;
    const safeExperience = Number.isNaN(experienceValue) ? undefined : experienceValue;
    let createdAt = Timestamp.now();
    let hasExistingProfile = false;

    try {
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        hasExistingProfile = true;
        createdAt = existing.data().createdAt ?? createdAt;
      }
    } catch (error) {
      if (DEBUG_SAVE) {
        console.error("[FarmerRegistration] Failed to read existing profile:", error);
      }
    }

    const basePayload = {
      uid: currentUser.uid,
      email: currentUser.email || undefined,
      fullName: formData.fullName,
      phone: formData.phone,
      county: formData.county,
      constituency: formData.constituency,
      ward: formData.ward,
      village: formData.village,
      farmSize: safeFarmSize,
      farmingType: formData.farmingType,
      crops: formData.crops || [],
      experienceYears: safeExperience,
      toolsOwned: formData.tools,
      challenges: formData.challenges,
      estimatedMonthlyProduction: formData.monthlyProduction,
      farmSizeAcres: safeFarmSize,
      typeOfFarming: (formData.farmingType || "Crop").toLowerCase() as
        | "crop"
        | "livestock"
        | "mixed",
      farmExperienceYears: safeExperience,
      toolsOrEquipment: formData.tools,
      primaryChallenges: formData.challenges,
    };

    const cleanBasePayload = Object.fromEntries(
      Object.entries(basePayload).filter(([, value]) => value !== undefined)
    );

    if (!hasExistingProfile) {
      try {
        const payload = {
          ...cleanBasePayload,
          createdAt,
          updatedAt: Timestamp.now(),
        };
        logDebug("Saving profile for uid:", currentUser.uid);
        await setDoc(docRef, payload, { merge: true });
      } catch (error: any) {
        if (DEBUG_SAVE) {
          console.error("[FarmerRegistration] Firestore save failed:", error);
        }
        const message = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to save profile: ${message}`);
        setIsSaving(false);
        return;
      }

      if (formData.farmPhoto) {
        const file = formData.farmPhoto;
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        const isTypeAllowed =
          ALLOWED_IMAGE_TYPES.has(file.type) || ALLOWED_IMAGE_EXTENSIONS.has(extension);

        if (!isTypeAllowed) {
          toast.error("Only JPG, JPEG, PNG, or WEBP images are allowed.");
        } else if (file.size > MAX_IMAGE_SIZE_BYTES) {
          toast.error("Farm photo must be 5MB or smaller.");
        } else {
          try {
            const [url] = await uploadToR2([file]);
            await setDoc(
              docRef,
              { farmPhotoUrl: url, updatedAt: Timestamp.now() },
              { merge: true }
            );
          } catch (error: any) {
            if (DEBUG_SAVE) {
              console.error("[FarmerRegistration] Farm photo upload failed:", error);
            }
            toast.warning("Profile saved, but photo upload failed.");
          }
        }
      }

      toast.success("Profile saved.");
      navigate("/access-summary");
      setIsSaving(false);
      return;
    }

    const submittedAt = Timestamp.now();
    try {
      await setDoc(
        docRef,
        {
          pending: {
            status: "pending",
            submittedAt,
            reviewEtaHours: 2,
          },
        },
        { merge: true }
      );
      await setDoc(
        doc(db, "farmers", currentUser.uid, "pendingUpdates", "latest"),
        {
          payload: cleanBasePayload,
          status: "pending",
          submittedAt,
          reviewEtaHours: 2,
        },
        { merge: true }
      );
    } catch (error: any) {
      if (DEBUG_SAVE) {
        console.error("[FarmerRegistration] Pending update save failed:", error);
      }
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to submit update: ${message}`);
      setIsSaving(false);
      return;
    }

    if (formData.farmPhoto) {
      const file = formData.farmPhoto;
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const isTypeAllowed =
        ALLOWED_IMAGE_TYPES.has(file.type) || ALLOWED_IMAGE_EXTENSIONS.has(extension);

      if (!isTypeAllowed) {
        toast.error("Only JPG, JPEG, PNG, or WEBP images are allowed.");
      } else if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error("Farm photo must be 5MB or smaller.");
      } else {
        try {
          const [url] = await uploadToR2([file]);
          await setDoc(
            doc(db, "farmers", currentUser.uid, "pendingUpdates", "latest"),
            { payload: { ...cleanBasePayload, farmPhotoUrl: url } },
            { merge: true }
          );
        } catch (error: any) {
          if (DEBUG_SAVE) {
            console.error("[FarmerRegistration] Farm photo upload failed:", error);
          }
          toast.warning("Profile saved, but photo upload failed.");
        }
      }
    }

    toast.success("Update submitted. It will be reviewed within 1-2 hours.");
    navigate("/profile");
    setIsSaving(false);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate(isEditing ? "/profile" : "/");
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.fullName && formData.county && formData.constituency && formData.ward && formData.village && formData.farmSize && formData.farmingType;
    }
    if (currentStep === 2) {
      return (formData.farmingType === "Crop" && formData.crops.length > 0) ||
             (formData.farmingType === "Livestock" && formData.livestock.length > 0) ||
             (formData.farmingType === "Mixed" && (formData.crops.length > 0 || formData.livestock.length > 0));
    }
    return formData.phone;
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="border-border/60 shadow-xl">
          <div className="flex flex-col max-h-[85vh]">
            <CardHeader className="border-b border-border/60">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">
                    {isEditing ? "Edit Farmer Profile" : "Farmer Registration"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Step {currentStep} of {totalSteps} · {currentStep === 1 ? "Identity" : currentStep === 2 ? "Farm details" : "Review & submit"}
                  </p>
                </div>
                <Button variant="outline" onClick={handleBack}>
                  {currentStep === 1 ? "Cancel" : "Back"}
                </Button>
              </div>
              <div className="pt-2 space-y-2">
                <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
                <div className="grid grid-cols-3 text-xs text-muted-foreground">
                  <span className={currentStep === 1 ? "text-foreground font-semibold" : ""}>1. Identity</span>
                  <span className={`text-center ${currentStep === 2 ? "text-foreground font-semibold" : ""}`}>2. Farm Details</span>
                  <span className={`text-right ${currentStep === 3 ? "text-foreground font-semibold" : ""}`}>3. Review & Submit</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto pb-24 pt-4" style={{ scrollPaddingBottom: "120px" }}>
              {!adminDataAvailable && (
                <AlertCard
                  type="warning"
                  title="Administrative dataset unavailable"
                  message="Administrative dataset unavailable - manual entry enabled."
                />
              )}

              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-up">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className="bg-background w-full min-w-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4" />
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+254 712 345 678"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="bg-background w-full min-w-0"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="county" className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4" />
                        County *
                      </Label>
                      {adminDataAvailable ? (
                        <Select value={formData.county} onValueChange={handleCountyChange}>
                          <SelectTrigger className="bg-background w-full min-w-0">
                            <SelectValue placeholder="Select county" />
                          </SelectTrigger>
                          <SelectContent>
                            {countyOptions.map((county) => (
                              <SelectItem key={county} value={county}>{county}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="county"
                          placeholder="Enter county"
                          value={formData.county}
                          onChange={(e) => handleInputChange("county", e.target.value)}
                          className="bg-background w-full min-w-0"
                        />
                      )}
                    </div>

                    <div>
                      <Label htmlFor="constituency" className="mb-2">Constituency *</Label>
                      {adminDataAvailable ? (
                        <Select
                          value={formData.constituency}
                          onValueChange={handleConstituencyChange}
                          disabled={!formData.county}
                        >
                          <SelectTrigger className="bg-background w-full min-w-0" disabled={!formData.county}>
                            <SelectValue placeholder="Select constituency" />
                          </SelectTrigger>
                          <SelectContent>
                            {constituencyOptions.map((constituency) => (
                              <SelectItem key={constituency} value={constituency}>{constituency}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="constituency"
                          placeholder="Enter constituency"
                          value={formData.constituency}
                          onChange={(e) => handleInputChange("constituency", e.target.value)}
                          className="bg-background w-full min-w-0"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="ward" className="mb-2">Ward *</Label>
                      {adminDataAvailable ? (
                        <Select
                          value={formData.ward}
                          onValueChange={(value) => handleInputChange("ward", value)}
                          disabled={!formData.constituency}
                        >
                          <SelectTrigger className="bg-background w-full min-w-0" disabled={!formData.constituency}>
                            <SelectValue placeholder="Select ward" />
                          </SelectTrigger>
                          <SelectContent>
                            {wardOptions.map((ward) => (
                              <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="ward"
                          placeholder="Enter ward"
                          value={formData.ward}
                          onChange={(e) => handleInputChange("ward", e.target.value)}
                          className="bg-background w-full min-w-0"
                        />
                      )}
                    </div>

                    <div>
                      <Label htmlFor="village" className="mb-2">Village *</Label>
                      <Input
                        id="village"
                        placeholder="Enter village"
                        value={formData.village}
                        onChange={(e) => handleInputChange("village", e.target.value)}
                        className="bg-background w-full min-w-0"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="farmSize" className="mb-2">Farm Size (acres) *</Label>
                      <Input
                        id="farmSize"
                        type="number"
                        placeholder="e.g., 5"
                        value={formData.farmSize}
                        onChange={(e) => handleInputChange("farmSize", e.target.value)}
                        className="bg-background w-full min-w-0"
                      />
                    </div>

                    <div>
                      <Label className="mb-3 block">Type of Farming *</Label>
                      <RadioGroup
                        value={formData.farmingType}
                        onValueChange={(value) => handleInputChange("farmingType", value)}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                      >
                        {farmingTypes.map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <RadioGroupItem value={type} id={type} />
                            <Label htmlFor={type} className="cursor-pointer">{type}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-up">
                  {(formData.farmingType === "Crop" || formData.farmingType === "Mixed") && (
                    <div>
                      <Label className="mb-3 block">Crops You Keep *</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {commonCrops.map(crop => (
                          <label
                            key={crop}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.crops.includes(crop)
                                ? "border-primary bg-primary/10"
                                : "border-border bg-background hover:border-primary/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.crops.includes(crop)}
                              onChange={() => handleMultiSelect("crops", crop)}
                              className="rounded border-input"
                            />
                            <span className="text-sm">{crop}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {(formData.farmingType === "Livestock" || formData.farmingType === "Mixed") && (
                    <div>
                      <Label className="mb-3 block">Livestock You Keep *</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {commonLivestock.map(animal => (
                          <label
                            key={animal}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.livestock.includes(animal)
                                ? "border-primary bg-primary/10"
                                : "border-border bg-background hover:border-primary/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.livestock.includes(animal)}
                              onChange={() => handleMultiSelect("livestock", animal)}
                              className="rounded border-input"
                            />
                            <span className="text-sm">{animal}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-up">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="experience" className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4" />
                        Farm Experience (years)
                      </Label>
                      <Input
                        id="experience"
                        type="number"
                        placeholder="e.g., 5"
                        value={formData.experience}
                        onChange={(e) => handleInputChange("experience", e.target.value)}
                        className="bg-background w-full min-w-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthlyProduction" className="mb-2">Estimated Monthly Production</Label>
                      <Input
                        id="monthlyProduction"
                        placeholder="e.g., 500kg maize, 200kg tomatoes"
                        value={formData.monthlyProduction}
                        onChange={(e) => handleInputChange("monthlyProduction", e.target.value)}
                        className="bg-background w-full min-w-0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tools" className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4" />
                      Tools or Equipment You Own
                    </Label>
                    <Textarea
                      id="tools"
                      placeholder="e.g., Tractor, Plow, Irrigation system..."
                      value={formData.tools}
                      onChange={(e) => handleInputChange("tools", e.target.value)}
                      className="bg-background min-h-[80px] w-full min-w-0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="challenges" className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      Primary Challenges You Face
                    </Label>
                    <Textarea
                      id="challenges"
                      placeholder="e.g., Water scarcity, Pest control, Market access..."
                      value={formData.challenges}
                      onChange={(e) => handleInputChange("challenges", e.target.value)}
                      className="bg-background min-h-[80px] w-full min-w-0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="farmPhoto" className="flex items-center gap-2 mb-2">
                      <Upload className="h-4 w-4" />
                      Upload Farm Photo (Optional)
                    </Label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <Input
                        id="farmPhoto"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="bg-background w-full min-w-0"
                      />
                      {formData.farmPhoto && (
                        <span className="text-sm text-muted-foreground">
                          {formData.farmPhoto.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <Card className="border-border/60">
                    <CardHeader>
                      <CardTitle className="text-base">Review</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Full name</p>
                        <p className="font-semibold">{formData.fullName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-semibold">{formData.phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-semibold">
                          {[formData.village, formData.ward, formData.constituency, formData.county].filter(Boolean).join(", ") || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Farm size</p>
                        <p className="font-semibold">{formData.farmSize || "—"} acres</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Farming type</p>
                        <p className="font-semibold">{formData.farmingType || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Crops/Livestock</p>
                        <p className="font-semibold">
                          {[...formData.crops, ...formData.livestock].join(", ") || "—"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>

            <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background/95 backdrop-blur px-6 py-4">
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2 w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {currentStep === 1 ? "Cancel" : "Back"}
                </Button>
                <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() || isSaving}
                    className="gap-2 w-full sm:w-auto"
                  >
                    {currentStep === totalSteps
                      ? currentUser
                        ? isEditing
                          ? isSaving
                            ? "Submitting..."
                            : "Submit for Review"
                          : isSaving
                            ? "Saving..."
                            : "Save Profile"
                        : "Continue to Signup"
                      : "Next"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
