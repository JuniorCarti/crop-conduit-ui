import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  buyerName: string;
  companyName?: string;
  buyerType: "LOCAL" | "INTERNATIONAL";
  verificationStatus: "pending" | "verified" | "rejected" | "needs_more_info" | "unverified";
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  onBrowseMarketplace: () => void;
  onCreateBid: () => void;
  onMessageCoop: () => void;
  onViewOrders: () => void;
};

const verificationLabel = {
  pending: "Verification Pending — SuperAdmin review required",
  verified: "Verified Buyer",
  rejected: "Verification Rejected — Contact Support",
  needs_more_info: "Needs More Info",
  unverified: "Unverified",
} as const;

export function BuyerPageHeader({
  buyerName,
  companyName,
  buyerType,
  verificationStatus,
  verifiedAt,
  verifiedBy,
  onBrowseMarketplace,
  onCreateBid,
  onMessageCoop,
  onViewOrders,
}: Props) {
  const verifiedDate = verifiedAt ? new Date(verifiedAt).toLocaleDateString() : "date unavailable";
  const tooltipText =
    verificationStatus === "verified"
      ? `Verified by AgriSmart Compliance on ${verifiedDate}${verifiedBy ? ` by ${verifiedBy}` : ""}`
      : verificationStatus === "rejected"
        ? "Verification was rejected. Contact support to resubmit required details."
      : "Verification is still pending compliance review.";

  return (
    <header className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{companyName || buyerName}</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={verificationStatus === "verified" ? "verified" : "secondary"} className="cursor-default">
                  {verificationLabel[verificationStatus]}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{tooltipText}</TooltipContent>
            </Tooltip>
            {buyerType === "INTERNATIONAL" && verificationStatus === "verified" ? (
              <Badge variant="outline">International Verified</Badge>
            ) : null}
            <Badge variant="outline">{buyerType}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Monitor buyer activity, payments, contracts, and account status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onBrowseMarketplace}>Browse Marketplace</Button>
          <Button variant="outline" onClick={onCreateBid}>Create Bid / Listing</Button>
          <Button variant="outline" onClick={onMessageCoop}>Message Cooperative</Button>
          <Button variant="outline" onClick={onViewOrders}>View Orders</Button>
        </div>
      </div>
    </header>
  );
}
