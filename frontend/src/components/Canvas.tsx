import { MutableRefObject, useContext, useState } from "react";
import { v4 as uuid } from "uuid";
import { twMerge } from "tailwind-merge";
import { DragAndDropComponent } from "./DragAndDropComponent";
import { GlobalPathSegments } from "./GlobalPathSegments";
import { findOrthogonalPath } from "./lib/orthogonal-finder";
import { getMultipageHandlePoint } from "./MultipageHandles";
import useArtboardStore, {
  PermanentPath,
  Wireframe,
} from "../store/ArtboardStore";
import { ViewContext } from "./zoom/ViewContext";

export const GRID_SIZE_PIXELS = 5;

function setupInstances(shapesParam: Wireframe[]) {
  const newShapes: Wireframe[] = [...shapesParam];
  const newChildren: Wireframe[] = [];
  const result = newShapes.map((shape) => {
    if (shape.type !== "instance") return shape;
    const parent = newShapes.find((newShape) => newShape.id === shape.parentId);
    if (!parent) return shape;
    if (parent.type !== "card") {
      throw new Error("ERR: parent is not of type card");
    }
    const newInstance = { ...shape };
    newInstance.width = parent.width;
    newInstance.height = parent.height;
    parent.childrenComponents.map((childId: string) => {
      const newChild = {
        ...newShapes.find((newShape) => newShape.id === childId)!,
        isInstanceChild: true,
      }; // perhaps should be childOfInstance of type number to handle deletion
      const childToParentX =
        newShapes.find((newShape) => newShape.id === childId)!.xOffset -
        parent.xOffset;
      const childToParentY =
        newShapes.find((newShape) => newShape.id === childId)!.yOffset -
        parent.yOffset;
      newChild.xOffset = newInstance.xOffset + childToParentX;
      newChild.yOffset = newInstance.yOffset + childToParentY;
      newChildren.push(newChild);
    });
    return newInstance;
  });
  return [...result, ...newChildren];
}

export function Canvas({
  shapes,
  pageRefList,
  allShapesRefList,
  canvasRef,
  isHandToolActive,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleCanvasClick,
  handleContextMenu,
}: {
  shapes: Wireframe[] | undefined;
  canvasPosition: { x: number; y: number };
  pageRefList: MutableRefObject<HTMLDivElement[]>;
  allShapesRefList: MutableRefObject<HTMLDivElement[]>;
  canvasRef: MutableRefObject<HTMLDivElement | null>;
  isHandToolActive: boolean;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleCanvasClick: (event: React.MouseEvent) => void;
  handleContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const viewContext = useContext(ViewContext);
  const [mousePos, setMousePos] = useState({
    x: 0,
    y: 0,
  });

  const { debugPath, setSelectedShapeId } = useArtboardStore();

  function handleMouseMoveGrid(e: React.MouseEvent<HTMLDivElement>) {
    if (!canvasRef.current || !viewContext) return;
    const { left, top, width, height } =
      canvasRef.current.getBoundingClientRect();
    const { scale } = viewContext;
    // Track the cursor position so we can center the radial gradient
    setMousePos({
      x: (e.clientX - left + width / 5) / scale,
      y: (e.clientY - top + height / 5) / scale,
    });
  }

  function getPermanentPath(path: PermanentPath) {
    if (!shapes) throw new Error("No shapes...");
    const shapeStart = shapes.find((shape) => shape.id === path.shapeStartId);
    const shapeEnd = shapes.find((shape) => shape.id === path.shapeEndId);
    if (!shapeStart || !shapeEnd) return null;

    const firstPoint = getMultipageHandlePoint({
      handle: path.shapeStartHandleType,
      ...shapeStart,
    });

    const lastPoint = getMultipageHandlePoint({
      handle: path.shapeEndHandleType,
      ...shapeEnd,
    });

    const pathWithExcludes = findOrthogonalPath(
      { x: firstPoint.xStart, y: firstPoint.yStart },
      { x: lastPoint.xStart, y: lastPoint.yStart },
      path.pageExcludeList
        .map((shapeId: string) =>
          shapes.find((shape) => shape.id.toString() === shapeId)
        )
        .filter((shapeOrUndefined: any) => shapeOrUndefined !== undefined),
      path.direction
    );
    if (pathWithExcludes.length === 0) {
      return findOrthogonalPath(
        { x: firstPoint.xStart, y: firstPoint.yStart },
        { x: lastPoint.xStart, y: lastPoint.yStart },
        [],
        path.direction
      );
    }
    return pathWithExcludes;
  }

  const permanentPaths: any[] = [];

  return (
    <div
      id="canvas"
      className={`w-[5000px] h-[5000px] absolute bg-[#2c2c2c] border rounded -top-[1000px] -left-[1000px] z-0 ${isHandToolActive ? "cursor-grab" : "arkhet-cursor"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={(args) => {
        handleMouseMove(args);
        handleMouseMoveGrid(args);
      }}
      onMouseUp={handleCanvasClick}
      ref={canvasRef}
    >
      <div
        className={twMerge(
          `w-[5000px] h-[5000px] absolute bg-[#2c2c2c] border rounded -top-[1000px] -left-[1000px] z-0 transition-opacity duration-500 `,
          viewContext && viewContext.scale >= 2 ? "opacity-1" : "opacity-0"
        )}
        style={{
          backgroundImage:
            "linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)",
          backgroundSize: `${GRID_SIZE_PIXELS}px ${GRID_SIZE_PIXELS}px`,
        }}
      >
        <div
          className="top-0 left-0 w-[5000px] h-[5000px] pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_transparent,_#2c2c2c)]"
          style={{
            background: `radial-gradient(
            circle at ${mousePos.x}px ${mousePos.y}px,
            rgba(44,44,44,0) 0%,
            rgba(44,44,44,0) 1%,
            rgba(44,44,44,0.8) 3%,
            rgba(44,44,44,1) 4%
          )`,
          }}
        />
      </div>
      <div className="relative w-full h-full">
        {debugPath && <GlobalPathSegments debugPath={debugPath.path} />}
        {permanentPaths.map((path) => {
          const calculatedPath = getPermanentPath(path);
          if (!calculatedPath) return null;
          return (
            <GlobalPathSegments debugPath={calculatedPath} key={path.id} />
          );
        })}
        {canvasRef.current && (
          <div
            style={{
              left: `${mousePos.x - 1003}px`,
              top: `${mousePos.y - 1003}px`,
            }}
            className="mouse-follow absolute w-1 h-1 bg-transparent"
          />
        )}
        {shapes &&
          setupInstances(shapes).map((shape) => (
            <div
              key={shape.id}
              onContextMenu={(e) => {
                handleContextMenu(e);
                setSelectedShapeId(shape.id);
              }}
            >
              <DragAndDropComponent
                mousePos={mousePos}
                shapes={shapes}
                handleMouseUp={handleMouseUp}
                canvasRef={canvasRef}
                shape={shape}
                pageRefList={pageRefList}
                allShapesRefList={allShapesRefList}
                isHandToolActive={isHandToolActive}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
