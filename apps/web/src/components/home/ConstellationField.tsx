"use client";

import { useEffect, useRef } from "react";

const colors = ["#8052ff", "#ffb829", "#46e5e0", "#d66dff", "#ffffff"];

export function ConstellationField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      node.style.setProperty("--field-x", `${x * 16}px`);
      node.style.setProperty("--field-y", `${y * 16}px`);
    };
    node.addEventListener("pointermove", move);
    return () => node.removeEventListener("pointermove", move);
  }, []);

  return (
    <div ref={ref} className="constellation-field" aria-hidden="true">
      <div className="constellation-haze" />
      {Array.from({ length: 110 }, (_, index) => {
        const x = ((index * 37) % 100) + ((index % 4) * 0.7);
        const y = ((index * 61) % 100) + ((index % 5) * 0.45);
        const color = colors[index % colors.length];
        return (
          <i
            key={index}
            style={{
              "--particle-x": `${x}%`,
              "--particle-y": `${y}%`,
              "--particle-delay": `${(index % 13) * -0.37}s`,
              "--particle-duration": `${4.5 + (index % 8) * 0.65}s`,
              "--particle-color": color,
              "--particle-scale": `${0.65 + (index % 5) * 0.16}`,
            } as React.CSSProperties}
          />
        );
      })}
      <div className="constellation-ring constellation-ring-one" />
      <div className="constellation-ring constellation-ring-two" />
      <div className="constellation-core"><span>N·U</span></div>
      <span className="constellation-caption">interactive intelligence / 01</span>
    </div>
  );
}
