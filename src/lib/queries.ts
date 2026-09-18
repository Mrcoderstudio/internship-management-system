import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { announcements, taskAssignments, tasks, users } from "@/db/schema";

export async function getAdminStats() {
  const [row] = await db
    .select({
      totalInterns: sql<number>`(select count(*) from ${users} where ${users.role} = 'intern')`.mapWith(Number),
      totalTasks: sql<number>`(select count(*) from ${tasks})`.mapWith(Number),
      activeTasks: sql<number>`(select count(distinct ${taskAssignments.taskId}) from ${taskAssignments} where ${taskAssignments.status} in ('pending','submitted','rejected'))`.mapWith(Number),
      pendingSubmissions: sql<number>`(select count(*) from ${taskAssignments} where ${taskAssignments.status} = 'submitted')`.mapWith(Number),
      completedTasks: sql<number>`(select count(*) from ${taskAssignments} where ${taskAssignments.status} = 'approved')`.mapWith(Number),
    })
    .from(sql`(select 1) as _`);
  return row;
}

export type InternProgress = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  skills: string | null;
  createdAt: Date;
  assigned: number;
  completed: number;
  pending: number;
  submitted: number;
  rejected: number;
  score: number;
};

export async function getInternProgress(): Promise<InternProgress[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      skills: users.skills,
      createdAt: users.createdAt,
      assigned: sql<number>`count(${taskAssignments.id})`.mapWith(Number),
      completed: sql<number>`count(*) filter (where ${taskAssignments.status} = 'approved')`.mapWith(Number),
      pending: sql<number>`count(*) filter (where ${taskAssignments.status} = 'pending')`.mapWith(Number),
      submitted: sql<number>`count(*) filter (where ${taskAssignments.status} = 'submitted')`.mapWith(Number),
      rejected: sql<number>`count(*) filter (where ${taskAssignments.status} = 'rejected')`.mapWith(Number),
      score: sql<number>`coalesce(sum(${taskAssignments.score}), 0)`.mapWith(Number),
    })
    .from(users)
    .leftJoin(taskAssignments, eq(taskAssignments.internId, users.id))
    .where(eq(users.role, "intern"))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));
  return rows;
}

export async function getTasksWithAssignments() {
  const taskRows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  const assignmentRows = await db
    .select({
      id: taskAssignments.id,
      taskId: taskAssignments.taskId,
      internId: taskAssignments.internId,
      status: taskAssignments.status,
      internName: users.name,
    })
    .from(taskAssignments)
    .innerJoin(users, eq(users.id, taskAssignments.internId));

  return taskRows.map((t) => ({
    ...t,
    assignments: assignmentRows.filter((a) => a.taskId === t.id),
  }));
}

export async function getSubmissions() {
  return db
    .select({
      id: taskAssignments.id,
      status: taskAssignments.status,
      submittedAt: taskAssignments.submittedAt,
      githubLink: taskAssignments.githubLink,
      liveLink: taskAssignments.liveLink,
      notes: taskAssignments.notes,
      feedback: taskAssignments.feedback,
      score: taskAssignments.score,
      taskId: tasks.id,
      taskTitle: tasks.title,
      taskCoins: tasks.coins,
      deadline: tasks.deadline,
      internId: users.id,
      internName: users.name,
      internEmail: users.email,
    })
    .from(taskAssignments)
    .innerJoin(tasks, eq(tasks.id, taskAssignments.taskId))
    .innerJoin(users, eq(users.id, taskAssignments.internId))
    .orderBy(
      sql`case ${taskAssignments.status} when 'submitted' then 0 when 'pending' then 1 when 'rejected' then 2 else 3 end`,
      desc(taskAssignments.submittedAt),
      desc(taskAssignments.createdAt),
    );
}

export async function getInternTasks(internId: number) {
  return db
    .select({
      id: taskAssignments.id,
      status: taskAssignments.status,
      submittedAt: taskAssignments.submittedAt,
      githubLink: taskAssignments.githubLink,
      liveLink: taskAssignments.liveLink,
      notes: taskAssignments.notes,
      feedback: taskAssignments.feedback,
      score: taskAssignments.score,
      taskId: tasks.id,
      title: tasks.title,
      description: tasks.description,
      requirements: tasks.requirements,
      deadline: tasks.deadline,
      coins: tasks.coins,
      assignedAt: taskAssignments.createdAt,
    })
    .from(taskAssignments)
    .innerJoin(tasks, eq(tasks.id, taskAssignments.taskId))
    .where(eq(taskAssignments.internId, internId))
    .orderBy(
      sql`case ${taskAssignments.status} when 'pending' then 0 when 'rejected' then 1 when 'submitted' then 2 else 3 end`,
      tasks.deadline,
    );
}

export async function getInternSummary(internId: number) {
  const [row] = await db
    .select({
      assigned: sql<number>`count(*)`.mapWith(Number),
      completed: sql<number>`count(*) filter (where ${taskAssignments.status} = 'approved')`.mapWith(Number),
      pending: sql<number>`count(*) filter (where ${taskAssignments.status} = 'pending')`.mapWith(Number),
      submitted: sql<number>`count(*) filter (where ${taskAssignments.status} = 'submitted')`.mapWith(Number),
      rejected: sql<number>`count(*) filter (where ${taskAssignments.status} = 'rejected')`.mapWith(Number),
      score: sql<number>`coalesce(sum(${taskAssignments.score}), 0)`.mapWith(Number),
    })
    .from(taskAssignments)
    .where(eq(taskAssignments.internId, internId));
  const progress = row.assigned > 0 ? Math.round((row.completed / row.assigned) * 100) : 0;
  return { ...row, progress };
}

export async function getAnnouncements(limit = 20) {
  return db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(limit);
}

export async function getAssignmentForIntern(assignmentId: number, internId: number) {
  const [row] = await db
    .select()
    .from(taskAssignments)
    .where(and(eq(taskAssignments.id, assignmentId), eq(taskAssignments.internId, internId)))
    .limit(1);
  return row ?? null;
}
