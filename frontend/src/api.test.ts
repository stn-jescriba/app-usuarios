import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { apiBase, usersApi, ApiError } from "./api";
beforeEach(() => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test/");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Cliente de la API", () => {
  it("exige una URL explícita válida", () => {
    expect(() => apiBase("")).toThrow("Falta configurar");
    expect(() => apiBase("incorrecta")).toThrow("URL válida");
    expect(() => apiBase("ftp://api.example.test")).toThrow("HTTP o HTTPS");
    expect(apiBase()).toBe("https://api.example.test");
  });
  it("codifica búsquedas y propaga la cancelación", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetcher);
    const controller = new AbortController();
    await usersApi.list("Ana & Luis", controller.signal);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.test/api/users?search=Ana%20%26%20Luis",
      expect.objectContaining({ signal: controller.signal }),
    );
  });
  it("conserva errores de validación del servidor", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { title: "Correo duplicado", errors: { email: ["Ya registrado"] } },
            { status: 409 },
          ),
        ),
    );
    await expect(
      usersApi.save({
        firstName: "Ana",
        lastName: "Pérez",
        email: "ana@example.test",
        role: "Ventas",
        isActive: true,
      }),
    ).rejects.toMatchObject({
      message: "Correo duplicado",
      errors: { email: ["Ya registrado"] },
    });
  });
  it("explica fallos de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(usersApi.list("")).rejects.toThrow("No se pudo conectar");
  });
  it("no muestra contenido interno de un error 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("<html>Stack trace</html>", { status: 500 }),
        ),
    );
    await expect(usersApi.list("")).rejects.toEqual(
      new ApiError(
        "El servidor no pudo completar la operación. Inténtalo de nuevo.",
      ),
    );
  });
  it("señala respuestas exitosas con contenido inválido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no-json")));
    await expect(usersApi.list("")).rejects.toThrow("respuesta inválida");
  });
});
