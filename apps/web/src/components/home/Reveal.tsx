"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Envuelve contenido renderizado en el servidor y le agrega una aparición al
 * entrar en el viewport (parte de la gramática "boot + scan" del sistema).
 * El children ya viene renderizado desde el Server Component padre; este
 * wrapper solo hidrata el observer, no vuelve a pedir datos.
 */
export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? "is-visible" : ""}`}>
      {children}
    </div>
  );
}
