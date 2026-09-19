import { handle } from "@/app/api/_guard";
import { saveService } from "@/lib/mutations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(req, (user, fd) => saveService(user, fd));
}
