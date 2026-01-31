import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, MapPin, Tag, Wheat } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPost, getPresignedUpload } from "@/services/communityService";
import type { CommunityPost, MediaItem } from "@/types/community";
import { useIsMobile } from "@/hooks/use-mobile";

const TAG_OPTIONS = ["Market", "Weather", "Pests", "Inputs", "Irrigation", "Harvest", "Livestock"];
const CROP_OPTIONS = ["Maize", "Tomatoes", "Potatoes", "Beans", "Millet", "Dairy", "Poultry"];

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (post: CommunityPost) => void;
}

export function CreatePostModal({ open, onOpenChange, onCreated }: CreatePostModalProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const previousBodyOverflow = useRef<string | null>(null);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [crop, setCrop] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const mediaType = useMemo(() => {
    if (!file) return "image" as const;
    return file.type.startsWith("video") ? "video" : "image";
  }, [file]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      previousBodyOverflow.current = document.body.style.overflow || null;
      document.body.style.overflow = "auto";
    }
    return () => {
      if (previousBodyOverflow.current !== null) {
        document.body.style.overflow = previousBodyOverflow.current;
      }
    };
  }, [open]);

  const createMutation = useMutation({
    mutationFn: (payload: {
      text: string;
      tags: string[];
      crop?: string;
      location?: string;
      media?: MediaItem[];
    }) => createPost(payload),
    onSuccess: (post) => {
      queryClient.setQueryData(["community", "feed"], (old: any) => {
        if (!old?.pages?.length) return old;
        const first = old.pages[0];
        return {
          ...old,
          pages: [
            { ...first, items: [post, ...first.items] },
            ...old.pages.slice(1),
          ],
        };
      });
      queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
      onCreated?.(post);
      toast.success("Post published");
      setText("");
      setTags([]);
      setCrop(undefined);
      setLocation("");
      setFile(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create post");
    },
  });

  const toggleTag = (value: string) => {
    setTags((prev) => (prev.includes(value) ? prev.filter((tag) => tag !== value) : [...prev, value]));
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error("Please write something before posting");
      return;
    }

    let mediaItems: MediaItem[] | undefined;

    if (file) {
      if (!(file instanceof File) || !file.name) {
        toast.error("Invalid file selected. Please reselect.");
        return;
      }
      if (!file.type) {
        toast.error("Invalid file selected. Please reselect.");
        return;
      }

      try {
        setUploading(true);
        const { uploadUrl, fileUrl } = await getPresignedUpload({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        });

        await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        mediaItems = [{ url: fileUrl, type: mediaType }];
      } catch (error: any) {
        toast.error(error?.message || "Upload failed");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    createMutation.mutate({
      text: text.trim(),
      tags,
      crop,
      location: location.trim() || undefined,
      media: mediaItems && mediaItems.length ? mediaItems : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-border/60">
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 pb-28 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Message</label>
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Share market tips, pest alerts, or harvest wins..."
              className="min-h-[160px] text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant={tags.includes(tag) ? "default" : "secondary"}
                  className={tags.includes(tag) ? "bg-emerald-600 hover:bg-emerald-700 h-10 px-4" : "h-10 px-4"}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Wheat className="h-4 w-4" />
                Crop (optional)
              </label>
              <Select value={crop} onValueChange={(value) => setCrop(value)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {CROP_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location (optional)
              </label>
              <Input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. Nakuru"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              Media upload
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="h-11 px-5"
                onClick={() => document.getElementById("community-media")?.click()}
              >
                Choose file
              </Button>
              {file ? <Badge variant="secondary">{file.name}</Badge> : <span className="text-xs text-muted-foreground">Optional</span>}
              <input
                id="community-media"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </div>
            {previewUrl ? (
              <div className="rounded-xl overflow-hidden border border-border/60">
                {mediaType === "video" ? (
                  <video className={isMobile ? "w-full max-h-56" : "w-full aspect-video"} controls src={previewUrl} />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={isMobile ? "w-full max-h-56 object-cover" : "w-full aspect-video object-cover"}
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/60 px-6 py-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" className="h-11 px-6" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6"
            disabled={createMutation.isPending || uploading}
            onClick={handleSubmit}
          >
            {uploading ? "Uploading..." : createMutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
