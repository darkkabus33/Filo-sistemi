import { handle, idOf } from "@/app/api/_guard";
import { deleteDriver } from "@/lib/mutations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(req, (user, fd) => deleteDriver(user, idOf(fd)));
}
