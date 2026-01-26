import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PREMIUM_PREVIEW_ENABLED } from "@/config/featureAccess";
import { usePremiumModalStore } from "@/store/premiumStore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type PremiumModalProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOpen, pendingRoute, pendingFeatureId, allowFeature, setOpen } =
    usePremiumModalStore();
  const resolvedOpen = open ?? isOpen;
  const handleOpenChange = onOpenChange ?? setOpen;

  const handleContinue = () => {
    if (pendingFeatureId && PREMIUM_PREVIEW_ENABLED) {
      allowFeature(pendingFeatureId);
    }
    handleOpenChange(false);
    if (pendingRoute && PREMIUM_PREVIEW_ENABLED) {
      navigate(pendingRoute);
    }
  };

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("premium.modal.title")}</DialogTitle>
          <DialogDescription>{t("premium.modal.body")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("premium.modal.close")}
          </Button>
          <Button type="button" onClick={handleContinue}>
            {t("premium.modal.continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
