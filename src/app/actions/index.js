"use server";

import { signIn, signOut } from "@/auth";

export async function doSignOut() {
  await signOut({ redirectTo: "/" });
}

export async function doCredentialSignIn(formData) {
  try {
    const response = await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    return { error: { message: "Unable to sign in. Check your credentials or try again later." } };
  }
}
