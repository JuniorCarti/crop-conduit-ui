import { useState } from "react";
import { Users, MessageCircle, Eye, Plus, Search, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForumPosts, useEvents, useKnowledgeResources } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/shared/AlertCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";

export default function Community() {
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ReturnType<typeof useForumPosts>["data"]>[0] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ReturnType<typeof useEvents>["data"]>[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const { data: forumPosts, isLoading: postsLoading, error: postsError } = useForumPosts(searchQuery);
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: knowledgeResources, isLoading: knowledgeLoading } = useKnowledgeResources();

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("community.title")}
        subtitle={t("community.subtitle")}
        icon={Users}
      >
        <Button size="sm" onClick={() => setShowPostModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("community.newPost")}</span>
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {postsError && (
          <AlertCard
            type="danger"
            title={t("community.errorTitle")}
            message={t("community.errorMessage")}
          />
        )}

        <div className="relative animate-fade-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("community.searchPlaceholder")}
            className="pl-10 bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="forum" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="forum">{t("community.tabs.forum")}</TabsTrigger>
            <TabsTrigger value="knowledge">{t("community.tabs.knowledge")}</TabsTrigger>
            <TabsTrigger value="events">{t("community.tabs.events")}</TabsTrigger>
          </TabsList>

          <TabsContent value="forum" className="mt-4 space-y-3">
            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : forumPosts && forumPosts.length > 0 ? (
              forumPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="w-full bg-card rounded-xl p-4 border border-border/50 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {post.author[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground line-clamp-2">{post.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("community.postMeta", { author: post.author, time: post.time })}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MessageCircle className="h-3 w-3" />
                          <span className="text-xs">{post.replies}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span className="text-xs">{post.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? t("community.noPostsMatch", { query: searchQuery })
                  : t("community.noPosts")}
              </div>
            )}
          </TabsContent>

          <TabsContent value="knowledge" className="mt-4 space-y-3">
            {knowledgeLoading ? (
              <div className="grid gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : knowledgeResources && knowledgeResources.length > 0 ? (
              <div className="grid gap-3">
                {knowledgeResources.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-3 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center text-2xl">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t("community.noKnowledge")}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4 space-y-3">
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : events && events.length > 0 ? (
              events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full bg-card rounded-xl p-4 border border-border/50 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg gradient-primary flex flex-col items-center justify-center text-primary-foreground">
                      <span className="text-xs font-medium">
                        {event.date.split(" ")[0].slice(0, 3)}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {event.date.split(" ")[1].replace(",", "")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {t("community.eventAttending", { count: event.attendees })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t("community.noEvents")}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-left">{selectedPost?.title}</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {selectedPost.author[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{selectedPost.author}</p>
                  <p className="text-sm text-muted-foreground">{selectedPost.time}</p>
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-4">
                <p className="text-sm text-foreground">{t("community.samplePost")}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{t("community.repliesCount", { count: selectedPost.replies })}</span>
                <span>-</span>
                <span>{t("community.viewsCount", { count: selectedPost.views })}</span>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground mb-3">{t("community.repliesTitle")}</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-xs">FM</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-secondary rounded-lg p-3">
                      <p className="text-xs font-medium text-foreground">FarmerMike</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("community.sampleReply")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Input placeholder={t("community.replyPlaceholder")} className="flex-1" />
                <Button>{t("community.replyButton")}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{t("community.eventDate")}</p>
                  <p className="font-medium text-foreground">{selectedEvent.date}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{t("community.eventLocation")}</p>
                  <p className="font-medium text-foreground">{selectedEvent.location}</p>
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{t("community.eventDescription")}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{t("community.eventPeople", { count: selectedEvent.attendees })}</span>
              </div>

              <Button className="w-full">{t("community.eventRegister")}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("community.createPost.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground">{t("community.createPost.fields.title")}</label>
              <Input placeholder={t("community.createPost.titlePlaceholder")} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("community.createPost.fields.category")}</label>
              <select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                <option>{t("community.createPost.categories.general")}</option>
                <option>{t("community.createPost.categories.crop")}</option>
                <option>{t("community.createPost.categories.pest")}</option>
                <option>{t("community.createPost.categories.marketing")}</option>
                <option>{t("community.createPost.categories.tools")}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("community.createPost.fields.content")}</label>
              <Textarea
                placeholder={t("community.createPost.contentPlaceholder")}
                className="mt-1 min-h-[120px]"
              />
            </div>
            <Button className="w-full">{t("community.createPost.publish")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
