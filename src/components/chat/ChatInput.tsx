"use client";

import { useRef, useState, KeyboardEvent, ChangeEvent } from "react";
import { Send, Square, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB raw, before base64 inflation
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

interface StagedImage extends ChatImage {
  previewUrl: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:image/png;base64," prefix — API wants raw base64.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ChatInput({ value, onChange, onSubmit, onStop, isLoading, placeholder = "Message Conch...", disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<StagedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageError(null);

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setImageError(`Up to ${MAX_IMAGES} images per message.`);
      return;
    }

    const toAdd = Array.from(files).slice(0, remaining);
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
      setImages((prev) => [
        ...prev,
        { mediaType: file.type as ChatImage["mediaType"], data, previewUrl: URL.createObjectURL(file) },
      ]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const submit = () => {
    if (isLoading) return;
    if (!value.trim() && images.length === 0) return;
    onSubmit(value.trim(), images.length > 0 ? images.map(({ mediaType, data }) => ({ mediaType, data })) : undefined);
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setImageError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const nearLimit = value.length > MAX_CHARS * 0.8;

  return (
    <div className="glass border border-white/10 rounded-2xl p-3 focus-within:border-coral-500/50 transition-colors">
      {images.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {images.map((img, i) => (
            <div key={img.previewUrl} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt="Attached" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {imageError && <p className="text-xs text-red-400 mb-2">{imageError}</p>}

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
          "w-full bg-transparent text-white placeholder:text-slate-500 resize-none outline-none text-base md:text-sm leading-relaxed min-h-[24px] max-h-40",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      />

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
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
            className="text-slate-500 hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Attach image"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          {nearLimit ? (
            <span className={cn("text-xs", value.length >= MAX_CHARS ? "text-red-400" : "text-amber-400")}>
              {value.length}/{MAX_CHARS}
            </span>
          ) : (
            <span className="text-xs text-slate-600">Shift+Enter for newline</span>
          )}
        </div>

        {isLoading ? (
          <Button variant="secondary" size="sm" onClick={onStop} className="h-8 px-3 text-xs">
            <Square className="w-3.5 h-3.5" /> Stop
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={submit}
            disabled={(!value.trim() && images.length === 0) || disabled}
            className="h-8 px-3 text-xs"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </Button>
        )}
      </div>
    </div>
  );
}
