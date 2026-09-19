import { handle } from "@/app/api/_guard";
import { saveDriver } from "@/lib/mutations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(req, (user, fd) => saveDriver(user, fd));
}
