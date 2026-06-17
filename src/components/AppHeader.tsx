import { Link, useLocation } from "react-router-dom";
import logoCircle from "@/assets/logo-circle.jpeg";
import { LogIn, Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileMenu from "@/components/UserProfileMenu";

const AppHeader = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, toggleLang, t } = useLanguage();
  const { user } = useAuth();

  const links = [
    { to: "/", label: t("home") },
    { to: "/merchant", label: t("merchant_portal") },
    { to: "/help", label: t("help_desk") },
    { to: "https://billing.mbdbusinesshub.in/", label: "Business Billing", external: true },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <>
      {/* Tricolor Ticker */}
      <div className="ticker-tricolor overflow-hidden whitespace-nowrap py-1.5 sticky top-0 z-[60]">
        <p className="ticker-scroll inline-block font-hindi text-sm font-semibold text-foreground">
          कश्मीर से लेकर कन्याकुमारी तक, हर धर्म को मिलेगा{" "}
          <span className="text-saffron font-bold">सम्मान</span> और हर घर पहुँचेगा{" "}
          <span className="text-green-india font-bold">सामान</span>।
          &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
          कश्मीर से लेकर कन्याकुमारी तक, हर धर्म को मिलेगा{" "}
          <span className="text-saffron font-bold">सम्मान</span> और हर घर पहुँचेगा{" "}
          <span className="text-green-india font-bold">सामान</span>।
        </p>
      </div>

      <header className="sticky top-[34px] z-50 bg-primary shadow-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoCircle}
              alt="Mera Bharat Dukaan"
              className="h-10 w-10 rounded-full object-cover border-2 border-primary-foreground/30"
            />
            <div>
              <h1 className="text-lg font-bold leading-tight text-primary-foreground">
                Mera Bharat Dukaan
              </h1>
              <p className="text-[10px] text-primary-foreground/60">
                {t("digital_india_marketplace")}
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            <nav className="flex gap-1">
              {links.map((l) => (
                l.external ? (
                  <a
                    key={l.to}
                    href={l.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      location.pathname === l.to
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    }`}
                  >
                    {l.label}
                  </Link>
                )
              ))}
            </nav>

            <DisplayToggle className="ml-2" />

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="ml-2 flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/20"
              title="Switch Language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{lang === "en" ? "A/अ" : "अ/A"}</span>
              <span className="hidden lg:inline">
                {lang === "en" ? "हिन्दी" : "EN"}
              </span>
            </button>

            {user ? (
              <div className="ml-2">
                <UserProfileMenu />
              </div>
            ) : (
              <Button asChild size="sm" variant="secondary" className="ml-2 rounded-full">
                <Link to="/login">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <DisplayToggle />
            {/* Language Toggle Mobile */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "en" ? "हिन्दी" : "EN"}
            </button>

            {user ? (
              <UserProfileMenu />
            ) : (
              <Button asChild size="sm" variant="secondary" className="h-8 rounded-full px-3 text-xs">
                <Link to="/login">
                  <LogIn className="mr-1 h-3.5 w-3.5" />
                  Login
                </Link>
              </Button>
            )}
            <button
              className="text-primary-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="border-t border-primary-foreground/10 bg-primary px-4 pb-4 md:hidden">
            {links.map((l) => (
              l.external ? (
                <a
                  key={l.to}
                  href={l.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground/70"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    location.pathname === l.to
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/70"
                  }`}
                >
                  {l.label}
                </Link>
              )
            ))}
          </nav>
        )}
      </header>

    </>
  );
};

export default AppHeader;
