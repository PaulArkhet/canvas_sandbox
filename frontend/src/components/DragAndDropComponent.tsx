import { MutableRefObject, useEffect, useMemo, useState } from "react";
import { Rnd } from "react-rnd";
import { Shape, updateShape } from "./lib/api/shapes";
import useArtboardStore from "../store/ArtboardStore";
import { getBoundsForShape } from "../routes";

export default function DragAndDropComponent(props: {
  shapes: Shape[];
  shape: Shape;
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  isHandToolActive: boolean;
  mousePos: { x: number; y: number };
  pageRefList?: MutableRefObject<HTMLDivElement[]>;
  canvasRef: MutableRefObject<HTMLDivElement | null>;
  allShapesRefList?: MutableRefObject<HTMLDivElement[]>;
  handleMouseUp: () => void;
}) {
  const { shapes, shape, setShapes, isHandToolActive } = props;
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialShapesBeforeEdit, setShapesBeforeChange] = useState<Shape[]>(
    []
  );
  const artboardTree = useMemo(() => {
    return setupArtboardTree(initialShapesBeforeEdit, updateShape);
  }, [initialShapesBeforeEdit]);
  const {
    selectedShapeId,
    setSelectedShapeId,
    selectedShapeIds,
    setTemporaryOffset,
    temporaryOffset,
  } = useArtboardStore();
  const [draggingEnabled, setDraggingEnabled] = useState(true);

  const [initialPositions, setInitialPositions] = useState(new Map());

  function handleUpdateRefList(el: HTMLDivElement) {
    if (!el || !props.pageRefList) return;
    // console.log("updating ref list...", props.pageRefList);

    const { pageRefList, allShapesRefList } = props;
    const elId = shape.shapeId.toString();

    const updateRefList = (refList: MutableRefObject<HTMLDivElement[]>) => {
      const currentList = refList.current || [];
      const index = currentList.findIndex((refEl) => refEl?.id === elId);

      let newList;
      if (index === -1) {
        // Element not found, add it to the array
        newList = [...currentList, el];
      } else {
        // Element found, replace it
        newList = [...currentList];
        newList[index] = el;
      }

      // Replace the reference with the new array
      refList.current = newList;
    };

    if (shape.type === "page") {
      pageRefList && updateRefList(pageRefList);
    }
    allShapesRefList && updateRefList(allShapesRefList);
  }

  const handleDragStart = (shapeId: string) => {
    if (selectedShapeIds.includes(shapeId)) {
      // Store initial positions for all selected shapes
      setInitialPositions(
        new Map(
          props.shapes
            .filter((shape) => selectedShapeIds.includes(shape.shapeId))
            .map((shape) => [
              shape.shapeId,
              { x: shape.xOffset, y: shape.yOffset },
            ])
        )
      );
    }
  };

  const handleDrag = (shapeId: string, data: any) => {
    if (selectedShapeIds.includes(shapeId) && initialPositions.size > 0) {
      const deltaX = data.x - initialPositions.get(shapeId).x;
      const deltaY = data.y - initialPositions.get(shapeId).y;

      setShapes((prevShapes) =>
        prevShapes.map((shape) =>
          selectedShapeIds.includes(shape.shapeId)
            ? {
                ...shape,
                xOffset: initialPositions.get(shape.shapeId).x + deltaX,
                yOffset: initialPositions.get(shape.shapeId).y + deltaY,
              }
            : shape
        )
      );
    }
  };

  return (
    <Rnd
      size={{ width: shape.width, height: shape.height }}
      position={{ x: shape.xOffset, y: shape.yOffset }}
      key={`${shape.shapeId}-${draggingEnabled}`}
      disableDragging={!draggingEnabled || isHandToolActive}
      onDragStart={(_, data) => {
        handleDragStart(shape.shapeId);
        setDragStart({ x: data.x, y: data.y });
        setShapesBeforeChange(props.shapes);
      }}
      onDrag={(_, dragData) => {
        // handleDrag(shape.shapeId, dragData);
        if (props.shape.type === "page") {
          const ourPage = artboardTree.find(
            (page) => page.shapeId === props.shape.shapeId
          )!;
          if (!ourPage.children) return;
          setTemporaryOffset({
            childrenId: ourPage.children.map((child) => child.shapeId),
            xOffset: dragData.x - dragStart.x,
            yOffset: dragData.y - dragStart.y,
          });
        }
        if (
          selectedShapeIds.includes(shape.shapeId) &&
          initialPositions.size > 0
        ) {
          const deltaX = dragData.x - initialPositions.get(shape.shapeId).x;
          const deltaY = dragData.y - initialPositions.get(shape.shapeId).y;

          setShapes((prevShapes) =>
            prevShapes.map((shape) =>
              selectedShapeIds.includes(shape.shapeId)
                ? {
                    ...shape,
                    xOffset: initialPositions.get(shape.shapeId).x + deltaX,
                    yOffset: initialPositions.get(shape.shapeId).y + deltaY,
                  }
                : shape
            )
          );
        }
      }}
      onDragStop={(_, dragData) => {
        const newX = dragData.x;
        const newY = dragData.y;
        updateShape(shapes, shape.shapeId, newX, newY);
        setShapes((prevShapes) =>
          prevShapes.map((s) =>
            s.shapeId === shape.shapeId
              ? { ...s, xOffset: newX, yOffset: newY }
              : s
          )
        );
        if (props.shape.type === "page") {
          setTemporaryOffset(null);
          const ourPage = artboardTree.find(
            (page) => page.shapeId === props.shape.shapeId
          )!;

          if (!ourPage.children) return;
          ourPage.children.forEach((child) => {
            updateShape(
              shapes,
              child.shapeId,
              child.xOffset + ourPage.xOffset,
              child.yOffset + ourPage.yOffset
            );
            setShapes((prevShapes) =>
              prevShapes.map((s) =>
                s.shapeId === shape.shapeId
                  ? { ...s, xOffset: newX, yOffset: newY }
                  : s
              )
            );
          });
        }
      }}
      style={{
        border:
          (selectedShapeId === shape.shapeId && shape.type !== "page") ||
          selectedShapeIds.includes(shape.shapeId)
            ? "2px solid #70acdc"
            : "2px solid transparent",
      }}
      onMouseDown={(e) => {
        if (e.detail !== 2) setSelectedShapeId(shape.shapeId);
        console.log(selectedShapeId); // Prevents interference with double-click
      }}
      onMouseUp={(e) => {
        if (shape.shapeId !== selectedShapeId) {
          setSelectedShapeId(shape.shapeId);
        }
      }}
    >
      <div
        id={shape.shapeId.toString()}
        className={`h-full relative shape`}
        ref={handleUpdateRefList}
        data-id={shape.shapeId}
      >
        {shape.type === "page" ? (
          <>
            <div
              className={`pb-5 absolute w-full -top-8 left-2 ${
                selectedShapeId == shape.shapeId ? "text-sky-200" : ""
              } `}
            >
              New Page
            </div>
            <div
              className={`h-full w-full bg-[#262626] bg-opacity-75 rounded-2xl shadow-[0px_0px_4px_2px_rgba(66,165,245,0.25)]  ${
                selectedShapeId == shape.shapeId
                  ? "page-focus border border-[#70acdc]"
                  : ""
              } ${
                selectedShapeIds.includes(shape.shapeId)
                  ? "page-focus border border-[#70acdc]"
                  : ""
              }`}
              key={shape.shapeId}
              onMouseEnter={() => setDraggingEnabled(false)}
              onMouseLeave={() => setDraggingEnabled(true)}
            ></div>
          </>
        ) : shape.type === "button" ? (
          <div
            className={`relative w-full h-full flex items-center flex-col text-center rounded justify-center [container-type:size] bg-white text-black `}
          >
            <span
              className={`text-[50cqh] text-center w-[90%] overflow-hidden text-ellipsis whitespace-nowrap select-none $
              }`}
            >
              Submit
            </span>
          </div>
        ) : (
          <div
            className="h-full w-full border bg-[#FFFFFF] rounded-2xl"
            key={shape.shapeId}
          ></div>
        )}
      </div>
    </Rnd>
  );
}

function setDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  return new Set([...setA].filter((item) => !setB.has(item)));
}
export type Bounds = ReturnType<typeof getBoundsForShape>;

function setupArtboardTree(shapes: Shape[], handleUpdateShape: any) {
  // react screenshot needs all components inside of each "frame" to be
  // children of each other to include them in the screenshot

  const roots = shapes.filter(
    (shape) => shape.type === "page" || shape.type === "card"
  );
  const children = shapes.filter(
    (shape) => shape.type !== "page" && shape.type !== "card"
  );

  const newRoots = roots.map((root: Shape & { children?: Shape[] }) => {
    const newRoot = { ...root };
    newRoot.children = [];
    const rootBounds = getBoundsForShape(root);
    const innerChildren = children.filter((child) => {
      const childBounds = getBoundsForShape(child);
      return isInBoundsOfOuterShape(rootBounds, childBounds);
    });
    innerChildren.forEach((child) => {
      const index = children.findIndex(
        (selectedChild) => selectedChild.shapeId === child.shapeId
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
    ...(children as (Shape & { children: undefined })[]),
  ];
  return result;
}

function isInBoundsOfOuterShape(outerShape: Bounds, innerShape: Bounds) {
  const result =
    outerShape.topBound < innerShape.topBound &&
    outerShape.bottomBound > innerShape.bottomBound &&
    outerShape.leftBound < innerShape.leftBound &&
    outerShape.rightBound > innerShape.rightBound;
  return result;
}
