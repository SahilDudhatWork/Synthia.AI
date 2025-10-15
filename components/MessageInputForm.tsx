import React, { useEffect, useRef, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useTranslations } from "next-intl";

interface MessageInputFormProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (finalInput?: string, uploadedUrls?: string[]) => void;
  loading: boolean;
  isChatModel?: boolean;
  className?: string;
  userId?: string;
  workspaceId?: string;
  chatId?: string;
}

export default function MessageInputForm({
  input,
  setInput,
  onSubmit,
  loading,
  isChatModel = false,
  className = "",
  userId,
  workspaceId,
  chatId,
}: MessageInputFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState<boolean[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);

  const t = useTranslations("dashboard");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const startIndex = selectedFiles.length;

      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setLoadingPreviews((prev) => [...prev, ...newFiles.map(() => true)]);

      newFiles.forEach((file, idx) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviews((prev) => [...prev, reader.result as string]);
            setLoadingPreviews((prev) => {
              const updated = [...prev];
              updated[startIndex + idx] = false;
              return updated;
            });
          };
          reader.readAsDataURL(file);
        } else {
          setPreviews((prev) => [...prev, ""]);
          setLoadingPreviews((prev) => {
            const updated = [...prev];
            updated[startIndex + idx] = false;
            return updated;
          });
        }
      });
      e.target.value = "";
    }
  };

  const triggerFileInput = () => {
    document.getElementById("fileInput")?.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setLoadingPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;

    setUploading(true);
    let uploadedUrls: string[] = [];

    if (selectedFiles.length > 0) {
      try {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("userId", userId!);
          formData.append("workspaceId", workspaceId!);
          if (chatId) formData.append("chatId", chatId);
          formData.append("file", file, file.name || `uploaded-${Date.now()}.jpg`);

          const resp = await fetch("/api/storeImage", {
            method: "POST",
            body: formData,
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || `Upload failed with status ${resp.status}`);
          }
          const result = await resp.json();
          if (result?.image?.url) {
            uploadedUrls.push(result.image.url as string);
          }
        }
      } catch (error) {
        console.error("Error uploading files:", error);
        setUploading(false);
        return;
      }
    }

    // Pass the input and uploaded URLs to the parent component
    onSubmit(input, uploadedUrls);

    // Clear the form
    setInput("");
    setSelectedFiles([]);
    setPreviews([]);
    setLoadingPreviews([]);
    setUploading(false);
  };

  useEffect(() => {
    const textarea = textareaRef.current as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.style.height = "40px";
      const newHeight = Math.min(textarea.scrollHeight, 230);
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  return (
    <div
      className={`relative flex w-full flex-col items-center gap-2 bg-white shadow-2xl rounded-2xl 
      ${isChatModel ? "max-w-full" : "max-w-full sm:max-w-xl"} ${className}`}
    >
      <form
        className="flex w-full flex-col overflow-hidden p-4 pt-2 rounded-2xl bg-white/20 ring-1 ring-inset ring-white/20 backdrop-blur-2xl"
        onSubmit={async (e) => {
          e.preventDefault();
          await handleSubmit();
        }}
      >
        {/* Files Preview */}
        <div className="mb-2 flex w-full relative flex-col">
          {selectedFiles.length > 0 && (
            <div className="mb-3 w-full flex gap-2 -mx-3 max-w-[calc(100%+24px)] flex-none overflow-x-auto px-3 pt-2 scrollbar-thin-2">
              {selectedFiles.map((file, i) => (
                <div
                  key={i}
                  className="group relative mb-2 mr-2 flex w-48 sm:w-60 flex-none items-center gap-3 rounded-lg bg-black/10 p-2 ring-1 ring-inset ring-black/10"
                >
                  <div className="flex flex-none items-center justify-center rounded-md bg-black/20 p-2">
                    {loadingPreviews[i] ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 256 256"
                        fill="currentColor"
                        className="size-6 animate-spin text-black/20 stroke-black/20"
                      >
                        <path d="M232 128a104 104 0 0 1-208 0c0-41 23.81-78.36 60.66-95.27a8 8 0 0 1 6.68 14.54C60.15 61.59 40 93.27 40 128a88 88 0 0 0 176 0c0-34.73-20.15-66.41-51.34-80.73a8 8 0 0 1 6.68-14.54C208.19 49.64 232 87 232 128Z" />
                      </svg>
                    ) : file.type.startsWith("image/") ? (
                      <img
                        src={previews[i]}
                        alt={file.name}
                        className="size-6 object-cover rounded"
                      />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="size-6 stroke-2 flex-none stroke-black/70"
                      >
                        <path
                          d="M14 2.26946V6.4C14 6.96005 14 7.24008 14.109 7.45399C14.2049 7.64215 14.3578 7.79513 14.546 7.89101C14.7599 8 15.0399 8 15.6 8H19.7305M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-[16px] leading-[24px] w-full overflow-hidden text-ellipsis whitespace-nowrap font-normal text-black/70">
                    {file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 bg-background p-[2px] opacity-0 group-hover:opacity-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="stroke-2 size-4 stroke-neutral-500 group-hover:stroke-neutral-700"
                    >
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full flex-none resize-none bg-transparent py-2 text-[16px] leading-[24px] outline-none text-black placeholder-black/50 max-h-[230px]"
            placeholder={t("askaque")}
            spellCheck="false"
            disabled={loading || uploading}
            ref={textareaRef}
          />
          {(loading || uploading) && (
            <div className="absolute right-1 top-4">
              <LoadingSpinner size="sm" color="primary" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <input
              id="fileInput"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt"
              disabled={loading || uploading}
            />
            <button
              className="relative inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium outline-none transition-all focus-visible:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-95 h-11 min-w-11 px-[12px] bg-black/5 hover:bg-black/10 active:bg-black/20 disabled:bg-black/5 before:pointer-events-none before:absolute before:inset-[-2px] before:rounded-full focus-visible:before:ring-2 focus-visible:before:ring-blue-500"
              type="button"
              disabled={loading || uploading}
              onClick={triggerFileInput}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="size-6 stroke-2 stroke-black"
              >
                <path
                  d="M21.1525 10.8995L12.1369 19.9151C10.0866 21.9654 6.7625 21.9654 4.71225 19.9151C2.662 17.8649 2.662 14.5408 4.71225 12.4905L13.7279 3.47489C15.0947 2.10806 17.3108 2.10806 18.6776 3.47489C20.0444 4.84173 20.0444 7.05781 18.6776 8.42464L10.0156 17.0867C9.33213 17.7701 8.22409 17.7701 7.54068 17.0867C6.85726 16.4033 6.85726 15.2952 7.54068 14.6118L15.1421 7.01043"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Submit Button */}
          <button
            className="flex flex-none items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 rounded-full ring-1 ring-inset ring-white/10 transition duration-150 h-12 aspect-square p-0 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-400"
            type="submit"
            disabled={
              loading ||
              uploading ||
              (!input.trim() && selectedFiles.length === 0)
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="size-6 stroke-2 stroke-white"
            >
              <path
                d="M12 19V5M12 5L5 12M12 5L19 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
