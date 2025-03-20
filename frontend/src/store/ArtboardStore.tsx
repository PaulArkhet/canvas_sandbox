import { create } from "zustand";

export type Wireframe = any;

export type HandleType = any;

export type PermanentPath = any;

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
  isHandToolActive: boolean;
  selectedShapeId: string | null;
  setSelectedShapeId: (args: string | null) => void;
  setIsHandToolActive: (args: boolean) => void;
  toggleHandTool: () => void;
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
  selectedShapeIds: string[];
  setSelectedShapeIds: (ids: string[]) => void;
  addSelectedShapeId: (id: string) => void;
  removeSelectedShapeId: (id: string) => void;
  clearSelection: () => void;
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
  selectedShapeIds: [], // Change from single selection
  setSelectedShapeIds: (ids: string[]) => set({ selectedShapeIds: ids }),
  addSelectedShapeId: (id: string) =>
    set((state) => ({
      selectedShapeIds: [...new Set([...state.selectedShapeIds, id])],
    })),
  removeSelectedShapeId: (id: string) =>
    set((state) => ({
      selectedShapeIds: state.selectedShapeIds.filter(
        (shapeId) => shapeId !== id
      ),
    })),
  clearSelection: () => set({ selectedShapeIds: [] }),
}));

export default useArtboardStore;
