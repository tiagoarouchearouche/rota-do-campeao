import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "missing_param"
  | "competition_not_found"
  | "team_not_found"
  | "internal_error";

export type ApiErrorBody = {
  error: ApiErrorCode;
  message: string;
};

/**
 * Every internal API route returns this exact shape on failure — never a bare
 * `{ error: string }` with unpredictable fields, and never a response missing
 * the fields callers expect on success (e.g. `competition`). Client code must
 * check `res.ok` (or `"error" in json`) before treating a response as the
 * success shape; this is what the /api/team-path "season is undefined" crash
 * was missing.
 */
export function apiError(status: number, code: ApiErrorCode, message: string): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: code, message }, { status });
}

export function competitionNotFoundResponse(competitionId: string): NextResponse<ApiErrorBody> {
  return apiError(
    404,
    "competition_not_found",
    `Competição "${competitionId}" não existe ou foi removida.`
  );
}

export function teamNotFoundResponse(teamId: string, competitionId: string): NextResponse<ApiErrorBody> {
  return apiError(
    404,
    "team_not_found",
    `Time "${teamId}" não foi encontrado na competição "${competitionId}".`
  );
}
