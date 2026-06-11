import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/admin";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});
