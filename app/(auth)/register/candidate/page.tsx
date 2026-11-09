import CandidateRegistration from "@/modules/auth/components/candidate-reg/CandidateRegistration";

import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Candidate Registration");

export default function CandidateRegPage() {
  return <CandidateRegistration />;
}
