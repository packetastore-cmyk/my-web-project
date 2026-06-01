import { useState, useEffect } from "react";
import { Download, Menu, X, Globe } from "lucide-react";

export default function Header({ t, lang, toggleLang }) {
  const [open, setOpen] = useState(false);
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }
  }, []);

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/supported", label: t("supported") },
    { href: "/history", label: t("history") },
    { href: "/faq", label: t("faq") },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Download size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-gray-900 text-lg tracking-tight">
              {t("brand")}
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? "text-gray-900 font-medium bg-gray-50"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              aria-label="Toggle language"
            >
              <Globe size={14} />
              <span>{lang === "ar" ? "EN" : "عربي"}</span>
            </button>

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 text-gray-700 rounded-lg hover:bg-gray-50"
              aria-label="Menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="md:hidden py-3 border-t border-gray-200">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      isActive
                        ? "text-gray-900 font-medium bg-gray-50"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
