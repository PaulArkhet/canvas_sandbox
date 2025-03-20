import { createShape } from "./lib/api/shapes";

export default function TopNav(props: {
  isHandToolActive: boolean;
  setIsHandToolActive: React.Dispatch<React.SetStateAction<boolean>>;
  toggleHandTool: () => void;
  shapes: any[];
  setShapes: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const {
    isHandToolActive,
    setIsHandToolActive,
    toggleHandTool,
    shapes,
    setShapes,
  } = props;

  return (
    <div
      className={`fixed top-0 left-[250px] w-[25%] sm:w-[45%] md:w-[50%] lg:w-[calc(100%_-_500px)] bg-[#242424] border-b border-b-zinc-700 flex items-center justify-between ${isHandToolActive ? "cursor-grab" : "arkhet-cursor"} z-[9999]`}
    >
      <div>
        <button
          className={`ml-5 py-2 px-2 pl-3 rounded ${
            !isHandToolActive && "bg-zinc-600"
          }`}
          onClick={() => setIsHandToolActive(false)}
        >
          <svg
            width="12"
            height="16"
            viewBox="0 0 12 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 0.8286V14.0719C0 14.5076 0.353584 14.8577 0.785741 14.8577C1.01075 14.8577 1.22861 14.7612 1.37862 14.5898L4.32872 11.2147L6.40379 15.3684C6.68594 15.9327 7.37168 16.1613 7.93599 15.8791C8.50029 15.597 8.72887 14.9112 8.44672 14.3469L6.42165 10.2861H10.6397C11.0754 10.2861 11.429 9.93248 11.429 9.49675C11.429 9.27175 11.3325 9.05745 11.1647 8.90745L1.37862 0.210722C1.22504 0.0750026 1.03218 0 0.8286 0C0.371441 0 0 0.371441 0 0.8286Z"
              fill="white"
            />
          </svg>
        </button>
        <button
          className="py-5 px-2"
          onClick={() => {
            createShape(shapes, "page", 600, 300);
            setShapes([...shapes]);
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="2.18695"
              width="2.30216"
              height="16"
              rx="0.5"
              fill="white"
            />
            <rect
              x="16"
              y="2.30225"
              width="2.30216"
              height="16"
              rx="0.5"
              transform="rotate(90 16 2.30225)"
              fill="white"
            />
            <rect
              x="11.3958"
              width="2.30216"
              height="16"
              rx="0.5"
              fill="white"
            />
            <rect
              x="16"
              y="11.5107"
              width="2.30216"
              height="16"
              rx="0.5"
              transform="rotate(90 16 11.5107)"
              fill="white"
            />
          </svg>
        </button>
        <button
          className={`py-2 px-2 rounded ${isHandToolActive ? "bg-zinc-600" : ""}`}
          onClick={toggleHandTool}
        >
          <div>
            <svg
              width="15"
              height="16"
              viewBox="0 0 15 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.00159 1C9.00159 0.446875 8.55471 0 8.00159 0C7.44846 0 7.00158 0.446875 7.00158 1V7.5C7.00158 7.775 6.77658 8 6.50158 8C6.22658 8 6.00158 7.775 6.00158 7.5V2C6.00158 1.44687 5.55471 1 5.00158 1C4.44846 1 4.00158 1.44687 4.00158 2V10.5C4.00158 10.5469 4.00158 10.5969 4.00471 10.6438L2.11408 8.84375C1.61408 8.36875 0.82346 8.3875 0.345335 8.8875C-0.13279 9.3875 -0.110915 10.1781 0.389085 10.6562L3.90158 14C5.24846 15.2844 7.03908 16 8.90158 16H9.50159C12.5391 16 15.0016 13.5375 15.0016 10.5V4C15.0016 3.44688 14.5547 3 14.0016 3C13.4485 3 13.0016 3.44688 13.0016 4V7.5C13.0016 7.775 12.7766 8 12.5016 8C12.2266 8 12.0016 7.775 12.0016 7.5V2C12.0016 1.44687 11.5547 1 11.0016 1C10.4485 1 10.0016 1.44687 10.0016 2V7.5C10.0016 7.775 9.77658 8 9.50159 8C9.22659 8 9.00159 7.775 9.00159 7.5V1Z"
                fill="white"
              />
            </svg>
          </div>
        </button>
      </div>
      <div className="ml-auto mr-auto absolute left-[40%] top-[3%] flex flex-row items-center justify-center mt-2">
        <div className="flex flex-col gap-1 items-center justify-center">
          <p className="text-[15px] text-center px-8 py-3 mr-2 rounded-t-sm tracking-[1px] bg-[#2C2C2C]">
            WIREFRAME
          </p>
        </div>
        <div className="">
          <div className="relative z-30 text-[15px] text-center px-8 py-3 ml-2 rounded-t-sm tracking-[1px] text-white border-t border-l border-r border-[#424242] border-b-[#2C2C2C]">
            PROTOTYPE
          </div>
        </div>
      </div>
    </div>
  );
}
