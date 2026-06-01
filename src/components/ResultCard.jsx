import { useState } from "react";
import {
  Download,
  Music,
  Video,
  Image as ImageIcon,
  ExternalLink,
  User,
  Clock,
  Eye,
  Loader2,
} from "lucide-react";
import PlatformIcon from "./PlatformIcon";

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "—";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function formatNumber(n) {
  if (!n || isNaN(n)) return "—";
  const num = Number(n);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

function QualityIcon({ type }) {
  if (type === "audio") return <Music size={14} />;
  if (type === "image") return <ImageIcon size={14} />;
  return <Video size={14} />;
}

export default function ResultCard({ t, result, onDownload }) {
  const [downloadingKey, setDownloadingKey] = useState(null);

  const handleDownload = async (format) => {
    setDownloadingKey(format.url);
    try {
      await onDownload(result, format);
    } finally {
      setTimeout(() => setDownloadingKey(null), 800);
    }
  };

  const formats = result.formats || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
        {/* Thumbnail */}
        <div className="md:col-span-2 relative bg-gray-50 border-b md:border-b-0 md:border-e border-gray-200">
          {result.thumbnail ? (
            <img
              src={result.thumbnail}
              alt={result.title || "preview"}
              className="w-full h-full object-cover aspect-video md:aspect-auto"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full aspect-video flex items-center justify-center">
              <PlatformIcon id={result.platform?.id} size={48} />
            </div>
          )}
          {result.duration ? (
            <div className="absolute bottom-2 end-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white bg-black/70 rounded-full backdrop-blur-sm">
              <Clock size={10} />
              <span>{formatDuration(result.duration)}</span>
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div className="md:col-span-3 p-5 flex flex-col">
          <div className="flex items-start gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-full flex-shrink-0">
              <PlatformIcon id={result.platform?.id} size={12} />
              <span className="font-medium">{result.platform?.name}</span>
            </div>
            {result.sourceUrl ? (
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ExternalLink size={12} />
                <span>{t("viewSource")}</span>
              </a>
            ) : null}
          </div>

          <h3 className="text-base font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">
            {result.title || "Untitled"}
          </h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-4">
            {result.author ? (
              <span className="inline-flex items-center gap-1">
                <User size={12} />
                <span>{result.author}</span>
              </span>
            ) : null}
            {result.views ? (
              <span className="inline-flex items-center gap-1">
                <Eye size={12} />
                <span>{formatNumber(result.views)}</span>
              </span>
            ) : null}
          </div>

          <div className="mt-auto">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {t("resultTitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {formats.map((f, idx) => {
                const isDownloading = downloadingKey === f.url;
                const isPrimary = idx === 0;
                return (
                  <button
                    key={f.url + idx}
                    onClick={() => handleDownload(f)}
                    disabled={isDownloading}
                    className={`group inline-flex items-center justify-between gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                      isPrimary
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-white text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <QualityIcon type={f.type} />
                      <span className="font-medium">{f.label}</span>
                      {f.size ? (
                        <span
                          className={`text-xs ${isPrimary ? "text-blue-100" : "text-gray-500"}`}
                        >
                          {f.size}
                        </span>
                      ) : null}
                    </span>
                    {isDownloading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
