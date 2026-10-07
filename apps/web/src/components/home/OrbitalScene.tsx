"use client";

import { useEffect, useRef } from "react";

export function OrbitalScene() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion || !finePointer) return;
    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      stage.style.setProperty("--scene-x", `${x * 10}deg`);
      stage.style.setProperty("--scene-y", `${y * -10}deg`);
    };
    const onLeave = () => { stage.style.setProperty("--scene-x", "0deg"); stage.style.setProperty("--scene-y", "0deg"); };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => { stage.removeEventListener("pointermove", onMove); stage.removeEventListener("pointerleave", onLeave); };
  }, []);

  return <div ref={stageRef} className="orbital-scene" aria-label="Visualización orbital 3D del portafolio" role="img"><div className="scene-grid" /><div className="scene-stars">{Array.from({ length: 34 }, (_, index) => <i key={index} style={{ "--i": index, "--x": `${(index * 47) % 100}%`, "--y": `${(index * 31) % 100}%` } as React.CSSProperties} />)}</div><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><div className="scene-core"><span /><b>IA</b></div><div className="scene-node node-one" /><div className="scene-node node-two" /><div className="scene-node node-three" /><span className="scene-caption caption-one">MCP / DATA</span><span className="scene-caption caption-two">BUILD / SHIP</span></div>;
}
