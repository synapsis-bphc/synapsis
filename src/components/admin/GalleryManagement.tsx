// src/components/admin/GalleryManagement.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, UploadCloud, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface GalleryItem {
  id: string;
  image_url: string;
  title?: string;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; completed: number } | null>(null);
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
      // Convert FileList to array and append to existing selection
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "No files selected", description: "Please choose one or more images to upload.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ total: selectedFiles.length, completed: 0 });

    const uploadedUrls: { image_url: string; title: string }[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `gallery/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("member-photos") // Assuming this is your general-purpose bucket
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("member-photos")
          .getPublicUrl(filePath);

        uploadedUrls.push({ image_url: publicUrl, title: file.name });
        setUploadProgress(prev => prev ? { ...prev, completed: i + 1 } : null);

      } catch (error) {
        console.error("Error uploading a file:", error);
        toast({ title: `Upload Failed for ${file.name}`, description: "Please try again.", variant: "destructive" });
        setIsUploading(false);
        setUploadProgress(null);
        return; // Stop the upload process if one file fails
      }
    }

    // After all files are uploaded to storage, insert records into the database
    try {
      const { error: insertError } = await supabase.from("gallery").insert(uploadedUrls);
      if (insertError) throw insertError;

      toast({ title: "Upload Complete!", description: `${uploadedUrls.length} images added to the gallery.` });
      setSelectedFiles([]);
      fetchGalleryItems(); // Refresh the gallery
      await updateMetadataTimestamp(); // Update the timestamp
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
      // 1. Delete from storage
      const filePath = item.image_url.split('/gallery/')[1];
      if (filePath) {
        await supabase.storage.from("member-photos").remove([`gallery/${filePath}`]);
      }

      // 2. Delete from database
      await supabase.from("gallery").delete().eq("id", item.id);

      toast({ title: "Success", description: "Image deleted successfully." });
      fetchGalleryItems();
      await updateMetadataTimestamp(); // Update the timestamp
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({ title: "Error", description: "Failed to delete image.", variant: "destructive" });
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover rounded-md" />
                    <button onClick={() => removeSelectedFile(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
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
                <Button variant="outline" onClick={() => setSelectedFiles([])} disabled={isUploading}>Clear Selection</Button>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {galleryItems.map((item) => (
                <div key={item.id} className="relative group">
                  <img src={item.image_url} alt={item.title || 'Gallery image'} className="w-full h-24 object-cover rounded-md" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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