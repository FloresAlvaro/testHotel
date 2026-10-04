import type { UserRole } from "~/types";

export const getDefaultRouteForRole = (role: UserRole | null | undefined) =>
  role === "receptionist" ? "/reservations" : "/dashboard";
