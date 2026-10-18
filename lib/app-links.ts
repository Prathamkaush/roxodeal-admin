import type { Role } from "./data";
const origins: Record<Role, string> = {
  buyer: process.env.NEXT_PUBLIC_USERS_URL || "http://localhost:3000",
  seller: process.env.NEXT_PUBLIC_SELLER_URL || "http://localhost:3001",
  admin: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002",
};
export function appHref(role: Role, path: string): string {
  return role === "admin" ? path : origins[role].replace(/\/$/, "") + path;
}
