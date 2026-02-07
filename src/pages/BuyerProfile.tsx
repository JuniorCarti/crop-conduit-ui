import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";

export default function BuyerProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      const buyerSnap = await getDoc(doc(db, "buyerProfiles", currentUser.uid));
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
      setProfile(buyerSnap.exists() ? buyerSnap.data() : null);
      setLoading(false);
    };
    load();
  }, [currentUser?.uid]);

  const handleSave = async () => {
    if (!currentUser?.uid) return;
    try {
      await setDoc(
        doc(db, "buyerProfiles", currentUser.uid),
        {
          ...profile,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("Buyer profile updated.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update buyer profile.");
    }
  };

  if (!currentUser && !loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-muted-foreground">Please sign in to view your profile.</p>
        <Button className="mt-4" onClick={() => navigate("/login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Buyer Profile</h1>
            <p className="text-sm text-muted-foreground">Manage buyer preferences and business details.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{userDoc?.buyerType || profile?.buyerType || "Buyer"}</Badge>
            <Badge variant="outline">Active</Badge>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              Save Changes
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Buyer name</Label>
              <Input
                value={profile?.fullName || userDoc?.displayName || ""}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={profile?.phone || userDoc?.phone || ""}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label>Buyer type</Label>
              <Input value={profile?.buyerType || userDoc?.buyerType || ""} disabled />
            </div>
            <div>
              <Label>Status</Label>
              <Input value="Active" disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location & Preferred Markets</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>County</Label>
              <Input value={profile?.county || userDoc?.county || ""} disabled />
            </div>
            <div>
              <Label>SubCounty</Label>
              <Input value={profile?.subCounty || ""} disabled />
            </div>
            <div>
              <Label>Ward</Label>
              <Input value={profile?.ward || ""} disabled />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={profile?.location || ""} disabled />
            </div>
            <div className="sm:col-span-2">
              <Label>Preferred markets</Label>
              <Input value={(profile?.markets || userDoc?.preferredMarkets || []).join(", ")} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interested Crops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(profile?.crops || userDoc?.interestedCrops || []).map((crop: string) => (
                <Badge key={crop} variant="secondary">
                  {crop}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Preferences</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Typical volume</Label>
              <Input value={profile?.buyerTypeDetails?.typicalVolume || ""} disabled />
            </div>
            <div>
              <Label>Payment terms</Label>
              <Input value={profile?.buyerTypeDetails?.paymentTerms || ""} disabled />
            </div>
            <div>
              <Label>Delivery schedule</Label>
              <Input value={(profile?.buyerTypeDetails?.deliveryDays || []).join(", ")} disabled />
            </div>
            <div>
              <Label>Contract preference</Label>
              <Input value={profile?.buyerTypeDetails?.contractPreference || ""} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marketplace Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">Get alerts for price changes.</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">ID verification uploads will be available soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
