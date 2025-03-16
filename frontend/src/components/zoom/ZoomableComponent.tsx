import React, { JSX, useContext, useEffect, useRef, useState } from "react";
import { ViewContext } from "./ViewContext";
import useArtboardStore from "../../store/ArtboardStore";

export function zoomAt(
  wrapperRef: React.RefObject<HTMLDivElement>,
  scaleAt: (point: { x: number; y: number }, factor: number) => void,
  scaleFactor: number
) {
  const rect = wrapperRef.current?.getBoundingClientRect();
  if (!rect) return;

  const viewportCenterX = window.scrollX + window.innerWidth / 2;
  const viewportCenterY = window.scrollY + window.innerHeight / 2;

  const x = viewportCenterX - rect.left + window.scrollX;
  const y = viewportCenterY - rect.top + window.scrollY;

  scaleAt({ x, y }, scaleFactor);
}

const ZoomableComponent = (props: {
  children: JSX.Element;
  panning: boolean;
}) => {
  const view = useContext(ViewContext);
  if (!view) {
    throw new Error("ZoomableComponent must be used within a ViewProvider");
  }

  const { transform, pan, scaleAt } = view;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const { setWrapperRef } = useArtboardStore();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return; // Ignore pinch-to-zoom

      if (event.shiftKey) {
        pan({ x: -event.deltaY, y: 0 });
      } else {
        pan({ x: -event.deltaX, y: -event.deltaY });
      }

      event.preventDefault();
    };

    wrapper.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      wrapper.removeEventListener("wheel", handleWheel);
    };
  }, [pan]);

  useEffect(() => {
    // @ts-ignore
    setWrapperRef(wrapperRef);
  }, [setWrapperRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (event.key === "-" || event.key === "=") {
        event.preventDefault();
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (!rect) return;
        // const viewportCenterX = window.scrollX + window.innerWidth / 2;
        // const viewportCenterY = window.scrollY + window.innerHeight / 2;
        // const x = viewportCenterX - rect.left + window.scrollX;
        // const y = viewportCenterY - rect.top + window.scrollY;
        const scaleFactor = event.key === "=" ? 1.05 : 1 / 1.05;
        // @ts-ignore
        zoomAt(wrapperRef, scaleAt, scaleFactor);
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!props.panning) return;
    setIsPanning(true);
    mouse.current.x = event.clientX;
    mouse.current.y = event.clientY;
    event.preventDefault();
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const deltaX = event.clientX - mouse.current.x;
      const deltaY = event.clientY - mouse.current.y;
      pan({ x: deltaX, y: deltaY });
      mouse.current.x = event.clientX;
      mouse.current.y = event.clientY;
      event.preventDefault();
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey) {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const scaleFactor = event.deltaY < 0 ? 1.02 : 1 / 1.02;
      scaleAt({ x, y }, scaleFactor);
      event.preventDefault();
    }
  };

  return (
    <div
      ref={wrapperRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      className={`${isPanning ? "cursor-grab" : "arkhet-cursor"} "touch-none w-fit h-fit"`}
    >
      <div id="zoomable-canvas" style={{ transform }}>
        {props.children}
      </div>
    </div>
  );
};

export default ZoomableComponent;
