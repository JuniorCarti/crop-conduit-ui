import { Crown } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function Upgrade() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={t("upgrade.title")} subtitle={t("upgrade.subtitle")} icon={Crown} />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>{t("upgrade.cardTitle")}</CardTitle>
            <CardDescription>{t("upgrade.cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>{t("upgrade.cta")}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
