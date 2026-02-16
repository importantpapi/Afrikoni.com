import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { cn } from '@/lib/utils';

const EXAMPLE_GOOD_LISTING = {
  title: 'Good listing',
  points: [
    '3+ clear photos from different angles',
    'Natural lighting, clean background',
    'Shows product texture and details',
    'Includes packaging if applicable',
  ],
};

const EXAMPLE_BAD_LISTING = {
  title: 'Poor listing',
  points: [
    'Single blurry photo',
    'Dark or cluttered background',
    "Can't see product quality",
    'No scale reference',
  ],
};

export default function ProductMediaStep({ formData, onUpdate }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (files) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    const newUrls = newFiles.map((file) => URL.createObjectURL(file));
    onUpdate({
      images: [...formData.images, ...newFiles].slice(0, 6),
      imageUrls: [...formData.imageUrls, ...newUrls].slice(0, 6),
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newUrls = formData.imageUrls.filter((_, i) => i !== index);
    onUpdate({ images: newImages, imageUrls: newUrls });
  };

  const imageCount = formData.imageUrls.length;
  const hasEnoughImages = imageCount >= 3;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Label className="text-os-sm font-medium">
          Product Photos <span className="text-white/70">*</span>
        </Label>
        <div
          className={cn(
            'relative border-2 border-dashed rounded-os-sm p-8 text-center transition-all cursor-pointer',
            dragActive && 'border-white/40 bg-white/10',
            !dragActive && 'border-white/15 hover:border-white/40 hover:bg-white/5'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-os-sm font-medium text-[var(--os-text-primary)]">
                Drop photos here or tap to upload
              </p>
              <p className="text-os-xs text-[var(--os-text-secondary)] mt-1">
                PNG, JPG up to 5MB each • Max 6 photos
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 border-white/20 hover:border-white/40"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Camera className="w-4 h-4 mr-2" />
              Choose Photos
            </Button>
          </div>
        </div>
      </div>

      {formData.imageUrls.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <Label className="text-os-sm font-medium">
              Uploaded Photos ({imageCount}/6)
            </Label>
            {hasEnoughImages ? (
              <span className="text-os-xs text-white flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Great! 3+ photos attract more buyers
              </span>
            ) : (
              <span className="text-os-xs text-white/70 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Add {3 - imageCount} more photo{3 - imageCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {formData.imageUrls.map((url, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group"
              >
                <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 text-os-xs font-medium bg-white text-black px-1.5 py-0.5 rounded">
                    Main
                  </span>
                )}
              </div>
            ))}

            {Array.from({ length: Math.max(0, 3 - imageCount) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-lg border-2 border-dashed border-white/15 flex items-center justify-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-6 h-6 text-white/40" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="video" className="text-os-sm font-medium flex items-center gap-2">
          <Video className="w-4 h-4" />
          Product Video URL
          <span className="text-os-xs text-[var(--os-text-secondary)] font-normal">(optional)</span>
        </Label>
        <Input
          id="video"
          type="url"
          value={formData.videoUrl}
          onChange={(e) => onUpdate({ videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          className="h-12 os-input"
        />
        <p className="text-os-xs text-[var(--os-text-secondary)]">
          YouTube or Vimeo link • Products with videos get 4x more views.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-os-sm font-medium text-white flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            {EXAMPLE_GOOD_LISTING.title}
          </p>
          <ul className="space-y-1">
            {EXAMPLE_GOOD_LISTING.points.map((point, i) => (
              <li key={i} className="text-os-xs text-[var(--os-text-secondary)] flex items-start gap-1.5">
                <span className="text-white/70 mt-0.5">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-os-sm font-medium text-white flex items-center gap-1.5 mb-2">
            <X className="w-4 h-4" />
            {EXAMPLE_BAD_LISTING.title}
          </p>
          <ul className="space-y-1">
            {EXAMPLE_BAD_LISTING.points.map((point, i) => (
              <li key={i} className="text-os-xs text-[var(--os-text-secondary)] flex items-start gap-1.5">
                <span className="text-white/70 mt-0.5">✗</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
