import { PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getInternTasks } from "@/lib/queries";
import TaskList from "./TaskList";

export const dynamic = "force-dynamic";

export default async function InternTasksPage() {
  const user = (await getCurrentUser())!;
  const tasks = await getInternTasks(user.id);
  return (
    <>
      <PageHeader title="My Tasks" subtitle="View requirements, submit your work, and read feedback." />
      <TaskList tasks={tasks} />
    </>
  );
}
