import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongo";
import { User } from "@/model/user-model";
import { registrationSchema } from "@/lib/validation";
import { errorResponse, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const data = registrationSchema.parse(await readJson(request));
    await dbConnect();
    await rateLimit("register:global", 100, 60 * 60_000);
    await rateLimit("register:" + data.email, 5, 60 * 60_000);
    // Existing duplicate identities fail closed until an explicit migration resolves them.
    await User.init();
    const password = await bcrypt.hash(data.password, 12);
    await User.create({ ...data, password });
    return Response.json({ message: "Account created. Please sign in." }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
