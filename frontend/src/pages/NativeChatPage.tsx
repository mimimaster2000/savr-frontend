import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquarePlus, XCircle, Camera } from 'lucide-react';
import { IoChatboxOutline } from 'react-icons/io5';
import { cn } from '@/lib/utils';
import MarkdownText from '@/components/MarkdownText';

interface ChatMessage {
  id: string;
  content: string;
  is_user: boolean;
  timestamp: Date;
  images?: { base64: string; mediaType: string }[];
}

const NativeChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 4) {
      alert('Maximum 4 images allowed');
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedImages.length === 0) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: input,
      is_user: true,
      timestamp: new Date(),
      images: selectedImages.length > 0 ? [] : undefined, // Would convert to base64 in real implementation
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImages([]);
    setImagePreviews([]);
    setIsLoading(true);

    // Simulate AI response (demo mode)
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: `I received your message: "${input || 'image(s)'}". In demo mode, I can't process requests, but I'm ready to help when connected to the backend!`,
        is_user: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900">
      {/* Header - Fixed at top with safe area */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <IoChatboxOutline className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Savr Assistant</h1>
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-full flex items-center justify-center mb-4">
              <MessageSquarePlus className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Start your conversation
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              Ask me about recipes, meal planning, or upload a photo to get personalized grocery suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.is_user ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3',
                  message.is_user
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
                )}>
                  {!message.is_user && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <IoChatboxOutline className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Savr Assistant
                      </span>
                    </div>
                  )}
                  <MarkdownText text={message.content} />
                  <div className={cn(
                    'text-xs mt-2',
                    message.is_user ? 'text-green-100' : 'text-slate-500 dark:text-slate-400'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-700 rounded-2xl px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom with safe area */}
      <div
        className="sticky bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {imagePreviews.map((previewUrl, idx) => (
              <div key={idx} className="relative">
                <div className="relative p-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                  <img
                    src={previewUrl}
                    alt={`Preview ${idx + 1}`}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 hover:bg-red-600 text-white rounded-full"
                    onClick={() => removeImage(idx)}
                    disabled={isLoading}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            style={{ display: 'none' }}
          />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Message Savr..."
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-base outline-none resize-none min-h-[48px] max-h-[100px] overflow-y-auto"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || selectedImages.length >= 4}
            className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            <Camera className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </Button>
          <Button
            type="submit"
            disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
            className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MessageSquarePlus className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NativeChatPage;
