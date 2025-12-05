import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Upload, MapPin, User, Phone, Calendar, Package, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { AlertCard } from "@/components/shared/AlertCard";
import { uploadImage, STORAGE_CATEGORIES } from "@/services/storage";
import { toast } from "sonner";

const kenyanCounties = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", 
  "Kitale", "Garissa", "Kakamega", "Nyeri", "Meru", "Machakos", "Uasin Gishu"
];

const farmingTypes = ["Crop", "Livestock", "Mixed"];

const commonCrops = [
  "Maize", "Wheat", "Sorghum", "Beans", "Tomatoes", "Potatoes", "Onions",
  "Cabbages", "Carrots", "Green Beans", "Peas", "Rice", "Millet", "Groundnuts"
];

const commonLivestock = [
  "Cattle", "Goats", "Sheep", "Chicken", "Pigs", "Rabbits", "Ducks", "Turkeys"
];

export default function FarmerRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    county: "",
    constituency: "",
    ward: "",
    village: "",
    farmSize: "",
    farmingType: "",
    crops: [] as string[],
    livestock: [] as string[],
    experience: "",
    tools: "",
    challenges: "",
    monthlyProduction: "",
    phone: "",
    farmPhoto: null as File | null,
    farmPhotoUrl: "" as string, // Will store Supabase URL after upload
  });

  const totalSteps = 3;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      setFormData(prev => ({ ...prev, farmPhoto: e.target.files![0] }));
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Upload farm photo to Supabase if provided, then proceed to signup
      if (formData.farmPhoto) {
        setIsUploading(true);
        try {
          // Generate a temporary user ID for upload (will be replaced with actual user ID after signup)
          const tempUserId = `temp-${Date.now()}`;
          const photoUrl = await uploadImage(
            formData.farmPhoto,
            STORAGE_CATEGORIES.FARM_PHOTOS,
            tempUserId
          );
          
          // Store the Supabase URL in formData
          const updatedFormData = {
            ...formData,
            farmPhotoUrl: photoUrl,
          };
          
          navigate("/signup", { state: { farmerData: updatedFormData } });
        } catch (error: any) {
          console.error("Error uploading farm photo:", error);
          toast.error("Failed to upload farm photo. You can continue without it.");
          // Proceed to signup even if upload fails
          navigate("/signup", { state: { farmerData: formData } });
        } finally {
          setIsUploading(false);
        }
      } else {
        // No photo to upload, proceed directly
        navigate("/signup", { state: { farmerData: formData } });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate("/");
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Farmer Registration
          </h1>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps} • Tell us about your farm
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-up">
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
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="county" className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  County *
                </Label>
                <Select value={formData.county} onValueChange={(value) => handleInputChange("county", value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {kenyanCounties.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="constituency" className="mb-2">Constituency *</Label>
                <Input
                  id="constituency"
                  placeholder="Enter constituency"
                  value={formData.constituency}
                  onChange={(e) => handleInputChange("constituency", e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ward" className="mb-2">Ward *</Label>
                <Input
                  id="ward"
                  placeholder="Enter ward"
                  value={formData.ward}
                  onChange={(e) => handleInputChange("ward", e.target.value)}
                  className="bg-background"
                />
              </div>

              <div>
                <Label htmlFor="village" className="mb-2">Village *</Label>
                <Input
                  id="village"
                  placeholder="Enter village"
                  value={formData.village}
                  onChange={(e) => handleInputChange("village", e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="farmSize" className="mb-2">Farm Size (acres) *</Label>
                <Input
                  id="farmSize"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.farmSize}
                  onChange={(e) => handleInputChange("farmSize", e.target.value)}
                  className="bg-background"
                />
              </div>

              <div>
                <Label className="mb-3 block">Type of Farming *</Label>
                <RadioGroup
                  value={formData.farmingType}
                  onValueChange={(value) => handleInputChange("farmingType", value)}
                  className="flex gap-4"
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

        {/* Step 2: Crops/Livestock */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-up">
            {(formData.farmingType === "Crop" || formData.farmingType === "Mixed") && (
              <div>
                <Label className="mb-3 block">Crops You Keep *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

        {/* Step 3: Additional Details */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div className="grid grid-cols-2 gap-4">
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
                  className="bg-background"
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
                  className="bg-background"
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
                className="bg-background min-h-[80px]"
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
                className="bg-background min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="monthlyProduction" className="mb-2">Estimated Monthly Production</Label>
              <Input
                id="monthlyProduction"
                placeholder="e.g., 500kg maize, 200kg tomatoes"
                value={formData.monthlyProduction}
                onChange={(e) => handleInputChange("monthlyProduction", e.target.value)}
                className="bg-background"
              />
            </div>

            <div>
              <Label htmlFor="farmPhoto" className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4" />
                Upload Farm Photo (Optional)
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="farmPhoto"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-background"
                />
                {formData.farmPhoto && (
                  <span className="text-sm text-muted-foreground">
                    {formData.farmPhoto.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 1 ? "Cancel" : "Back"}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                {currentStep === totalSteps ? "Continue to Signup" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

