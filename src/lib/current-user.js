import { auth } from "@/auth";
import { dbConnect } from "@/lib/mongo";
import { User } from "@/model/user-model";
import { HttpError } from "@/lib/http";

export async function requireUser(role) {
  const session = await auth();
  const id = session?.user?.id;
  if (session?.error || typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id)) {
    throw new HttpError(401, "Please sign in.");
  }
  await dbConnect();
  const user = await User.findById(id).select("-password").lean();
  if (!user) throw new HttpError(401, "Please sign in again.");
  const actualRole = user.service ? "provider" : "customer";
  if (role && actualRole !== role) throw new HttpError(403, "You cannot perform this action.");
  return user;
}
