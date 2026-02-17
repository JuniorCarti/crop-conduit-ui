import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MessageCircle, MapPin, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  filterMembersByRadius,
  followUser,
  getFollowCounts,
  isFollowingUser,
  listCommunityMembersForCurrentUser,
  type CommunityMemberSummary,
  unfollowUser,
} from "@/services/communityMembersService";
import { startConversation } from "@/services/dmService";
import { getUserVerificationMap, type UserVerificationProfile } from "@/services/userVerificationService";

interface CommunityMembersDiscoveryProps {
  uid: string;
}

const tabs = ["Explore", "Top", "Near You", "Newest", "Online Now"] as const;
type MembersTab = (typeof tabs)[number];

const radiusOptions = [10, 25, 50, 100];

function formatRelative(value: Date | null) {
  if (!value) return "--";
  const diffMs = Date.now() - value.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MemberPreviewCard({
  member,
  currentUid,
  onChat,
  verification,
}: {
  member: CommunityMemberSummary;
  currentUid: string;
  onChat: (uid: string) => Promise<void>;
  verification?: UserVerificationProfile;
}) {
  const queryClient = useQueryClient();
  const [openMobile, setOpenMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const followQuery = useQuery({
    queryKey: ["community", "followState", currentUid, member.uid],
    queryFn: () => isFollowingUser(currentUid, member.uid),
    enabled: Boolean(currentUid && member.uid && currentUid !== member.uid),
    staleTime: 1000 * 30,
  });

  const countsQuery = useQuery({
    queryKey: ["community", "followCounts", member.uid],
    queryFn: () => getFollowCounts(member.uid),
    enabled: Boolean(member.uid),
    staleTime: 1000 * 30,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (currentUid === member.uid) return;
      if (followQuery.data) {
        await unfollowUser(currentUid, member.uid);
      } else {
        await followUser(currentUid, member.uid);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "followState", currentUid, member.uid] });
      queryClient.invalidateQueries({ queryKey: ["community", "followCounts", member.uid] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to update follow state");
    },
  });

  const summary = (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold">
          {member.initials}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="font-medium truncate">{verification?.displayName || member.name}</p>
            {verification?.badgeType ? <VerifiedBadge type={verification.badgeType} compact /> : null}
          </div>
          <p className="text-xs text-muted-foreground">{member.location}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {member.mainCrops.slice(0, 2).map((crop) => (
          <Badge key={crop} variant="secondary" className="rounded-full">{crop}</Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {member.cooperativeName || "Cooperative unavailable"} • Active {formatRelative(member.lastActiveAt)}
      </p>
      <div className="text-xs text-muted-foreground">
        {countsQuery.data?.followers ?? 0} followers • {countsQuery.data?.following ?? 0} following
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onChat(member.uid)}>
          <MessageCircle className="mr-1 h-4 w-4" /> Chat
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/community/members/${member.uid}`)}>View Profile</Button>
        {currentUid !== member.uid ? (
          <Button size="sm" variant="ghost" onClick={() => followMutation.mutate()} disabled={followMutation.isPending}>
            {followQuery.data ? "Unfollow" : "Follow"}
          </Button>
        ) : null}
      </div>
    </div>
  );

  const avatar = (
    <button
      type="button"
      onClick={() => {
        if (isMobile) setOpenMobile(true);
      }}
      className="relative h-16 w-16 rounded-full bg-white shadow ring-2 ring-white flex items-center justify-center text-lg font-semibold text-emerald-700 hover:scale-[1.02] transition"
    >
      {member.initials}
      {member.verified ? <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-600 border-2 border-white" /> : null}
    </button>
  );

  return (
    <>
      {isMobile ? (
        avatar
      ) : (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>{avatar}</PopoverTrigger>
          <PopoverContent className="w-80">{summary}</PopoverContent>
        </Popover>
      )}
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="bottom" className="rounded-t-2xl"> 
          <SheetHeader>
            <SheetTitle>Member details</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{summary}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function CommunityMembersDiscovery({ uid }: CommunityMembersDiscoveryProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MembersTab>("Explore");
  const [radiusKm, setRadiusKm] = useState(25);

  const membersQuery = useQuery({
    queryKey: ["community", "members", uid],
    queryFn: () => listCommunityMembersForCurrentUser(uid),
    enabled: Boolean(uid),
    staleTime: 1000 * 60,
  });

  const me = useMemo(() => {
    const list = membersQuery.data || [];
    return list.find((row) => row.uid === uid) ?? null;
  }, [membersQuery.data, uid]);

  const scoped = useMemo(() => {
    const list = (membersQuery.data || []).filter((row) => row.uid !== uid);
    if (activeTab === "Top") {
      return [...list].sort((a, b) => b.score - a.score);
    }
    if (activeTab === "Newest") {
      return [...list].sort((a, b) => (b.joinedAt?.getTime() ?? 0) - (a.joinedAt?.getTime() ?? 0));
    }
    if (activeTab === "Online Now") {
      return list.filter((row) => {
        const ts = row.lastActiveAt?.getTime() ?? 0;
        return ts > 0 && Date.now() - ts < 1000 * 60 * 15;
      });
    }
    if (activeTab === "Near You") {
      return filterMembersByRadius({
        members: list,
        originLat: me?.lat ?? null,
        originLon: me?.lon ?? null,
        radiusKm,
      });
    }
    return list;
  }, [activeTab, membersQuery.data, me?.lat, me?.lon, radiusKm]);

  const verificationQuery = useQuery({
    queryKey: ["community", "member-verification", [...scoped.map((member) => member.uid)].sort().join("|")],
    queryFn: () => getUserVerificationMap(scoped.map((member) => member.uid)),
    enabled: scoped.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const handleChat = async (otherUid: string) => {
    try {
      const convo = await startConversation(otherUid);
      if (convo?.conversationId) {
        navigate(`/community/chat/${convo.conversationId}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Unable to open chat");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab}
            type="button"
            size="sm"
            variant={activeTab === tab ? "default" : "outline"}
            className={activeTab === tab ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
        {activeTab === "Near You" ? (
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {radiusOptions.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={radiusKm === value ? "default" : "outline"}
                className={radiusKm === value ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => setRadiusKm(value)}
              >
                {value}km
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {membersQuery.isLoading ? (
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-9">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-16 rounded-full" />
          ))}
        </div>
      ) : null}

      {!membersQuery.isLoading && scoped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-8 text-center">
          <UserRoundCheck className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-2 text-sm text-muted-foreground">No members found.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {scoped.map((member) => (
          <MemberPreviewCard
            key={member.uid}
            member={member}
            currentUid={uid}
            onChat={handleChat}
            verification={verificationQuery.data?.[member.uid]}
          />
        ))}
      </div>
    </div>
  );
}
