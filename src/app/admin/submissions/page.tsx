import { PageHeader } from "@/components/ui";
import { getSubmissions } from "@/lib/queries";
import SubmissionReview from "./SubmissionReview";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const submissions = await getSubmissions();
  const waiting = submissions.filter((s) => s.status === "submitted").length;
  return (
    <>
      <PageHeader title="Submissions" subtitle={`${waiting} awaiting review · approve or reject with feedback`} />
      <SubmissionReview submissions={submissions} />
    </>
  );
}
