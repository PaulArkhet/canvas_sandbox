import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import "../index.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  React.useEffect(() => {
    document.body.classList.add("arkhet-cursor");
    return () => document.body.classList.remove("arkhet-cursor");
  }, []);
  return (
    <React.Fragment>
      <div className="flex flex-col min-h-screen w-full bg-zinc-800 text-white nunitofont overflow-hidden arkhet-cursor">
        <Outlet />
      </div>
    </React.Fragment>
  );
}
