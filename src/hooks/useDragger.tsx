import { useContext } from "react";
import { DragProvider } from "../components/DragWrapper";

export default function useDragger() {
  return useContext(DragProvider)
}