import { z } from "zod";
export const SignupSchema = z.object({
  username: z.string(),
  password: z.string().min(8),
  role: z.enum(["user", "admin"]),
});
