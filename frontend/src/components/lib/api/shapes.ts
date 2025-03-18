export type Shape = {};

export function createShape(shapes: any[], shape: string) {
  const shapeId = shapes.length;
  const type = shape;
  const position = { x: 1650, y: 1300 };
  shapes.push({ shapeId, type, position, width: 250, height: 250 });
  console.log(shapes);
}

export function updateShape(shapes: any[], shapeId: number, newPosition: any) {
  shapes.map((shape) => {
    if (shape.id === shapeId) {
      shape.position = newPosition;
    }
  });
}

export function deleteShape(shapes: [], shapeId: number) {}
