import React, { useState } from 'react';
import { Share2, Copy, CheckCircle, Facebook, Twitter, Linkedin, Mail, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ShareProduct({ product, productUrl }) {
  const [copied, setCopied] = useState(false);

  const fullUrl = productUrl || window.location.href;
  const shareText = `Check out ${product?.title || 'this product'} on Afrikoni - Africa's Leading B2B Marketplace`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async (platform) => {
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedText = encodeURIComponent(shareText);

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodeURIComponent(product?.title || 'Product')}&body=${encodedText}%20${encodedUrl}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title || 'Product',
          text: shareText,
          url: fullUrl
        });
      } catch (error) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  return (
    <Card className="border-afrikoni-gold/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-afrikoni-gold" />
          <h3 className="font-semibold text-afrikoni-chestnut">Share Product</h3>
        </div>
        
        <div className="space-y-3">
          {/* Native Share (Mobile) */}
          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share via...
            </Button>
          )}

          {/* Social Media Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleShare('facebook')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </Button>
            <Button
              onClick={() => handleShare('twitter')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Twitter className="w-4 h-4 text-blue-400" />
              Twitter
            </Button>
            <Button
              onClick={() => handleShare('linkedin')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Linkedin className="w-4 h-4 text-blue-700" />
              LinkedIn
            </Button>
            <Button
              onClick={() => handleShare('email')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-afrikoni-gold" />
              Email
            </Button>
          </div>

          {/* Copy Link */}
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full"
            size="sm"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>

          {/* Link Display */}
          <div className="p-2 bg-afrikoni-offwhite rounded border border-afrikoni-gold/20">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-afrikoni-deep/70 flex-shrink-0" />
              <p className="text-xs text-afrikoni-deep/70 truncate">{fullUrl}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

