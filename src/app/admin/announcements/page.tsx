import { PageHeader } from "@/components/ui";
import { getAnnouncements } from "@/lib/queries";
import AnnouncementManager from "./AnnouncementManager";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const announcements = await getAnnouncements(100);
  return (
    <>
      <PageHeader title="Announcements" subtitle="Broadcast messages to every intern." />
      <AnnouncementManager announcements={announcements} />
    </>
  );
}
