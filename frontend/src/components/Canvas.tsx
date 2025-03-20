import { MutableRefObject } from "react";
import DragAndDropComponent from "./DragAndDropComponent";
import { Shape } from "./lib/api/shapes";

export default function Canvas(props: {
  isHandToolActive: boolean;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handleCanvasClick: (event: React.MouseEvent) => void;
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  pageRefList?: MutableRefObject<HTMLDivElement[]>;
  canvasRef: MutableRefObject<HTMLDivElement | null>;
  allShapesRefList?: MutableRefObject<HTMLDivElement[]>;
}) {
  const {
    shapes,
    isHandToolActive,
    handleMouseDown,
    handleMouseMove,
    handleCanvasClick,
    setShapes,
    pageRefList,
    canvasRef,
    allShapesRefList,
  } = props;

  return (
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
          mousePos={{ x: 0, y: 0 }}
          key={shape.shapeId}
          shape={shape}
          pageRefList={pageRefList}
          canvasRef={canvasRef}
          allShapesRefList={allShapesRefList}
          isHandToolActive={isHandToolActive}
          handleMouseUp={() => null}
          shapes={shapes}
          setShapes={setShapes}
        />
      ))}
    </div>
  );
}
