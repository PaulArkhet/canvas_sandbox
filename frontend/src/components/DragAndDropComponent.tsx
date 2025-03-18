import { useState } from "react";
import { Rnd } from "react-rnd";
import { updateShape } from "./lib/api/shapes";
import useArtboardStore from "../store/ArtboardStore";

export default function DragAndDropComponent(props: {
  shapes: any[];
  shape: any;
  setShapes: React.Dispatch<React.SetStateAction<any[]>>;
  isHandToolActive: boolean;
}) {
  const { shapes, shape, setShapes, isHandToolActive } = props;
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { selectedShapeId, setSelectedShapeId, selectedShapeIds } =
    useArtboardStore();

  return (
    <Rnd
      size={{ width: shape.width, height: shape.height }}
      position={shape.position}
      key={shape.id}
      onDragStart={(_, data) => {
        setDragStart({ x: data.x, y: data.y });
      }}
      onDragStop={(_, dragData) => {
        const newX = dragData.x;
        const newY = dragData.y;
        updateShape(shapes, shape.shapeId, { x: newX, y: newY });
        setShapes((prevShapes) =>
          prevShapes.map((s) =>
            s.shapeId === shape.shapeId
              ? { ...s, position: { x: newX, y: newY } }
              : s
          )
        );
      }}
      onMouseDown={(e) => {
        if (e.detail !== 2) setSelectedShapeId(shape.shapeId);
        console.log(selectedShapeId); // Prevents interference with double-click
      }}
      onMouseUp={(e) => {
        if (shape.id !== selectedShapeId) {
          // for dragging path segments between different MultipageHandles, handles the "release" of dragging
          // we need to set the selected shape id to the shape that is being dragged over
          // so that the path is drawn from the correct shape
          setSelectedShapeId(shape.shapeId);
        }
      }}
      className={`${isHandToolActive ? "cursor-grab" : "arkhet-cursor"}`}
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
          key={shape.id}
        ></div>
      ) : shape.type === "button" ? (
        <div
          className={`relative w-full h-full flex items-center flex-col text-center rounded justify-center [container-type:size]`}
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
          key={shape.id}
        ></div>
      )}
    </Rnd>
  );
}
