import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLang } from "../../utils/useLang";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FaqPage() {
  const { t, lang, toggleLang } = useLang();
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
  ];

  return (
    <>
      <Header t={t} lang={lang} toggleLang={toggleLang} />

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full mb-4">
            <HelpCircle size={12} />
            <span>{t("faq")}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
            {t("faqTitle")}
          </h1>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="space-y-3">
            {faqs.map((f, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border transition-colors ${
                    isOpen
                      ? "border-gray-300"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-xl"
                  >
                    <span className="text-sm md:text-base font-semibold text-gray-900">
                      {f.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 flex-shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen ? (
                    <div className="px-5 pb-4 -mt-1">
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {f.a}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Contact card */}
          <div className="mt-10 bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {lang === "ar"
                ? "لم تجد إجابة لسؤالك؟"
                : "Didn't find your answer?"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {lang === "ar"
                ? "تواصل معنا وسنرد عليك في أقرب وقت."
                : "Reach out to us and we'll get back to you soon."}
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
            >
              <span>{t("contact")}</span>
            </a>
          </div>
        </div>
      </section>

      <Footer t={t} />
    </>
  );
}
