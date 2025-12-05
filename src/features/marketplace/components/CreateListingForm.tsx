/**
 * Create Listing Form Component
 * Form for sellers to create new listings
 */

import { useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateListing } from "../hooks/useMarketplace";
import { uploadImage } from "../services/StorageService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Listing } from "../models/types";

const listingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  cropType: z.string().min(1, "Crop type is required"),
  variety: z.string().optional(),
  quantity: z.number().min(0.1, "Quantity must be greater than 0"),
  unit: z.enum(["kg", "tons", "bags", "crates", "pieces"]),
  pricePerUnit: z.number().min(1, "Price must be greater than 0"),
  currency: z.enum(["KES", "USD"]),
  county: z.string().min(1, "County is required"),
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

export function CreateListingForm({ onSuccess, onCancel }: CreateListingFormProps) {
  const { currentUser } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const createListing = useCreateListing();

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

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentUser?.uid) return;

    try {
      setUploadingImages(true);
      // Upload to Supabase Storage
      const uploadPromises = Array.from(files).map((file) =>
        uploadImage(file, "listings", currentUser.uid)
      );
      const urls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...urls]);
      toast.success("Images uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ListingFormData) => {
    if (!currentUser?.uid) {
      toast.error("Please sign in to create a listing");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    try {
      const listing: Omit<Listing, "id" | "createdAt" | "updatedAt" | "sellerId"> = {
        title: data.title,
        cropType: data.cropType,
        variety: data.variety,
        quantity: data.quantity,
        unit: data.unit,
        pricePerUnit: data.pricePerUnit,
        currency: data.currency,
        location: {
          lat: data.lat || 0,
          lng: data.lng || 0,
          county: data.county,
          address: data.address,
        },
        images,
        description: data.description,
        tags: data.tags || [],
        status: "active",
      };

      await createListing.mutateAsync(listing);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating listing:", error);
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
              <Label htmlFor="county">County *</Label>
              <Input id="county" {...register("county")} placeholder="e.g., Nakuru" />
              {errors.county && (
                <p className="text-sm text-destructive mt-1">{errors.county.message}</p>
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
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 gap-2">
                  {images.map((url, index) => (
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
            <Button type="submit" disabled={createListing.isPending}>
              {createListing.isPending ? (
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
