import AuthCardShell from "@/modules/auth/components/AuthCardShell";
import OtpForm from "@/modules/auth/components/OtpForm";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Verify Email");

// Same frame as forgot / reset / set password: standard auth header and one card at
// a fixed offset below it.
export default function OtpPage() {
  return (
    <AuthCardShell>
      <OtpForm />
    </AuthCardShell>
  );
}
