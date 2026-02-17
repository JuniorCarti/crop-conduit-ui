import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  applyJoinCode,
  resolveJoinCode,
  validateJoinCode,
  type JoinCodeType,
  type JoinCodeValidationReason,
} from "@/services/joinCodeService";
import { getUserProfileDoc } from "@/services/userProfileService";

export default function JoinCode() {
  const { code: pathCode } = useParams();
  const [searchParams] = useSearchParams();
  const code = pathCode ?? searchParams.get("code") ?? "";
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "invalid" | "ready" | "joined">("loading");
  const [memberType, setMemberType] = useState<JoinCodeType>("farmer");
  const [orgName, setOrgName] = useState<string>("organization");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [invalidReason, setInvalidReason] = useState<JoinCodeValidationReason | "NOT_FOUND" | null>(null);

  useEffect(() => {
    if (!code) {
      setStatus("invalid");
      setInvalidReason("NOT_FOUND");
      return;
    }
    resolveJoinCode(code)
      .then((resolved) => {
        if (!resolved) {
          setStatus("invalid");
          setInvalidReason("NOT_FOUND");
          return;
        }
        const validation = validateJoinCode(resolved.data);
        if (!validation.ok) {
          setStatus("invalid");
          setInvalidReason(validation.reason ?? "NOT_FOUND");
          if (import.meta.env.DEV) {
            console.debug("[JoinCode] validation failed", {
              codeInput: code,
              resolvedPath: `orgs/${resolved.orgId}/joinCodes/${resolved.joinCodeId}`,
              rawExpiresAt: resolved.data.expiresAt ?? null,
              parsedExpiresAt: validation.expiresAtDate?.toISOString?.() ?? null,
              used: validation.used,
              max: Number.isFinite(validation.max) ? validation.max : "infinity",
              reason: validation.reason,
            });
          }
          return;
        }
        const doc = resolved.data;
        setMemberType(doc.type);
        setOrgName(doc.orgName ?? "organization");
        setInvalidReason(null);
        if (import.meta.env.DEV) {
          console.debug("[JoinCode] validation success", {
            codeInput: code,
            resolvedPath: `orgs/${resolved.orgId}/joinCodes/${resolved.joinCodeId}`,
            rawExpiresAt: doc.expiresAt ?? null,
            parsedExpiresAt: validation.expiresAtDate?.toISOString?.() ?? null,
            used: validation.used,
            max: Number.isFinite(validation.max) ? validation.max : "infinity",
          });
        }
        setStatus("ready");
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.debug("[JoinCode] resolver failed", {
            codeInput: code,
            message: error?.message,
          });
        }
        setStatus("invalid");
        setInvalidReason("NOT_FOUND");
      });
  }, [code]);

  const invalidMessage = (() => {
    if (invalidReason === "INACTIVE") return "Join code is disabled.";
    if (invalidReason === "EXPIRED") return "Join code has expired.";
    if (invalidReason === "MAXED_OUT") return "Join code has reached its usage limit.";
    return "Join code is invalid or expired.";
  })();

  const handleJoin = async () => {
    if (!code || !currentUser) return;
    if (memberType === "farmer" && !phone) {
      setJoinError("Phone number is required for farmer onboarding.");
      return;
    }
    setJoinError(null);
    try {
      await applyJoinCode(code, currentUser.uid, memberType, currentUser.displayName, currentUser.email, phone);
      setStatus("joined");
      const profile = await getUserProfileDoc(currentUser.uid);
      if (profile?.role === "buyer") {
        navigate("/marketplace");
      } else if (profile?.role === "org_admin" || profile?.role === "org_staff") {
        navigate("/org");
      } else if (profile?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/profile");
      }
    } catch (error: any) {
      setJoinError(error?.message || "Unable to join with this code.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Join organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "loading" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating join code...
              </div>
            )}
            {status === "invalid" && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {invalidMessage}
              </div>
            )}
            {status === "ready" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Join <span className="font-semibold">{orgName}</span> as{" "}
                  <span className="font-semibold">{memberType}</span>.
                </p>
                {!currentUser ? (
                  <Button
                    onClick={() => navigate(`/signup?joinCode=${code}&memberType=${memberType}`)}
                    className="w-full"
                  >
                    Continue to signup
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {memberType === "farmer" && (
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Phone number *</label>
                        <input
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          placeholder="e.g. 07xx xxx xxx"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                        />
                      </div>
                    )}
                    <Button onClick={handleJoin} className="w-full">
                      Join organization
                    </Button>
                  </div>
                )}
                {joinError && <p className="text-xs text-destructive">{joinError}</p>}
              </>
            )}
            {status === "joined" && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="h-4 w-4" />
                Joined successfully.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
