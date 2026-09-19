import { handle, idOf } from "@/app/api/_guard";
import { deleteVehicle } from "@/lib/mutations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(req, (user, fd) => deleteVehicle(user, idOf(fd)));
}
