import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, File, X, Image as ImageIcon, Download, Clock, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

/**
 * Order Communication Hub
 * Centralized communication for orders with file sharing
 * Keeps all trade-related conversations in one place
 */

export function OrderCommunicationHub({
  orderId,
  orderNumber,
  currentUserCompanyId,
  otherPartyName,
  messages = [],
  onSendMessage,
  onFileUpload,
  className = ''
}) {
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => onFileUpload(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      setAttachments(prev => [
        ...prev,
        ...uploadedFiles.map(url => ({
          url,
          name: files[uploadedFiles.indexOf(url)].name,
          type: files[uploadedFiles.indexOf(url)].type,
          size: files[uploadedFiles.indexOf(url)].size
        }))
      ]);
      
      toast.success(`${files.length} file(s) attached`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!messageText.trim() && attachments.length === 0) return;

    setIsSending(true);
    try {
      await onSendMessage({
        message: messageText.trim(),
        attachments: attachments.map(a => ({ url: a.url, name: a.name, type: a.type }))
      });
      
      setMessageText('');
      setAttachments([]);
      toast.success('Message sent');
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Card className={cn('border-afrikoni-gold/30', className)}>
      <CardHeader>
        <CardTitle className="text-lg text-afrikoni-chestnut flex items-center gap-2">
          Order Communication
          <Badge variant="outline" className="text-xs font-normal">
            Order #{orderNumber}
          </Badge>
        </CardTitle>
        <p className="text-xs text-afrikoni-deep/60">
          All messages are logged and accessible by Afrikoni support if needed
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages List */}
        <div className="bg-afrikoni-offwhite rounded-lg p-4 h-96 overflow-y-auto space-y-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-3">
              {/* Date Separator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-afrikoni-gold/20" />
                <span className="text-xs text-afrikoni-deep/50 font-medium">{date}</span>
                <div className="flex-1 h-px bg-afrikoni-gold/20" />
              </div>

              {/* Messages for this date */}
              {dateMessages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_company_id === currentUserCompanyId}
                  senderName={message.sender_company_id === currentUserCompanyId ? 'You' : otherPartyName}
                />
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <AttachmentPreview
                key={index}
                attachment={attachment}
                onRemove={() => handleRemoveAttachment(index)}
              />
            ))}
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${otherPartyName}...`}
            rows={3}
            disabled={isSending}
            className="resize-none"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSending}
              >
                <Paperclip className="w-4 h-4 mr-1" />
                {isUploading ? 'Uploading...' : 'Attach File'}
              </Button>
            </div>

            <Button
              size="sm"
              onClick={handleSend}
              disabled={(!messageText.trim() && attachments.length === 0) || isSending}
              className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
            >
              <Send className="w-4 h-4 mr-1" />
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>

          <p className="text-xs text-afrikoni-deep/50 italic">
            💡 Keep all order communication here for Trade Shield protection
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MessageBubble({ message, isOwn, senderName }) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[75%] space-y-1',
        isOwn ? 'items-end' : 'items-start'
      )}>
        {/* Sender Name */}
        <div className={cn(
          'text-xs font-medium',
          isOwn ? 'text-afrikoni-gold' : 'text-afrikoni-deep/70'
        )}>
          {senderName}
        </div>

        {/* Message Content */}
        <div className={cn(
          'px-4 py-2 rounded-lg',
          isOwn 
            ? 'bg-afrikoni-gold text-afrikoni-chestnut rounded-br-none' 
            : 'bg-white border border-afrikoni-gold/20 text-afrikoni-deep rounded-bl-none'
        )}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment, index) => (
                <AttachmentLink key={index} attachment={attachment} />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp & Status */}
        <div className={cn(
          'flex items-center gap-1 text-xs',
          isOwn ? 'text-afrikoni-deep/50' : 'text-afrikoni-deep/50'
        )}>
          <Clock className="w-3 h-3" />
          <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
          {isOwn && message.read && (
            <CheckCheck className="w-3 h-3 text-blue-500" />
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentPreview({ attachment, onRemove }) {
  const isImage = attachment.type?.startsWith('image/');
  const fileSize = (attachment.size / 1024).toFixed(1);

  return (
    <div className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-afrikoni-gold/30">
      {isImage ? (
        <ImageIcon className="w-4 h-4 text-blue-600" />
      ) : (
        <File className="w-4 h-4 text-afrikoni-deep/60" />
      )}
      <div className="text-xs">
        <p className="font-medium text-afrikoni-chestnut max-w-[150px] truncate">
          {attachment.name}
        </p>
        <p className="text-afrikoni-deep/50">{fileSize} KB</p>
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function AttachmentLink({ attachment }) {
  const isImage = attachment.type?.startsWith('image/');

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
    >
      {isImage ? (
        <ImageIcon className="w-3 h-3" />
      ) : (
        <File className="w-3 h-3" />
      )}
      <span className="max-w-[200px] truncate">{attachment.name}</span>
      <Download className="w-3 h-3" />
    </a>
  );
}

function groupMessagesByDate(messages) {
  const groups = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  messages.forEach(message => {
    const messageDate = new Date(message.created_at);
    let dateLabel;

    if (messageDate.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(message);
  });

  return groups;
}

