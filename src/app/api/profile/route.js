import { requireUser } from "@/lib/current-user";
import { profileSchema } from "@/lib/validation";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { User } from "@/model/user-model";
export async function PATCH(request) {
  try {
    const user = await requireUser();
    const data = profileSchema.parse(await readJson(request));
    if (!user.service && (data.schedule || !data.street || !data.city || !data.state))
      throw new HttpError(
        400,
        "Customers must supply an address and cannot set provider availability.",
      );
    await User.updateOne(
      { _id: user._id },
      { $set: data, $inc: { scheduleVersion: 1 } },
      { runValidators: true },
    );
    return Response.json({
      message: "Settings saved. Existing booking contact details are preserved.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
