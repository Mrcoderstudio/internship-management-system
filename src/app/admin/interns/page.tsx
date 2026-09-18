import { PageHeader } from "@/components/ui";
import { getInternProgress } from "@/lib/queries";
import InternManager from "./InternManager";

export const dynamic = "force-dynamic";

export default async function AdminInternsPage() {
  const interns = await getInternProgress();
  return (
    <>
      <PageHeader title="Interns" subtitle={`${interns.length} intern${interns.length === 1 ? "" : "s"} · progress tracking and management`} />
      <InternManager interns={interns} />
    </>
  );
}
