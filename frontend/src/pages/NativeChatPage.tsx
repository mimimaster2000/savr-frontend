import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  XCircle,
  Camera,
  Send,
  ShoppingCart,
} from 'lucide-react';
import { PreferencesDropdown } from '@/components/PreferencesDropdown';
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

const WELCOME_MESSAGE =
  "Hi! Welcome to Savr, your personal grocery shopping companion. Planning your meals for the week? Just let me know what you're craving, and I'll help you create the perfect shopping list.";

const NativeChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('there');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        const name =
          user?.first_name && user?.last_name
            ? `${user.first_name} ${user.last_name}`
            : user?.email || user?.username || 'there';
        setDisplayName(name);
      } catch {
        setDisplayName('there');
      }
    }
  }, []);

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
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedImages.length === 0) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: input,
      is_user: true,
      timestamp: new Date(),
      images: selectedImages.length > 0 ? [] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSelectedImages([]);
    setImagePreviews([]);
    setIsLoading(true);

    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: `I received your message: "${input || 'image(s)'}". In demo mode, I can't process requests, but I'm ready to help when connected to the backend!`,
        is_user: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-br from-amber-50/80 via-emerald-50/80 to-teal-50/80 dark:from-slate-900 dark:via-emerald-950/30 dark:to-teal-950/30">
      {/* Main chat content - web-style layout */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        <div className="w-full max-w-2xl mx-auto space-y-4">
          {/* Greeting & headline (always visible at top when no messages) */}
          {messages.length === 0 && (
            <>
              <p className="text-slate-700 dark:text-slate-300">
                Hello {displayName} 👋
              </p>
              <h2 className="text-xl font-bold text-green-800 dark:text-green-400">
                Your AI grocery shopping companion.
              </h2>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-500 text-white text-sm font-medium">
                ⚡ AI-Powered Canadian Grocery Shopping 🇨🇦
              </div>
            </>
          )}

          {messages.length === 0 ? (
            /* Savr Assistant welcome message - web style */
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium">
                <IoChatboxOutline className="h-4 w-4" />
                Savr Assistant
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-600 px-4 py-4 max-w-full">
                <p className="text-sm leading-relaxed">{WELCOME_MESSAGE}</p>
              </div>
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
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3',
                      message.is_user
                        ? 'bg-green-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600'
                    )}
                  >
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
                    <div
                      className={cn(
                        'text-xs mt-2',
                        message.is_user
                          ? 'text-green-100'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white dark:bg-slate-800 px-4 py-3 border border-slate-200 dark:border-slate-600">
                    <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar - web style: rounded, light red border, icons, green send */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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

        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 rounded-2xl border-2 border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 px-3 py-2 shadow-sm"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || selectedImages.length >= 4}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-40"
            aria-label="Upload image"
          >
            <Camera className="h-5 w-5" />
          </button>
          <PreferencesDropdown variant="inline" />
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Add to list"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
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
            placeholder="Ask anything..."
            disabled={isLoading}
            rows={1}
            className="flex-1 min-h-[40px] max-h-[100px] py-2 px-2 bg-transparent text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-base outline-none resize-none overflow-y-auto"
          />
          <Button
            type="submit"
            disabled={
              (!input.trim() && selectedImages.length === 0) || isLoading
            }
            className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NativeChatPage;
