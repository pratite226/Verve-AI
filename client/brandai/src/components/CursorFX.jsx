import { useEffect, useRef } from "react";

const CursorFX = () => {
  const ringRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (reduceMotion || coarsePointer) return undefined;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const tgt = { ...pos };

    const onMove = (e) => {
      tgt.x = e.clientX;
      tgt.y = e.clientY;
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (dot) {
        dot.style.opacity = "1";
        dot.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      }
      if (ring) ring.style.opacity = "1";

      const over =
        e.target &&
        e.target.closest &&
        e.target.closest("button,a,[data-magnetic],input,textarea,select");
      if (ring) {
        if (over) {
          ring.style.width = "58px";
          ring.style.height = "58px";
          ring.style.margin = "-29px 0 0 -29px";
          ring.style.backgroundColor = "rgba(198,242,78,.12)";
        } else {
          ring.style.width = "34px";
          ring.style.height = "34px";
          ring.style.margin = "-17px 0 0 -17px";
          ring.style.backgroundColor = "transparent";
        }
      }
    };

    window.addEventListener("mousemove", onMove);

    let raf;
    const loop = () => {
      pos.x += (tgt.x - pos.x) * 0.16;
      pos.y += (tgt.y - pos.y) * 0.16;
      const ring = ringRef.current;
      if (ring) ring.style.transform = `translate(${pos.x}px,${pos.y}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
};

export default CursorFX;
