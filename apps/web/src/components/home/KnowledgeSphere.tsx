"use client";

import { useEffect, useRef } from "react";

const particleColors = ["#8052ff", "#ffb829", "#36c6a0", "#c7b6ff", "#ffffff"];

export function KnowledgeSphere() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.setProperty("--sphere-x", `${x * 18}px`);
      element.style.setProperty("--sphere-y", `${y * 18}px`);
      element.style.setProperty("--sphere-tilt-x", `${y * -7}deg`);
      element.style.setProperty("--sphere-tilt-y", `${x * 7}deg`);
    };
    const onLeave = () => {
      element.style.setProperty("--sphere-x", "0px");
      element.style.setProperty("--sphere-y", "0px");
      element.style.setProperty("--sphere-tilt-x", "0deg");
      element.style.setProperty("--sphere-tilt-y", "0deg");
    };
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);
    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const particles = Array.from({ length: 360 }, (_, index) => {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const z = 1 - ((index + 0.5) / 360) * 2;
    const radius = Math.sqrt(1 - z * z);
    const angle = index * goldenAngle;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const size = 2 + (index % 4) * 0.8;
    return (
      <i
        key={index}
        style={{
          "--particle-left": `${50 + x * 48}%`,
          "--particle-top": `${50 + y * 48}%`,
          "--particle-size": `${size}px`,
          "--particle-depth": `${Math.round(z * 22)}px`,
          "--particle-color": particleColors[index % particleColors.length],
          "--particle-delay": `${(index % 19) * -0.22}s`,
        } as React.CSSProperties}
      />
    );
  });

  return (
    <div ref={ref} className="knowledge-sphere" aria-label="Visualización generativa del portafolio" role="img">
      <div className="knowledge-sphere-glow" />
      <div className="knowledge-sphere-cloud">{particles}</div>
      <div className="knowledge-sphere-highlight" />
      <div className="knowledge-sphere-label"><span>N·U</span><small>knowledge / in motion</small></div>
    </div>
  );
}
