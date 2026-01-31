import { useMemo, useState } from "react";
import { Heart, MessageCircle, Bookmark, Share2, MapPin, Leaf, Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { CommunityPost } from "@/types/community";

interface PostCardProps {
  post: CommunityPost;
  onLike: (post: CommunityPost) => void;
  onComment: (post: CommunityPost) => void;
  onShare: (post: CommunityPost) => void;
  onBookmark: (post: CommunityPost) => void;
  onMessage: (post: CommunityPost) => void;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function initials(name?: string | null) {
  if (!name) return "F";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "F";
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function PostCard({ post, onLike, onComment, onShare, onBookmark, onMessage }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const createdAt = useMemo(() => formatDate(post.createdAt), [post.createdAt]);
  const tags = post.tags?.slice(0, 4) || [];
  const validMedia = post.media.filter(
    (media) => media.url && !media.url.includes("undefined") && !media.url.endsWith("/undefined"),
  );

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm transition-shadow hover:shadow-md">
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
              {initials(post.authorName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground truncate">{post.authorName || "Farmer"}</p>
              {post.location ? (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  {post.location}
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Leaf className="h-3 w-3" />
                  Community
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{createdAt}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className={cn("text-sm text-foreground leading-relaxed", !expanded && "line-clamp-3")}>
            {post.text}
          </p>
          {post.text.length > 160 ? (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-emerald-700"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Show less" : "Read more"}
            </Button>
          ) : null}

          {validMedia.length ? (
            <div className="relative">
              <Carousel className="w-full">
                <CarouselContent>
                  {validMedia.map((media) => (
                    <CarouselItem key={media.url}>
                      <div className="relative overflow-hidden rounded-2xl bg-muted">
                        {media.type === "video" ? (
                          <video className="w-full aspect-video" controls src={media.url} />
                        ) : (
                          <img
                            src={media.url}
                            alt="Community post media"
                            className="w-full aspect-video object-cover"
                            loading="lazy"
                            onError={(event) => {
                              const target = event.currentTarget;
                              target.style.display = "none";
                            }}
                          />
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {post.media.length > 1 ? (
                  <>
                    <CarouselPrevious className="-left-4 top-1/2 bg-background/90" />
                    <CarouselNext className="-right-4 top-1/2 bg-background/90" />
                  </>
                ) : null}
              </Carousel>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-xs text-muted-foreground">
              No media attached
            </div>
          )}

          {tags.length || post.crop ? (
            <div className="flex flex-wrap gap-2">
              {post.crop ? (
                <Badge className="bg-emerald-600/10 text-emerald-700">{post.crop}</Badge>
              ) : null}
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("gap-2 h-10 px-3", post.likedByMe && "text-rose-600")}
              onClick={() => onLike(post)}
            >
              <Heart className={cn("h-4 w-4", post.likedByMe && "fill-rose-600")} />
              <span className="text-xs font-medium">{post.counts.likeCount}</span>
            </Button>
            <Button type="button" variant="ghost" size="sm" className="gap-2 h-10 px-3" onClick={() => onComment(post)}>
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium">{post.counts.commentCount}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-10 px-3" onClick={() => onShare(post)}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-10 px-3" onClick={() => onMessage(post)}>
              <Mail className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-10 px-3", post.bookmarkedByMe && "text-emerald-600")}
              onClick={() => onBookmark(post)}
            >
              <Bookmark className={cn("h-4 w-4", post.bookmarkedByMe && "fill-emerald-600")} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
