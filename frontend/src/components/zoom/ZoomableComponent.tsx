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
  shapes: any[];
}) => {
  const view = useContext(ViewContext);
  if (!view) {
    throw new Error("ZoomableComponent must be used within a ViewProvider");
  }

  const { transform, pan, scaleAt } = view;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const { setWrapperRef, setSelectedShapeIds, selectedShapeIds } =
    useArtboardStore();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  // Selection Box State
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
  }>({
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    active: false,
  });

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
    if (props.panning) {
      setIsPanning(true);
      mouse.current.x = event.clientX;
      mouse.current.y = event.clientY;
      event.preventDefault();
    } else {
      const isShape = !(
        event.target instanceof HTMLElement &&
        event.target.classList.contains("mouse-follow")
      ); // hacky way to detect a canvas click;
      if (isShape) {
        return;
      }
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const startX = event.clientX - rect.left;
      const startY = event.clientY - rect.top;
      setSelectionBox({
        startX,
        startY,
        x: startX,
        y: startY,
        width: 0,
        height: 0,
        active: true,
      });
      event.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setSelectionBox((prev) => ({ ...prev, active: false }));

    if (selectionBox.active) {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const selectedShapes = props.shapes.filter((shape) => {
        const shapeBounds = {
          x: shape.position.x,
          y: shape.position.y,
          width: 250, // Assuming fixed width for now
          height: 250, // Assuming fixed height for now
        };

        return (
          shapeBounds.x + shapeBounds.width > selectionBox.x &&
          shapeBounds.x < selectionBox.x + selectionBox.width &&
          shapeBounds.y + shapeBounds.height > selectionBox.y &&
          shapeBounds.y < selectionBox.y + selectionBox.height
        );
      });

      setSelectedShapeIds(selectedShapes.map((s) => s.shapeId));
      console.log(selectedShapeIds);
    }
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
    if (selectionBox.active) {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const endX = event.clientX - rect.left;
      const endY = event.clientY - rect.top;

      setSelectionBox((prev) => ({
        ...prev,
        x: Math.min(prev.startX, endX),
        y: Math.min(prev.startY, endY),
        width: Math.abs(endX - prev.startX),
        height: Math.abs(endY - prev.startY),
      }));
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
      {selectionBox.active && (
        <div
          className="absolute border border-purple-500 bg-purple-500 opacity-10"
          style={{
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

export default ZoomableComponent;
