import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { CommunityFilters } from "@/components/community/CommunityFilters";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostDialog } from "@/components/community/CreatePostDialog";
import { CommentsDrawer } from "@/components/community/CommentsDrawer";
import { listPosts, reactToPost } from "@/services/communityService";
import { startConversation } from "@/services/dmService";
import type { CommunityPost } from "@/types/community";
import { cn } from "@/lib/utils";

const TOPIC_OPTIONS = ["Market", "Weather", "Pests", "Inputs", "Irrigation", "Harvest", "Livestock"];
const CROP_OPTIONS = ["Maize", "Tomatoes", "Potatoes", "Beans", "Millet", "Dairy", "Poultry"];
const BOOKMARK_STORAGE_KEY = "community.bookmarks";
const LIKE_STORAGE_KEY = "community.likes";

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
    onError: (error: any) => {
      const message = String(error?.message || "").toLowerCase();
      if (message.includes("blocked")) {
        toast.error("You cannot message this farmer.");
        return;
      }
      toast.error(error?.message || "Unable to start conversation");
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

  const updatePostInCache = (postId: string, updater: (post: CommunityPost) => CommunityPost) => {
    queryClient.setQueryData(["community", "feed"], (old: any) => {
      if (!old?.pages?.length) return old;
      const pages = old.pages.map((page: any) => ({
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
      navigate(`/community/chat/${convo.conversationId}`);
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search posts (e.g. pests, maize, prices...)"
                className="h-11"
              />
            </div>

            <div className="space-y-4">
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
            </div>

            <CommunityTabs value={tab} onChange={setTab} />

            <div className="space-y-4">
              {feedQuery.isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-44 rounded-2xl" />
                  ))}
                </div>
              ) : null}

              {!feedQuery.isLoading && postsByTab[tab as keyof typeof postsByTab].length === 0 ? (
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
                {postsByTab[tab as keyof typeof postsByTab].map((post) => (
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
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-3">
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
