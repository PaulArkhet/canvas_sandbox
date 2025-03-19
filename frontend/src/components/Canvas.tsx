import DragAndDropComponent from "./DragAndDropComponent";
import { Shape } from "./lib/api/shapes";

export default function Canvas(props: {
  isHandToolActive: boolean;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handleCanvasClick: (event: React.MouseEvent) => void;
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
}) {
  const {
    shapes,
    isHandToolActive,
    handleMouseDown,
    handleMouseMove,
    handleCanvasClick,
    setShapes,
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
          shapes={shapes}
          setShapes={setShapes}
          shape={shape}
          isHandToolActive={isHandToolActive}
          key={shape.shapeId}
        />
      ))}
    </div>
  );
}
