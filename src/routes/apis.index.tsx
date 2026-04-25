import { createFileRoute } from "@tanstack/react-router";
import { ApisIndex } from "./apis";

export const Route = createFileRoute("/apis/")({
  head: () => ({ meta: [{ title: "API Management — DevPulse" }] }),
  component: ApisIndex,
});
