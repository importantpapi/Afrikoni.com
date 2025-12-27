/**
 * Smart Image Uploader Component
 * 
 * Features:
 * - Drag and drop
 * - Image preview with reorder
 * - Auto-compression
 * - Validation
 * - Upload to product-images bucket
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, GripVertical, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';

export default function SmartImageUploader({ 
  images = [], 
  onImagesChange,
  userId,
  maxImages = 5,
  maxSizeMB = 5,
  onFirstImageUpload = null // Callback when first image is uploaded (for AI analysis)
}) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Auto-crop and center image to 1:1 aspect ratio with clean background
  const cropAndCenterImage = (file, size = 1200, quality = 0.9) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          // Fill with white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
          
          // Calculate dimensions to center and fit image
          const imgAspect = img.width / img.height;
          let drawWidth = size;
          let drawHeight = size;
          let offsetX = 0;
          let offsetY = 0;
          
          if (imgAspect > 1) {
            // Image is wider - fit to height
            drawWidth = size * imgAspect;
            offsetX = (size - drawWidth) / 2;
          } else {
            // Image is taller - fit to width
            drawHeight = size / imgAspect;
            offsetY = (size - drawHeight) / 2;
          }
          
          // Draw image centered
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          
          canvas.toBlob(
            (blob) => {
              const croppedFile = new File([blob], file.name, {
                type: 'image/jpeg', // Always convert to JPEG for consistency
                lastModified: Date.now(),
              });
              resolve(croppedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Compress image if needed - optimized for better performance
  const compressImage = (file, maxWidth = 1920, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if too large - use more aggressive compression for large images
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
            // Reduce quality for very large images to save bandwidth
            if (file.size > 5 * 1024 * 1024) {
              quality = 0.75;
            }
          }

          // Use better image quality settings
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Enable better image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.drawImage(img, 0, 0, width, height);

          // Prefer JPEG for better compression, fallback to original type
          const outputType = file.type === 'image/png' && file.size > 2 * 1024 * 1024 
            ? 'image/jpeg' 
            : file.type;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Fallback if compression fails
                resolve(file);
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: outputType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            outputType,
            quality
          );
        };
        img.onerror = () => {
          // Fallback on error
          resolve(file);
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        // Fallback on read error
        resolve(file);
      };
      reader.readAsDataURL(file);
    });
  };

  // Validate file
  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = maxSizeMB * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error(`${file.name}: Only JPEG, PNG, WebP, GIF allowed`);
      return false;
    }

    if (file.size > maxSize) {
      toast.error(`${file.name}: Max size ${maxSizeMB}MB. Will compress automatically.`);
      // Still allow, will compress
    }

    return true;
  };

  // Upload single image with auto-crop and thumbnail generation
  const uploadImage = async (file, isFirstImage = false) => {
    if (!validateFile(file)) return null;

    // Ensure userId is available
    if (!userId) {
      toast.error('User ID is required to upload images. Please refresh the page.');
      return null;
    }

    try {
      // Auto-crop and center first image to 1:1 aspect (main product image)
      let fileToUpload = file;
      if (isFirstImage) {
        fileToUpload = await cropAndCenterImage(file, 1200, 0.9);
      } else if (file.size > 2 * 1024 * 1024) {
        // Compress other images if > 2MB
        fileToUpload = await compressImage(file);
      }

      // Generate unique path: products/{userId}/{timestamp}-{random}.{ext}
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const path = `products/${userId}/${timestamp}-${randomStr}.jpg`; // Always .jpg after crop

      // Upload main image using helper for consistent error handling
      const uploadResult = await supabaseHelpers.storage.uploadFile(
        fileToUpload,
        'product-images',
        path,
        {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        }
      );

      const publicUrl = uploadResult.file_url;

      // Generate thumbnail (300x300) for first image
      let thumbnailUrl = publicUrl;
      if (isFirstImage) {
        try {
          const thumbnailFile = await cropAndCenterImage(file, 300, 0.85);
          const thumbPath = `products/${userId}/${timestamp}-${randomStr}-thumb.jpg`;
          const thumbResult = await supabaseHelpers.storage.uploadFile(
            thumbnailFile,
            'product-images',
            thumbPath,
            {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/jpeg'
            }
          );
          
          if (thumbResult?.file_url) {
            thumbnailUrl = thumbResult.file_url;
          }
        } catch (thumbError) {
          // Thumbnail generation is optional, continue with main image
          console.warn('Thumbnail generation failed (optional):', thumbError);
        }
      }

      return {
        url: publicUrl,
        thumbnail_url: thumbnailUrl,
        path: uploadResult.path,
        is_primary: images.length === 0,
        sort_order: images.length
      };
    } catch (error) {
      // Error handled by toast below
      toast.error(`Failed to upload ${file.name}: ${error.message}`);
      return null;
    }
  };

  // Handle file upload
  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s)`);
      fileArray.splice(remainingSlots);
    }

    if (fileArray.length === 0) return;

    setUploading(true);
    try {
      // Upload sequentially to ensure first image gets special treatment
      const successful = [];
      for (let i = 0; i < fileArray.length; i++) {
        const isFirstImage = images.length === 0 && i === 0;
        const result = await uploadImage(fileArray[i], isFirstImage);
        if (result) {
          successful.push(result);
        }
      }
      
      if (successful.length > 0) {
        const newImages = [...images, ...successful];
        onImagesChange(newImages);
        toast.success(`${successful.length} image(s) uploaded successfully${images.length === 0 ? ' - First image auto-cropped to 1:1' : ''}`);
        
        // Trigger callback for AI analysis if first image
        if (images.length === 0 && successful.length > 0 && onFirstImageUpload) {
          onFirstImageUpload(successful[0]);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [images]);

  // Remove image
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    // Update sort_order
    const updated = newImages.map((img, i) => ({
      ...img,
      sort_order: i,
      is_primary: i === 0
    }));
    onImagesChange(updated);
  };

  // Set as primary
  const setPrimary = (index) => {
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
      sort_order: i === index ? 0 : (i < index ? i + 1 : i)
    }));
    // Reorder: primary first, then others
    const reordered = [
      updated[index],
      ...updated.filter((_, i) => i !== index)
    ].map((img, i) => ({ ...img, sort_order: i }));
    onImagesChange(reordered);
  };

  // Reorder images (drag)
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    const updated = newImages.map((img, i) => ({
      ...img,
      sort_order: i,
      is_primary: i === 0
    }));
    
    onImagesChange(updated);
    setDraggedIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${dragOver 
            ? 'border-afrikoni-gold bg-afrikoni-gold/5' 
            : 'border-afrikoni-gold/30 hover:border-afrikoni-gold/50'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg"
            >
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-afrikoni-gold animate-pulse mx-auto mb-2" />
                <p className="text-sm text-afrikoni-deep">Uploading...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Upload className="w-12 h-12 text-afrikoni-gold/70 mx-auto mb-3" />
        <p className="text-afrikoni-chestnut font-medium mb-1">
          {images.length >= maxImages 
            ? `Maximum ${maxImages} images reached`
            : `Drag & drop or click to upload (${maxImages - images.length} remaining)`
          }
        </p>
        <p className="text-xs text-afrikoni-deep/70">
          JPEG, PNG, WebP, GIF • Max {maxSizeMB}MB each • AI will auto-enhance
        </p>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <AnimatePresence>
            {images.map((img, index) => (
              <motion.div
                key={img.path || img.url || index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOverItem(e, index)}
                className={`
                  relative group aspect-square rounded-lg overflow-hidden border-2
                  ${img.is_primary ? 'border-afrikoni-gold ring-2 ring-afrikoni-gold/20' : 'border-afrikoni-gold/20'}
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  cursor-move
                `}
              >
                <img 
                  src={img.url || img.thumbnail_url || (typeof img === 'string' ? img : '')} 
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback if image fails to load
                    if (img.thumbnail_url && e.target.src !== img.thumbnail_url) {
                      e.target.src = img.thumbnail_url;
                    } else if (img.url && e.target.src !== img.url) {
                      e.target.src = img.url;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
                
                {/* Delete button - always visible in top-right corner */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    removeImage(index);
                  }}
                  className="absolute top-1 right-1 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Primary badge */}
                {img.is_primary && (
                  <div className="absolute top-1 left-1 bg-afrikoni-gold text-white text-xs px-2 py-1 rounded font-semibold z-10">
                    Main
                  </div>
                )}

                {/* Overlay on hover for additional actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                  <div className="flex gap-2">
                    {!img.is_primary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimary(index);
                        }}
                        className="h-8 text-xs bg-white hover:bg-gray-100"
                      >
                        Set Main
                      </Button>
                    )}
                  </div>
                </div>

                {/* Drag handle - bottom right */}
                <div className="absolute bottom-1 right-1 bg-white/90 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <GripVertical className="w-3 h-3 text-afrikoni-deep" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Tips */}
      {images.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Image Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Use high-resolution images (min 800x800px)</li>
                <li>First image will be the main product photo</li>
                <li>Show product from multiple angles</li>
                <li>Clean, white background works best</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


