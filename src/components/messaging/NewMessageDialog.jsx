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
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user, companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!user || !companyId) {
        toast.error('Please complete onboarding first');
        return;
      }

      if (!recipientCompany || !recipientCompany.id) {
        toast.error('Invalid recipient');
        return;
      }

      // Get or create conversation
      let conversationId;
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(buyer_company_id.eq.${companyId},seller_company_id.eq.${recipientCompany.id}),and(buyer_company_id.eq.${recipientCompany.id},seller_company_id.eq.${companyId})`)
        .maybeSingle();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            buyer_company_id: companyId,
            seller_company_id: recipientCompany.id,
            subject: subject || `Inquiry about ${relatedType || 'product'}`,
            last_message: content.trim().substring(0, 100),
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

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

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: content.trim().substring(0, 100),
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

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

