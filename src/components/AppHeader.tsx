import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.jpeg";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const AppHeader = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/", label: "Home", labelHi: "होम" },
    { to: "/merchant", label: "Merchant", labelHi: "दुकानदार" },
    { to: "/admin", label: "Admin", labelHi: "प्रशासन" },
    { to: "/help", label: "Help", labelHi: "सहायता" },
    { to: "/terms", label: "Terms", labelHi: "शर्तें" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-lg">
      <div className="tiranga-stripe h-1 w-full" />
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Mera Bharat Dukaan" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <h1 className="text-lg font-bold leading-tight text-primary-foreground">
              Mera Bharat Dukaan
            </h1>
            <p className="font-hindi text-xs text-primary-foreground/70">मेरा भारत दुकान</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === l.to
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className="text-primary-foreground md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
              {l.label} <span className="font-hindi text-xs opacity-60">({l.labelHi})</span>
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default AppHeader;
