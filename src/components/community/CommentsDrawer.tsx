import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CommunityPost } from "@/types/community";
import { addComment, listComments } from "@/services/communityService";

interface CommentsDrawerProps {
  post: CommunityPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function initials(name?: string | null) {
  if (!name) return "F";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "F";
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function CommentsDrawer({ post, open, onOpenChange }: CommentsDrawerProps) {
  const isMobile = useIsMobile();
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const postId = post?.id || "";

  const commentsQuery = useInfiniteQuery({
    queryKey: ["community", "comments", postId],
    queryFn: ({ pageParam }) => listComments(postId, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: Boolean(postId) && open,
  });

  const addMutation = useMutation({
    mutationFn: (value: string) => addComment(postId, { text: value }),
    onSuccess: (comment) => {
      queryClient.setQueryData(["community", "comments", postId], (old: any) => {
        if (!old) return old;
        const first = old.pages?.[0];
        if (!first) return old;
        const updated = {
          ...old,
          pages: [
            { ...first, items: [comment, ...first.items] },
            ...(old.pages || []).slice(1),
          ],
        };
        return updated;
      });
      queryClient.setQueryData(["community", "feed"], (old: any) => {
        if (!old?.pages?.length) return old;
        const pages = old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: CommunityPost) =>
            item.id === postId
              ? { ...item, counts: { ...item.counts, commentCount: item.counts.commentCount + 1 } }
              : item,
          ),
        }));
        return { ...old, pages };
      });
      queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
      setText("");
      toast.success("Comment added");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add comment");
    },
  });

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-2">
        <p className="text-sm text-muted-foreground">
          {post?.counts.commentCount || 0} comments
        </p>
      </div>
      <ScrollArea className="flex-1 px-4">
        {commentsQuery.isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : null}

        {!commentsQuery.isLoading && commentsQuery.data?.pages?.[0]?.items?.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <MessageCircle className="h-4 w-4" />
            Be the first to comment.
          </div>
        ) : null}

        <div className="space-y-4 py-4">
          {commentsQuery.data?.pages?.flatMap((page) =>
            page.items.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {initials(comment.authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-xl bg-muted/60 p-3">
                  <p className="text-xs font-semibold text-foreground">{comment.authorName || "Farmer"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                </div>
              </div>
            )),
          )}
        </div>

        {commentsQuery.hasNextPage ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full mb-4"
            onClick={() => commentsQuery.fetchNextPage()}
            disabled={commentsQuery.isFetchingNextPage}
          >
            {commentsQuery.isFetchingNextPage ? "Loading..." : "Load more comments"}
          </Button>
        ) : null}
      </ScrollArea>

      <div className="border-t border-border/60 p-4 flex gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a comment"
          className="flex-1"
        />
        <Button
          type="button"
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={!text.trim() || addMutation.isPending}
          onClick={() => addMutation.mutate(text.trim())}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Comments</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
