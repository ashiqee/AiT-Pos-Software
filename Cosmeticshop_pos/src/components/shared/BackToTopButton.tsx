"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed z-50 bottom-6 right-6 p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-110 transition-transform duration-300"
          aria-label="Back to Top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </>
  );
}
