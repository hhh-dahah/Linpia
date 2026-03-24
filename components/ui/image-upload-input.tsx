"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";

type ImageUploadInputProps = {
  name: string;
  label: string;
  helper: string;
  previewUrl?: string | null;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
};

export function ImageUploadInput({
  name,
  label,
  helper,
  previewUrl,
  maxSizeMB = 0.3,
  maxWidthOrHeight = 1280,
}: ImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState(previewUrl || "");
  const [status, setStatus] = useState("");

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus("正在压缩图片...");

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        initialQuality: 0.82,
        fileType: "image/webp",
      });

      const normalized = new File([compressed], `${name}.webp`, { type: "image/webp" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(normalized);

      if (inputRef.current) {
        inputRef.current.files = dataTransfer.files;
      }

      setPreview(URL.createObjectURL(normalized));
      setStatus(`已压缩为 ${(normalized.size / 1024).toFixed(0)} KB`);
    } catch {
      setStatus("压缩失败，将使用原图提交。");
      setPreview(URL.createObjectURL(file));
    }
  }

  return (
    <label className="block space-y-3">
      <span className="field-label">{label}</span>
      <div className="rounded-[1.25rem] border border-dashed border-[rgba(17,40,79,0.16)] bg-white/80 p-4">
        <input ref={inputRef} type="file" name={name} accept="image/*" className="field-base" onChange={handleChange} />
        <p className="mt-2 text-xs text-muted">{helper}</p>
        {status ? <p className="mt-2 text-xs text-primary">{status}</p> : null}
        {preview ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[rgba(17,40,79,0.08)] bg-[rgba(17,40,79,0.03)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={`${label} 预览`} className="h-36 w-full object-cover" />
          </div>
        ) : null}
      </div>
    </label>
  );
}
