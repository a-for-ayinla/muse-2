import { handler, ok, readJson, ApiError } from "@/lib/api";
import { loginSchema } from "@/lib/validators";
import { createSession, verifyPassword } from "@/lib/auth";
import { findUserByEmail, throttle } from "@/lib/auth-helpers";
import { publicUser } from "../signup/route";

export const dynamic = "force-dynamic";

export const POST = handler(async (req, rid) => {
  const body = loginSchema.parse(await readJson(req));
  await throttle(`login:${body.email}`, 8, 300);

  const user = await findUserByEmail(body.email);
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new ApiError("UNAUTHENTICATED", "Invalid email or password.", 401);
  }
  if (!user.emailConfirmed) {
    throw new ApiError(
      "FORBIDDEN",
      "This account's email is not confirmed yet. Check your inbox for the confirmation link.",
      403,
    );
  }
  await createSession(user.id, req.headers.get("user-agent") ?? "");
  return ok({ user: publicUser(user) }, rid);
});
