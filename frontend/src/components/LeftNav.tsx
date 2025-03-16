import { useState } from "react";
import logo from "/Arkhet-logo_white 1.png";
import caretRight from "/iconcaretright.png";

export default function LeftNav() {
  const [searchContent, setSearchContent] = useState("");

  return (
    <div className="fixed top-0 left-0 h-screen w-[250px] bg-zinc-900 overflow-auto arkhet-cursor">
      <div className="border-b-zinc-700 border-b-[1px] p-2  pr-10 pl-4">
        <div className="flex items-center">
          <img src={logo} alt="Arkhet Logo" className="pr-2 scale-75" />
          <p className="font pt-1 text-lg tracking-widest">ARKHET</p>
        </div>
      </div>
      <div className="flex my-2 py-2 pl-4 text-sm border-b-[1px] border-b-zinc-700">
        <div className="flex justify-center items-center">
          <svg
            width="13"
            height="13"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_2642_26774)">
              <path
                d="M6.5 3.25C6.5 3.96719 6.26719 4.62969 5.875 5.16719L7.85312 7.14687C8.04844 7.34219 8.04844 7.65937 7.85312 7.85469C7.65781 8.05 7.34062 8.05 7.14531 7.85469L5.16719 5.875C4.62969 6.26875 3.96719 6.5 3.25 6.5C1.45469 6.5 0 5.04531 0 3.25C0 1.45469 1.45469 0 3.25 0C5.04531 0 6.5 1.45469 6.5 3.25ZM3.25 5.5C3.54547 5.5 3.83805 5.4418 4.11104 5.32873C4.38402 5.21566 4.63206 5.04992 4.84099 4.84099C5.04992 4.63206 5.21566 4.38402 5.32873 4.11104C5.4418 3.83805 5.5 3.54547 5.5 3.25C5.5 2.95453 5.4418 2.66194 5.32873 2.38896C5.21566 2.11598 5.04992 1.86794 4.84099 1.65901C4.63206 1.45008 4.38402 1.28434 4.11104 1.17127C3.83805 1.0582 3.54547 1 3.25 1C2.95453 1 2.66194 1.0582 2.38896 1.17127C2.11598 1.28434 1.86794 1.45008 1.65901 1.65901C1.45008 1.86794 1.28434 2.11598 1.17127 2.38896C1.0582 2.66194 1 2.95453 1 3.25C1 3.54547 1.0582 3.83805 1.17127 4.11104C1.28434 4.38402 1.45008 4.63206 1.65901 4.84099C1.86794 5.04992 2.11598 5.21566 2.38896 5.32873C2.66194 5.4418 2.95453 5.5 3.25 5.5Z"
                fill="currentColor"
              />
            </g>
            <defs>
              <clipPath id="clip0_2642_26774">
                <rect width="8" height="8" fill="currentColor" />
              </clipPath>
            </defs>
          </svg>
          <input
            type="text"
            className="mt-1 font pl-3 bg-transparent outline-none"
            placeholder="Search..."
            onChange={(e) => setSearchContent(e.target.value)}
          />
        </div>
      </div>
      <div className="pl-4 pb-2 border-b border-b-[#303030]">
        <div className="flex w-[200px] py-2">
          <img src={caretRight} alt="" className="mr-2 h-[15px] w-[7px] pt-2" />
          <p>Basic Components</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pr-4 pb-2">
        <div
          className="justify-center items-center flex hover:text-[#42A5F5] hover:bg-[#202020] rounded pt-5 transition-all ease-in-out duration-200"
          draggable
        >
          <button>
            <svg
              width="46"
              height="17"
              viewBox="0 0 46 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="46" height="17" rx="3" fill="currentColor" />
            </svg>
            <p className="text-xs pt-5 pb-2">
              <span className="font-extrabold">B</span>utton
            </p>
          </button>
        </div>
        <div
          draggable
          className="justify-center items-center flex hover:text-[#42A5F5] hover:bg-[#202020] rounded pt-4 transition-all ease-in-out duration-200 cursor-pointer"
        >
          <button>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.3393 0.928571C11.1295 0.370536 10.5938 0 10 0C9.40625 0 8.87054 0.370536 8.66071 0.928571L2.58036 17.1429H1.42857C0.638393 17.1429 0 17.7812 0 18.5714C0 19.3616 0.638393 20 1.42857 20H5.71429C6.50446 20 7.14286 19.3616 7.14286 18.5714C7.14286 17.7812 6.50446 17.1429 5.71429 17.1429H5.63393L6.4375 15H13.5625L14.3661 17.1429H14.2857C13.4955 17.1429 12.8571 17.7812 12.8571 18.5714C12.8571 19.3616 13.4955 20 14.2857 20H18.5714C19.3616 20 20 19.3616 20 18.5714C20 17.7812 19.3616 17.1429 18.5714 17.1429H17.4196L11.3393 0.928571ZM12.4911 12.1429H7.50893L10 5.49554L12.4911 12.1429Z"
                fill="currentColor"
              />
            </svg>
            <p className="text-xs pt-5 pb-2">
              <span className="font-bold">T</span>ext
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
