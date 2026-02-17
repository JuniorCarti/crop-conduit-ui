import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, UserRoundPlus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  followUser,
  getCommunityMemberByUid,
  getFollowCounts,
  isFollowingUser,
  unfollowUser,
} from "@/services/communityMembersService";
import { startConversation } from "@/services/dmService";

export default function CommunityMemberProfile() {
  const { memberId } = useParams<{ memberId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["community", "memberProfile", currentUser?.uid, memberId],
    queryFn: async () => {
      if (!currentUser?.uid || !memberId) return null;
      return getCommunityMemberByUid(currentUser.uid, memberId);
    },
    enabled: Boolean(currentUser?.uid && memberId),
  });

  const followStateQuery = useQuery({
    queryKey: ["community", "followState", currentUser?.uid, memberId],
    queryFn: async () => {
      if (!currentUser?.uid || !memberId) return false;
      return isFollowingUser(currentUser.uid, memberId);
    },
    enabled: Boolean(currentUser?.uid && memberId && currentUser.uid !== memberId),
  });

  const followCountsQuery = useQuery({
    queryKey: ["community", "followCounts", memberId],
    queryFn: async () => getFollowCounts(memberId || ""),
    enabled: Boolean(memberId),
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.uid || !memberId || currentUser.uid === memberId) return;
      if (followStateQuery.data) {
        await unfollowUser(currentUser.uid, memberId);
      } else {
        await followUser(currentUser.uid, memberId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "followState", currentUser?.uid, memberId] });
      queryClient.invalidateQueries({ queryKey: ["community", "followCounts", memberId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to update follow state");
    },
  });

  const startChatMutation = useMutation({
    mutationFn: async () => {
      if (!memberId) throw new Error("Member not found");
      return startConversation(memberId);
    },
    onSuccess: (data) => {
      if (data?.conversationId) navigate(`/community/chat/${data.conversationId}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to open chat");
    },
  });

  const member = profileQuery.data;
  const cropList = useMemo(() => {
    if (!member) return [];
    return [...member.mainCrops, ...member.secondaryCrops].filter(Boolean);
  }, [member]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-6 space-y-5">
        <Button type="button" variant="ghost" onClick={() => navigate("/community")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Community
        </Button>

        {profileQuery.isLoading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : null}

        {!profileQuery.isLoading && !member ? (
          <Card className="border-border/60">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">Member not found.</CardContent>
          </Card>
        ) : null}

        {member ? (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-xl">{member.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{member.location}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {member.verified ? <Badge variant="verified">Verified</Badge> : <Badge variant="secondary">Unverified</Badge>}
                {cropList.length ? cropList.slice(0, 8).map((crop) => <Badge key={crop} variant="outline">{crop}</Badge>) : <Badge variant="outline">No crops listed</Badge>}
              </div>

              <div className="text-sm text-muted-foreground">
                {followCountsQuery.data?.followers ?? 0} followers • {followCountsQuery.data?.following ?? 0} following
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => startChatMutation.mutate()} className="bg-emerald-600 hover:bg-emerald-700" disabled={startChatMutation.isPending}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Chat
                </Button>
                {currentUser?.uid !== member.uid ? (
                  <Button variant="outline" onClick={() => followMutation.mutate()} disabled={followMutation.isPending}>
                    <UserRoundPlus className="mr-2 h-4 w-4" /> {followStateQuery.data ? "Unfollow" : "Follow"}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
