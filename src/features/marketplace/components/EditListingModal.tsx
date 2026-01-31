import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Listing } from "@/features/marketplace/models/types";
import { requestListingEdit, uploadToR2 } from "@/services/marketplaceService";

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

const editSchema = z.object({
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
  lon: z.number().optional(),
  description: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

interface EditListingModalProps {
  open: boolean;
  listing: Listing | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function EditListingModal({ open, listing, onClose, onSubmitted }: EditListingModalProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: listing?.title ?? "",
      cropType: listing?.cropType ?? "",
      variety: listing?.variety ?? "",
      quantity: listing?.quantity ?? 1,
      unit: listing?.unit ?? "kg",
      pricePerUnit: listing?.pricePerUnit ?? 1,
      currency: listing?.currency ?? "KES",
      county: listing?.location?.county ?? "",
      phoneNumber: listing?.phoneNumber ?? "",
      address: listing?.location?.address ?? "",
      lat: listing?.location?.lat ?? undefined,
      lon: listing?.location?.lon ?? listing?.location?.lng ?? undefined,
      description: listing?.description ?? "",
    },
  });

  useEffect(() => {
    if (!listing) return;
    setValue("title", listing.title);
    setValue("cropType", listing.cropType);
    setValue("variety", listing.variety ?? "");
    setValue("quantity", listing.quantity);
    setValue("unit", listing.unit);
    setValue("pricePerUnit", listing.pricePerUnit);
    setValue("currency", listing.currency);
    setValue("county", listing.location?.county ?? "");
    setValue("phoneNumber", listing.phoneNumber ?? "");
    setValue("address", listing.location?.address ?? "");
    setValue("lat", listing.location?.lat ?? undefined);
    setValue("lon", listing.location?.lon ?? listing.location?.lng ?? undefined);
    setValue("description", listing.description ?? "");
    setImageUrls(Array.isArray(listing.images) ? listing.images : []);
  }, [listing, setValue]);

  const remainingSlots = useMemo(() => Math.max(0, MAX_IMAGES - imageUrls.length), [imageUrls.length]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !listing) return;

    const selectedFiles = Array.from(files);
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
    } finally {
      setUploadingImages(false);
      setUploadProgress(null);
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const buildPatch = (data: EditFormData): Record<string, unknown> => {
    if (!listing) return {};
    const patch: Record<string, unknown> = {};

    if (data.title !== listing.title) patch.title = data.title;
    if (data.cropType !== listing.cropType) patch.cropType = data.cropType;
    if ((data.variety || "") !== (listing.variety || "")) patch.variety = data.variety || "";
    if (data.quantity !== listing.quantity) patch.quantity = data.quantity;
    if (data.unit !== listing.unit) patch.unit = data.unit;
    if (data.pricePerUnit !== listing.pricePerUnit) patch.pricePerUnit = data.pricePerUnit;
    if (data.currency !== listing.currency) patch.currency = data.currency;
    if ((data.description || "") !== (listing.description || "")) patch.description = data.description || "";

    const normalizedPhone = normalizePhoneNumber(data.phoneNumber);
    if (!normalizedPhone) {
      throw new Error("Enter a valid phone number.");
    }
    if (normalizedPhone !== listing.phoneNumber) patch.phoneNumber = normalizedPhone;

    const currentAddress = listing.location?.address || "";
    const currentLat = listing.location?.lat ?? null;
    const currentLon = listing.location?.lon ?? listing.location?.lng ?? null;
    const nextLat = data.lat ?? currentLat;
    const nextLon = data.lon ?? currentLon;
    const nextAddress = data.address ?? "";
    const nextCounty = data.county;

    const locationChanged =
      nextLat !== currentLat ||
      nextLon !== currentLon ||
      nextAddress !== currentAddress ||
      nextCounty !== listing.location?.county;

    if (locationChanged) {
      patch.location = {
        lat: nextLat ?? null,
        lon: nextLon ?? null,
        lng: nextLon ?? null,
        address: nextAddress,
        county: nextCounty,
      };
    }

    if (JSON.stringify(imageUrls) !== JSON.stringify(listing.images ?? [])) {
      patch.images = imageUrls;
    }

    return patch;
  };

  const onSubmit = async (data: EditFormData) => {
    if (!listing?.id) return;
    if (uploadingImages) {
      toast.error("Please wait for image uploads to finish");
      return;
    }
    if (uploadError) {
      toast.error("Please resolve image upload errors before submitting edits");
      return;
    }

    try {
      setIsSubmitting(true);
      const patch = buildPatch(data);
      if (Object.keys(patch).length === 0) {
        toast.error("No changes to submit.");
        return;
      }

      await requestListingEdit(listing, patch);
      toast.success("Update submitted. Review takes 1-2 hours.");
      onSubmitted?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit update.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cropType">Crop Type *</Label>
              <Input id="cropType" {...register("cropType")} />
              {errors.cropType && <p className="text-sm text-destructive mt-1">{errors.cropType.message}</p>}
            </div>
            <div>
              <Label htmlFor="variety">Variety</Label>
              <Input id="variety" {...register("variety")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" type="number" step="0.1" {...register("quantity", { valueAsNumber: true })} />
              {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Select value={watch("unit")} onValueChange={(value) => setValue("unit", value as any)}>
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
              <Input id="pricePerUnit" type="number" step="0.01" {...register("pricePerUnit", { valueAsNumber: true })} />
              {errors.pricePerUnit && (
                <p className="text-sm text-destructive mt-1">{errors.pricePerUnit.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="county">County *</Label>
              <Input id="county" {...register("county")} />
              {errors.county && <p className="text-sm text-destructive mt-1">{errors.county.message}</p>}
            </div>
            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select value={watch("currency")} onValueChange={(value) => setValue("currency", value as any)}>
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
            <Input id="phoneNumber" {...register("phoneNumber")} />
            {errors.phoneNumber && <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" type="number" step="0.000001" {...register("lat", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="lon">Longitude</Label>
              <Input id="lon" type="number" step="0.000001" {...register("lon", { valueAsNumber: true })} />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} {...register("description")} />
          </div>

          <div>
            <Label>Images</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("edit-image-upload")?.click()}
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
                  id="edit-image-upload"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {imageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={url} alt={`Listing ${index + 1}`} className="w-full h-full object-cover" />
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

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || uploadingImages || !!uploadError}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Update"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditListingModal;
