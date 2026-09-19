import { handle, idOf } from "@/app/api/_guard";
import { deleteVehicle, saveVehicle } from "@/lib/mutations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(req, (user, fd) => saveVehicle(user, fd));
}

export async function DELETE(req: Request) {
  return handle(req, (user, fd) => deleteVehicle(user, idOf(fd)));
}
