import { useState, useEffect, useCallback } from "react";
import heroSlide1 from "@/assets/hero-slide-1.png";
import heroSlide2 from "@/assets/hero-slide-2.png";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import heroSlide4 from "@/assets/hero-slide-4.jpg";

const slides = [
  { img: heroSlide1, slogan: "भारत दुकान: आपका स्थानीय बाज़ार, अब आपकी जेब में।" },
  { img: heroSlide2, slogan: "0% कमीशन. सीधा भुगतान. आत्मनिर्भर भारत।" },
  { img: heroSlide3, slogan: "अपनी दुकान, अपनी पहचान। भारत दुकान से जुड़ें आज।" },
  { img: heroSlide4, slogan: "भारत दुकान: आपका स्थानीय बाज़ार, अब आपकी जेब में।" },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % slides.length);
  }, []);

  useEffect(() => {
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-2xl sm:h-[400px]">
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <img src={s.img} alt={s.slogan} className="h-full w-full object-cover" />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          {/* Slogan */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
            <p className="font-hindi text-xl font-bold text-white drop-shadow-lg sm:text-2xl md:text-3xl">
              {s.slogan}
            </p>
          </div>
        </div>
      ))}
      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-6 bg-accent" : "w-2 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
