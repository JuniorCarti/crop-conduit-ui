/**
 * Irrigation Scheduler Page
 * Smart irrigation scheduling with weather integration, water source management,
 * cost-benefit analysis, and calendar view
 */

import { useState, useMemo } from "react";
import { Droplets, Calendar as CalendarIcon, TrendingUp, AlertCircle, Plus, Edit, Trash2, CheckCircle2, Upload, FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useIrrigationSchedules, useCreateIrrigationSchedule, useUpdateIrrigationSchedule, useDeleteIrrigationSchedule } from "@/hooks/useIrrigation";
import { useWaterSources, useCreateWaterSource, useUpdateWaterSource, useDeleteWaterSource } from "@/hooks/useIrrigation";
import { useIrrigationEfficiency } from "@/hooks/useIrrigation";
import { useCrops } from "@/hooks/useCrops";
import { useAuth } from "@/contexts/AuthContext";
import { formatKsh } from "@/lib/currency";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { uploadFile, uploadImage, STORAGE_CATEGORIES, getPublicUrl, deleteFile } from "@/services/storage";
import { toast } from "sonner";

// Mock weather API function (replace with real API)
const getWeatherForecast = (date: Date) => {
  return {
    temperature: 25 + Math.random() * 5,
    humidity: 60 + Math.random() * 20,
    rainfall: Math.random() * 10,
    windSpeed: 5 + Math.random() * 10,
  };
};

export default function Irrigation() {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showWaterSourceDialog, setShowWaterSourceDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [editingSource, setEditingSource] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("schedule");
  
  // File upload states for irrigation schedules
  const [scheduleFiles, setScheduleFiles] = useState<{
    weatherChart?: File;
    sensorData?: File;
    report?: File;
    attachments?: File[];
  }>({});
  const [uploadingScheduleFiles, setUploadingScheduleFiles] = useState(false);
  
  // File upload states for water sources
  const [sourceFiles, setSourceFiles] = useState<{
    photo?: File;
    document?: File;
    sensorLog?: File;
    maintenanceLog?: File;
    attachments?: File[];
  }>({});
  const [uploadingSourceFiles, setUploadingSourceFiles] = useState(false);

  const { schedules, isLoading: schedulesLoading } = useIrrigationSchedules();
  const { sources, isLoading: sourcesLoading } = useWaterSources();
  const { crops } = useCrops();
  const { efficiency } = useIrrigationEfficiency();

  const createScheduleMutation = useCreateIrrigationSchedule();
  const updateScheduleMutation = useUpdateIrrigationSchedule();
  const deleteScheduleMutation = useDeleteIrrigationSchedule();
  const createSourceMutation = useCreateWaterSource();
  const updateSourceMutation = useUpdateWaterSource();
  const deleteSourceMutation = useDeleteWaterSource();

  // Form state for schedule
  const [scheduleForm, setScheduleForm] = useState({
    cropId: "",
    field: "",
    scheduledDate: new Date(),
    duration: 60,
    waterAmount: 1000,
    method: "drip" as "drip" | "sprinkler" | "flood" | "manual",
    notes: "",
  });

  // Form state for water source
  const [sourceForm, setSourceForm] = useState({
    name: "",
    type: "reservoir" as "reservoir" | "well" | "river" | "borehole" | "tank",
    capacity: 10000,
    currentLevel: 10000,
    location: "",
    status: "available" as "available" | "low" | "empty" | "maintenance",
    refillCost: 0,
    notes: "",
  });

  // Filter schedules by date
  const upcomingSchedules = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return schedules.filter((s) => {
      const scheduleDate = new Date(s.scheduledDate);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate >= today && s.status === "scheduled";
    }).slice(0, 5);
  }, [schedules]);

  // Calculate water usage statistics
  const waterStats = useMemo(() => {
    const totalUsed = schedules
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + (s.waterAmount || 0), 0);
    const totalAvailable = sources.reduce((sum, s) => sum + s.currentLevel, 0);
    const totalCapacity = sources.reduce((sum, s) => sum + s.capacity, 0);
    return { totalUsed, totalAvailable, totalCapacity, percentage: totalCapacity > 0 ? (totalAvailable / totalCapacity) * 100 : 0 };
  }, [schedules, sources]);

  // Prepare efficiency chart data
  const efficiencyData = useMemo(() => {
    return efficiency.slice(0, 7).map((e) => ({
      date: format(new Date(e.date), "MMM d"),
      efficiency: e.efficiency,
      waterUsed: e.waterUsed,
      yieldIncrease: e.yieldIncrease || 0,
    }));
  }, [efficiency]);

  /**
   * Upload files for irrigation schedule to Supabase Storage
   * Returns object with Supabase URLs for each uploaded file
   */
  const uploadScheduleFiles = async (): Promise<{
    weatherChartUrl?: string;
    sensorDataUrl?: string;
    reportUrl?: string;
    attachments?: string[];
  }> => {
    if (!currentUser?.uid) {
      throw new Error("User must be authenticated to upload files");
    }

    const uploadedUrls: {
      weatherChartUrl?: string;
      sensorDataUrl?: string;
      reportUrl?: string;
      attachments?: string[];
    } = {};

    try {
      // Upload weather chart if provided
      if (scheduleFiles.weatherChart) {
        uploadedUrls.weatherChartUrl = await uploadImage(
          scheduleFiles.weatherChart,
          STORAGE_CATEGORIES.IRRIGATION_WEATHER,
          currentUser.uid
        );
      }

      // Upload sensor data file (can be image or document)
      if (scheduleFiles.sensorData) {
        if (scheduleFiles.sensorData.type.startsWith("image/")) {
          uploadedUrls.sensorDataUrl = await uploadImage(
            scheduleFiles.sensorData,
            STORAGE_CATEGORIES.IRRIGATION_SENSORS,
            currentUser.uid
          );
        } else {
          uploadedUrls.sensorDataUrl = await uploadFile(
            scheduleFiles.sensorData,
            STORAGE_CATEGORIES.IRRIGATION_SENSORS,
            currentUser.uid
          );
        }
      }

      // Upload report (PDF, DOC, etc.)
      if (scheduleFiles.report) {
        uploadedUrls.reportUrl = await uploadFile(
          scheduleFiles.report,
          STORAGE_CATEGORIES.IRRIGATION_REPORTS,
          currentUser.uid
        );
      }

      // Upload additional attachments
      if (scheduleFiles.attachments && scheduleFiles.attachments.length > 0) {
        uploadedUrls.attachments = await Promise.all(
          scheduleFiles.attachments.map(async (file) => {
            if (file.type.startsWith("image/")) {
              return await uploadImage(
                file,
                STORAGE_CATEGORIES.IRRIGATION_REPORTS,
                currentUser.uid
              );
            } else {
              return await uploadFile(
                file,
                STORAGE_CATEGORIES.IRRIGATION_REPORTS,
                currentUser.uid
              );
            }
          })
        );
      }
    } catch (error: any) {
      console.error("Error uploading schedule files:", error);
      toast.error(`Failed to upload files: ${error.message}`);
      throw error;
    }

    return uploadedUrls;
  };

  const handleCreateSchedule = async () => {
    const crop = crops.find((c) => c.id === scheduleForm.cropId);
    const weather = getWeatherForecast(scheduleForm.scheduledDate);

    setUploadingScheduleFiles(true);
    try {
      // Upload files to Supabase Storage first
      const fileUrls = await uploadScheduleFiles();

      // Create schedule with Supabase URLs
      await createScheduleMutation.mutateAsync({
        ...scheduleForm,
        cropName: crop?.name || "",
        status: "scheduled",
        weatherForecast: weather,
        cost: scheduleForm.waterAmount * 0.05, // Mock cost calculation
        // Store Supabase URLs instead of Firebase Storage paths
        weatherChartUrl: fileUrls.weatherChartUrl,
        sensorDataUrl: fileUrls.sensorDataUrl,
        reportUrl: fileUrls.reportUrl,
        attachments: fileUrls.attachments,
      });
      
      setShowScheduleDialog(false);
      setScheduleForm({
        cropId: "",
        field: "",
        scheduledDate: new Date(),
        duration: 60,
        waterAmount: 1000,
        method: "drip",
        notes: "",
      });
      setScheduleFiles({});
      toast.success("Irrigation schedule created with files uploaded to Supabase");
    } catch (error) {
      console.error("Error creating schedule:", error);
    } finally {
      setUploadingScheduleFiles(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;
    setUploadingScheduleFiles(true);
    try {
      // Upload new files to Supabase Storage if any
      const fileUrls = await uploadScheduleFiles();
      
      // Update schedule with new Supabase URLs (merge with existing URLs)
      await updateScheduleMutation.mutateAsync({
        id: editingSchedule.id,
        updates: {
          ...scheduleForm,
          // Merge new URLs with existing ones
          weatherChartUrl: fileUrls.weatherChartUrl || editingSchedule.weatherChartUrl,
          sensorDataUrl: fileUrls.sensorDataUrl || editingSchedule.sensorDataUrl,
          reportUrl: fileUrls.reportUrl || editingSchedule.reportUrl,
          attachments: fileUrls.attachments 
            ? [...(editingSchedule.attachments || []), ...fileUrls.attachments]
            : editingSchedule.attachments,
        },
      });
      setShowScheduleDialog(false);
      setEditingSchedule(null);
      setScheduleFiles({});
      toast.success("Schedule updated with files uploaded to Supabase");
    } catch (error) {
      console.error("Error updating schedule:", error);
    } finally {
      setUploadingScheduleFiles(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteScheduleMutation.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting schedule:", error);
      }
    }
  };

  /**
   * Upload files for water source to Supabase Storage
   * Returns object with Supabase URLs for each uploaded file
   */
  const uploadSourceFiles = async (): Promise<{
    photoUrl?: string;
    documentUrl?: string;
    sensorLogUrl?: string;
    maintenanceLogUrl?: string;
    attachments?: string[];
  }> => {
    if (!currentUser?.uid) {
      throw new Error("User must be authenticated to upload files");
    }

    const uploadedUrls: {
      photoUrl?: string;
      documentUrl?: string;
      sensorLogUrl?: string;
      maintenanceLogUrl?: string;
      attachments?: string[];
    } = {};

    try {
      // Upload water source photo
      if (sourceFiles.photo) {
        uploadedUrls.photoUrl = await uploadImage(
          sourceFiles.photo,
          STORAGE_CATEGORIES.WATER_SOURCE_PHOTOS,
          currentUser.uid
        );
      }

      // Upload documents (permits, certificates)
      if (sourceFiles.document) {
        uploadedUrls.documentUrl = await uploadFile(
          sourceFiles.document,
          STORAGE_CATEGORIES.WATER_SOURCE_DOCS,
          currentUser.uid
        );
      }

      // Upload sensor logs
      if (sourceFiles.sensorLog) {
        uploadedUrls.sensorLogUrl = await uploadFile(
          sourceFiles.sensorLog,
          STORAGE_CATEGORIES.WATER_SOURCE_LOGS,
          currentUser.uid
        );
      }

      // Upload maintenance logs
      if (sourceFiles.maintenanceLog) {
        uploadedUrls.maintenanceLogUrl = await uploadFile(
          sourceFiles.maintenanceLog,
          STORAGE_CATEGORIES.WATER_SOURCE_LOGS,
          currentUser.uid
        );
      }

      // Upload additional attachments
      if (sourceFiles.attachments && sourceFiles.attachments.length > 0) {
        uploadedUrls.attachments = await Promise.all(
          sourceFiles.attachments.map(async (file) => {
            if (file.type.startsWith("image/")) {
              return await uploadImage(
                file,
                STORAGE_CATEGORIES.WATER_SOURCE_PHOTOS,
                currentUser.uid
              );
            } else {
              return await uploadFile(
                file,
                STORAGE_CATEGORIES.WATER_SOURCE_DOCS,
                currentUser.uid
              );
            }
          })
        );
      }
    } catch (error: any) {
      console.error("Error uploading source files:", error);
      toast.error(`Failed to upload files: ${error.message}`);
      throw error;
    }

    return uploadedUrls;
  };

  const handleCreateSource = async () => {
    setUploadingSourceFiles(true);
    try {
      // Upload files to Supabase Storage first
      const fileUrls = await uploadSourceFiles();

      // Create water source with Supabase URLs
      await createSourceMutation.mutateAsync({
        ...sourceForm,
        // Store Supabase URLs instead of Firebase Storage paths
        photoUrl: fileUrls.photoUrl,
        documentUrl: fileUrls.documentUrl,
        sensorLogUrl: fileUrls.sensorLogUrl,
        maintenanceLogUrl: fileUrls.maintenanceLogUrl,
        attachments: fileUrls.attachments,
      });
      
      setShowWaterSourceDialog(false);
      setSourceForm({
        name: "",
        type: "reservoir",
        capacity: 10000,
        currentLevel: 10000,
        location: "",
        status: "available",
        refillCost: 0,
        notes: "",
      });
      setSourceFiles({});
      toast.success("Water source created with files uploaded to Supabase");
    } catch (error) {
      console.error("Error creating source:", error);
    } finally {
      setUploadingSourceFiles(false);
    }
  };

  const handleUpdateSource = async () => {
    if (!editingSource) return;
    setUploadingSourceFiles(true);
    try {
      // Upload new files to Supabase Storage if any
      const fileUrls = await uploadSourceFiles();
      
      // Update source with new Supabase URLs (merge with existing URLs)
      await updateSourceMutation.mutateAsync({
        id: editingSource.id,
        updates: {
          ...sourceForm,
          // Merge new URLs with existing ones
          photoUrl: fileUrls.photoUrl || editingSource.photoUrl,
          documentUrl: fileUrls.documentUrl || editingSource.documentUrl,
          sensorLogUrl: fileUrls.sensorLogUrl || editingSource.sensorLogUrl,
          maintenanceLogUrl: fileUrls.maintenanceLogUrl || editingSource.maintenanceLogUrl,
          attachments: fileUrls.attachments
            ? [...(editingSource.attachments || []), ...fileUrls.attachments]
            : editingSource.attachments,
        },
      });
      setShowWaterSourceDialog(false);
      setEditingSource(null);
      setSourceFiles({});
      toast.success("Water source updated with files uploaded to Supabase");
    } catch (error) {
      console.error("Error updating source:", error);
    } finally {
      setUploadingSourceFiles(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (confirm("Are you sure you want to delete this water source?")) {
      try {
        await deleteSourceMutation.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting source:", error);
      }
    }
  };

  const openEditSchedule = (schedule: any) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      cropId: schedule.cropId,
      field: schedule.field,
      scheduledDate: new Date(schedule.scheduledDate),
      duration: schedule.duration,
      waterAmount: schedule.waterAmount,
      method: schedule.method,
      notes: schedule.notes || "",
    });
    // Reset file uploads when editing (existing files are shown via URLs)
    setScheduleFiles({});
    setShowScheduleDialog(true);
  };

  const openEditSource = (source: any) => {
    setEditingSource(source);
    setSourceForm({
      name: source.name,
      type: source.type,
      capacity: source.capacity,
      currentLevel: source.currentLevel,
      location: source.location || "",
      status: source.status,
      refillCost: source.refillCost || 0,
      notes: source.notes || "",
    });
    // Reset file uploads when editing (existing files are shown via URLs)
    setSourceFiles({});
    setShowWaterSourceDialog(true);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader
        title="Irrigation Scheduler"
        description="Smart irrigation scheduling with weather integration and water management"
        icon={Droplets}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Water Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waterStats.totalAvailable.toLocaleString()} L</div>
            <p className="text-xs text-muted-foreground">
              {waterStats.percentage.toFixed(1)}% of capacity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Water Used (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waterStats.totalUsed.toLocaleString()} L</div>
            <p className="text-xs text-muted-foreground">From completed schedules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSchedules.length}</div>
            <p className="text-xs text-muted-foreground">Next 5 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Water Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sources.length}</div>
            <p className="text-xs text-muted-foreground">Active sources</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="sources">Water Sources</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Irrigation Schedules</h2>
            <Button onClick={() => {
              setEditingSchedule(null);
              setScheduleForm({
                cropId: "",
                field: "",
                scheduledDate: new Date(),
                duration: 60,
                waterAmount: 1000,
                method: "drip",
                notes: "",
              });
              setShowScheduleDialog(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </div>

          {schedulesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Droplets className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No irrigation schedules yet. Create one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{schedule.cropName || "Unknown Crop"}</CardTitle>
                        <CardDescription>{schedule.field}</CardDescription>
                      </div>
                      <Badge variant={schedule.status === "completed" ? "default" : schedule.status === "scheduled" ? "secondary" : "outline"}>
                        {schedule.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Date:</span> {format(new Date(schedule.scheduledDate), "MMM d, yyyy")}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Method:</span> {schedule.method}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Water:</span> {schedule.waterAmount.toLocaleString()} L
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Duration:</span> {schedule.duration} min
                    </div>
                    {schedule.cost && (
                      <div className="text-sm">
                        <span className="font-medium">Cost:</span> {formatKsh(schedule.cost)}
                      </div>
                    )}
                    {/* Display Supabase Storage files if available */}
                    {(schedule.weatherChartUrl || schedule.sensorDataUrl || schedule.reportUrl || (schedule.attachments && schedule.attachments.length > 0)) && (
                      <div className="pt-2 border-t">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Attachments:</div>
                        <div className="flex flex-wrap gap-1">
                          {schedule.weatherChartUrl && (
                            <a
                              href={schedule.weatherChartUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <ImageIcon className="h-3 w-3" />
                              Weather Chart
                            </a>
                          )}
                          {schedule.sensorDataUrl && (
                            <a
                              href={schedule.sensorDataUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Sensor Data
                            </a>
                          )}
                          {schedule.reportUrl && (
                            <a
                              href={schedule.reportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Report
                            </a>
                          )}
                          {schedule.attachments && schedule.attachments.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              +{schedule.attachments.length} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditSchedule(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {schedule.status === "scheduled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateScheduleMutation.mutateAsync({
                            id: schedule.id!,
                            updates: { status: "completed" },
                          })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Water Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Water Sources</h2>
            <Button onClick={() => {
              setEditingSource(null);
              setSourceForm({
                name: "",
                type: "reservoir",
                capacity: 10000,
                currentLevel: 10000,
                location: "",
                status: "available",
                refillCost: 0,
                notes: "",
              });
              setShowWaterSourceDialog(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Source
            </Button>
          </div>

          {sourcesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : sources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Droplets className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No water sources yet. Add one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => {
                const percentage = (source.currentLevel / source.capacity) * 100;
                return (
                  <Card key={source.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{source.name}</CardTitle>
                          <CardDescription>{source.type} • {source.location || "No location"}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            source.status === "available"
                              ? "default"
                              : source.status === "low"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {source.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Capacity</span>
                          <span>{source.currentLevel.toLocaleString()} / {source.capacity.toLocaleString()} L</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              percentage > 50 ? "bg-green-500" : percentage > 20 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}% full</div>
                      </div>
                      {source.refillCost && source.refillCost > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Refill Cost:</span> {formatKsh(source.refillCost)}
                        </div>
                      )}
                      {/* Display Supabase Storage files if available */}
                      {(source.photoUrl || source.documentUrl || source.sensorLogUrl || source.maintenanceLogUrl || (source.attachments && source.attachments.length > 0)) && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Files:</div>
                          <div className="flex flex-wrap gap-1">
                            {source.photoUrl && (
                              <a
                                href={source.photoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <ImageIcon className="h-3 w-3" />
                                Photo
                              </a>
                            )}
                            {source.documentUrl && (
                              <a
                                href={source.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText className="h-3 w-3" />
                                Document
                              </a>
                            )}
                            {source.sensorLogUrl && (
                              <a
                                href={source.sensorLogUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText className="h-3 w-3" />
                                Sensor Log
                              </a>
                            )}
                            {source.maintenanceLogUrl && (
                              <a
                                href={source.maintenanceLogUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText className="h-3 w-3" />
                                Maintenance
                              </a>
                            )}
                            {source.attachments && source.attachments.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                +{source.attachments.length} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditSource(source)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSource(source.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Efficiency Tab */}
        <TabsContent value="efficiency" className="space-y-4">
          <h2 className="text-xl font-semibold">Irrigation Efficiency Analysis</h2>
          <Card>
            <CardHeader>
              <CardTitle>Water Usage & Efficiency Trends</CardTitle>
              <CardDescription>Track your irrigation efficiency over time</CardDescription>
            </CardHeader>
            <CardContent>
              {efficiencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="efficiency" stroke="#8884d8" name="Efficiency %" />
                    <Line type="monotone" dataKey="waterUsed" stroke="#82ca9d" name="Water Used (L)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No efficiency data yet. Complete irrigation schedules to see trends.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <h2 className="text-xl font-semibold">Irrigation Calendar</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Schedules for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Selected Date"}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-2">
                    {schedules
                      .filter((s) => {
                        const scheduleDate = new Date(s.scheduledDate);
                        return (
                          scheduleDate.getDate() === selectedDate.getDate() &&
                          scheduleDate.getMonth() === selectedDate.getMonth() &&
                          scheduleDate.getFullYear() === selectedDate.getFullYear()
                        );
                      })
                      .map((schedule) => (
                        <div key={schedule.id} className="p-3 border rounded-lg">
                          <div className="font-medium">{schedule.cropName}</div>
                          <div className="text-sm text-muted-foreground">
                            {schedule.field} • {schedule.waterAmount}L • {schedule.method}
                          </div>
                        </div>
                      ))}
                    {schedules.filter((s) => {
                      const scheduleDate = new Date(s.scheduledDate);
                      return (
                        scheduleDate.getDate() === selectedDate.getDate() &&
                        scheduleDate.getMonth() === selectedDate.getMonth() &&
                        scheduleDate.getFullYear() === selectedDate.getFullYear()
                      );
                    }).length === 0 && (
                      <p className="text-muted-foreground text-center py-8">No schedules for this date</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Select a date to view schedules</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "Edit" : "Create"} Irrigation Schedule</DialogTitle>
            <DialogDescription>
              Schedule irrigation for your crops with smart weather integration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Crop</Label>
              <Select value={scheduleForm.cropId} onValueChange={(value) => setScheduleForm({ ...scheduleForm, cropId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id!}>
                      {crop.name} - {crop.field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Field/Plot Name</Label>
              <Input
                value={scheduleForm.field}
                onChange={(e) => setScheduleForm({ ...scheduleForm, field: e.target.value })}
                placeholder="Enter field name"
              />
            </div>
            <div>
              <Label>Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleForm.scheduledDate ? format(scheduleForm.scheduledDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduleForm.scheduledDate}
                    onSelect={(date) => date && setScheduleForm({ ...scheduleForm, scheduledDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={scheduleForm.duration}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Water Amount (liters)</Label>
                <Input
                  type="number"
                  value={scheduleForm.waterAmount}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, waterAmount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Irrigation Method</Label>
              <Select
                value={scheduleForm.method}
                onValueChange={(value: any) => setScheduleForm({ ...scheduleForm, method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drip">Drip</SelectItem>
                  <SelectItem value="sprinkler">Sprinkler</SelectItem>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                placeholder="Add any additional notes..."
              />
            </div>
            
            {/* File Upload Section - Supabase Storage Integration */}
            <div className="space-y-4 pt-4 border-t">
              <div className="text-sm font-medium">Attach Files (Supabase Storage)</div>
              
              {/* Display existing files when editing */}
              {editingSchedule && (
                <div className="space-y-2 p-3 bg-secondary rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Existing Files:</div>
                  <div className="space-y-1">
                    {editingSchedule.weatherChartUrl && (
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={editingSchedule.weatherChartUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Weather Chart
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-destructive"
                          onClick={async () => {
                            try {
                              const url = new URL(editingSchedule.weatherChartUrl);
                              const path = url.pathname.split('/').slice(-3).join('/');
                              await deleteFile(path);
                              await updateScheduleMutation.mutateAsync({
                                id: editingSchedule.id,
                                updates: { weatherChartUrl: null },
                              });
                              toast.success("File deleted from Supabase");
                            } catch (error: any) {
                              toast.error(`Failed to delete file: ${error.message}`);
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {editingSchedule.sensorDataUrl && (
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={editingSchedule.sensorDataUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Sensor Data
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-destructive"
                          onClick={async () => {
                            try {
                              const url = new URL(editingSchedule.sensorDataUrl);
                              const path = url.pathname.split('/').slice(-3).join('/');
                              await deleteFile(path);
                              await updateScheduleMutation.mutateAsync({
                                id: editingSchedule.id,
                                updates: { sensorDataUrl: null },
                              });
                              toast.success("File deleted from Supabase");
                            } catch (error: any) {
                              toast.error(`Failed to delete file: ${error.message}`);
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {editingSchedule.reportUrl && (
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={editingSchedule.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Report
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-destructive"
                          onClick={async () => {
                            try {
                              const url = new URL(editingSchedule.reportUrl);
                              const path = url.pathname.split('/').slice(-3).join('/');
                              await deleteFile(path);
                              await updateScheduleMutation.mutateAsync({
                                id: editingSchedule.id,
                                updates: { reportUrl: null },
                              });
                              toast.success("File deleted from Supabase");
                            } catch (error: any) {
                              toast.error(`Failed to delete file: ${error.message}`);
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {editingSchedule.attachments && editingSchedule.attachments.length > 0 && (
                      <div className="space-y-1">
                        {editingSchedule.attachments.map((url: string, index: number) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Attachment {index + 1}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-destructive"
                              onClick={async () => {
                                try {
                                  const urlObj = new URL(url);
                                  const path = urlObj.pathname.split('/').slice(-3).join('/');
                                  await deleteFile(path);
                                  const newAttachments = editingSchedule.attachments.filter((_: string, i: number) => i !== index);
                                  await updateScheduleMutation.mutateAsync({
                                    id: editingSchedule.id,
                                    updates: { attachments: newAttachments },
                                  });
                                  toast.success("File deleted from Supabase");
                                } catch (error: any) {
                                  toast.error(`Failed to delete file: ${error.message}`);
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="weatherChart" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Weather Forecast Chart (Image)
                </Label>
                <Input
                  id="weatherChart"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setScheduleFiles({ ...scheduleFiles, weatherChart: file });
                  }}
                  className="mt-1"
                />
                {scheduleFiles.weatherChart && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {scheduleFiles.weatherChart.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setScheduleFiles({ ...scheduleFiles, weatherChart: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="sensorData" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  IoT Sensor Data (Image/File)
                </Label>
                <Input
                  id="sensorData"
                  type="file"
                  accept="image/*,.csv,.txt,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setScheduleFiles({ ...scheduleFiles, sensorData: file });
                  }}
                  className="mt-1"
                />
                {scheduleFiles.sensorData && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {scheduleFiles.sensorData.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setScheduleFiles({ ...scheduleFiles, sensorData: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="report" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cost-Benefit Report (PDF/DOC)
                </Label>
                <Input
                  id="report"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setScheduleFiles({ ...scheduleFiles, report: file });
                  }}
                  className="mt-1"
                />
                {scheduleFiles.report && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {scheduleFiles.report.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setScheduleFiles({ ...scheduleFiles, report: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="attachments" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Additional Attachments
                </Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setScheduleFiles({
                        ...scheduleFiles,
                        attachments: [...(scheduleFiles.attachments || []), ...files],
                      });
                    }
                  }}
                  className="mt-1"
                />
                {scheduleFiles.attachments && scheduleFiles.attachments.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {scheduleFiles.attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {file.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => {
                            const newAttachments = scheduleFiles.attachments?.filter((_, i) => i !== index);
                            setScheduleFiles({ ...scheduleFiles, attachments: newAttachments });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowScheduleDialog(false);
              setScheduleFiles({});
            }}>
              Cancel
            </Button>
            <Button 
              onClick={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
              disabled={uploadingScheduleFiles}
            >
              {uploadingScheduleFiles ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  {editingSchedule ? "Update" : "Create"} Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Water Source Dialog */}
      <Dialog open={showWaterSourceDialog} onOpenChange={setShowWaterSourceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSource ? "Edit" : "Add"} Water Source</DialogTitle>
            <DialogDescription>Manage your water sources and track availability</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Source Name</Label>
              <Input
                value={sourceForm.name}
                onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                placeholder="e.g., Main Reservoir"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={sourceForm.type}
                  onValueChange={(value: any) => setSourceForm({ ...sourceForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reservoir">Reservoir</SelectItem>
                    <SelectItem value="well">Well</SelectItem>
                    <SelectItem value="river">River</SelectItem>
                    <SelectItem value="borehole">Borehole</SelectItem>
                    <SelectItem value="tank">Tank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={sourceForm.status}
                  onValueChange={(value: any) => setSourceForm({ ...sourceForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="empty">Empty</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacity (liters)</Label>
                <Input
                  type="number"
                  value={sourceForm.capacity}
                  onChange={(e) => setSourceForm({ ...sourceForm, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Current Level (liters)</Label>
                <Input
                  type="number"
                  value={sourceForm.currentLevel}
                  onChange={(e) => setSourceForm({ ...sourceForm, currentLevel: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={sourceForm.location}
                onChange={(e) => setSourceForm({ ...sourceForm, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>
            <div>
              <Label>Refill Cost (KSh)</Label>
              <Input
                type="number"
                value={sourceForm.refillCost}
                onChange={(e) => setSourceForm({ ...sourceForm, refillCost: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={sourceForm.notes}
                onChange={(e) => setSourceForm({ ...sourceForm, notes: e.target.value })}
                placeholder="Add any additional notes..."
              />
            </div>
            
            {/* File Upload Section - Supabase Storage Integration */}
            <div className="space-y-4 pt-4 border-t">
              <div className="text-sm font-medium">Attach Files (Supabase Storage)</div>
              
              {/* Display existing files when editing */}
              {editingSource && (
                <div className="space-y-2 p-3 bg-secondary rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Existing Files:</div>
                  <div className="space-y-1">
                    {editingSource.photoUrl && (
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={editingSource.photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Photo
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-destructive"
                          onClick={async () => {
                            try {
                              const url = new URL(editingSource.photoUrl);
                              const path = url.pathname.split('/').slice(-3).join('/');
                              await deleteFile(path);
                              await updateSourceMutation.mutateAsync({
                                id: editingSource.id,
                                updates: { photoUrl: null },
                              });
                              toast.success("File deleted from Supabase");
                            } catch (error: any) {
                              toast.error(`Failed to delete file: ${error.message}`);
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {editingSource.documentUrl && (
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={editingSource.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Document
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-destructive"
                          onClick={async () => {
                            try {
                              const url = new URL(editingSource.documentUrl);
                              const path = url.pathname.split('/').slice(-3).join('/');
                              await deleteFile(path);
                              await updateSourceMutation.mutateAsync({
                                id: editingSource.id,
                                updates: { documentUrl: null },
                              });
                              toast.success("File deleted from Supabase");
                            } catch (error: any) {
                              toast.error(`Failed to delete file: ${error.message}`);
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {editingSource.sensorLogUrl && (
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={editingSource.sensorLogUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Sensor Log
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-destructive"
                          onClick={async () => {
                            try {
                              const url = new URL(editingSource.sensorLogUrl);
                              const path = url.pathname.split('/').slice(-3).join('/');
                              await deleteFile(path);
                              await updateSourceMutation.mutateAsync({
                                id: editingSource.id,
                                updates: { sensorLogUrl: null },
                              });
                              toast.success("File deleted from Supabase");
                            } catch (error: any) {
                              toast.error(`Failed to delete file: ${error.message}`);
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {editingSource.maintenanceLogUrl && (
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={editingSource.maintenanceLogUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Maintenance Log
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-destructive"
                          onClick={async () => {
                            try {
                              const url = new URL(editingSource.maintenanceLogUrl);
                              const path = url.pathname.split('/').slice(-3).join('/');
                              await deleteFile(path);
                              await updateSourceMutation.mutateAsync({
                                id: editingSource.id,
                                updates: { maintenanceLogUrl: null },
                              });
                              toast.success("File deleted from Supabase");
                            } catch (error: any) {
                              toast.error(`Failed to delete file: ${error.message}`);
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {editingSource.attachments && editingSource.attachments.length > 0 && (
                      <div className="space-y-1">
                        {editingSource.attachments.map((url: string, index: number) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Attachment {index + 1}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-destructive"
                              onClick={async () => {
                                try {
                                  const urlObj = new URL(url);
                                  const path = urlObj.pathname.split('/').slice(-3).join('/');
                                  await deleteFile(path);
                                  const newAttachments = editingSource.attachments.filter((_: string, i: number) => i !== index);
                                  await updateSourceMutation.mutateAsync({
                                    id: editingSource.id,
                                    updates: { attachments: newAttachments },
                                  });
                                  toast.success("File deleted from Supabase");
                                } catch (error: any) {
                                  toast.error(`Failed to delete file: ${error.message}`);
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="sourcePhoto" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Water Source Photo
                </Label>
                <Input
                  id="sourcePhoto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSourceFiles({ ...sourceFiles, photo: file });
                  }}
                  className="mt-1"
                />
                {sourceFiles.photo && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {sourceFiles.photo.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setSourceFiles({ ...sourceFiles, photo: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="sourceDocument" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents (Permits, Certificates)
                </Label>
                <Input
                  id="sourceDocument"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSourceFiles({ ...sourceFiles, document: file });
                  }}
                  className="mt-1"
                />
                {sourceFiles.document && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {sourceFiles.document.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setSourceFiles({ ...sourceFiles, document: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="sensorLog" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Sensor Data Logs
                </Label>
                <Input
                  id="sensorLog"
                  type="file"
                  accept=".csv,.txt,.json,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSourceFiles({ ...sourceFiles, sensorLog: file });
                  }}
                  className="mt-1"
                />
                {sourceFiles.sensorLog && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {sourceFiles.sensorLog.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setSourceFiles({ ...sourceFiles, sensorLog: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="maintenanceLog" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Maintenance Records
                </Label>
                <Input
                  id="maintenanceLog"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSourceFiles({ ...sourceFiles, maintenanceLog: file });
                  }}
                  className="mt-1"
                />
                {sourceFiles.maintenanceLog && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {sourceFiles.maintenanceLog.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setSourceFiles({ ...sourceFiles, maintenanceLog: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="sourceAttachments" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Additional Attachments
                </Label>
                <Input
                  id="sourceAttachments"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setSourceFiles({
                        ...sourceFiles,
                        attachments: [...(sourceFiles.attachments || []), ...files],
                      });
                    }
                  }}
                  className="mt-1"
                />
                {sourceFiles.attachments && sourceFiles.attachments.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {sourceFiles.attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {file.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => {
                            const newAttachments = sourceFiles.attachments?.filter((_, i) => i !== index);
                            setSourceFiles({ ...sourceFiles, attachments: newAttachments });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWaterSourceDialog(false);
              setSourceFiles({});
            }}>
              Cancel
            </Button>
            <Button 
              onClick={editingSource ? handleUpdateSource : handleCreateSource}
              disabled={uploadingSourceFiles}
            >
              {uploadingSourceFiles ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  {editingSource ? "Update" : "Create"} Source
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

