import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Phone, User, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCard } from "@/components/shared/AlertCard";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationResult } from "firebase/auth";
import { saveFarmerProfile } from "@/services/firestore-farmer";
import { toast } from "sonner";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const farmerData = location.state?.farmerData;
  const { signup, signInWithGoogle, signInWithPhone, verifyPhoneOTP } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    phone: farmerData?.phone || "",
    password: "",
    confirmPassword: "",
    displayName: farmerData?.fullName || "",
    otp: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | "google">("email");

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email && !formData.phone) {
      newErrors.email = "Email or phone number is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !/^\+254\s?\d{9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid Kenyan phone number (+254...)";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const userCredential = await signup(formData.email, formData.password, formData.displayName);
      
      // Save farmer profile to Firestore with Supabase Storage URL
      if (farmerData && userCredential?.user?.uid) {
        try {
          await saveFarmerProfile({
            userId: userCredential.user.uid,
            fullName: farmerData.fullName,
            county: farmerData.county,
            constituency: farmerData.constituency,
            ward: farmerData.ward,
            village: farmerData.village,
            farmSize: farmerData.farmSize,
            farmingType: farmerData.farmingType as "Crop" | "Livestock" | "Mixed",
            crops: farmerData.crops || [],
            livestock: farmerData.livestock || [],
            experience: farmerData.experience,
            tools: farmerData.tools,
            challenges: farmerData.challenges,
            monthlyProduction: farmerData.monthlyProduction,
            phone: farmerData.phone,
            farmPhotoUrl: farmerData.farmPhotoUrl || undefined, // Supabase Storage URL
          });
          toast.success("Farmer profile saved successfully");
        } catch (profileError: any) {
          console.error("Error saving farmer profile:", profileError);
          toast.error("Account created but failed to save profile. Please update it later.");
        }
      }
      
      navigate("/");
    } catch (err: any) {
      // Error is already handled in AuthContext with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithGoogle();
      
      // Save farmer profile to Firestore with Supabase Storage URL
      if (farmerData && userCredential?.user?.uid) {
        try {
          await saveFarmerProfile({
            userId: userCredential.user.uid,
            fullName: farmerData.fullName,
            county: farmerData.county,
            constituency: farmerData.constituency,
            ward: farmerData.ward,
            village: farmerData.village,
            farmSize: farmerData.farmSize,
            farmingType: farmerData.farmingType as "Crop" | "Livestock" | "Mixed",
            crops: farmerData.crops || [],
            livestock: farmerData.livestock || [],
            experience: farmerData.experience,
            tools: farmerData.tools,
            challenges: farmerData.challenges,
            monthlyProduction: farmerData.monthlyProduction,
            phone: farmerData.phone,
            farmPhotoUrl: farmerData.farmPhotoUrl || undefined, // Supabase Storage URL
          });
          toast.success("Farmer profile saved successfully");
        } catch (profileError: any) {
          console.error("Error saving farmer profile:", profileError);
          toast.error("Account created but failed to save profile. Please update it later.");
        }
      }
      
      navigate("/");
    } catch (err: any) {
      // Error is already handled in AuthContext with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneConfirmation) {
      // Send OTP
      if (!formData.phone) {
        setErrors({ phone: "Please enter your phone number" });
        return;
      }

      setIsSubmitting(true);
      try {
        const confirmation = await signInWithPhone(formData.phone);
        setPhoneConfirmation(confirmation);
      } catch (err: any) {
        // Error is already handled in AuthContext with toast
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Verify OTP
      if (!formData.otp) {
        setErrors({ otp: "Please enter the verification code" });
        return;
      }

      setIsSubmitting(true);
      try {
        const userCredential = await verifyPhoneOTP(phoneConfirmation, formData.otp);
        
        // Save farmer profile to Firestore with Supabase Storage URL
        if (farmerData && userCredential?.user?.uid) {
          try {
            await saveFarmerProfile({
              userId: userCredential.user.uid,
              fullName: farmerData.fullName,
              county: farmerData.county,
              constituency: farmerData.constituency,
              ward: farmerData.ward,
              village: farmerData.village,
              farmSize: farmerData.farmSize,
              farmingType: farmerData.farmingType as "Crop" | "Livestock" | "Mixed",
              crops: farmerData.crops || [],
              livestock: farmerData.livestock || [],
              experience: farmerData.experience,
              tools: farmerData.tools,
              challenges: farmerData.challenges,
              monthlyProduction: farmerData.monthlyProduction,
              phone: farmerData.phone,
              farmPhotoUrl: farmerData.farmPhotoUrl || undefined, // Supabase Storage URL
            });
            toast.success("Farmer profile saved successfully");
          } catch (profileError: any) {
            console.error("Error saving farmer profile:", profileError);
            toast.error("Account created but failed to save profile. Please update it later.");
          }
        }
        
        navigate("/");
      } catch (err: any) {
        // Error is already handled in AuthContext with toast
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // If no farmer data, redirect to farmer registration
  if (!farmerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
          <AlertCard
            type="warning"
            title="Registration Required"
            message="Please complete farmer registration first"
          />
          <Button
            onClick={() => navigate("/farmer-registration")}
            className="w-full mt-4"
          >
            Go to Registration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
        {/* Success Message */}
        <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Farmer Registration Complete!</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Welcome, {farmerData.fullName}! Now create your account to get started.
          </p>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Create Your Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up your login credentials
          </p>
        </div>

        {/* reCAPTCHA container for phone auth */}
        <div id="recaptcha-container"></div>

        {/* Auth Methods Tabs */}
        <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "email" | "phone" | "google")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
          </TabsList>

          {/* Email Signup */}
          <TabsContent value="email">
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`bg-background ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`bg-background ${errors.password ? "border-destructive" : ""}`}
                />
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={`bg-background ${errors.confirmPassword ? "border-destructive" : ""}`}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 mt-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Phone Signup */}
          <TabsContent value="phone">
            <form onSubmit={handlePhoneSignup} className="space-y-4">
              {!phoneConfirmation ? (
                <>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+254 712 345 678"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`bg-background ${errors.phone ? "border-destructive" : ""}`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive mt-1">{errors.phone}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your phone number with country code
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="otp" className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4" />
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={formData.otp}
                      onChange={(e) => handleInputChange("otp", e.target.value)}
                      className={`bg-background ${errors.otp ? "border-destructive" : ""}`}
                      maxLength={6}
                    />
                    {errors.otp && (
                      <p className="text-xs text-destructive mt-1">{errors.otp}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the code sent to {formData.phone}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPhoneConfirmation(null);
                        setFormData(prev => ({ ...prev, otp: "" }));
                      }}
                      className="flex-1"
                    >
                      Change Number
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify & Create Account
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </TabsContent>

          {/* Google Signup */}
          <TabsContent value="google">
            <div className="space-y-4">
              <Button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isSubmitting}
                className="w-full gap-2"
                variant="outline"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign up with Google
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Click to create an account with Google
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

