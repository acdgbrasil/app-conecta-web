// Admin Service — client-side operations for admin dashboard, people, and audit.
// All requests go through /api/admin/* on the Hono BFF.
// Lookup operations are in lookup-admin-service.ts (separate concern).

import { get, post, put } from "./base-client.ts";
import type { Result, ServiceError } from "./base-client.ts";
import type { Person, SystemRole } from "./people-service.ts";
import type { AuditEntry } from "../viewmodels/admin-hub/types.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardStats = Readonly<{
  totalPeople: number;
  activeRoles: number;
  pendingRequests: number;
  recentAuditCount: number;
}>;

export type CreatePersonInput = Readonly<{
  fullName: string;
  cpf?: string;
  birthDate: string;
}>;

export type UpdatePersonInput = Readonly<{
  fullName?: string;
  birthDate?: string;
}>;

export type AssignRoleInput = Readonly<{
  system: string;
  role: string;
}>;

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const getStats = (): Promise<Result<DashboardStats, ServiceError>> =>
  get<DashboardStats>("/api/admin/stats");

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export const listPeople = (): Promise<
  Result<readonly Person[], ServiceError>
> => get<readonly Person[]>("/api/admin/people");

export const getPersonById = (
  personId: string,
): Promise<Result<Person, ServiceError>> =>
  get<Person>(`/api/admin/people/${personId}`);

export const createPerson = (
  input: CreatePersonInput,
): Promise<Result<Person, ServiceError>> =>
  post<Person>("/api/admin/people", input);

export const updatePerson = (
  personId: string,
  input: UpdatePersonInput,
): Promise<Result<Person, ServiceError>> =>
  put<Person>(`/api/admin/people/${personId}`, input);

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const getPersonRoles = (
  personId: string,
): Promise<Result<readonly SystemRole[], ServiceError>> =>
  get<readonly SystemRole[]>(`/api/admin/people/${personId}/roles`);

export const assignRole = (
  personId: string,
  input: AssignRoleInput,
): Promise<Result<SystemRole, ServiceError>> =>
  post<SystemRole>(`/api/admin/people/${personId}/roles`, input);

export const deactivateRole = (
  personId: string,
  roleId: string,
): Promise<Result<void, ServiceError>> =>
  put<void>(
    `/api/admin/people/${personId}/roles/${roleId}/deactivate`,
    {},
  );

export const reactivateRole = (
  personId: string,
  roleId: string,
): Promise<Result<void, ServiceError>> =>
  put<void>(
    `/api/admin/people/${personId}/roles/${roleId}/reactivate`,
    {},
  );

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export const listAudit = (
  limit = 50,
  offset = 0,
): Promise<Result<readonly AuditEntry[], ServiceError>> =>
  get<readonly AuditEntry[]>(
    `/api/admin/audit?limit=${limit}&offset=${offset}`,
  );
