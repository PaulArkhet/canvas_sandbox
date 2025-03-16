import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import "../index.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <React.Fragment>
      <div className="text-8xl">Hello "__root"!</div>
      <Outlet />
    </React.Fragment>
  );
}
