import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Lock, Mail, Phone, ShieldCheck, Sprout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCard } from "@/components/shared/AlertCard";
import { useAuth } from "@/contexts/AuthContext";
import { clearAuthDebug, ensureAuthToken, waitForAuth } from "@/services/authService";
import { getUserProfileDoc, upsertUserProfileDoc } from "@/services/userProfileService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationResult } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { LandingShell } from "@/components/landing/LandingShell";
import { HeroPanel } from "@/components/landing/HeroPanel";
import { AuthCardShell } from "@/components/landing/AuthCardShell";
import { AgriSmartLogo } from "@/components/Brand/AgriSmartLogo";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signInWithGoogle, signInWithPhone, verifyPhoneOTP } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    otp: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | "google">("email");

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const fromLocation = (location.state as any)?.from;
  const fromPath = fromLocation?.pathname
    ? `${fromLocation.pathname}${fromLocation.search ?? ""}${fromLocation.hash ?? ""}`
    : "";
  const redirectParam = searchParams.get("redirect") ?? "";
  const defaultRedirect = "/";
  const authPaths = new Set(["/login", "/signup", "/reset-password"]);
  const allowedPrefixes = [
    "/market",
    "/crops",
    "/resources",
    "/irrigation",
    "/harvest",
    "/finance",
    "/marketplace",
    "/marketplace/listings",
    "/checkout",
    "/market-prices",
    "/community",
    "/community/inbox",
    "/community/chat",
    "/climate",
    "/asha",
    "/profile",
    "/upgrade",
    "/farmer-registration",
    "/registration",
    "/buyer-registration",
    "/org-registration",
    "/org",
    "/org/members",
    "/org/market-dashboard",
    "/org/training",
    "/org/contracts",
    "/org/traceability",
    "/org/credit",
    "/org/loans",
    "/org/risk-alerts",
    "/gov",
    "/gov/overview",
    "/gov/national-stats",
    "/gov/markets",
    "/gov/climate",
    "/gov/food-security",
    "/gov/cooperatives",
    "/gov/value-chains",
    "/gov/reports",
    "/gov/alerts",
    "/gov/settings",
    "/admin",
    "/superadmin",
    "/access-summary",
  ];

  const isSafeInternalPath = (path: string) => {
    if (!path || typeof path !== "string") return false;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return false;
    const pathname = path.split(/[?#]/)[0] ?? "";
    if (authPaths.has(pathname)) return false;
    if (pathname === "/") return true;
    return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  };

  const resolveRoleHome = async () => {
    const tokenInfo = await ensureAuthToken();
    const uid = tokenInfo?.uid;
    if (!uid) return defaultRedirect;
    const profile = await getUserProfileDoc(uid);
    const role = String(profile?.role ?? "");
    const hasOrg = Boolean(profile?.orgId);
    const orgType = String((profile as any)?.orgType ?? "");
    if (role === "buyer") return "/marketplace";
    if (role === "gov_admin" || role === "gov_analyst" || role === "gov_viewer") return "/gov/overview";
    if ((role === "org_admin" || role === "org_staff") && (orgType === "government_national" || orgType === "gov_national")) return "/gov/overview";
    if (role === "org_admin" || role === "org_staff") return "/org";
    if (role === "partner_admin" || role === "partner_analyst" || role === "partner_finance") return "/partner";
    if ((role === "admin" || role === "staff") && hasOrg) return "/org";
    if (role === "admin") return "/admin";
    if (role === "superadmin") return "/superadmin";
    return "/";
  };

  const getPostLoginPath = async () => {
    const candidate = fromPath || redirectParam;
    if (isSafeInternalPath(candidate) && candidate !== "/") return candidate;
    return resolveRoleHome();
  };

  const hydrateUserDirectory = async () => {
    const user = await waitForAuth();
    if (!user?.uid) return;
    await upsertUserProfileDoc(user.uid, {
      displayName: user.displayName || undefined,
      email: user.email || undefined,
      phone: user.phoneNumber || undefined,
    });
  };


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError(t("login.errors.required"));
      return;
    }

    setIsSubmitting(true);
    try {
      clearAuthDebug();
      await login(formData.email, formData.password);
      await hydrateUserDirectory();
      const destination = await getPostLoginPath();
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || t("login.errors.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      clearAuthDebug();
      await signInWithGoogle();
      await hydrateUserDirectory();
      const destination = await getPostLoginPath();
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || t("login.errors.googleFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phoneConfirmation) {
      if (!formData.phone) {
        setError(t("login.errors.phoneRequired"));
        return;
      }

      setIsSubmitting(true);
      try {
        const confirmation = await signInWithPhone(formData.phone);
        setPhoneConfirmation(confirmation);
      } catch (err: any) {
        setError(err.message || t("login.errors.codeFailed"));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!formData.otp) {
        setError(t("login.errors.otpRequired"));
        return;
      }

      setIsSubmitting(true);
      try {
        await verifyPhoneOTP(phoneConfirmation, formData.otp);
        await hydrateUserDirectory();
        const destination = await getPostLoginPath();
        navigate(destination, { replace: true });
      } catch (err: any) {
        setError(err.message || t("login.errors.otpInvalid"));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <LandingShell
      hero={
        <HeroPanel>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl whitespace-normal break-words">
              The premium command center for modern farms.
            </h1>
            <p className="max-w-xl text-base text-foreground/70 sm:text-lg whitespace-normal break-words leading-relaxed">
              Monitor climate, plan harvests, and trade confidently with real-time market
              intelligence - all in one elegant workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="gap-2" onClick={() => navigate("/registration")}>
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Explore Features</a>
            </Button>
          </div>

          <div id="features" className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Climate & crop insights",
                description: "Stay ahead of weather shifts with AI-driven alerts and forecasts.",
                icon: Sprout,
              },
              {
                title: "Secure market operations",
                description: "Track pricing, logistics, and sales with protected workflows.",
                icon: ShieldCheck,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground whitespace-normal break-words">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground whitespace-normal break-words leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </HeroPanel>
      }
      card={
        <AuthCardShell id="login" className="pt-8 md:pt-10">
              <div className="flex justify-end mb-4">
                <LanguageSwitcher />
              </div>
              <div className="mb-6 text-center">
                <div className="mb-5 flex justify-center">
                  <AgriSmartLogo
                    variant="inline"
                    size="md"
                    showTagline
                    className="items-center [&>div:first-child]:scale-110"
                  />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 whitespace-normal break-words leading-snug">
                  {t("login.title")}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground whitespace-normal break-words leading-relaxed">{t("login.subtitle")}</p>
              </div>

              {error && (
                <AlertCard
                  type="danger"
                  title={t("login.errorTitle")}
                  message={error}
                  className="mb-4"
                  onDismiss={() => setError("")}
                />
              )}

              <div id="recaptcha-container"></div>

              <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "email" | "phone" | "google")} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="email">{t("login.tabs.email")}</TabsTrigger>
                  <TabsTrigger value="phone">{t("login.tabs.phone")}</TabsTrigger>
                  <TabsTrigger value="google">{t("login.tabs.google")}</TabsTrigger>
                </TabsList>

                <TabsContent value="email">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2 mb-2 whitespace-normal break-words text-sm sm:text-base">
                        <Mail className="h-4 w-4" />
                        {t("login.emailLabel")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("login.emailPlaceholder")}
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="bg-background/80 w-full min-w-0"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="password" className="flex items-center gap-2 mb-2 whitespace-normal break-words text-sm sm:text-base">
                        <Lock className="h-4 w-4" />
                        {t("login.passwordLabel")}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={t("login.passwordPlaceholder")}
                        value={formData.password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                        className="bg-background/80 w-full min-w-0"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded border-input" />
                        <span className="text-muted-foreground">{t("login.rememberMe")}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => navigate("/reset-password")}
                        className="text-sm text-primary hover:underline"
                      >
                        {t("login.forgotPassword")}
                      </button>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full gap-2 mt-6">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("login.signingIn")}
                        </>
                      ) : (
                        <>
                          {t("login.signIn")}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="phone">
                  <form onSubmit={handlePhoneLogin} className="space-y-4">
                    {!phoneConfirmation ? (
                      <>
                        <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 mb-2 whitespace-normal break-words text-sm sm:text-base">
                        <Phone className="h-4 w-4" />
                        {t("login.phoneLabel")}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t("login.phonePlaceholder")}
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="bg-background/80 w-full min-w-0"
                        required
                      />
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 whitespace-normal break-words">{t("login.phoneHint")}</p>
                    </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t("login.sendingCode")}
                            </>
                          ) : (
                            <>
                              {t("login.sendCode")}
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div>
                      <Label htmlFor="otp" className="flex items-center gap-2 mb-2 whitespace-normal break-words text-sm sm:text-base">
                        <Lock className="h-4 w-4" />
                        {t("login.otpLabel")}
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder={t("login.otpPlaceholder")}
                        value={formData.otp}
                        onChange={(e) => setFormData((prev) => ({ ...prev, otp: e.target.value }))}
                        className="bg-background/80 w-full min-w-0"
                        maxLength={6}
                        required
                      />
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 whitespace-normal break-words">
                        {t("login.otpHint", { phone: formData.phone })}
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
                            {t("login.changeNumber")}
                          </Button>
                          <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("login.verifying")}
                              </>
                            ) : (
                              <>
                                {t("login.verify")}
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
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("login.signingIn")}
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
                          {t("login.googleSignIn")}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">{t("login.googleHint")}</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <p className="text-sm sm:text-base text-muted-foreground whitespace-normal break-words">
                  {t("login.noAccount")}{" "}
                  <button
                    onClick={() => navigate("/registration")}
                    className="text-primary hover:underline font-medium"
                  >
                    {t("login.createAccount")}
                  </button>
                </p>
              </div>
        </AuthCardShell>
      }
    />
  );
}
