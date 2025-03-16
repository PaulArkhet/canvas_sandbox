import { createFileRoute } from "@tanstack/react-router";
import LeftNav from "../components/LeftNav";
import TopNav from "../components/TopNav";
import RightNav from "../components/RightNav";
import ZoomableComponent from "../components/zoom/ZoomableComponent";
import { useState } from "react";
import { ZoomBadge } from "../components/zoom/ZoomBadge";

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

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isHandToolActive, setIsHandToolActive] = useState(false);
  return (
    <div className="bg-[#2c2c2c] text-white h-screen w-screen overflow-hidden">
      <ZoomBadge />
      <ZoomableComponent panning={isHandToolActive}>
        <div>
          <div className="w-[5000px] h-[5000px] absolute bg-[#2c2c2c] border rounded -top-[1000px] -left-[1000px] z-0"></div>
        </div>
      </ZoomableComponent>
      <LeftNav />
      <TopNav />
      <RightNav />
    </div>
  );
}
