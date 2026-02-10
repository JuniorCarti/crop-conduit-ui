import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { applyJoinCode, getJoinCode, isJoinCodeValid, type JoinCodeType } from "@/services/joinCodeService";
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

  useEffect(() => {
    if (!code) {
      setStatus("invalid");
      return;
    }
    getJoinCode(code)
      .then((doc) => {
        if (!doc || !isJoinCodeValid(doc)) {
          setStatus("invalid");
          return;
        }
        setMemberType(doc.type);
        setOrgName(doc.orgName ?? "organization");
        setStatus("ready");
      })
      .catch(() => setStatus("invalid"));
  }, [code]);

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
                Join code is invalid or expired.
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
