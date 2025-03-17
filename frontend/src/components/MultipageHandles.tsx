import useArtboardStore, { TemporaryPath } from "@/store/ArtboardStore";
import { Wireframe, PermanentPath } from "@backend/src/interfaces/artboard";
import { HandleType } from "@backend/src/interfaces/artboard";
import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { findOrthogonalPath } from "@/lib/orthogonal-finder";
import {
  getBoundsForShape,
  isInBoundsOfOuterShape,
} from "@/routes/_authenticated/artboard/$projectId";
import { v4 as uuid } from "uuid";
import { match } from "ts-pattern";
import {
  getMultipagePathsQueryOptions,
  useCreateMultipagePathMutation,
  useDeleteMultipagePathMutation,
  useUpdateMultipagePathMutation,
} from "@/lib/api/multipage-paths";
import { useQuery } from "@tanstack/react-query";
import { getAllShapesForProjectQueryOptions } from "@/lib/api/shapes";

export function getMultipageHandlePoint(args: {
  handle: HandleType;
  xOffset: number;
  yOffset: number;
  width: number;
  height: number;
}) {
  return match(args.handle)
    .with("top", () => ({
      xStart: args.xOffset + args.width / 2,
      yStart: args.yOffset - 20,
    }))
    .with("left", () => ({
      xStart: args.xOffset - 12,
      yStart: args.yOffset + args.height / 2 - 3,
    }))
    .with("bottom", () => ({
      xStart: args.xOffset + args.width / 2,
      yStart: args.yOffset + args.height + 12,
    }))
    .with("right", () => ({
      xStart: args.xOffset + args.width + 14,
      yStart: args.yOffset + args.height / 2 - 3,
    }))
    .exhaustive();
}

export function MultipageHandles(props: {
  setDraggingEnabled: (enabled: boolean) => void;
  shape: Wireframe;
  mousePos: { x: number; y: number };
  projectId: number;
}) {
  const { data: shapes } = useQuery(
    getAllShapesForProjectQueryOptions(props.projectId)
  );
  if (!shapes) return null;

  const { debugPath, setIsHandToolActive, setDebugPath } = useArtboardStore();
  const [selectedHandle, setSelectedHandle] = useState<HandleType | "none">(
    "none"
  );

  const {
    data: permanentPaths,
    error: permanentPathsError,
    isPending: permanentPathsLoading,
  } = useQuery(getMultipagePathsQueryOptions({ projectId: props.projectId }));
  const { mutate: createPermanentPath } = useCreateMultipagePathMutation();
  const { mutate: deletePermanentPath } = useDeleteMultipagePathMutation();

  const pages = useMemo(
    () => shapes.filter((shape) => shape.type === "page"),
    [shapes]
  );

  function escapeSelection(e: KeyboardEvent) {
    if (e.key !== "Escape") return;
    setSelectedHandle((prevHandle) =>
      prevHandle !== "none" ? "none" : prevHandle
    );
    setDebugPath(null);
  }

  useEffect(() => {
    window.addEventListener("keydown", escapeSelection);
    return () => window.removeEventListener("keydown", escapeSelection);
  }, []);

  function handleMouseEnter() {
    props.setDraggingEnabled(false);
  }

  function handleMouseLeave() {
    props.setDraggingEnabled(true);
  }

  function handleSetupPermanentPath(debugPath: TemporaryPath) {
    if (debugPath.path.length === 0) return;

    const lastPoint = debugPath.path.at(-1)!;
    // we wanna check all of our possible points
    //
    const allPoints = (["top", "left", "right", "bottom"] as const).map(
      (handle) => ({
        ...getMultipageHandlePoint({ handle, ...props.shape }),
        handleType: handle,
      })
    );

    const closestPoint = allPoints.reduce(
      (acc, current) => {
        const deltaXCurrent = lastPoint.x - current.xStart;
        const deltaYCurrent = lastPoint.y - current.yStart;
        const sumSquaresCurrent =
          Math.sqrt(Math.pow(deltaXCurrent, 2)) +
          Math.sqrt(Math.pow(deltaYCurrent, 2));

        const deltaXAcc = lastPoint.x - acc.xStart;
        const deltaYAcc = lastPoint.y - acc.yStart;
        const sumSquaresAcc =
          Math.sqrt(Math.pow(deltaXAcc, 2)) + Math.sqrt(Math.pow(deltaYAcc, 2));

        return sumSquaresCurrent < sumSquaresAcc ? current : acc;
      },
      { xStart: Infinity, yStart: Infinity, handleType: "top" }
    );

    const newPath = {
      projectId: props.projectId,
      shapeStartId: debugPath.originalShapeId,
      shapeStartHandleType: debugPath.handleType,
      shapeEndId: props.shape.id,
      shapeEndHandleType: closestPoint.handleType,
      ...debugPath,
      pageExcludeList: debugPath.pageExcludeList.map((number) =>
        number.toString()
      ),
    };
    createPermanentPath(newPath);
    setSelectedHandle("none");
    setIsHandToolActive(false);
    setDebugPath(null);
    props.setDraggingEnabled(true);
    return;
  }

  function handleClick(
    _e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    type: HandleType
  ) {
    if (!permanentPaths) {
      return setTimeout(() => handleClick, 1000);
    }
    if (props.shape.type === "page" && debugPath) {
      // we also wanna check if a path already exists; we wish to overwrite that path with this one

      const foundPathsFromOriginalShape = permanentPaths.filter(
        (path) => path.shapeStartId === debugPath.originalShapeId
      );
      console.log(foundPathsFromOriginalShape, permanentPaths);
      // if we find one, delete the old path and proceed as normal
      if (foundPathsFromOriginalShape.length !== 0) {
        foundPathsFromOriginalShape.map((path) => {
          deletePermanentPath({
            projectId: props.projectId,
            multipageId: path.id,
          });
        });
      }
      handleSetupPermanentPath(debugPath);
      return;
    }
    setSelectedHandle(type);
    setIsHandToolActive(false);
  }

  useEffect(() => {
    if (selectedHandle === "none") {
      return;
    }
    const { xOffset, yOffset, width, height } = props.shape;
    const mouseX = props.mousePos.x - 1000;
    const mouseY = props.mousePos.y - 1000;

    // 1) Determine which handle to use based on where the mouse is
    //    relative to the shape's bounding box.
    //
    //    We'll do a simple approach:
    //      - If cursor is left  of the shape => "left"
    //      - If cursor is right of the shape => "right"
    //      - Else if above => "top"
    //      - Else if below => "bottom"
    //    If the cursor is actually *inside* the shape horizontally, we'll check
    //    top vs bottom, and so on.

    let autoHandle: "left" | "right" | "top" | "bottom" = selectedHandle;
    const shapeLeft = xOffset;
    const shapeRight = xOffset + width;
    const shapeTop = yOffset;
    const shapeBottom = yOffset + height;

    // Horizontal check
    if (mouseX < shapeLeft) {
      autoHandle = "left";
    } else if (mouseX > shapeRight) {
      autoHandle = "right";
    } else {
      // Mouse is horizontally within the shape’s bounds
      // so we pick top or bottom based on vertical position
      if (mouseY < shapeTop) {
        autoHandle = "top";
      } else if (mouseY > shapeBottom) {
        autoHandle = "bottom";
      } else {
        // The mouse is *inside* the shape. In that case,
        // maybe pick whichever side is closer?
        const distToLeft = mouseX - shapeLeft;
        const distToRight = shapeRight - mouseX;
        const distToTop = mouseY - shapeTop;
        const distToBottom = shapeBottom - mouseY;

        const minDist = Math.min(
          distToLeft,
          distToRight,
          distToTop,
          distToBottom
        );
        switch (minDist) {
          case distToLeft:
            autoHandle = "left";
            break;
          case distToRight:
            autoHandle = "right";
            break;
          case distToTop:
            autoHandle = "top";
            break;
          case distToBottom:
            autoHandle = "bottom";
            break;
        }
      }
    }

    setSelectedHandle(autoHandle);
    let { xStart, yStart } = getMultipageHandlePoint({
      handle: autoHandle,
      xOffset,
      yOffset,
      width,
      height,
    });

    // 3) Build the path from that handle point to the mouse
    //    (adjust any offsets if needed)
    const p1 = { x: xStart, y: yStart };
    const p2 = { x: mouseX, y: mouseY }; // or subtract any global offsets

    // Decide if we prefer "vertical first" or "horizontal first"
    // for the single-bend approach:
    const direction =
      autoHandle === "left" || autoHandle === "right"
        ? "vertical"
        : "horizontal";

    const validPages = pages.filter((page) => {
      const pageBounds = getBoundsForShape(page);
      const shapeBounds = getBoundsForShape(props.shape);
      const isInBounds = isInBoundsOfOuterShape(pageBounds, shapeBounds);
      return !isInBounds;
    });

    const pageExcludeList = [...validPages, props.shape];
    let path = findOrthogonalPath(p1, p2, pageExcludeList, direction);

    if (path.length === 0) {
      // fallback if blocked by obstacles
      path = findOrthogonalPath(p1, p2, [], direction);
    }

    setDebugPath({
      path,
      originalShapeId: props.shape.id,
      direction,
      handleType: autoHandle,
      pageExcludeList:
        path.length === 0 ? [] : pageExcludeList.map((page) => page.id),
    });
  }, [props.mousePos, selectedHandle, props.shape, pages]);

  /*
   * Need to create a series of divs to model the arrow
   * we can have:
   * vertical line,
   * horizontal line,
   * curved segments; we can think of these as a square of x,y width and height
   * we place these at the intersections of lines
   * we also would like to avoid any pages when placing lines
   * */

  return (
    <>
      {/* top */}
      <div className="absolute w-full top-0 left-0 flex flex-row justify-center">
        <div
          className={twMerge(
            "relative bottom-5 w-3 h-3 bg-white border-[#42A5F5] rounded-full border-[3px] hover:cursor-pointer hover:bg-[#42A5F5] multipage-handle top z-20",
            selectedHandle === "top" ? "bg-[#42A5F5]" : ""
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseUp={(e) => handleClick(e, "top")}
          onMouseDown={(e) => handleClick(e, "top")}
        ></div>
      </div>
      {/* left */}
      <div className="absolute h-full top-0 left-0 flex flex-col justify-center">
        <div
          className={twMerge(
            "relative right-5 w-3 h-3 bg-white border-[#42A5F5] rounded-full border-[3px] hover:cursor-pointer hover:bg-[#42A5F5] multipage-handle",
            selectedHandle === "left" ? "bg-[#42A5F5]" : ""
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseUp={(e) => handleClick(e, "left")}
          onMouseDown={(e) => handleClick(e, "left")}
        />
      </div>
      {/* right */}
      <div className="absolute h-full bottom-0 right-0 flex flex-col justify-center">
        <div
          className={twMerge(
            "relative left-5 w-3 h-3 bg-white border-[#42A5F5] rounded-full border-[3px] hover:cursor-pointer hover:bg-[#42A5F5] multipage-handle",
            selectedHandle === "right" ? "bg-[#42A5F5]" : ""
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseUp={(e) => handleClick(e, "right")}
          onMouseDown={(e) => handleClick(e, "right")}
        />
      </div>
      {/* bottom */}
      <div className="absolute w-full bottom-0 left-0 flex flex-row justify-center">
        <div
          className={twMerge(
            "relative top-5 w-3 h-3 bg-white border-[#42A5F5] rounded-full border-[3px] hover:cursor-pointer hover:bg-[#42A5F5] multipage-handle",
            selectedHandle === "bottom" ? "bg-[#42A5F5]" : ""
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseUp={(e) => handleClick(e, "bottom")}
          onMouseDown={(e) => handleClick(e, "bottom")}
        />
      </div>
    </>
  );
}
