import { createFileRoute } from "@tanstack/react-router";
import LeftNav from "../components/LeftNav";
import TopNav from "../components/TopNav";
import RightNav from "../components/RightNav";
import ZoomableComponent from "../components/zoom/ZoomableComponent";
import { useContext, useEffect, useRef, useState } from "react";
import { ZoomBadge } from "../components/zoom/ZoomBadge";
import { ViewContext } from "../components/zoom/ViewContext";
import useArtboardStore, { Wireframe } from "../store/ArtboardStore";
import { Rnd } from "react-rnd";
import { updateShape } from "../components/lib/api/shapes";
import DragAndDropComponent from "../components/DragAndDropComponent";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

export type Bounds = ReturnType<typeof getBoundsForShape>;

export function getBoundsForShape(shape: Wireframe) {
  return {
    leftBound: shape.xOffset,
    rightBound: shape.xOffset + shape.width,
    topBound: shape.yOffset,
    bottomBound: shape.yOffset + shape.height,
  };
}

export function isInBoundsOfOuterShape(outerShape: Bounds, innerShape: Bounds) {
  const result =
    outerShape.topBound < innerShape.topBound &&
    outerShape.bottomBound > innerShape.bottomBound &&
    outerShape.leftBound < innerShape.leftBound &&
    outerShape.rightBound > innerShape.rightBound;
  return result;
}

export function isShapeInPage(shape: Wireframe, page: Wireframe) {
  return isInBoundsOfOuterShape(
    getBoundsForShape(page),
    getBoundsForShape(shape)
  );
}

function setupArtboardTree(shapes: Wireframe[]) {
  // react screenshot needs all components inside of each "frame" to be
  // children of each other to include them in the screenshot
  const roots = shapes.filter((shape) => shape.type === "page");
  const children = shapes.filter((shape) => shape.type !== "page");

  const newRoots = roots.map((root: Wireframe & { children?: Wireframe[] }) => {
    const newRoot = { ...root };
    newRoot.children = [];
    const rootBounds = getBoundsForShape(root);
    const innerChildren = children.filter((child) => {
      const childBounds = getBoundsForShape(child);
      return isInBoundsOfOuterShape(rootBounds, childBounds);
    });
    innerChildren.forEach((child) => {
      const index = children.findIndex(
        (selectedChild) => selectedChild.id === child.id
      );
      children.splice(index, 1);
      const newChild = { ...child };
      newChild.xOffset -= root.xOffset;
      newChild.yOffset -= root.yOffset;
      newRoot.children!.push(newChild);
    });
    return newRoot;
  });
  const result = [
    ...newRoots,
    ...(children as (Wireframe & { children: undefined })[]),
  ];
  return result;
}

function moveLayer(
  objects: Wireframe[],
  targetId: string,
  direction: "up" | "down"
): Wireframe[] {
  // Sort the objects by zIndex in ascending order.
  const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  // Find the index of the target object.
  const targetIndex = sortedObjects.findIndex((obj) => obj.id === targetId);
  if (targetIndex === -1) {
    return objects;
  }

  // Determine the new index based on the direction.
  const newIndex = direction === "up" ? targetIndex + 1 : targetIndex - 1;
  if (newIndex < 0 || newIndex >= sortedObjects.length) {
    return objects;
  }

  // Remove the target object from its current position.
  const [targetObj] = sortedObjects.splice(targetIndex, 1);
  // Insert the target object at the new position.
  sortedObjects.splice(newIndex, 0, targetObj);

  // Reassign zIndex values so that they reflect the new ordering.
  const updatedObjects = sortedObjects.map((obj, idx) => ({
    ...obj,
    zIndex: idx,
  }));

  return updatedObjects;
}

function RouteComponent() {
  const [isHandToolActive, setIsHandToolActive] = useState(false);
  const view = useContext(ViewContext);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [canvasPosition, setCanvasPosition] = useState({
    x: -1000,
    y: -1000,
  });
  const pageRefList = useRef<HTMLDivElement[]>([]);
  const allShapesRefList = useRef<HTMLDivElement[]>([]);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [shapes, setShapes] = useState<any[]>([]);
  const { setSelectedShapeId } = useArtboardStore();

  function toggleHandTool() {
    setIsHandToolActive(!isHandToolActive);
  }

  function handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY });
  }

  function handleClickOutside(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setContextMenu(null);
    }
  }

  function handleMouseDown(event: React.MouseEvent) {
    if (isHandToolActive || event.button === 1) {
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }

  function handleMouseMove(event: React.MouseEvent) {
    if (isHandToolActive && dragStart) {
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      setCanvasPosition((prevPosition) => ({
        x: prevPosition.x + dx / 2,
        y: prevPosition.y + dy / 2,
      }));
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }

  function handleMouseUp() {
    setDragStart(null);
  }

  function handleCanvasClick(event: React.MouseEvent) {
    const currentTarget = event.currentTarget as HTMLElement;
    // console.log(event.target, event.currentTarget);

    // Deselect any selected shape when clicking on the canvas
    const isMultipageHandle =
      event.target instanceof HTMLElement &&
      event.target.classList.contains("multipage-handle");
    const isShape = !(
      event.target instanceof HTMLElement &&
      event.target.classList.contains("mouse-follow")
    ); // hacky way to detect a canvas click;
    if (isMultipageHandle || isShape) {
      return;
    }
    console.log("detected a canvas click!", event.currentTarget, event.target);
    setSelectedShapeId(null);
  }

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
    }
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key === "h") {
        toggleHandTool();
      }
      if (event.key === "v") {
        setIsHandToolActive(false);
      }
      if (event.key === " ") {
        event.preventDefault();
        setIsHandToolActive(true);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === " ") {
        // Deactivate hand tool on spacebar release
        setIsHandToolActive(false);
      }
    }
    function handleMouseDown(event: MouseEvent) {
      if (event.button === 1) {
        // Middle mouse button (scroll wheel click)
        event.preventDefault();
        setIsHandToolActive(true); // Activate hand tool on scroll wheel press
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mousedown", handleMouseDown);
    // window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousedown", handleMouseDown);
      // window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [view]);

  return (
    <div
      className={`bg-[#2c2c2c] text-white h-screen w-screen overflow-hidden ${isHandToolActive ? "cursor-grab" : "arkhet-cursor"}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <ZoomBadge />
      <ZoomableComponent panning={isHandToolActive}>
        <div
          className={`mouse-follow w-[5000px] h-[5000px] absolute bg-[#2c2c2c] border rounded -top-[1000px] -left-[1000px] z-0 ${isHandToolActive ? "cursor-grab" : "arkhet-cursor"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={(args) => {
            handleMouseMove(args);
          }}
          onMouseUp={handleCanvasClick}
        >
          {shapes.map((shape) => (
            <DragAndDropComponent
              shapes={shapes}
              setShapes={setShapes}
              shape={shape}
              isHandToolActive={isHandToolActive}
              key={shape.shapeId}
            />
          ))}
        </div>
      </ZoomableComponent>
      <LeftNav shapes={shapes} setShapes={setShapes} />
      <TopNav
        isHandToolActive={isHandToolActive}
        setIsHandToolActive={setIsHandToolActive}
        toggleHandTool={toggleHandTool}
        shapes={shapes}
        setShapes={setShapes}
      />
      <RightNav />
    </div>
  );
}
