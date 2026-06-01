import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PlatformIcon from "../../components/PlatformIcon";
import { useLang } from "../../utils/useLang";
import { useHistory } from "../../utils/useHistory";
import {
  Trash2,
  ExternalLink,
  Download,
  Music,
  Video,
  Image as ImageIcon,
  Inbox,
  X,
} from "lucide-react";

function timeAgo(iso, lang) {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const isAr = lang === "ar";
  if (seconds < 60) return isAr ? "الآن" : "Just now";
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return isAr ? `منذ ${m} دقيقة` : `${m}m ago`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return isAr ? `منذ ${h} ساعة` : `${h}h ago`;
  }
  const d = Math.floor(seconds / 86400);
  return isAr ? `منذ ${d} يوم` : `${d}d ago`;
}

function FormatIcon({ type }) {
  if (type === "audio") return <Music size={12} />;
  if (type === "image") return <ImageIcon size={12} />;
  return <Video size={12} />;
}

export default function HistoryPage() {
  const { t, lang, toggleLang } = useLang();
  const { history, removeItem, clearAll } = useHistory();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <>
      <Header t={t} lang={lang} toggleLang={toggleLang} />

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight mb-2">
                {t("historyTitle")}
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-full">
                <span>
                  {history.length} {t("historyCount")}
                </span>
              </div>
            </div>
            {history.length > 0 ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
                <span>{t("clearHistory")}</span>
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {history.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
                <Inbox size={24} className="text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {t("historyEmpty")}
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                {t("historyEmptyDesc")}
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={14} />
                <span>{t("home")}</span>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
                >
                  <div className="relative bg-gray-50 aspect-video">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title || "preview"}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlatformIcon id={item.platform?.id} size={36} />
                      </div>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 end-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:text-red-600 hover:border-red-200 transition-colors"
                      aria-label="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-full">
                        <PlatformIcon id={item.platform?.id} size={10} />
                        <span className="font-medium">
                          {item.platform?.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {timeAgo(item.createdAt, lang)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-3 min-h-[2.5rem]">
                      {item.title || "Untitled"}
                    </h3>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                        <FormatIcon type={item.formatType} />
                        <span>{item.formatLabel}</span>
                      </div>
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          <ExternalLink size={11} />
                          <span>{t("viewSource")}</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Confirm clear modal */}
      {confirmClear ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {t("clearHistory")}?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {lang === "ar"
                ? "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure? This action cannot be undone."}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  clearAll();
                  setConfirmClear(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                {lang === "ar" ? "مسح الكل" : "Clear all"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Footer t={t} />
    </>
  );
}
