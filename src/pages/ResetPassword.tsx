import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCard } from "@/components/shared/AlertCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(t("resetPassword.errors.required"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("resetPassword.errors.invalidEmail"));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t("resetPassword.errors.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t("resetPassword.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("resetPassword.subtitle")}</p>
        </div>

        {success && (
          <AlertCard
            type="success"
            title={t("resetPassword.successTitle")}
            message={t("resetPassword.successMessage")}
            className="mb-4"
          />
        )}

        {error && (
          <AlertCard
            type="danger"
            title={t("resetPassword.errorTitle")}
            message={error}
            className="mb-4"
            onDismiss={() => setError("")}
          />
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                {t("resetPassword.emailLabel")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("resetPassword.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full gap-2 mt-6">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("resetPassword.sending")}
                </>
              ) : (
                <>
                  {t("resetPassword.sendLink")}
                  <Mail className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("resetPassword.sentTo", { email })}
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate("/login")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("resetPassword.backToLogin")}
          </Button>
        </div>
      </div>
    </div>
  );
}
