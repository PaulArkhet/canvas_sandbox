import {
  MutableRefObject,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useArtboardStore from "../../../store/ArtboardStore";
import { Wireframe } from "@backend/src/interfaces/artboard";
import imageIcon from "/iconimage.png";
import { Rnd } from "react-rnd";
import debounce from "lodash/debounce";
import {
  Bounds,
  getBoundsForShape,
  isShapeInPage,
} from "@/routes/_authenticated/artboard/$projectId";
import { ViewContext } from "../../zoom/ViewContext";
import { Switch } from "../../ui/switch";
import { DragHandles } from "../components/DragHandles";
import { GRID_SIZE_PIXELS } from "../Canvas";
import { MultipageHandles } from "./MultipageHandles";
import { useUpdateShapeMutation } from "@/lib/api/shapes";

export function getNearestGridCoordinate(currentPositionPixels: number) {
  return (
    Math.round(currentPositionPixels / GRID_SIZE_PIXELS) * GRID_SIZE_PIXELS
  );
}
export function findShape(shapeId: string, shapes: Wireframe[]) {
  return shapes.find((shapeItem) => shapeItem.id === shapeId);
}

export function DragAndDropComponent(props: {
  shape: ReturnType<typeof setupArtboardTree>[number];
  pageRefList?: MutableRefObject<HTMLDivElement[]>;
  canvasRef: MutableRefObject<HTMLDivElement | null>;
  allShapesRefList?: MutableRefObject<HTMLDivElement[]>;
  isHandToolActive: boolean;
  handleMouseUp: () => void;
  shapes: Wireframe[];
  mousePos: { x: number; y: number };
}) {
  const { shape, isHandToolActive } = props;
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingEnabled, setDraggingEnabled] = useState(true);
  const [initialShapesBeforeEdit, setShapesBeforeChange] = useState<
    Wireframe[]
  >([]);
  const view = useContext(ViewContext);
  const { mutate: handleUpdateShape } = useUpdateShapeMutation(props.projectId);
  const debouncedUpdateShape = debounce((updateProps) => {
    handleUpdateShape(updateProps);
  }, 300);

  const [text, setText] = useState(shape.type === "text" ? shape.content : "");

  useEffect(() => {
    if (shape.type !== "text" || text === shape.content) return;

    const timeout = setTimeout(() => {
      handleUpdateShape({
        shapeId: shape.id,
        args: {
          type: shape.type,
          content: text,
        },
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [text]);

  // function handleShapeClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
  //   switch (e.detail) {
  //     case 1:
  //       setSelectedShapeId(shape.id);
  //       break;
  //     case 2:
  //       if (shape.type === "button" || shape.type === "text") {
  //         setIsEditable(true);
  //         setSelectedShapeId(shape.id);
  //       }
  //       break;
  //   }
  // }

  const {
    selectedShapeId,
    setSelectedShapeId,
    addUndoState,
    debugPath,
    setTemporaryOffset,
    temporaryOffset,
  } = useArtboardStore((state) => state);

  const [isEditable, setIsEditable] = useState(false);
  const artboardTree = useMemo(() => {
    return setupArtboardTree(initialShapesBeforeEdit, handleUpdateShape);
  }, [initialShapesBeforeEdit]);

  function handleUpdateRefList(el: HTMLDivElement) {
    if (!el || !props.pageRefList) return;
    // console.log("updating ref list...", props.pageRefList);

    const { pageRefList, allShapesRefList } = props;
    const elId = shape.id.toString();

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

  const [isHovered, setIsHovered] = useState(false);

  return (
    <Rnd
      enableUserSelectHack={!isHandToolActive}
      enableResizing={
        !isHandToolActive && shape.type !== "instance" && !shape.isInstanceChild
      }
      scale={view ? view.scale : 1}
      key={shape.id + shape.type}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        zIndex: shape.zIndex,
        position: "absolute",
        cursor: isHandToolActive ? "grab" : "arkhet-cursor",
        border:
          (selectedShapeId === shape.id && shape.type !== "page") ||
          (isHovered && shape.type !== "page")
            ? "2px solid #70acdc"
            : "2px solid transparent",
      }}
      resizeHandleComponent={{
        bottomRight: DragHandles({
          shape: props.shape,
          selectedShapeId: selectedShapeId,
        })[0],
        bottomLeft: DragHandles({
          shape: props.shape,
          selectedShapeId,
        })[1],
        topLeft: DragHandles({
          shape: props.shape,
          selectedShapeId,
        })[2],
        topRight: DragHandles({
          shape: props.shape,
          selectedShapeId,
        })[3],
      }}
      // onResizeStop={props.handleMouseUp}
      // maxWidth={shape.maxWidth} // this should be from the shapes properties, not here
      minWidth={shape.minWidth}
      default={{
        x: shape.xOffset,
        y: shape.yOffset,
        width: shape.width,
        height: shape.height,
      }}
      position={
        temporaryOffset &&
        temporaryOffset.childrenId.findIndex(
          (offsetId) => offsetId === shape.id
        ) !== -1
          ? {
              x: shape.xOffset + temporaryOffset.xOffset,
              y: shape.yOffset + temporaryOffset.yOffset,
            }
          : {
              x: shape.xOffset,
              y: shape.yOffset,
            }
      }
      size={{
        width: shape.width,
        height: shape.height,
      }}
      disableDragging={!draggingEnabled || isHandToolActive}
      minHeight={shape.minHeight}
      bounds={props.canvasRef.current ? props.canvasRef.current : "parent"}
      onResizeStart={() => {
        setShapesBeforeChange(props.shapes);
      }}
      onDragStart={(_, data) => {
        setDragStart({ x: data.x, y: data.y });
        setShapesBeforeChange(props.shapes);
      }}
      onDrag={(_, dragData) => {
        if (props.shape.type === "page" || shape.type === "card") {
          const ourPage = artboardTree.find(
            (page) => page.id === props.shape.id
          )!;
          // if (isTemporaryShape) {
          //   handleUpdateShape({
          //     shapeId: props.shape.id,
          //     args: {
          //       type: props.shape.type,
          //       xOffset: getNearestGridCoordinate(dragData.x),
          //       yOffset: getNearestGridCoordinate(dragData.y),
          //     },
          //   });
          // }

          if (!ourPage.children) return;
          setTemporaryOffset({
            childrenId: ourPage.children.map((child) => child.id),
            xOffset: dragData.x - dragStart.x,
            yOffset: dragData.y - dragStart.y,
          });
        }
      }}
      onDragStop={(_, dragData) => {
        addUndoState(initialShapesBeforeEdit);
        const newX = getNearestGridCoordinate(dragData.x);
        const newY = getNearestGridCoordinate(dragData.y);
        if (shape.xOffset !== newX || shape.yOffset !== newY) {
          console.log("on drag stop shape id:", props.shape.id);
          handleUpdateShape({
            shapeId: props.shape.id,
            args: {
              type: props.shape.type,
              xOffset: newX,
              yOffset: newY,
            },
          });

          if (props.shape.type === "page") {
            setTemporaryOffset(null);
            const ourPage = artboardTree.find(
              (page) => page.id === props.shape.id
            )!;

            if (!ourPage.children) return;

            ourPage.children.forEach((child) => {
              handleUpdateShape({
                shapeId: child.id,
                args: {
                  type: child.type,
                  xOffset:
                    child.xOffset +
                    ourPage.xOffset +
                    getNearestGridCoordinate(dragData.x - dragStart.x),
                  yOffset:
                    child.yOffset +
                    ourPage.yOffset +
                    getNearestGridCoordinate(dragData.y - dragStart.y),
                },
              });
            });
          }
        }
      }}
      onResizeStop={(_, direction, ___, resizableDelta) => {
        addUndoState(initialShapesBeforeEdit);

        const offset = {
          x: 0,
          y: 0,
        };

        if (
          direction === "left" ||
          direction === "bottomLeft" ||
          direction === "topLeft"
        ) {
          offset.x += resizableDelta.width;
        }

        if (
          direction === "top" ||
          direction === "topRight" ||
          direction === "topLeft"
        ) {
          offset.y += resizableDelta.height;
        }

        handleUpdateShape({
          shapeId: shape.id,
          args: {
            type: shape.type,
            width: getNearestGridCoordinate(
              Math.max(shape.width + resizableDelta.width, 5)
            ),
            height: getNearestGridCoordinate(
              Math.max(shape.height + resizableDelta.height, 5)
            ),
            xOffset: getNearestGridCoordinate(shape.xOffset - offset.x),
            yOffset: getNearestGridCoordinate(shape.yOffset - offset.y),
          },
        });
      }}
    >
      <div
        id={shape.id.toString()}
        className={`h-full relative shape`}
        ref={handleUpdateRefList}
        data-id={shape.id}
        data-description={shape.type === "page" ? shape.description : undefined}
        onMouseDown={(e) => {
          if (e.detail !== 2) setSelectedShapeId(shape.id); // Prevents interference with double-click
        }}
        onMouseUp={(e) => {
          if (shape.id !== selectedShapeId) {
            // for dragging path segments between different MultipageHandles, handles the "release" of dragging
            // we need to set the selected shape id to the shape that is being dragged over
            // so that the path is drawn from the correct shape
            setSelectedShapeId(shape.id);
          }
        }}
        onDoubleClick={(e) => {
          if (shape.type === "button" || shape.type === "text") {
            setIsEditable(true);
            setSelectedShapeId(shape.id);
          }
        }}
      >
        {selectedShapeId === shape.id && shape.type !== "page" && (
          <MultipageHandles
            setDraggingEnabled={setDraggingEnabled}
            mousePos={props.mousePos}
            shape={shape}
            projectId={props.projectId}
          />
        )}
        {shape.type === "page" &&
          debugPath &&
          findShape(debugPath.originalShapeId, props.shapes) &&
          !isShapeInPage(
            findShape(debugPath.originalShapeId, props.shapes)!,
            shape
          ) && (
            <MultipageHandles
              setDraggingEnabled={setDraggingEnabled}
              mousePos={props.mousePos}
              shape={shape}
              projectId={props.projectId}
            />
          )}
        {shape.type === "page" ? (
          <>
            <div
              className={`pb-5 absolute w-full -top-8 left-2 ${
                selectedShapeId == shape.id ? "text-sky-200" : ""
              }`}
            >
              <input
                style={{
                  cursor: isHandToolActive ? "grab" : "arkhet-cursor",
                }}
                className="bg-transparent focus:outline-none"
                defaultValue={shape.title}
                onChange={(e) => {
                  debouncedUpdateShape({
                    shapeId: shape.id,
                    args: {
                      type: shape.type,
                      title: e.target.value,
                    },
                  });
                }}
                type="text"
              />
            </div>
            <div
              className={`page page-inner w-full h-full bg-[#262626] bg-opacity-75 rounded-2xl transition-opacity duration-500 ${
                selectedShapeId == shape.id
                  ? "page-focus border border-[#70acdc]"
                  : ""
              }
                ${view && view.scale >= 2 ? "opacity-50" : "bg-opacity-100"}
                `}
            />
            <input
              className={`bg-transparent focus:outline-none w-full my-2 ${
                selectedShapeId == shape.id ? "text-sky-200" : ""
              }`}
              defaultValue={shape.description}
              onChange={(e) => {
                debouncedUpdateShape({
                  shapeId: shape.id,
                  args: {
                    type: shape.type,
                    description: e.target.value,
                  },
                });
              }}
              type="text"
            />
          </>
        ) : shape.type === "button" ? (
          <div
            className={`relative w-full h-full flex items-center flex-col text-center rounded justify-center ${shape.subtype} [container-type:size]`}
            onDoubleClick={(e) => {
              setIsEditable(true);
              setSelectedShapeId(shape.id);
            }}
          >
            {isEditable ? (
              <input
                autoFocus
                className={`text-[50cqh] text-center w-[90%] ${
                  shape.subtype == "Secondary" || shape.subtype == "Tertiary"
                    ? "bg-transparent"
                    : ""
                }`}
                defaultValue={shape.title}
                onChange={(e) =>
                  debouncedUpdateShape({
                    shapeId: shape.id,
                    args: {
                      type: shape.type,
                      title: e.target.value,
                    },
                  })
                }
                onBlur={() => setIsEditable(false)}
              />
            ) : (
              <span
                className={`text-[50cqh] text-center w-[90%] overflow-hidden text-ellipsis whitespace-nowrap select-none ${
                  isHandToolActive ? "cursor: grab" : "arkhet-cursor"
                }`}
              >
                {shape.title}
              </span>
            )}
          </div>
        ) : shape.type === "text" ? (
          <div
            className="w-full h-full"
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditable(true);
              setSelectedShapeId(shape.id);
            }}
          >
            {isEditable ? (
              <textarea
                ref={(ref) => ref && ref.focus()}
                value={text}
                autoFocus
                onFocus={(e) => {
                  e.target.setSelectionRange(
                    e.target.value.length,
                    e.target.value.length
                  );
                }}
                className={`w-full h-full bg-transparent focus:outline-none ${shape.fontColor} ${shape.fontSize}`}
                onChange={(e) => setText(e.target.value)}
                onBlur={(e) => {
                  if (
                    !e.relatedTarget ||
                    !e.relatedTarget.closest(".editable-component")
                  ) {
                    setIsEditable(false);
                  }
                }}
              />
            ) : (
              <div
                className={`w-full h-full bg-transparent select-none ${shape.fontColor} ${shape.fontSize}`}
              >
                {shape.content || ""}
              </div>
            )}
          </div>
        ) : shape.type === "inputField" ? (
          <div
            className="relative h-full"
            onDoubleClick={() => setIsEditable(true)}
          >
            {isEditable ? (
              <input
                autoFocus
                type="text"
                className="bg-transparent border border-gray-300 rounded focus:outline-none text-xs h-full w-full"
                defaultValue={shape.title}
                onChange={(e) =>
                  debouncedUpdateShape({
                    shapeId: shape.id,
                    args: {
                      type: shape.type,
                      title: e.target.value,
                    },
                  })
                }
                onBlur={() => setIsEditable(false)}
              />
            ) : (
              <span
                className="w-full h-full p-1 focus:outline-none bg-transparent rounded-sm border text-xs"
                style={{
                  display: "inline-block",
                  minWidth: shape.minWidth,
                }}
              >
                {shape.title}
              </span>
            )}
          </div>
        ) : shape.type === "checkbox" ? (
          <div className="w-full h-full">
            <div>{shape.label}</div>
            {/*<div className="text-xs py-1">{shape.description}</div>  no description.. */}
            <div className={`${shape.subtype === "horizontal" && "flex"}`}>
              <div className="flex">
                <input
                  readOnly={!isEditable}
                  type="checkbox"
                  className=""
                  defaultChecked
                />
                <div className="px-2 text-xs">{shape.option1}</div>
              </div>
              <div className="flex">
                <input readOnly={!isEditable} type="checkbox" className="" />
                <div className="px-2 text-xs">{shape.option2}</div>
              </div>
            </div>
          </div>
        ) : shape.type === "radio" ? (
          <div className="w-full h-full">
            <div>{shape.label}</div>
            {/*<div className="text-xs py-1">{shape.description}</div>  no description.. */}
            <div className={`flex ${shape.subtype === "column" && "flex-col"}`}>
              <div className="flex">
                <input type="radio" />
                <label className="px-2 text-xs">{shape.option1}</label>
              </div>
              <div className="flex">
                <input type="radio" />
                <label className="px-2 text-xs">{shape.option2}</label>
              </div>
              <div className="flex">
                <input type="radio" />
                <label className="px-2 text-xs">{shape.option3}</label>
              </div>
            </div>
          </div>
        ) : shape.type === "image" ? (
          <div className="w-full h-full bg-[#404040] flex justify-center items-center rounded-xl">
            <img src={imageIcon} alt="" className="mx-auto" draggable={false} />
          </div>
        ) : shape.type === "dropdown" ? (
          <select
            onMouseEnter={() => console.log("hover")}
            className={`w-full h-full text-black text-xs ${
              isHandToolActive
                ? "cursor-grab pointer-events-none"
                : "arkhet-cursor"
            }`}
            disabled={isHandToolActive}
          >
            <option value="default">{shape.option1}</option>
            <option value="default2">{shape.option2}</option>
            <option value="default2">{shape.option3}</option>
          </select>
        ) : shape.type === "circle" ? (
          <div className="w-full h-full bg-white rounded-full"></div>
        ) : shape.type === "card" ? (
          <>
            <div
              className={`pb-5 absolute w-full -top-8 left-2 ${
                selectedShapeId == shape.id ? "text-sky-200" : ""
              }`}
            >
              <input
                style={{
                  cursor: isHandToolActive ? "grab" : "arkhet-cursor",
                }}
                className="bg-transparent focus:outline-none"
                defaultValue={shape.title}
                onChange={(e) => {
                  debouncedUpdateShape({
                    shapeId: shape.id,
                    args: {
                      type: shape.type,
                      title: e.target.value,
                    },
                  });
                }}
                type="text"
              />
            </div>
            <div
              className={`w-full h-full bg-[#1C1C1C]  ${
                selectedShapeId == shape.id
                  ? "page-focus border border-[#70acdc]"
                  : ""
              }`}
            />

            <input
              className={`bg-transparent focus:outline-none w-full my-2 ${
                selectedShapeId == shape.id ? "text-sky-200" : ""
              }`}
              defaultValue={shape.description}
              onChange={(e) => {
                debouncedUpdateShape({
                  shapeId: shape.id,
                  args: {
                    type: shape.type,
                    description: e.target.value,
                  },
                });
              }}
              type="text"
            />
          </>
        ) : shape.type === "toggle" ? (
          <Switch className="bg-blue-500 text-black" />
        ) : shape.type === "divider" ? (
          <div
            className={`p-2 ${
              isHandToolActive ? "cursor: grab" : "cursor-ew-resize"
            }`}
            style={{ minWidth: "50px", minHeight: "5px" }}
          >
            <div
              onMouseEnter={() => {
                console.log("hover");
              }}
              className="bg-white rounded-full"
              style={{
                height: "3px",
                width: "100%",
                backgroundColor: "white",
              }}
            />
          </div>
        ) : shape.type === "navigation" ? (
          <div className="w-full h-full ">
            <textarea
              name=""
              id=""
              value={shape.content}
              className={`w-full h-full bg-transparent focus:outline-none ${shape.fontColor} ${shape.fontSize} text-xs`}
              onChange={(e) => {
                handleUpdateShape({
                  shapeId: shape.id,
                  args: {
                    type: shape.type,
                    content: e.target.value,
                  },
                });
              }}
            />
          </div>
        ) : shape.type === "chatbot" ? (
          <div className="w-full h-full bg-gradient-to-r from-[#7AA3DC] via-[#6454B7] to-[#B754B3]">
            <div className="w-[98%] h-[98%] relative left-[2px] top-[1px] bg-[#262626] ">
              <div className="h-[75%] flex justify-center pt-5">
                <svg
                  width="20"
                  height="16"
                  viewBox="0 0 20 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 0C10.5531 0 11 0.446875 11 1V3H14.75C15.9937 3 17 4.00625 17 5.25V13.75C17 14.9937 15.9937 16 14.75 16H5.25C4.00625 16 3 14.9937 3 13.75V5.25C3 4.00625 4.00625 3 5.25 3H9V1C9 0.446875 9.44687 0 10 0ZM6.5 12C6.225 12 6 12.225 6 12.5C6 12.775 6.225 13 6.5 13H7.5C7.775 13 8 12.775 8 12.5C8 12.225 7.775 12 7.5 12H6.5ZM9.5 12C9.225 12 9 12.225 9 12.5C9 12.775 9.225 13 9.5 13H10.5C10.775 13 11 12.775 11 12.5C11 12.225 10.775 12 10.5 12H9.5ZM12.5 12C12.225 12 12 12.225 12 12.5C12 12.775 12.225 13 12.5 13H13.5C13.775 13 14 12.775 14 12.5C14 12.225 13.775 12 13.5 12H12.5ZM8.25 8C8.25 7.66848 8.1183 7.35054 7.88388 7.11612C7.64946 6.8817 7.33152 6.75 7 6.75C6.66848 6.75 6.35054 6.8817 6.11612 7.11612C5.8817 7.35054 5.75 7.66848 5.75 8C5.75 8.33152 5.8817 8.64946 6.11612 8.88388C6.35054 9.1183 6.66848 9.25 7 9.25C7.33152 9.25 7.64946 9.1183 7.88388 8.88388C8.1183 8.64946 8.25 8.33152 8.25 8ZM13 9.25C13.3315 9.25 13.6495 9.1183 13.8839 8.88388C14.1183 8.64946 14.25 8.33152 14.25 8C14.25 7.66848 14.1183 7.35054 13.8839 7.11612C13.6495 6.8817 13.3315 6.75 13 6.75C12.6685 6.75 12.3505 6.8817 12.1161 7.11612C11.8817 7.35054 11.75 7.66848 11.75 8C11.75 8.33152 11.8817 8.64946 12.1161 8.88388C12.3505 9.1183 12.6685 9.25 13 9.25ZM1.5 7H2V13H1.5C0.671875 13 0 12.3281 0 11.5V8.5C0 7.67188 0.671875 7 1.5 7ZM18.5 7C19.3281 7 20 7.67188 20 8.5V11.5C20 12.3281 19.3281 13 18.5 13H18V7H18.5Z"
                    fill="#D9D9D9"
                  />
                </svg>
              </div>
              <div className="h-[24%] bg-gradient-to-r from-[#7AA3DC] via-[#6454B7] to-[#B754B3] mx-1 mb-1 rounded">
                <div className="w-[99%] h-[95%] relative left-[1px] top-[1px] bg-[#262626] text-[#6A66C0] text-sm px-1 rounded py-2 pl-2">
                  Ask a Question...
                </div>
              </div>
            </div>
          </div>
        ) : shape.type === "instance" ? (
          <>
            <div
              className={`pb-5 absolute w-full -top-8 left-2 ${
                selectedShapeId == shape.id ? "text-sky-200" : ""
              }`}
            ></div>
            <div
              className={`w-full h-full bg-[#1C1C1C] ${
                selectedShapeId == shape.id
                  ? "page-focus border border-[#70acdc]"
                  : ""
              }`}
            />
          </>
        ) : shape.type === "rectangle" ? (
          <div
            className={`h-full w-full bg-[#1C1C1C] ${
              selectedShapeId == shape.id
                ? "page-focus border border-[#70acdc]"
                : ""
            }`}
          ></div>
        ) : (
          <div>ERR: Nonexisting component</div>
        )}
        {shape.children?.map((child, index) => (
          <DragAndDropComponent
            {...props}
            pageRefList={undefined}
            allShapesRefList={undefined}
            shape={child}
            key={shape.type + shape.id + index}
          />
        ))}
      </div>
    </Rnd>
  );
}

function setDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  return new Set([...setA].filter((item) => !setB.has(item)));
}

function setupArtboardTree(
  shapes: Wireframe[],
  handleUpdateShape: ReturnType<typeof useUpdateShapeMutation>["mutate"]
) {
  // react screenshot needs all components inside of each "frame" to be
  // children of each other to include them in the screenshot

  const roots = shapes.filter(
    (shape) => shape.type === "page" || shape.type === "card"
  );
  const children = shapes.filter(
    (shape) => shape.type !== "page" && shape.type !== "card"
  );

  const newRoots = roots.map((root: Wireframe & { children?: Wireframe[] }) => {
    const newRoot = { ...root };
    newRoot.children = [];
    const rootBounds = getBoundsForShape(root);
    const innerChildren = children.filter((child) => {
      const childBounds = getBoundsForShape(child);
      return isInBoundsOfOuterShape(rootBounds, childBounds);
    });
    innerChildren.forEach((child) => {
      const index = children.findIndex(
        (selectedChild) => selectedChild.id === child.id
      );
      children.splice(index, 1);
      const newChild = { ...child };
      newChild.xOffset -= root.xOffset;
      newChild.yOffset -= root.yOffset;
      newRoot.children!.push(newChild);
    });
    return newRoot;
  });

  newRoots
    .filter((root) => root.type === "card")
    .forEach((cardRoot) => {
      const cardInStore = shapes.find((shape) => shape.id === cardRoot.id);
      if (!cardInStore || cardInStore.type !== "card") return;
      if (!cardRoot.children) return;

      const rootChildrenIds = cardRoot.children!.map(
        (childComponent) => childComponent.id
      );
      const rootChildrenSet = new Set(rootChildrenIds);
      const cardInStoreChildrenSet = new Set(cardInStore.childrenComponents);

      const idsToRemoveFromStore = setDifference(
        cardInStoreChildrenSet,
        rootChildrenSet
      );
      const idsToAddToStore = setDifference(
        rootChildrenSet,
        cardInStoreChildrenSet
      );

      idsToRemoveFromStore.forEach((id) => {
        cardInStoreChildrenSet.delete(id);
      });

      idsToAddToStore.forEach((id) => {
        cardInStoreChildrenSet.add(id);
      });

      const newChildrenIds = Array.from(cardInStoreChildrenSet);

      handleUpdateShape({
        shapeId: cardInStore.id,
        args: {
          type: cardInStore.type,
          childrenComponents: newChildrenIds,
        },
      });
    });

  const result = [
    ...newRoots,
    ...(children as (Wireframe & { children: undefined })[]),
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
