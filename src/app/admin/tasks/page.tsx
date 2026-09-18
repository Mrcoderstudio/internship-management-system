import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { PageHeader } from "@/components/ui";
import { getTasksWithAssignments } from "@/lib/queries";
import TaskManager from "./TaskManager";

export const dynamic = "force-dynamic";

export default async function AdminTasksPage() {
  const [tasks, interns] = await Promise.all([
    getTasksWithAssignments(),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.role, "intern")).orderBy(users.name),
  ]);
  return (
    <>
      <PageHeader title="Tasks" subtitle="Create tasks, assign them to interns, and keep deadlines on track." />
      <TaskManager tasks={tasks} interns={interns} />
    </>
  );
}
