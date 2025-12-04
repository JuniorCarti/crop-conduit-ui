import { useState } from "react";
import { Users, MessageCircle, Calendar, Eye, Plus, Search, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forumPosts, events } from "@/data/dummyData";
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

export default function Community() {
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<typeof forumPosts[0] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null);

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Community" 
        subtitle="Connect & learn together"
        icon={Users}
      >
        <Button size="sm" onClick={() => setShowPostModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Post</span>
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {/* Search */}
        <div className="relative animate-fade-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search discussions..." className="pl-10 bg-card" />
        </div>

        <Tabs defaultValue="forum" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="forum">Forum</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          {/* Forum Tab */}
          <TabsContent value="forum" className="mt-4 space-y-3">
            {forumPosts.map((post) => (
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
                    <p className="text-sm text-muted-foreground mt-1">by {post.author} • {post.time}</p>
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
            ))}
          </TabsContent>

          {/* Knowledge Tab */}
          <TabsContent value="knowledge" className="mt-4 space-y-3">
            <div className="grid gap-3">
              {[
                { title: "Crop Disease Identification", category: "Guides", icon: "📚" },
                { title: "Organic Farming Basics", category: "Videos", icon: "🎥" },
                { title: "Market Pricing Strategies", category: "Articles", icon: "📄" },
                { title: "Climate-Smart Agriculture", category: "Courses", icon: "🎓" },
              ].map((item, index) => (
                <div 
                  key={index}
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
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-4 space-y-3">
            {events.map((event) => (
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
                      <span className="text-xs text-muted-foreground">{event.attendees} attending</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Detail Modal */}
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
                <p className="text-sm text-foreground">
                  Looking for advice on the best storage methods for maize to prevent post-harvest losses.
                  What has worked well for you? Any tips on moisture control?
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{selectedPost.replies} replies</span>
                <span>•</span>
                <span>{selectedPost.views} views</span>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground mb-3">Replies</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-xs">FM</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-secondary rounded-lg p-3">
                      <p className="text-xs font-medium text-foreground">FarmerMike</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        I use hermetic bags and they work great! Keeps pests out too.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Input placeholder="Write a reply..." className="flex-1" />
                <Button>Reply</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{selectedEvent.date}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{selectedEvent.location}</p>
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Join fellow farmers for hands-on training sessions covering the latest agricultural techniques
                  and best practices.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{selectedEvent.attendees} people attending</span>
              </div>

              <Button className="w-full">Register for Event</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Post Modal */}
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input placeholder="What's your question or topic?" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                <option>General Discussion</option>
                <option>Crop Management</option>
                <option>Pest Control</option>
                <option>Marketing Tips</option>
                <option>Equipment & Tools</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Content</label>
              <Textarea 
                placeholder="Share your thoughts, questions, or experiences..." 
                className="mt-1 min-h-[120px]" 
              />
            </div>
            <Button className="w-full">Publish Post</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
