import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityTabsProps {
  value: string;
  onChange: (value: string) => void;
}

export function CommunityTabs({ value, onChange }: CommunityTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange} className="w-full">
      <TabsList className="flex w-full gap-2 rounded-full bg-muted/60 p-1 overflow-x-auto">
        <TabsTrigger
          value="feed"
          className={cn("rounded-full px-4", value === "feed" && "bg-background shadow-sm")}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Feed
        </TabsTrigger>
        <TabsTrigger
          value="my"
          className={cn("rounded-full px-4", value === "my" && "bg-background shadow-sm")}
        >
          My Posts
        </TabsTrigger>
        <TabsTrigger
          value="bookmarks"
          className={cn("rounded-full px-4", value === "bookmarks" && "bg-background shadow-sm")}
        >
          <Bookmark className="h-4 w-4 mr-2" />
          Bookmarks
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
