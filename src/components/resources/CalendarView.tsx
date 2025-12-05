import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { type Resource } from "@/services/firestore";

interface CalendarViewProps {
  resources: Resource[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarView({ resources, open, onOpenChange }: CalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);

  // Get resources with application dates
  const resourcesWithDates = useMemo(() => {
    return resources.filter(r => r.applicationDate);
  }, [resources]);

  // Group resources by date
  const resourcesByDate = useMemo(() => {
    const grouped: Record<string, Resource[]> = {};
    resourcesWithDates.forEach(resource => {
      const dateKey = format(new Date(resource.applicationDate!), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(resource);
    });
    return grouped;
  }, [resourcesWithDates]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getResourcesForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return resourcesByDate[dateKey] || [];
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fertilizer":
        return "bg-success/10 text-success border-success/30";
      case "seed":
        return "bg-primary/10 text-primary border-primary/30";
      case "pesticide":
        return "bg-warning/10 text-warning border-warning/30";
      case "water":
        return "bg-info/10 text-info border-info/30";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Application Schedule Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              Previous
            </Button>
            <h3 className="text-lg font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              Next
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const dayResources = getResourcesForDate(day);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-1 border border-border/50 rounded ${
                    isCurrentMonth ? "bg-card" : "bg-secondary/30"
                  } ${isToday ? "ring-2 ring-primary" : ""}`}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                  } ${isToday ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayResources.slice(0, 2).map((resource, idx) => (
                      <Badge
                        key={idx}
                        className={`text-xs p-0.5 px-1 ${getTypeColor(resource.type)}`}
                        title={resource.name}
                      >
                        {resource.name.length > 8 ? `${resource.name.substring(0, 8)}...` : resource.name}
                      </Badge>
                    ))}
                    {dayResources.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayResources.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">Legend:</span>
            {["fertilizer", "seed", "pesticide", "water"].map(type => (
              <Badge key={type} className={getTypeColor(type)}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


