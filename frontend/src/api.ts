export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export type UserInput = Pick<
  User,
  "firstName" | "lastName" | "email" | "role" | "isActive"
>;
export class ApiError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}
export function apiBase(
  value: string | undefined = import.meta.env.VITE_API_URL,
): string {
  if (!value?.trim())
    throw new Error(
      "Falta configurar VITE_API_URL para conectar con el servidor.",
    );
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("VITE_API_URL debe ser una URL válida.");
  }
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("VITE_API_URL debe usar HTTP o HTTPS.");
  return value.trim().replace(/\/+$/, "");
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${apiBase()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new Error(
      "No se pudo conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.",
    );
  }
  if (!response.ok) {
    let problem: { title?: string; errors?: Record<string, string[]> } = {};
    if (response.headers.get("content-type")?.includes("json")) {
      try {
        problem = await response.json();
      } catch {
        throw new ApiError(
          `El servidor devolvió un error HTTP ${response.status} con una respuesta inválida.`,
        );
      }
    }
    const message =
      response.status >= 500
        ? "El servidor no pudo completar la operación. Inténtalo de nuevo."
        : (problem.title ??
          `No se pudo completar la operación (HTTP ${response.status}).`);
    throw new ApiError(message, problem.errors);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("El servidor devolvió una respuesta inválida.");
  }
}
export const usersApi = {
  list: (search: string, signal?: AbortSignal) =>
    request<User[]>(`/api/users?search=${encodeURIComponent(search)}`, {
      signal,
    }),
  save: (input: UserInput, id?: string) =>
    request<User>(`/api/users${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(input),
    }),
  status: (id: string, isActive: boolean) =>
    request<User>(`/api/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
};
