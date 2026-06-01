import { useState, useCallback } from "react";
import {
  Shield,
  Zap,
  Award,
  Music,
  Globe2,
  Sparkles,
  Info,
  Lock,
  Eye,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LinkInput from "../components/LinkInput";
import ResultCard from "../components/ResultCard";
import PlatformIcon from "../components/PlatformIcon";
import { useLang } from "../utils/useLang";
import { useHistory } from "../utils/useHistory";
import { EXAMPLE_LINKS } from "../data/platforms";

const FEATURE_ICONS = [Award, Shield, Globe2, Lock, Music, Zap];

export default function HomePage() {
  const { t, lang, toggleLang, isRTL } = useLang();
  const { addItem } = useHistory();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleAnalyze = useCallback(
    async (url, platform) => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || t("networkError"));
        }
        setResult({ ...data, sourceUrl: data.sourceUrl || url });
        setIsPreviewMode(data.notice === "preview_mode");
      } catch (err) {
        console.error(err);
        setError(err.message || t("networkError"));
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  const handleDownload = useCallback(
    async (resultObj, format) => {
      if (format.url === "#preview") {
        setError(t("apiKeyMissing"));
        return;
      }
      try {
        // Save to history
        addItem({
          title: resultObj.title,
          thumbnail: resultObj.thumbnail,
          platform: resultObj.platform,
          sourceUrl: resultObj.sourceUrl,
          formatLabel: format.label,
          formatType: format.type,
          downloadUrl: format.url,
        });

        // Build filename
        const safeName =
          (resultObj.title || "nova-download")
            .replace(/[^\w\u0600-\u06FF.\- ]/g, "")
            .slice(0, 60)
            .trim() || "nova-download";

        const ext = format.type === "audio" ? "mp3" : (format.type === "video" ? "mp4" : "jpg");
        const finalName = safeName.includes(".") ? safeName : `${safeName}.${ext}`;

        if (format.type === "link") {
          window.open(format.url, '_blank');
          return;
        }

        // Route via our /api/download proxy so it forces "Save As" + handles CORS
        const proxyUrl =
          "/api/download?url=" +
          encodeURIComponent(format.url) +
          "&filename=" +
          encodeURIComponent(finalName);

        // Trigger the download
        const a = document.createElement("a");
        a.href = proxyUrl;
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error(err);
        setError(t("networkError"));
      }
    },
    [addItem, t],
  );

  const handleExample = useCallback(
    (example) => {
      handleAnalyze(example.url, { id: example.platform });
    },
    [handleAnalyze],
  );

  const featureTitles = [
    "feat1Title",
    "feat2Title",
    "feat3Title",
    "feat4Title",
    "feat5Title",
    "feat6Title",
  ];
  const featureDescs = [
    "feat1Desc",
    "feat2Desc",
    "feat3Desc",
    "feat4Desc",
    "feat5Desc",
    "feat6Desc",
  ];

  return (
    <>
      <Header t={t} lang={lang} toggleLang={toggleLang} />

      {/* HERO */}
      <section className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-24 md:pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full mb-6">
              <Sparkles size={12} />
              <span>{t("heroBadge")}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight leading-tight mb-4">
              {t("heroTitle")}
            </h1>

            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              {t("heroSubtitle")}
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span>{t("pillNoWatermark")}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-full">
                <Zap size={12} className="text-orange-500" />
                <span>{t("pillFast")}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-full">
                <Award size={12} className="text-blue-600" />
                <span>{t("pillFree")}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-full">
                <Shield size={12} className="text-gray-700" />
                <span>{t("pillSecure")}</span>
              </div>
            </div>

            {/* Input */}
            <div className="max-w-2xl mx-auto">
              <LinkInput
                t={t}
                onSubmit={handleAnalyze}
                isLoading={isLoading}
                isRTL={isRTL}
              />

              {/* Examples */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
                <span>{t("tryExample")}</span>
                {EXAMPLE_LINKS.map((ex) => (
                  <button
                    key={ex.url}
                    onClick={() => handleExample(ex)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <PlatformIcon id={ex.platform} size={11} />
                    <span>{ex.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Supported platform icons strip */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                {t("supported")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 opacity-80">
                {[
                  "youtube",
                  "tiktok",
                  "instagram",
                  "facebook",
                  "twitter",
                  "pinterest",
                  "reddit",
                  "vimeo",
                  "twitch",
                  "soundcloud",
                  "telegram",
                  "linkedin",
                ].map((id) => (
                  <div
                    key={id}
                    className="grayscale hover:grayscale-0 transition-all"
                    title={id}
                  >
                    <PlatformIcon id={id} size={22} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULT */}
      {(result || error) && (
        <section className="bg-gray-50 border-y border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {error ? (
              <div className="bg-white border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={16} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {lang === "ar" ? "حدث خطأ" : "Something went wrong"}
                    </h3>
                    <p className="text-sm text-gray-600">{error}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {result ? (
              <>
                {isPreviewMode ? (
                  <div className="mb-4 bg-white border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Info size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1 text-sm text-gray-600">
                        <span className="font-medium text-gray-900">
                          {lang === "ar" ? "وضع المعاينة" : "Preview mode"}
                        </span>{" "}
                        — {t("apiKeyMissing")}
                      </div>
                    </div>
                  </div>
                ) : null}
                <ResultCard t={t} result={result} onDownload={handleDownload} />
              </>
            ) : null}
          </div>
        </section>
      )}

      {/* STATS */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "1M+", label: t("statsUsers") },
              { value: "50M+", label: t("statsDownloads") },
              { value: "1000+", label: t("statsPlatforms") },
              { value: "99.9%", label: t("statsUptime") },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 text-center"
              >
                <div className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
              {t("featuresTitle")}
            </h2>
            <p className="text-sm text-gray-600">{t("featuresSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureTitles.map((titleKey, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div
                  key={titleKey}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {t(titleKey)}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(featureDescs[i])}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIMITATIONS — honesty section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full mb-4">
              <Info size={12} />
              <span>{t("limitTitle")}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
              {t("limitSubtitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Lock size={14} className="text-gray-700" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span className="font-medium">{t("notSupported")}</span>
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {t("whatsappLimitTitle")}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("whatsappLimit")}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Eye size={14} className="text-gray-700" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span className="font-medium">{t("partialSupport")}</span>
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {t("storiesLimitTitle")}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("storiesLimit")}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Clock size={14} className="text-gray-700" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span className="font-medium">{t("partialSupport")}</span>
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {t("telegramLimitTitle")}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("telegramLimit")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer t={t} />
    </>
  );
}
