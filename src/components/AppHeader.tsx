import { Link, useLocation } from "react-router-dom";
import logoCircle from "@/assets/logo-circle.jpeg";
import { Menu, X, LogIn, Home, Store, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoginModal from "@/components/LoginModal";

const AppHeader = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/merchant", label: "Merchant Portal" },
    { to: "/help", label: "Help Desk" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-primary shadow-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoCircle} alt="Mera Bharat Dukaan" className="h-10 w-10 rounded-full object-cover border-2 border-primary-foreground/30" />
            <div>
              <h1 className="text-lg font-bold leading-tight text-primary-foreground">
                Mera Bharat Dukaan
              </h1>
              <p className="text-[10px] text-primary-foreground/60">Digital India Marketplace</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            <nav className="flex gap-1">
              {links.map((l) => (
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
              ))}
            </nav>
            <Button
              onClick={() => setLoginOpen(true)}
              className="ml-3 rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              <LogIn className="mr-1.5 h-4 w-4" />
              Login
            </Button>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              <LogIn className="mr-1 h-4 w-4" />
              Login
            </Button>
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
            ))}
          </nav>
        )}
      </header>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
};

export default AppHeader;
