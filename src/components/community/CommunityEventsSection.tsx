import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { listFarmerEvents, type CommunityEventsItem } from "@/services/communityMembersService";

type EventsTab = "upcoming" | "past" | "yours";

function formatDate(value: Date | null) {
  if (!value) return "Date TBD";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export function CommunityEventsSection({ uid }: { uid: string }) {
  const [tab, setTab] = useState<EventsTab>("upcoming");
  const [selected, setSelected] = useState<CommunityEventsItem | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["community", "events", uid],
    queryFn: () => listFarmerEvents(uid),
    enabled: Boolean(uid),
    staleTime: 1000 * 60,
  });

  const eventsByTab = useMemo(() => {
    const now = Date.now();
    const events = eventsQuery.data || [];
    if (tab === "past") {
      return events.filter((row) => (row.eventAt?.getTime() ?? 0) < now);
    }
    if (tab === "yours") {
      return events.slice(0, 10);
    }
    return events.filter((row) => (row.eventAt?.getTime() ?? 0) >= now);
  }, [eventsQuery.data, tab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={tab === "upcoming" ? "default" : "outline"} className={tab === "upcoming" ? "bg-emerald-600 hover:bg-emerald-700" : ""} onClick={() => setTab("upcoming")}>Upcoming</Button>
        <Button size="sm" variant={tab === "past" ? "default" : "outline"} className={tab === "past" ? "bg-emerald-600 hover:bg-emerald-700" : ""} onClick={() => setTab("past")}>Past</Button>
        <Button size="sm" variant={tab === "yours" ? "default" : "outline"} className={tab === "yours" ? "bg-emerald-600 hover:bg-emerald-700" : ""} onClick={() => setTab("yours")}>Yours</Button>
      </div>

      {eventsQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {!eventsQuery.isLoading && eventsByTab.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-8 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-2 text-sm text-muted-foreground">No events upcoming.</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {eventsByTab.map((event) => (
          <Card key={`${event.source}-${event.id}`} className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base line-clamp-1">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Clock3 className="h-4 w-4" />{formatDate(event.eventAt)}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{event.location}</div>
              <p className="line-clamp-2 text-muted-foreground">{event.description || "Cooperative event."}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">{event.hostCoopName || "Cooperative"}</span>
                <Button size="sm" variant="outline" onClick={() => setSelected(event)}>View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{selected.description || "No description provided."}</p>
              <p><span className="font-medium">Date:</span> {formatDate(selected.eventAt)}</p>
              <p><span className="font-medium">Location:</span> {selected.location}</p>
              <p><span className="font-medium">Host:</span> {selected.hostCoopName || "Cooperative"}</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline">Interested</Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Going</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
