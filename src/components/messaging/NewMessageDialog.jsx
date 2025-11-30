import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function NewMessageDialog({ open, onOpenChange, recipientCompany, relatedTo, relatedType, subject }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);
    try {
      const user = await supabaseHelpers.auth.me();
      if (!user || !user.company_id) {
        toast.error('Please complete onboarding first');
        return;
      }

      const conversationId = `${user.company_id}-${recipientCompany.id}`;

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_company_id: user.company_id,
        receiver_company_id: recipientCompany.id,
        sender_user_email: user.email,
        content: content.trim(),
        read: false,
        related_to: relatedTo,
        related_type: relatedType,
        subject: subject
      });

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_email: recipientCompany.owner_email,
        company_id: recipientCompany.id,
        title: 'New Message',
        message: `You received a new message from ${user.email}`,
        type: 'message',
        link: `/messages`,
        read: false
      });

      toast.success('Message sent!');
      setContent('');
      onOpenChange(false);
      if (window.location.pathname === '/messages') {
        window.location.reload();
      }
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>
        <div className="space-y-4">
          {subject && (
            <div>
              <Label>Subject</Label>
              <div className="text-sm text-afrikoni-deep mt-1">{subject}</div>
            </div>
          )}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isLoading} className="flex-1 bg-afrikoni-gold hover:bg-amber-700">
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

