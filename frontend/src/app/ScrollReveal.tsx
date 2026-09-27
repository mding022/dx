"use client";

import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.classList.add("js-reveal");
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.visible = "true";
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    nodes.forEach(node => observer.observe(node));

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("js-reveal");
    };
  }, []);

  return null;
}
