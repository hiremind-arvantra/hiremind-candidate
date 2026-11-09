import type { Metadata } from "next";
import ImproveMatchPage from "@/modules/dashboard/ImproveMatchPage";

export const metadata: Metadata = { title: "Improve Your Match" };

export default function Page() {
  return <ImproveMatchPage />;
}
