"use client";

import { useRef, useState, useCallback, KeyboardEvent, ChangeEvent, memo } from "react";
import { Square, Paperclip, X, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatImage } from "@/hooks/useChat";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string, images?: ChatImage[]) => void;
  onStop?: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const MAX_CHARS = 10000;
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

interface StagedImage extends ChatImage {
  previewUrl: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ChatInput = memo(function ChatInput({ value, onChange, onSubmit, onStop, isLoading, placeholder = "Message Conch...", disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<StagedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageError(null);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setImageError(`Up to ${MAX_IMAGES} images per message.`);
      return;
    }
    const toAdd = Array.from(files).slice(0, remaining);
    const newImages: StagedImage[] = [];
    for (const file of toAdd) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setImageError("Only PNG, JPEG, WebP, or GIF images are supported.");
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError("Each image must be under 4MB.");
        continue;
      }
      const data = await fileToBase64(file);
      newImages.push({ mediaType: file.type as ChatImage["mediaType"], data, previewUrl: URL.createObjectURL(file) });
    }
    if (newImages.length > 0) setImages((prev) => [...prev, ...newImages]);
  }, [images.length]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const submit = useCallback(() => {
    if (isLoading) return;
    if (!value.trim() && images.length === 0) return;
    onSubmit(value.trim(), images.length > 0 ? images.map(({ mediaType, data }) => ({ mediaType, data })) : undefined);
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setImageError(null);
  }, [isLoading, value, images, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }, [submit]);

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const canSubmit = (value.trim() || images.length > 0) && !isLoading;

  return (
    <div className="relative">
      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {images.map((img) => (
            <div key={img.previewUrl} className="relative w-14 h-14 rounded-xl overflow-hidden border border-border group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt="Attached" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(images.indexOf(img))}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {imageError && <p className="text-[11px] text-destructive mb-1.5">{imageError}</p>}

      {/* Input */}
      <div className="chat-input-bg rounded-2xl transition-all duration-200">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value.slice(0, MAX_CHARS));
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            "w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-[14px] leading-relaxed min-h-[44px] max-h-[200px] px-4 pt-3.5 pr-20",
            (disabled || isLoading) && "opacity-40 cursor-not-allowed"
          )}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading || images.length >= MAX_IMAGES}
              className="chat-btn-ghost p-1.5 rounded-lg disabled:opacity-30 transition-colors"
              aria-label="Attach image"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            {value.length > MAX_CHARS * 0.8 && (
              <span className={cn("text-[10px] ml-1", value.length >= MAX_CHARS ? "text-destructive" : "text-muted-foreground")}>
                {value.length}/{MAX_CHARS}
              </span>
            )}
          </div>

          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Square className="w-3 h-3" /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                canSubmit
                  ? "bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/20"
                  : "bg-card text-muted-foreground cursor-not-allowed"
              )}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Helper */}
      <p className="text-center text-[10px] chat-text-muted mt-1.5">
        Conch can make mistakes. Check important info.
      </p>
    </div>
  );
});
