import React, { useRef, useState } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ImageUpload({ value, onChange, testId = "upload", endpoint = "/upload", accept = "image/*,application/pdf" }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post(endpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });
      const fullUrl = `${BACKEND_URL}${r.data.url}`;
      onChange(fullUrl);
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Image URL or upload"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 rounded-lg text-sm"
        data-testid={`${testId}-url`}
      />
      <input
        ref={fileRef} type="file" accept={accept}
        className="hidden" onChange={(e) => upload(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="px-3 py-2 rounded-lg bg-[#14b8a6] text-[#05050A] font-medium text-sm inline-flex items-center gap-1 hover:bg-[#2dd4bf] disabled:opacity-50"
        data-testid={`${testId}-btn`}
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : value?.startsWith(BACKEND_URL) ? <Check size={14} /> : <Upload size={14} />}
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
