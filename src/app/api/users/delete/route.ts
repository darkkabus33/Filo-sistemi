import { handle, idOf } from "@/app/api/_guard";
import { deleteUser } from "@/lib/mutations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(req, (user, fd) => deleteUser(user, idOf(fd)));
}
