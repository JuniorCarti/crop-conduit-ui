import { Mic } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AshaVoiceAgent } from "@/components/voice/AshaVoiceAgent";
import { useTranslation } from "react-i18next";

export default function AshaVoice() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("asha.title")}
        subtitle={t("asha.subtitle")}
        icon={Mic}
      />
      <div className="p-4 md:p-6">
        <div className="mx-auto w-full max-w-2xl">
          <AshaVoiceAgent />
        </div>
      </div>
    </div>
  );
}
