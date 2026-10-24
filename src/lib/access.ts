import { db } from "./db";
import type { User } from "../generated/prisma/client";
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function actor(id?: string): Promise<User> {
  if (!id) throw new AppError(401, "Sign in to continue.");
  const user = await db.user.findUnique({ where: { id } });
  if (!user?.active) throw new AppError(401, "Account is inactive.");
  return user;
}
export function admin(user: User) {
  if (user.role !== "ADMIN")
    throw new AppError(403, "Administrator access required.");
}
export function requester(user: User) {
  if (user.role !== "REQUESTER")
    throw new AppError(403, "Requester access required.");
}
export async function visible(user: User, id: string) {
  const request = await db.request.findUnique({
    where: { id },
    include: { assignments: true },
  });
  if (
    !request ||
    !(
      request.ownerId === user.id ||
      user.role === "ADMIN" ||
      (user.role === "REVIEWER" &&
        request.assignments.some(
          (a) => a.reviewerId === user.id && a.version === request.version,
        ))
    )
  )
    throw new AppError(404, "Request not found.");
  return request;
}
