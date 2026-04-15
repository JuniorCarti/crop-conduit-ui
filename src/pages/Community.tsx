import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bookmark, Leaf, Users, Activity, CalendarDays, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { CommunityFilters } from "@/components/community/CommunityFilters";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostDialog } from "@/components/community/CreatePostDialog";
import { CommentsDrawer } from "@/components/community/CommentsDrawer";
import { CommunityMembersDiscovery } from "@/components/community/CommunityMembersDiscovery";
import { CommunityEventsSection } from "@/components/community/CommunityEventsSection";
import { listPosts, reactToPost } from "@/services/communityService";
import { startConversation } from "@/services/dmService";
import type { CommunityPost } from "@/types/community";
import { cn } from "@/lib/utils";

const TOPIC_OPTIONS = ["Market", "Weather", "Pests", "Inputs", "Irrigation", "Harvest", "Livestock"];
const CROP_OPTIONS = ["Maize", "Tomatoes", "Potatoes", "Beans", "Millet", "Dairy", "Poultry"];
const BOOKMARK_STORAGE_KEY = "community.bookmarks";
const LIKE_STORAGE_KEY = "community.likes";
const COMMUNITY_FARMD_ENABLED = (import.meta.env.VITE_ENABLE_COMMUNITY_FARMD ?? "true") === "true";

const STATUS_STYLES: Record<string, string> = {
  good: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  neutral: "bg-secondary/70 text-muted-foreground border-border",
};

type CommunityFeedPage = {
  items: CommunityPost[];
  nextCursor?: string | null;
};

type CommunityFeedCache = {
  pages: CommunityFeedPage[];
  pageParams: unknown[];
};

function loadStoredIds(key: string) {
  if (typeof window === "undefined") return [] as string[];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export default function Community() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [tab, setTab] = useState("feed");
  const [communityView, setCommunityView] = useState<"feed" | "members" | "events">("feed");
  const [bookmarks, setBookmarks] = useState<string[]>(() => loadStoredIds(BOOKMARK_STORAGE_KEY));
  const [likedPostIds, setLikedPostIds] = useState<string[]>(() => loadStoredIds(LIKE_STORAGE_KEY));

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
    }
  }, [bookmarks]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(likedPostIds));
    }
  }, [likedPostIds]);

  const feedQuery = useInfiniteQuery({
    queryKey: ["community", "feed"],
    queryFn: ({ pageParam }) => listPosts({ cursor: pageParam as string | undefined }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: Boolean(currentUser),
  });

  useEffect(() => {
    if (feedQuery.error) {
      toast.error("Unable to load community feed");
    }
  }, [feedQuery.error]);

  const reactMutation = useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: "like" | "helpful" | "insight" }) =>
      reactToPost(postId, reaction),
    onError: () => {
      toast.error("Failed to react to post");
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: (otherUid: string) => startConversation(otherUid),
    onError: (error: unknown) => {
      const message = String((error as { message?: string })?.message || "").toLowerCase();
      if (message.includes("blocked")) {
        toast.error("You cannot message this farmer.");
        return;
      }
      toast.error((error as { message?: string })?.message || "Unable to start conversation");
    },
  });

  const allPosts = useMemo(() => {
    const posts = feedQuery.data?.pages.flatMap((page) => page.items) || [];
    return posts.map((post) => ({
      ...post,
      likedByMe: likedPostIds.includes(post.id) || post.likedByMe,
      bookmarkedByMe: bookmarks.includes(post.id),
    }));
  }, [feedQuery.data, likedPostIds, bookmarks]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allPosts.filter((post) => {
      const text = `${post.text} ${post.authorName || ""} ${(post.tags || []).join(" ")} ${post.crop || ""}`.toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesTopic =
        selectedTopics.length === 0 ||
        selectedTopics.some((topic) => text.includes(topic.toLowerCase()));
      const matchesCrop =
        selectedCrops.length === 0 ||
        selectedCrops.some((crop) => (post.crop || "").toLowerCase() === crop.toLowerCase());
      return matchesQuery && matchesTopic && matchesCrop;
    });
  }, [allPosts, searchQuery, selectedTopics, selectedCrops]);

  const postsByTab = useMemo(() => {
    return {
      feed: filteredPosts,
      my: filteredPosts.filter((post) => post.userId === currentUser?.uid),
      bookmarks: filteredPosts.filter((post) => post.bookmarkedByMe),
    };
  }, [filteredPosts, currentUser?.uid]);

  const currentTabPosts = postsByTab[tab as keyof typeof postsByTab];
  const activeFilterCount = selectedTopics.length + selectedCrops.length + (searchQuery.trim() ? 1 : 0);
  const feedStateTone = feedQuery.isLoading ? "warning" : feedQuery.error ? "critical" : "good";
  const feedStateLabel = feedQuery.isLoading
    ? "Loading feed"
    : feedQuery.error
    ? "Feed issue"
    : "Feed healthy";
  const communityMetrics = [
    {
      title: "Posts Visible",
      value: currentTabPosts.length.toString(),
      note: `Viewing ${tab === "my" ? "my posts" : tab === "bookmarks" ? "bookmarks" : "feed"}.`,
      icon: Activity,
      tone: currentTabPosts.length > 0 ? "good" : "warning",
    },
    {
      title: "Bookmarks",
      value: postsByTab.bookmarks.length.toString(),
      note: "Saved posts ready for quick access.",
      icon: Bookmark,
      tone: postsByTab.bookmarks.length > 0 ? "good" : "neutral",
    },
    {
      title: "Active Filters",
      value: activeFilterCount.toString(),
      note: activeFilterCount > 0 ? "Filters are refining this stream." : "No filters applied.",
      icon: Filter,
      tone: activeFilterCount > 0 ? "warning" : "neutral",
    },
    {
      title: "Community Mode",
      value: communityView === "feed" ? "Feed" : communityView === "members" ? "Members" : "Events",
      note: "Switch between conversations, people, and activities.",
      icon: communityView === "events" ? CalendarDays : Users,
      tone: "good",
    },
  ] as const;

  const updatePostInCache = (postId: string, updater: (post: CommunityPost) => CommunityPost) => {
    queryClient.setQueryData<CommunityFeedCache>(["community", "feed"], (old) => {
      if (!old?.pages?.length) return old;
      const pages = old.pages.map((page) => ({
        ...page,
        items: page.items.map((item: CommunityPost) => (item.id === postId ? updater(item) : item)),
      }));
      return { ...old, pages };
    });
  };

  const handleToggleLike = (post: CommunityPost) => {
    const wasLiked = likedPostIds.includes(post.id);
    setLikedPostIds((prev) => (wasLiked ? prev.filter((id) => id !== post.id) : [...prev, post.id]));

    updatePostInCache(post.id, (item) => ({
      ...item,
      likedByMe: !wasLiked,
      counts: {
        ...item.counts,
        likeCount: Math.max(0, item.counts.likeCount + (wasLiked ? -1 : 1)),
      },
    }));

    reactMutation.mutate(
      { postId: post.id, reaction: "like" },
      {
        onError: () => {
          setLikedPostIds((prev) => (wasLiked ? [...prev, post.id] : prev.filter((id) => id !== post.id)));
          updatePostInCache(post.id, (item) => ({
            ...item,
            likedByMe: wasLiked,
            counts: {
              ...item.counts,
              likeCount: Math.max(0, item.counts.likeCount + (wasLiked ? 1 : -1)),
            },
          }));
        },
      },
    );
  };

  const handleBookmark = (post: CommunityPost) => {
    setBookmarks((prev) => (prev.includes(post.id) ? prev.filter((id) => id !== post.id) : [...prev, post.id]));
  };

  const handleShare = (post: CommunityPost) => {
    const url = `${window.location.origin}/community?post=${post.id}`;
    if (navigator.share) {
      navigator
        .share({ title: "Community Connect", text: post.text, url })
        .catch(() => null);
      return;
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copied"));
      return;
    }
    toast.message("Copy this link:", { description: url });
  };

  const handleMessage = async (post: CommunityPost) => {
    const otherUid = post.userId;
    if (!otherUid || otherUid.length <= 20) {
      toast.error("Please select a farmer from a post or profile (names aren’t valid IDs).");
      return;
    }
    const convo = await startConversationMutation.mutateAsync(otherUid);
    if (convo?.conversationId) {
      navigate(`/community/chat/${encodeURIComponent(convo.conversationId)}`);
    }
  };

  const toggleSelection = (value: string, setter: (values: string[]) => void, values: string[]) => {
    if (values.includes(value)) {
      setter(values.filter((item) => item !== value));
      return;
    }
    setter([...values, value]);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <Leaf className="h-6 w-6 text-emerald-700" />
          </div>
          <h2 className="text-xl font-semibold">Community Connect</h2>
          <p className="text-sm text-muted-foreground">Please sign in to use Community Connect.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommunityHeader onCreate={() => setCreateOpen(true)} onInbox={() => navigate("/community/inbox")} />

      <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 space-y-6">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/20 via-card to-card shadow-card">
            <div className="pointer-events-none absolute -top-14 -right-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
            <CardContent className="relative space-y-5 p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Cooperative community hub</p>
                  <h2 className="text-2xl font-semibold text-foreground md:text-3xl">Community Connect</h2>
                  <p className="text-sm text-muted-foreground">Share experiences, ask questions, and coordinate field actions.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn("border px-3 py-1 text-xs font-medium", STATUS_STYLES[feedStateTone])}>
                    {feedStateLabel}
                  </Badge>
                  <Badge className={cn("border px-3 py-1 text-xs font-medium", STATUS_STYLES[activeFilterCount > 0 ? "warning" : "neutral"])}>
                    Filters: {activeFilterCount}
                  </Badge>
                  <Badge className={cn("border px-3 py-1 text-xs font-medium", STATUS_STYLES[postsByTab.bookmarks.length > 0 ? "good" : "neutral"])}>
                    Bookmarks: {postsByTab.bookmarks.length}
                  </Badge>
                </div>
              </div>

              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search posts (e.g. pests, maize, prices...)"
                  className="h-11 bg-background/80"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  Create Post
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/community/inbox")}>
                  Open Inbox
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Community pulse</CardTitle>
              <CardDescription>Live status for feed, people, and activity windows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Current view</span>
                </div>
                <Badge className={cn("border px-2 py-0.5 text-xs", STATUS_STYLES.good)}>
                  {communityView === "feed" ? "Feed" : communityView === "members" ? "Members" : "Events"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>Tab focus</span>
                </div>
                <Badge className={cn("border px-2 py-0.5 text-xs", STATUS_STYLES.neutral)}>
                  {tab === "feed" ? "Feed" : tab === "my" ? "My Posts" : "Bookmarks"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>Visible posts</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{currentTabPosts.length}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => setCommunityView("feed")}
              >
                Return to feed
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-1 duration-500">
          {communityMetrics.map((metric) => (
            <Card key={metric.title} className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.title}</p>
                    <p className="text-lg font-semibold text-foreground">{metric.value}</p>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      metric.tone === "good"
                        ? "bg-success/10"
                        : metric.tone === "warning"
                        ? "bg-warning/10"
                        : metric.tone === "critical"
                        ? "bg-destructive/10"
                        : "bg-muted"
                    )}
                  >
                    <metric.icon className="h-4 w-4 text-foreground" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{metric.note}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {COMMUNITY_FARMD_ENABLED ? (
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={communityView === "feed" ? "default" : "outline"}
                      className={communityView === "feed" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      onClick={() => setCommunityView("feed")}
                    >
                      Feed
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={communityView === "members" ? "default" : "outline"}
                      className={communityView === "members" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      onClick={() => setCommunityView("members")}
                    >
                      Members
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={communityView === "events" ? "default" : "outline"}
                      className={communityView === "events" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      onClick={() => setCommunityView("events")}
                    >
                      Events
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {communityView === "members" && COMMUNITY_FARMD_ENABLED ? (
              <CommunityMembersDiscovery uid={currentUser.uid} />
            ) : null}

            {communityView === "events" && COMMUNITY_FARMD_ENABLED ? (
              <CommunityEventsSection uid={currentUser.uid} />
            ) : null}

            {communityView === "feed" ? (
              <>
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="space-y-4 p-4">
                    <CommunityFilters
                      label="Topics"
                      options={TOPIC_OPTIONS}
                      selected={selectedTopics}
                      onToggle={(value) => toggleSelection(value, setSelectedTopics, selectedTopics)}
                    />
                    <CommunityFilters
                      label="Crops"
                      options={CROP_OPTIONS}
                      selected={selectedCrops}
                      onToggle={(value) => toggleSelection(value, setSelectedCrops, selectedCrops)}
                    />
                    <CommunityTabs value={tab} onChange={setTab} />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {feedQuery.isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-44 rounded-2xl" />
                      ))}
                    </div>
                  ) : null}

                  {!feedQuery.isLoading && currentTabPosts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-8 text-center">
                      <Leaf className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {tab === "feed"
                          ? "No posts yet. Start the conversation."
                          : tab === "my"
                          ? "You haven't posted yet."
                          : "No bookmarked posts yet."}
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    {currentTabPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleToggleLike}
                        onComment={(selected) => setSelectedPost(selected)}
                        onBookmark={handleBookmark}
                        onShare={handleShare}
                        onMessage={handleMessage}
                      />
                    ))}
                  </div>

                  {tab === "feed" && feedQuery.hasNextPage ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full h-11"
                      onClick={() => feedQuery.fetchNextPage()}
                      disabled={feedQuery.isFetchingNextPage}
                    >
                      {feedQuery.isFetchingNextPage ? "Loading..." : "Load more posts"}
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-3">
              {communityView === "feed" ? (
                <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bookmark className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold">Bookmarks</p>
                  </div>
                  {postsByTab.bookmarks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No bookmarks yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {postsByTab.bookmarks.slice(0, 3).map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => setSelectedPost(post)}
                          className="w-full text-left rounded-xl border border-border/60 p-3 hover:border-emerald-600/60 transition"
                        >
                          <p className="text-sm font-medium line-clamp-2">{post.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">{post.authorName || "Farmer"}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
                  Community insights update as members and events load.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <Button
        type="button"
        className={cn(
          "fixed bottom-20 right-4 h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg md:hidden",
        )}
        onClick={() => setCreateOpen(true)}
      >
        +
      </Button>

      <CreatePostDialog open={createOpen} onOpenChange={setCreateOpen} />

      <CommentsDrawer
        post={selectedPost}
        open={Boolean(selectedPost)}
        onOpenChange={(open) => {
          if (!open) setSelectedPost(null);
        }}
      />
    </div>
  );
}
