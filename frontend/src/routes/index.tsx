import { createFileRoute } from "@tanstack/react-router";
import LeftNav from "../components/LeftNav";
import TopNav from "../components/TopNav";
import RightNav from "../components/RightNav";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="bg-[#2c2c2c] text-white h-screen w-screen overflow-hidden">
      <LeftNav />
      <TopNav />
      <RightNav />
    </div>
  );
}
