import { createFileRoute } from "@tanstack/react-router";
import { ApisIndex } from "./apis";

export const Route = createFileRoute("/apis/")({
  component: ApisIndex,
});
