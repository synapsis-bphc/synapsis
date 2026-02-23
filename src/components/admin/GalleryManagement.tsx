// src/components/admin/GalleryManagement.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, UploadCloud, X, Pencil, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface GalleryItem {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
}

interface FileWithMeta {
  file: File;
  previewUrl: string;
  description: string;
}

// Function to update the metadata timestamp
const updateMetadataTimestamp = async () => {
  try {
    const { error } = await supabase.rpc('update_last_updated_timestamp');
    if (error) throw error;
  } catch (error) {
    console.error('Error updating metadata timestamp:', error);
  }
};

export function GalleryManagement() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithMeta[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; completed: number } | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGalleryItems(data || []);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
      toast({ title: "Error", description: "Failed to fetch gallery items.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileWithMeta[] = Array.from(e.target.files).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        description: "",
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateFileDescription = (index: number, description: string) => {
    setSelectedFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, description } : f))
    );
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "No files selected", description: "Please choose one or more images to upload.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ total: selectedFiles.length, completed: 0 });

    const uploadedRows: { image_url: string; title: string; description: string | null }[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const { file, description } = selectedFiles[i];
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `gallery/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("member-photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("member-photos")
          .getPublicUrl(filePath);

        uploadedRows.push({
          image_url: publicUrl,
          title: file.name,
          description: description.trim() || null,
        });
        setUploadProgress((prev) => prev ? { ...prev, completed: i + 1 } : null);
      } catch (error) {
        console.error("Error uploading a file:", error);
        toast({ title: `Upload Failed for ${file.name}`, description: "Please try again.", variant: "destructive" });
        setIsUploading(false);
        setUploadProgress(null);
        return;
      }
    }

    try {
      const { error: insertError } = await supabase.from("gallery").insert(uploadedRows);
      if (insertError) throw insertError;

      toast({ title: "Upload Complete!", description: `${uploadedRows.length} images added to the gallery.` });
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setSelectedFiles([]);
      fetchGalleryItems();
      await updateMetadataTimestamp();
    } catch (error) {
      console.error("Error inserting gallery records:", error);
      toast({ title: "Database Error", description: "Images were uploaded but failed to save to the gallery.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(`Are you sure you want to delete this image?`)) return;
    try {
      const filePath = item.image_url.split('/gallery/')[1];
      if (filePath) {
        await supabase.storage.from("member-photos").remove([`gallery/${filePath}`]);
      }
      await supabase.from("gallery").delete().eq("id", item.id);
      toast({ title: "Success", description: "Image deleted successfully." });
      fetchGalleryItems();
      await updateMetadataTimestamp();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({ title: "Error", description: "Failed to delete image.", variant: "destructive" });
    }
  };

  const startEditDescription = (item: GalleryItem) => {
    setEditingId(item.id);
    setEditingDescription(item.description || "");
  };

  const saveDescription = async (item: GalleryItem) => {
    try {
      const { error } = await supabase
        .from("gallery")
        .update({ description: editingDescription.trim() || null })
        .eq("id", item.id);
      if (error) throw error;
      toast({ title: "Saved", description: "Description updated." });
      setEditingId(null);
      fetchGalleryItems();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save description.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Image Uploader</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="image-upload" className="w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
              <span className="mt-4 font-semibold text-primary">Click to select files</span>
              <p className="text-sm text-muted-foreground">or drag and drop images here</p>
            </Label>
            <Input id="image-upload" type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold">Selected Files ({selectedFiles.length}):</h4>
              <div className="space-y-3">
                {selectedFiles.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start border rounded-lg p-3">
                    <div className="relative flex-shrink-0">
                      <img src={item.previewUrl} alt={item.file.name} className="w-20 h-20 object-cover rounded-md" />
                      <button
                        onClick={() => removeSelectedFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <Textarea
                        placeholder="Description (optional)…"
                        className="text-sm resize-none"
                        rows={2}
                        value={item.description}
                        onChange={(e) => updateFileDescription(index, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {isUploading && uploadProgress && (
                <div className="space-y-2">
                  <p>Uploading {uploadProgress.completed} of {uploadProgress.total}...</p>
                  <Progress value={(uploadProgress.completed / uploadProgress.total) * 100} />
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleBulkUpload} disabled={isUploading}>
                  {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} Images`}
                </Button>
                <Button variant="outline" onClick={() => { selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl)); setSelectedFiles([]); }} disabled={isUploading}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Gallery Items */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Existing Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading gallery...</p>
          ) : galleryItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryItems.map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden flex flex-col">
                  <div className="relative group">
                    <img
                      src={item.image_url}
                      alt={item.title || 'Gallery image'}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 flex-1 flex flex-col gap-1">
                    {editingId === item.id ? (
                      <>
                        <Textarea
                          className="text-sm resize-none"
                          rows={3}
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          placeholder="Add a description…"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button size="sm" className="flex-1" onClick={() => saveDescription(item)}>
                            <Check className="h-3 w-3 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                          {item.description || <span className="italic">No description</span>}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-xs"
                          onClick={() => startEditDescription(item)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          {item.description ? "Edit description" : "Add description"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No images in the gallery yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}