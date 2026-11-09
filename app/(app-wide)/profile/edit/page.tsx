import type { Metadata } from "next";
import EditProfilePage from "@/modules/dashboard/EditProfilePage";

export const metadata: Metadata = { title: "Edit Profile" };

export default function Page() {
  return <EditProfilePage />;
}
