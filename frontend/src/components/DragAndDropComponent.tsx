import { useState } from "react";
import { Rnd } from "react-rnd";
import { Shape, updateShape } from "./lib/api/shapes";
import useArtboardStore from "../store/ArtboardStore";

export default function DragAndDropComponent(props: {
  shapes: Shape[];
  shape: Shape;
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  isHandToolActive: boolean;
}) {
  const { shapes, shape, setShapes, isHandToolActive } = props;
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { selectedShapeId, setSelectedShapeId, selectedShapeIds } =
    useArtboardStore();

  const [initialPositions, setInitialPositions] = useState(new Map());

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
      key={shape.shapeId}
      onDragStart={() => {
        handleDragStart(shape.shapeId);
      }}
      onDrag={(_, data) => handleDrag(shape.shapeId, data)}
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
      }}
      onMouseDown={(e) => {
        if (e.detail !== 2) setSelectedShapeId(shape.shapeId);
        console.log(selectedShapeId); // Prevents interference with double-click
      }}
      onMouseUp={(e) => {
        if (shape.shapeId !== selectedShapeId) {
          // for dragging path segments between different MultipageHandles, handles the "release" of dragging
          // we need to set the selected shape id to the shape that is being dragged over
          // so that the path is drawn from the correct shape
          setSelectedShapeId(shape.shapeId);
        }
      }}
      className={`${isHandToolActive ? "cursor-grab" : "arkhet-cursor"}`}
      style={{
        cursor: isHandToolActive ? "grab" : "arkhet-cursor",
        border:
          (selectedShapeId === shape.shapeId && shape.type !== "page") ||
          selectedShapeIds.includes(shape.shapeId)
            ? "2px solid #70acdc"
            : "2px solid transparent",
      }}
    >
      {shape.type === "page" ? (
        <div
          className={`h-full w-full bg-[#262626] bg-opacity-75 rounded-2xl shadow-[0px_0px_4px_2px_rgba(66,165,245,0.25)]  ${
            selectedShapeId == shape.shapeId
              ? "page-focus border border-[#70acdc]"
              : ""
          } ${isHandToolActive ? "cursor-grab" : "arkhet-cursor"}  ${
            selectedShapeIds.includes(shape.shapeId)
              ? "page-focus border border-[#70acdc]"
              : ""
          }`}
          key={shape.shapeId}
        ></div>
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
          className="h-full w-full border bg-[#FFFFFF] bg-opacity-75 rounded-2xl"
          key={shape.shapeId}
        ></div>
      )}
    </Rnd>
  );
}
