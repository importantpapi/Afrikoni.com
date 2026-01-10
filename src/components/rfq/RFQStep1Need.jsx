/**
 * RFQ Step 1: What do you need?
 * 
 * Mobile-first input for product/service description
 * - Large text input
 * - Optional photo upload
 * - Optional voice input UI stub
 * - Category selection (chips)
 */

import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/shared/ui/textarea';
import { Input } from '@/components/shared/ui/input';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Camera, Mic, X, Upload } from 'lucide-react';
import { supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function RFQStep1Need({ formData, updateFormData, categories = [] }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [voiceRecording, setVoiceRecording] = useState(false);

  const handleTitleChange = (e) => {
    updateFormData({ title: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    updateFormData({ description: e.target.value });
  };

  const handleCategorySelect = (categoryId) => {
    updateFormData({ category_id: categoryId });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Generate unique filename with proper sanitization
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `rfq-attachments/${timestamp}-${randomStr}-${cleanFileName}`;
      
      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', fileName);
      updateFormData({ 
        attachments: [...(formData.attachments || []), file_url] 
      });
      toast.success('Photo uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload photo: ${error.message || 'Please try again'}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (e.target) e.target.value = '';
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = [...(formData.attachments || [])];
    newAttachments.splice(index, 1);
    updateFormData({ attachments: newAttachments });
  };

  const handleVoiceStart = () => {
    // Placeholder for future voice input
    setVoiceRecording(true);
    toast.info('Voice input coming soon');
    setTimeout(() => setVoiceRecording(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-2">
          What do you need?
        </h1>
        <p className="text-afrikoni-deep/70 text-base">
          Describe the product or service you're looking for
        </p>
      </div>

      {/* Main Title Input */}
      <div>
        <label className="block text-sm font-semibold text-afrikoni-deep mb-2">
          Product or Service Name *
        </label>
        <Input
          value={formData.title || ''}
          onChange={handleTitleChange}
          placeholder="e.g., Organic Cocoa Beans, Shipping Services..."
          className="text-base min-h-[52px] px-4"
          autoFocus
        />
      </div>

      {/* Description (Optional) */}
      <div>
        <label className="block text-sm font-semibold text-afrikoni-deep mb-2">
          Additional Details (Optional)
        </label>
        <Textarea
          value={formData.description || ''}
          onChange={handleDescriptionChange}
          placeholder="Specifications, quality requirements, certifications needed..."
          className="text-base min-h-[120px] px-4 resize-none"
          rows={5}
        />
      </div>

      {/* Category Selection (Chips) */}
      {categories.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-afrikoni-deep mb-3">
            Category (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 12).map((cat) => (
              <Badge
                key={cat.id}
                variant={formData.category_id === cat.id ? 'default' : 'outline'}
                className={`min-h-[44px] px-4 py-2 cursor-pointer transition-all ${
                  formData.category_id === cat.id
                    ? 'bg-afrikoni-gold text-afrikoni-chestnut'
                    : 'border-afrikoni-gold/40 hover:bg-afrikoni-gold/10'
                }`}
                onClick={() => handleCategorySelect(
                  formData.category_id === cat.id ? '' : cat.id
                )}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Media Upload Section */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-afrikoni-deep">
          Add Photos (Optional)
        </label>
        
        {/* Photo Upload Button */}
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 min-h-[44px] border-afrikoni-gold/40"
          >
            <Camera className="w-5 h-5 mr-2" />
            {isUploading ? 'Uploading...' : 'Add Photo'}
          </Button>

          {/* Voice Input Button (Placeholder) */}
          <Button
            type="button"
            variant="outline"
            onClick={handleVoiceStart}
            disabled={voiceRecording}
            className="min-h-[44px] min-w-[44px] border-afrikoni-gold/40"
            aria-label="Record voice note"
          >
            <Mic className={`w-5 h-5 ${voiceRecording ? 'text-red-500' : ''}`} />
          </Button>
        </div>

        {/* Uploaded Photos Preview */}
        {formData.attachments && formData.attachments.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {formData.attachments.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-afrikoni-gold/20">
                <img
                  src={url}
                  alt={`Attachment ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeAttachment(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                  aria-label="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

