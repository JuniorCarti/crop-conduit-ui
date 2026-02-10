import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Phone, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCard } from "@/components/shared/AlertCard";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationResult } from "firebase/auth";
import { saveFarmerProfile } from "@/services/firestore-farmer";
import { uploadToR2 } from "@/services/marketplaceService";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ensureAuthToken } from "@/services/authService";
import { upsertUserProfileDoc, type UserRole } from "@/services/userProfileService";
import { applyJoinCode } from "@/services/joinCodeService";
import { AgriSmartLogo } from "@/components/Brand/AgriSmartLogo";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const farmerData = location.state?.farmerData;
  const searchParams = new URLSearchParams(location.search);
  const joinCode = (location.state?.joinCode as string | undefined) || searchParams.get("joinCode") || undefined;
  const joinMemberType =
    (location.state?.memberType as "farmer" | "staff" | "buyer" | undefined) ||
    (searchParams.get("memberType") as "farmer" | "staff" | "buyer" | null) ||
    undefined;
  const { signup, signInWithGoogle, signInWithPhone, verifyPhoneOTP } = useAuth();
  const { t } = useTranslation();

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
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email && !formData.phone) {
      newErrors.email = t("signup.errors.emailOrPhone");
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("signup.errors.invalidEmail");
    }

    if (formData.phone && !/^\+254\s?\d{9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = t("signup.errors.invalidPhone");
    }

    if (!formData.password) {
      newErrors.password = t("signup.errors.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = t("signup.errors.passwordLength");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("signup.errors.passwordMatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createAccountProfile = async (uid: string, email?: string | null) => {
    if (joinCode && joinMemberType) {
      const joinRole: UserRole =
        joinMemberType === "staff" ? "org_staff" : joinMemberType === "buyer" ? "buyer" : "farmer";
      const resolvedEmail = (email ?? formData.email) || undefined;
      await upsertUserProfileDoc(uid, {
        role: joinRole,
        displayName: formData.displayName || undefined,
        email: resolvedEmail,
        phone: formData.phone || farmerData?.phone || undefined,
      });
      await applyJoinCode(joinCode, uid, joinMemberType, formData.displayName, resolvedEmail);
      toast.success(`Role set: ${joinRole.replace("_", " ")}`);
      return;
    }

    if (farmerData) {
      await upsertUserProfileDoc(uid, {
        role: "farmer",
        orgId: null,
        orgRole: null,
        displayName: formData.displayName || undefined,
        email: email || formData.email || undefined,
        premium: false,
      });
      toast.success("Role set: farmer");
      return;
    }

    await upsertUserProfileDoc(uid, {
      displayName: formData.displayName || undefined,
      email: email || formData.email || undefined,
    });

  };

  const saveProfile = async (userId: string, emailOverride?: string | null) => {
    if (!farmerData) return;
    const DEBUG_SAVE = import.meta.env.DEV && import.meta.env.VITE_DEBUG_PROFILE === "true";

    await saveFarmerProfile({
      uid: userId,
      email: emailOverride || formData.email || undefined,
      fullName: farmerData.fullName,
      phone: farmerData.phone,
      county: farmerData.county,
      constituency: farmerData.constituency,
      ward: farmerData.ward,
      village: farmerData.village,
      farmSizeAcres: farmerData.farmSize,
      farmSize:
        farmerData.farmSize && !Number.isNaN(parseFloat(farmerData.farmSize))
          ? parseFloat(farmerData.farmSize)
          : undefined,
      typeOfFarming: (farmerData.farmingType || "Crop").toLowerCase() as
        | "crop"
        | "livestock"
        | "mixed",
      farmingType: farmerData.farmingType,
      crops: farmerData.crops || [],
      farmExperienceYears: farmerData.experience,
      experienceYears:
        farmerData.experience && !Number.isNaN(parseInt(farmerData.experience, 10))
          ? parseInt(farmerData.experience, 10)
          : undefined,
      toolsOrEquipment: farmerData.tools,
      toolsOwned: farmerData.tools,
      primaryChallenges: farmerData.challenges,
      challenges: farmerData.challenges,
      estimatedMonthlyProduction: farmerData.monthlyProduction,
      farmPhotoUrl: null,
    });

    if (farmerData.farmPhoto) {
      const file: File = farmerData.farmPhoto as File;
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
      const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
      const maxSizeBytes = 5 * 1024 * 1024;

      if (!allowedTypes.has(file.type) && !allowedExtensions.has(extension)) {
        toast.error("Only JPG, JPEG, PNG, or WEBP images are allowed.");
      } else if (file.size > maxSizeBytes) {
        toast.error("Farm photo must be 5MB or smaller.");
      } else {
        try {
          const [url] = await uploadToR2([file]);
          await setDoc(
            doc(db, "farmers", userId),
            { farmPhotoUrl: url, updatedAt: Timestamp.now() },
            { merge: true }
          );
        } catch (error: any) {
          if (DEBUG_SAVE) {
            console.error("Farm photo upload failed:", error);
          }
          toast.warning("Profile saved, photo upload failed.");
        }
      }
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const userCredential = await signup(formData.email, formData.password, formData.displayName);
      await ensureAuthToken();
      await createAccountProfile(userCredential.user.uid, userCredential.user.email);
      if (farmerData && userCredential?.user?.uid) {
        try {
          await saveProfile(userCredential.user.uid, userCredential.user.email);
          toast.success(t("signup.profileSaved"));
        } catch (profileError: any) {
          console.error("Error saving farmer profile:", profileError);
          toast.error(t("signup.profileSaveError"));
        }
      }
      if (farmerData) {
        navigate("/profile");
      } else if (joinMemberType === "buyer") {
        navigate("/marketplace");
      } else if (joinMemberType === "staff") {
        navigate("/org");
      } else if (joinMemberType === "farmer") {
        navigate("/registration");
      } else {
        navigate("/registration");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithGoogle();
      await ensureAuthToken();
      if (userCredential?.user?.uid) {
        await createAccountProfile(userCredential.user.uid, userCredential.user.email);
      }
      if (farmerData && userCredential?.user?.uid) {
        try {
          await saveProfile(userCredential.user.uid, userCredential.user.email);
          toast.success(t("signup.profileSaved"));
        } catch (profileError: any) {
          console.error("Error saving farmer profile:", profileError);
          toast.error(t("signup.profileSaveError"));
        }
      }
      if (farmerData) {
        navigate("/profile");
      } else if (joinMemberType === "buyer") {
        navigate("/marketplace");
      } else if (joinMemberType === "staff") {
        navigate("/org");
      } else if (joinMemberType === "farmer") {
        navigate("/registration");
      } else {
        navigate("/registration");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneConfirmation) {
      if (!formData.phone) {
        setErrors({ phone: t("signup.errors.phoneRequired") });
        return;
      }

      setIsSubmitting(true);
      try {
        const confirmation = await signInWithPhone(formData.phone);
        setPhoneConfirmation(confirmation);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!formData.otp) {
        setErrors({ otp: t("signup.errors.otpRequired") });
        return;
      }

      setIsSubmitting(true);
      try {
        const userCredential = await verifyPhoneOTP(phoneConfirmation, formData.otp);
        await ensureAuthToken();
        if (userCredential?.user?.uid) {
          await createAccountProfile(userCredential.user.uid, userCredential.user.email);
        }
        if (farmerData && userCredential?.user?.uid) {
          try {
            await saveProfile(userCredential.user.uid, userCredential.user.email);
            toast.success(t("signup.profileSaved"));
          } catch (profileError: any) {
            console.error("Error saving farmer profile:", profileError);
            toast.error(t("signup.profileSaveError"));
          }
        }
        if (farmerData) {
          navigate("/profile");
        } else if (joinMemberType === "buyer") {
          navigate("/marketplace");
        } else if (joinMemberType === "staff") {
          navigate("/org");
        } else if (joinMemberType === "farmer") {
          navigate("/registration");
        } else {
          navigate("/registration");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

 

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        {farmerData && (
          <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{t("signup.registrationComplete")}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t("signup.registrationWelcome", { name: farmerData.fullName })}
            </p>
          </div>
        )}

        <div className="text-center mb-6">
          <AgriSmartLogo variant="stacked" size="lg" showTagline className="mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t("signup.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("signup.subtitle")}
          </p>
        </div>


        <div id="recaptcha-container"></div>

        <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "email" | "phone" | "google")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="email">{t("signup.tabs.email")}</TabsTrigger>
            <TabsTrigger value="phone">{t("signup.tabs.phone")}</TabsTrigger>
            <TabsTrigger value="google">{t("signup.tabs.google")}</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  {t("signup.emailLabel")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("signup.emailPlaceholder")}
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
                  {t("signup.passwordLabel")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("signup.passwordPlaceholder")}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`bg-background ${errors.password ? "border-destructive" : ""}`}
                />
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t("signup.passwordHint")}
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4" />
                  {t("signup.confirmPasswordLabel")}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("signup.confirmPasswordPlaceholder")}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={`bg-background ${errors.confirmPassword ? "border-destructive" : ""}`}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full gap-2 mt-6">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("signup.creatingAccount")}
                  </>
                ) : (
                  <>
                    {t("signup.createAccount")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone">
            <form onSubmit={handlePhoneSignup} className="space-y-4">
              {!phoneConfirmation ? (
                <>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4" />
                      {t("signup.phoneLabel")}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t("signup.phonePlaceholder")}
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`bg-background ${errors.phone ? "border-destructive" : ""}`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive mt-1">{errors.phone}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("signup.phoneHint")}
                    </p>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("signup.sendingCode")}
                      </>
                    ) : (
                      <>
                        {t("signup.sendCode")}
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
                      {t("signup.otpLabel")}
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder={t("signup.otpPlaceholder")}
                      value={formData.otp}
                      onChange={(e) => handleInputChange("otp", e.target.value)}
                      className={`bg-background ${errors.otp ? "border-destructive" : ""}`}
                      maxLength={6}
                    />
                    {errors.otp && (
                      <p className="text-xs text-destructive mt-1">{errors.otp}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("signup.otpHint", { phone: formData.phone })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPhoneConfirmation(null);
                        setFormData((prev) => ({ ...prev, otp: "" }));
                      }}
                      className="flex-1"
                    >
                      {t("signup.changeNumber")}
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("signup.verifying")}
                        </>
                      ) : (
                        <>
                          {t("signup.verifyCreate")}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </TabsContent>

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
                    {t("signup.creatingAccount")}
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
                    {t("signup.googleSignup")}
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {t("signup.googleHint")}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("signup.haveAccount")}{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:underline font-medium"
            >
              {t("signup.signIn")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
