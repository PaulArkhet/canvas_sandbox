export type Shape = {
  shapeId: string;
  type: string;
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
};

export function createShape(
  shapes: Shape[],
  shape: string,
  w: number,
  h: number
) {
  const shapeId = shapes.length.toString();
  const type = shape;
  const width = w;
  const height = h;
  const xOffset = 1650;
  const yOffset = 1300;
  shapes.push({ shapeId, type, xOffset, yOffset, width, height });
  console.log(shapes);
}

export function updateShape(
  shapes: Shape[],
  shapeId: string,
  newX: number,
  newY: number
) {
  shapes.map((shape) => {
    if (shape.shapeId === shapeId) {
      shape.xOffset = newX;
      shape.yOffset = newY;
    }
  });
}

export function deleteShape(shapes: [], shapeId: number) {}
