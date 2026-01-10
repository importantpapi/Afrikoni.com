import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function ProductImageUploader({ 
  images = [], 
  onImagesChange,
  productId = null 
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Validate files first
      const validFiles = [];
      const invalidFiles = [];

      files.forEach(file => {
        if (!file.type.startsWith('image/')) {
          invalidFiles.push(`${file.name} is not an image file`);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          invalidFiles.push(`${file.name} is too large (max 5MB)`);
          return;
        }
        validFiles.push(file);
      });

      // Show errors for invalid files
      if (invalidFiles.length > 0) {
        invalidFiles.forEach(msg => toast.error(msg));
      }

      if (validFiles.length === 0) {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Use Promise.allSettled to handle individual failures
      const uploadPromises = validFiles.map(async (file, index) => {
        try {
          // Generate unique filename
          const fileExt = file.name.split('.').pop();
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 9);
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = productId 
            ? `${productId}/${timestamp}-${randomStr}-${cleanFileName}`
            : `${timestamp}-${randomStr}-${cleanFileName}`;

          const result = await supabaseHelpers.storage.uploadFile(
            file,
            'product-images',
            fileName
          );

          return {
            success: true,
            url: result.file_url,
            alt_text: file.name,
            is_primary: images.length === 0 && index === 0,
            sort_order: images.length + index
          };
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          return {
            success: false,
            fileName: file.name,
            error: error.message
          };
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      
      // Process results
      const newImages = [];
      const failedUploads = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          newImages.push({
            url: result.value.url,
            alt_text: result.value.alt_text,
            is_primary: result.value.is_primary,
            sort_order: result.value.sort_order
          });
        } else {
          const fileName = result.status === 'fulfilled' 
            ? result.value.fileName 
            : validFiles[index]?.name || 'unknown';
          failedUploads.push(fileName);
        }
      });

      // Update images with successful uploads
      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} image(s) uploaded successfully`);
      }

      // Show errors for failed uploads
      if (failedUploads.length > 0) {
        toast.error(`Failed to upload ${failedUploads.length} image(s): ${failedUploads.join(', ')}`);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    // If we removed the primary image, make the first one primary
    if (images[index].is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    onImagesChange(newImages);
  };

  const handleSetPrimary = (index) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    onImagesChange(newImages);
  };

  const handleMoveImage = (index, direction) => {
    const newImages = [...images];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    // Update sort_order
    newImages.forEach((img, i) => {
      img.sort_order = i;
    });
    onImagesChange(newImages);
  };

  const fileInputRef = React.useRef(null);

  const handleButtonClick = () => {
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-afrikoni-chestnut">
          Product Images ({images.length})
        </label>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={handleButtonClick}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Images'}
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-afrikoni-gold/30 rounded-lg p-12 text-center">
          <ImageIcon className="w-12 h-12 text-afrikoni-deep/50 mx-auto mb-4" />
          <p className="text-sm text-afrikoni-deep/70 mb-2">No images uploaded</p>
          <p className="text-xs text-afrikoni-deep/50">Upload at least one image for your product</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-afrikoni-gold/20 bg-afrikoni-cream">
                  <img
                    src={image.url}
                    alt={image.alt_text || `Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {image.is_primary && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-afrikoni-gold text-afrikoni-chestnut text-xs px-2 py-1 rounded font-semibold">
                        Primary
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Controls overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetPrimary(index)}
                    disabled={image.is_primary}
                    className="text-afrikoni-cream hover:text-afrikoni-gold"
                  >
                    Set Primary
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveImage(index, -1)}
                    disabled={index === 0}
                    className="text-afrikoni-cream hover:text-afrikoni-gold"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveImage(index, 1)}
                    disabled={index === images.length - 1}
                    className="text-afrikoni-cream hover:text-afrikoni-gold"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveImage(index)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

