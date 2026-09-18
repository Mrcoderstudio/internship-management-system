import { ApiError, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    throw new ApiError(403, "Public signup is disabled. Contact your administrator.");
  } catch (err) {
    return handleError(err);
  }
}