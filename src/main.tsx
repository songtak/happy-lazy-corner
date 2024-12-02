import * as React from "react";
import * as ReactDOM from "react-dom/client";
import MainRouter from "./routes/MainRouter";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MainRouter />
  </React.StrictMode>
);
