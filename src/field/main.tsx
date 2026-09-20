import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Field } from "./Field";
import "./style.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Field />
  </StrictMode>,
);
