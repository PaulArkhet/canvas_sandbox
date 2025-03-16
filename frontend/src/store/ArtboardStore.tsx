import { create } from "zustand";

export type Wireframe = any;

export type HandleType = any;

export type PrototypeScreenshot = {
  id: number;
  xOffset: number;
  yOffset: number;
  width: number;
  height: number;
  title?: string;
  description?: string;
  src: string;
};

export type ArtboardState = {
  shapeHistory: {
    undoStack: Wireframe[][];
    redoStack: Wireframe[][];
  };
  isHandToolActive: boolean;
  selectedShapeId: string | null;
  setSelectedShapeId: (args: string | null) => void;
  setIsHandToolActive: (args: boolean) => void;
  toggleHandTool: () => void;
  handleTimeTravel: (direction: "redo" | "undo") => void;
  addUndoState: (shapes: Wireframe[]) => void;
  debugPath: TemporaryPath | null;
  setDebugPath: (path: TemporaryPath | null) => void;
  setTemporaryOffset: (
    temporaryOffset: null | {
      childrenId: string[];
      xOffset: number;
      yOffset: number;
    }
  ) => void;
  temporaryOffset: null | {
    childrenId: string[];
    xOffset: number;
    yOffset: number;
  };
  wrapperRef: React.RefObject<HTMLDivElement> | null;
  setWrapperRef: (ref: React.RefObject<HTMLDivElement>) => void;
};

export type TemporaryPath = {
  path: { x: number; y: number }[];
  originalShapeId: string;
  handleType: HandleType;
  pageExcludeList: string[];
  direction: "vertical" | "horizontal";
};

export type ArtboardView = {
  scale: number;
  x: number;
  y: number;
};

const useArtboardStore = create<ArtboardState>((set, get) => ({
  debugPath: null,
  setDebugPath: (path: TemporaryPath | null) => {
    set({ debugPath: path });
  },
  shapeHistory: {
    undoStack: [],
    redoStack: [],
  },
  handleTimeTravel: (direction) => {
    // needs to be refactored
    /*
    const { shapeHistory, shapes } = get();
    if (direction === "undo" && shapeHistory.undoStack.length > 0) {
      // pop from undo stack into state, add state to redostack
      const newState = shapeHistory.undoStack.pop();
      shapeHistory.redoStack.push(shapes);
      set({ shapeHistory, shapes: newState });
    } else if (direction === "redo" && shapeHistory.redoStack.length > 0) {
      const newState = shapeHistory.redoStack.pop();
      shapeHistory.undoStack.push(shapes);
      set({ shapeHistory, shapes: newState });
    }
    */
  },
  addUndoState: (shapes: Wireframe[]) => {
    const { shapeHistory } = get();
    shapeHistory.redoStack = [];
    shapeHistory.undoStack.push(shapes);
    set({ shapeHistory });
  },
  selectedShapeId: null,
  isHandToolActive: false,
  setSelectedShapeId: (args: any) => {
    if (args > Date.now() / 10) return; // don't set temporary shapes as selected.
    set({ selectedShapeId: args });
  },
  setIsHandToolActive: (args: boolean) => set({ isHandToolActive: args }),
  toggleHandTool: () => {
    const handToolState = get().isHandToolActive;
    set({ isHandToolActive: !handToolState });
  },
  setTemporaryOffset: (temporaryOffset) => set({ temporaryOffset }),
  temporaryOffset: null,
  wrapperRef: null,
  setWrapperRef: (ref) => set({ wrapperRef: ref }),
}));

export default useArtboardStore;
