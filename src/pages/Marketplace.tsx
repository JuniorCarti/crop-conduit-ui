import { useState } from "react";
import { Store, Search, MessageSquare, Star, Plus, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listings, transactions } from "@/data/dummyData";
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

const cropEmojis: Record<string, string> = {
  maize: "🌽",
  wheat: "🌾",
  sorghum: "🌿",
  groundnuts: "🥜",
};

export default function Marketplace() {
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<typeof listings[0] | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Marketplace" 
        subtitle="Buy & sell crops"
        icon={Store}
      >
        <Button size="sm" onClick={() => setShowListingModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">List Crop</span>
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {/* Search */}
        <div className="flex gap-2 animate-fade-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search crops..." className="pl-10 bg-card" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="browse" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="my-listings">My Listings</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {listings.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => setSelectedListing(listing)}
                  className="bg-card rounded-xl border border-border/50 overflow-hidden text-left hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <div className="h-24 bg-secondary flex items-center justify-center text-4xl">
                    {cropEmojis[listing.image] || "🌱"}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-foreground text-sm line-clamp-1">{listing.title}</p>
                    <p className="text-lg font-bold text-primary mt-1">${listing.price}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{listing.location}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-warning fill-warning" />
                        <span className="text-xs font-medium">{listing.rating}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* My Listings Tab */}
          <TabsContent value="my-listings" className="mt-4">
            <div className="bg-card rounded-xl p-6 border border-border/50 text-center">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No active listings</p>
              <p className="text-sm text-muted-foreground mt-1">Start selling your crops today</p>
              <Button className="mt-4" onClick={() => setShowListingModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Listing
              </Button>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-4 space-y-3">
            {transactions.map((tx) => (
              <div 
                key={tx.id}
                className="bg-card rounded-xl p-4 border border-border/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{tx.item}</p>
                    <p className="text-sm text-muted-foreground">Buyer: {tx.buyer}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">${tx.amount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tx.status === "Completed"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Listing Detail Modal */}
      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedListing?.title}</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4 mt-4">
              <div className="h-40 bg-secondary rounded-xl flex items-center justify-center text-6xl">
                {cropEmojis[selectedListing.image] || "🌱"}
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">${selectedListing.price}</p>
                  <p className="text-sm text-muted-foreground">{selectedListing.location}</p>
                </div>
                <div className="flex items-center gap-1 bg-secondary px-3 py-1.5 rounded-full">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span className="font-medium">{selectedListing.rating}</span>
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Seller</p>
                <p className="font-medium text-foreground">{selectedListing.seller}</p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  setSelectedListing(null);
                  setShowChatModal(true);
                }}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
                <Button variant="outline" className="flex-1">
                  Make Offer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Listing Modal */}
      <Dialog open={showListingModal} onOpenChange={setShowListingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground">Crop Type</label>
              <select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                <option>Maize</option>
                <option>Wheat</option>
                <option>Sorghum</option>
                <option>Groundnuts</option>
                <option>Soybeans</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Quantity (kg)</label>
                <Input type="number" placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Price ($)</label>
                <Input type="number" placeholder="0" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea placeholder="Describe your crop quality, harvest date, etc." className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Location</label>
              <Input placeholder="e.g., Kumasi, Ghana" className="mt-1" />
            </div>
            <Button className="w-full">Publish Listing</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat with Seller</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="h-64 bg-secondary rounded-lg p-4 overflow-y-auto space-y-3">
              <div className="flex justify-start">
                <div className="bg-card rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">Hello! I'm interested in your crop listing. Is it still available?</p>
                  <p className="text-xs text-muted-foreground mt-1">10:30 AM</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">Yes, it's available! The quality is excellent, harvested last week.</p>
                  <p className="text-xs opacity-70 mt-1">10:32 AM</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Type a message..." className="flex-1" />
              <Button>Send</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
