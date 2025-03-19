import React, { createContext, useState } from "react";

interface Position {
  x: number;
  y: number;
}

interface ViewContextType {
  transform: string;
  pan: (amount: Position) => void;
  scaleAt: (at: Position, amount: number) => void;
  scale: number;
  setScale: (scale: number) => void;
  pos: Position;
}

export const ViewContext = createContext<ViewContextType | undefined>(
  undefined
);

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [pos, setPos] = useState<Position>({ x: 0, y: 0 });

  const pan = (amount: Position) => {
    setPos((prevPos) => ({
      x: prevPos.x + amount.x,
      y: prevPos.y + amount.y,
    }));
  };

  const scaleAt = (at: Position, amount: number) => {
    setScale((oldScale) => oldScale * amount);
    setPos((prevPos) => ({
      x: at.x - (at.x - prevPos.x) * amount,
      y: at.y - (at.y - prevPos.y) * amount,
    }));
  };

  const matrix = [scale, 0, 0, scale, pos.x, pos.y];
  const transform = `matrix(${matrix.join(",")})`;

  return (
    <ViewContext.Provider
      value={{ transform, pan, scaleAt, scale, setScale, pos }}
    >
      {children}
    </ViewContext.Provider>
  );
};
