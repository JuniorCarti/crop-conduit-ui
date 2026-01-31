import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommunityHeaderProps {
  onCreate: () => void;
  onInbox?: () => void;
}

export function CommunityHeader({ onCreate, onInbox }: CommunityHeaderProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-600/70">Community</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Community Connect</h1>
          <p className="text-sm text-muted-foreground">Learn, share and sell smarter together</p>
        </div>
        <div className="flex items-center gap-2">
          {onInbox ? (
            <Button
              type="button"
              variant="outline"
              onClick={onInbox}
              className="hidden md:inline-flex"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Inbox
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onCreate}
            className="hidden md:inline-flex bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
          <Button
            type="button"
            onClick={onCreate}
            size="icon"
            className="md:hidden bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
          </Button>
          {onInbox ? (
            <Button type="button" variant="outline" size="icon" onClick={onInbox} className="md:hidden">
              <MessageCircle className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
