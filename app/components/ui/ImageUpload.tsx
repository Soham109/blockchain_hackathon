"use client";
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image using canvas
  async function compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to data URL with compression
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // If still too large, reduce quality further
          if (dataUrl.length > 500 * 1024) { // 500KB limit per image
            const reducedQuality = Math.max(0.3, quality - 0.2);
            const compressed = canvas.toDataURL('image/jpeg', reducedQuality);
            resolve(compressed);
          } else {
            resolve(dataUrl);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async function processFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      return;
    }
    
    const filesToUpload = files.slice(0, remainingSlots);

    setUploading(true);
    try {
      const newImages: string[] = [];
      for (const file of filesToUpload) {
        if (file.type.startsWith('image/')) {
          // Validate file size (max 10MB before compression)
          if (file.size > 10 * 1024 * 1024) {
            console.warn(`File ${file.name} is too large (max 10MB before compression)`);
            continue;
          }
          
          try {
            // Compress image before converting to data URL
            const compressedDataUrl = await compressImage(file);
            
            if (compressedDataUrl && compressedDataUrl.length > 0) {
              newImages.push(compressedDataUrl);
            }
          } catch (error) {
            console.error(`Failed to compress image ${file.name}:`, error);
            // Fallback to original if compression fails
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              if (result && result.length > 0) {
                resolve(result);
              } else {
                reject(new Error('Failed to read file'));
              }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });
          if (dataUrl && dataUrl.length > 0) {
            newImages.push(dataUrl);
            }
          }
        }
      }
      
      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploading) {
      return;
    }

    const files = Array.from(e.dataTransfer.files || []);
    await processFiles(files);
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <Card className="overflow-hidden border-2">
                <div className="aspect-square relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeImage(index)}
                      className="cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <Card 
          className={cn(
            "border-2 border-dashed transition-all",
            isDragging 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "hover:border-primary/50",
            images.length === 0 && "border-primary/30"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="p-6">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (fileInputRef.current && !uploading) {
                  // Reset the input value to allow selecting the same file again
                  fileInputRef.current.value = '';
                  // Use setTimeout to ensure the click happens after any state updates
                  setTimeout(() => {
                    fileInputRef.current?.click();
                  }, 0);
                }
              }}
              disabled={uploading}
              className="w-full flex flex-col items-center justify-center gap-3 py-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                </>
              ) : (
                <>
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                    isDragging ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Upload className={cn(
                      "h-6 w-6 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isDragging ? "Drop images here" : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {images.length > 0 
                        ? `Add ${maxImages - images.length} more image${maxImages - images.length > 1 ? 's' : ''}`
                        : `Upload up to ${maxImages} images (PNG, JPG, GIF)`
                      }
                    </p>
                  </div>
                </>
              )}
            </button>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
}
