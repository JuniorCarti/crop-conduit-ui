/**
 * Create Listing Form Component
 * Form for sellers to create new listings
 */

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X, Loader2, LocateFixed, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Listing } from "../models/types";
import { createListingWithProfile, uploadToR2 } from "@/services/marketplaceService";

const normalizePhoneNumber = (value: string): string | null => {
  const trimmed = value.trim().replace(/\s+/g, "").replace(/-/g, "");
  if (!trimmed) return null;

  let normalized = trimmed;
  if (trimmed.startsWith("0")) {
    normalized = `+254${trimmed.slice(1)}`;
  } else if (trimmed.startsWith("254")) {
    normalized = `+${trimmed}`;
  } else if (!trimmed.startsWith("+")) {
    return null;
  }

  const digits = normalized.startsWith("+") ? normalized.slice(1) : normalized;
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length < 10 || digits.length > 13) return null;
  return normalized;
};

const isValidPhoneNumber = (value: string) => Boolean(normalizePhoneNumber(value));

const listingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  cropType: z.string().min(1, "Crop type is required"),
  variety: z.string().optional(),
  quantity: z.number().min(0.1, "Quantity must be greater than 0"),
  unit: z.enum(["kg", "tons", "bags", "crates", "pieces"]),
  pricePerUnit: z.number().min(1, "Price must be greater than 0"),
  currency: z.enum(["KES", "USD"]),
  county: z.string().min(1, "County is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .refine((value) => isValidPhoneNumber(value), {
      message: "Enter a valid Kenyan phone number",
    }),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface CreateListingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export function CreateListingForm({ onSuccess, onCancel }: CreateListingFormProps) {
  const { currentUser } = useAuth();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState<{ type: "warning" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      currency: "KES",
      unit: "kg",
    },
  });

  useEffect(() => {
    if (currentUser?.phoneNumber) {
      const normalized = normalizePhoneNumber(currentUser.phoneNumber);
      if (normalized) {
        setValue("phoneNumber", normalized, { shouldDirty: false });
      }
    }
  }, [currentUser?.phoneNumber, setValue]);

  const hasLocation = Boolean(locationCoords);

  const locationBadge = useMemo(() => {
    if (!hasLocation) return null;
    return (
      <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200">
        Location captured
      </Badge>
    );
  }, [hasLocation]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentUser?.uid) return;

    const selectedFiles = Array.from(files);
    const remainingSlots = MAX_IMAGES - imageUrls.length;

    if (remainingSlots <= 0) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} images.`);
      event.target.value = "";
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more image(s) can be added (max ${MAX_IMAGES}).`);
      event.target.value = "";
      return;
    }

    for (const file of selectedFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const isTypeAllowed =
        ALLOWED_IMAGE_TYPES.has(file.type) || ALLOWED_IMAGE_EXTENSIONS.has(extension);
      if (!isTypeAllowed) {
        toast.error("Only JPG, JPEG, PNG, or WEBP images are allowed.");
        event.target.value = "";
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error("Each image must be 5MB or smaller.");
        event.target.value = "";
        return;
      }
    }

    let didFail = false;
    try {
      setUploadingImages(true);
      setUploadError(null);
      setUploadProgress({ completed: 0, total: selectedFiles.length });
      const urls = await uploadToR2(selectedFiles);
      setImageUrls((prev) => [...prev, ...urls]);
      setUploadProgress({ completed: selectedFiles.length, total: selectedFiles.length });
      toast.success("Images uploaded successfully");
    } catch (error: any) {
      const message = error?.message || "Failed to upload images";
      setUploadError(message);
      toast.error(message);
      didFail = true;
    } finally {
      setUploadingImages(false);
      if (!didFail) {
        setUploadProgress(null);
      }
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      const message =
        "Geolocation is not supported on this device. Listings without location won't appear on the Map tab.";
      setLocationMessage({ type: "warning", text: message });
      toast.warning(message);
      return;
    }

    setIsLocating(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocationCoords({ lat, lon });
        setValue("lat", lat, { shouldValidate: false, shouldDirty: true });
        // Keep existing lng wiring for compatibility while also storing lon.
        setValue("lng", lon, { shouldValidate: false, shouldDirty: true });
        setIsLocating(false);
        toast.success("Location captured.");
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setIsLocating(false);
        const message =
          "We couldn't access your location. You can still create the listing, but it won't appear on the Map tab.";
        setLocationMessage({ type: "warning", text: message });
        toast.warning(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const onSubmit = async (data: ListingFormData) => {
    if (!currentUser?.uid) {
      toast.error("Please sign in to create a listing");
      return;
    }

    if (uploadingImages) {
      toast.error("Please wait for image uploads to finish");
      return;
    }

    if (uploadError) {
      toast.error("Please resolve image upload errors before creating a listing");
      return;
    }

    if (imageUrls.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    if (!hasLocation) {
      const message =
        "Listings without location coordinates will not appear on the Map tab.";
      setLocationMessage({ type: "warning", text: message });
      toast.warning(message);
    }

    try {
      setIsSubmitting(true);
      const lat = locationCoords?.lat ?? data.lat ?? null;
      const lon = locationCoords?.lon ?? data.lng ?? null;
      const normalizedPhone = normalizePhoneNumber(data.phoneNumber);
      if (!normalizedPhone) {
        toast.error("Please enter a valid phone number.");
        return;
      }

      const listing = {
        title: data.title,
        cropType: data.cropType,
        variety: data.variety,
        quantity: data.quantity,
        unit: data.unit,
        pricePerUnit: data.pricePerUnit,
        currency: data.currency,
        phoneNumber: normalizedPhone,
        location: {
          lat,
          lon,
          // Preserve lng for existing UI/hooks that expect it.
          lng: lon,
          county: data.county || "",
          address: data.address || "",
        },
        images: imageUrls || [],
        imageUrls,
        description: data.description,
        tags: data.tags || [],
        status: "active",
      } as Omit<Listing, "id" | "createdAt" | "updatedAt" | "sellerId"> & {
        imageUrls: string[];
      };

      await createListingWithProfile(listing, currentUser);
      toast.success("Listing created successfully");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error(error?.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Listing</CardTitle>
        <CardDescription>List your crops for sale on the marketplace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g., Fresh Maize from Nakuru"
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cropType">Crop Type *</Label>
              <Input
                id="cropType"
                {...register("cropType")}
                placeholder="e.g., Maize, Wheat"
              />
              {errors.cropType && (
                <p className="text-sm text-destructive mt-1">{errors.cropType.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="variety">Variety</Label>
              <Input
                id="variety"
                {...register("variety")}
                placeholder="e.g., Hybrid 513"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={watch("unit")}
                onValueChange={(value) => setValue("unit", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="tons">tons</SelectItem>
                  <SelectItem value="bags">bags</SelectItem>
                  <SelectItem value="crates">crates</SelectItem>
                  <SelectItem value="pieces">pieces</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pricePerUnit">Price per Unit *</Label>
              <Input
                id="pricePerUnit"
                type="number"
                step="0.01"
                {...register("pricePerUnit", { valueAsNumber: true })}
              />
              {errors.pricePerUnit && (
                <p className="text-sm text-destructive mt-1">{errors.pricePerUnit.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="county">County *</Label>
                {locationBadge}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input id="county" {...register("county")} placeholder="e.g., Nakuru" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Locating...
                    </>
                  ) : (
                    <>
                      <LocateFixed className="h-4 w-4" />
                      Use my location
                    </>
                  )}
                </Button>
              </div>
              {errors.county && (
                <p className="text-sm text-destructive mt-1">{errors.county.message}</p>
              )}
              {locationMessage && (
                <p
                  className={`text-xs mt-2 ${
                    locationMessage.type === "error"
                      ? "text-destructive"
                      : "text-amber-600"
                  }`}
                >
                  {locationMessage.text}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={watch("currency")}
                onValueChange={(value) => setValue("currency", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="phoneNumber"
                {...register("phoneNumber")}
                placeholder="e.g., 0712345678 or +254712345678"
              />
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>
            {errors.phoneNumber && (
              <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe your crop, quality, harvest date, etc."
              rows={4}
            />
          </div>

          <div>
            <Label>Images *</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  disabled={uploadingImages}
                >
                  {uploadingImages ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Images
                    </>
                  )}
                </Button>
                {uploadingImages && uploadProgress && (
                  <span className="text-xs text-muted-foreground">
                    Uploading {uploadProgress.completed}/{uploadProgress.total}...
                  </span>
                )}
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 gap-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`Listing ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || uploadingImages || !!uploadError}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Listing"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
