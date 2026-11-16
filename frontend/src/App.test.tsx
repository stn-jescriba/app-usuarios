import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect, vi } from "vitest";
import App from "./App";
import { ApiError, usersApi, type User } from "./api";
vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  return {
    ...actual,
    usersApi: { list: vi.fn(), save: vi.fn(), status: vi.fn() },
  };
});
const ana: User = {
  id: "user-1",
  firstName: "Ana",
  lastName: "Pérez",
  email: "ana@example.test",
  role: "Operaciones",
  isActive: true,
  createdAt: "2026-11-16T00:00:00Z",
  updatedAt: "2026-11-16T00:00:00Z",
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(usersApi.list).mockResolvedValue([ana]);
  vi.mocked(usersApi.save).mockResolvedValue(ana);
  vi.mocked(usersApi.status).mockResolvedValue({ ...ana, isActive: false });
});
async function openCreate() {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText("Ana Pérez");
  await user.click(screen.getByRole("button", { name: "Nuevo usuario" }));
  return user;
}
async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  const dialog = within(screen.getByRole("dialog"));
  await user.type(dialog.getByLabelText(/^Nombre/), "Ana");
  await user.type(dialog.getByLabelText(/^Apellidos/), "Pérez");
  await user.type(
    dialog.getByLabelText(/^Correo electrónico/),
    "ana@example.test",
  );
  await user.type(dialog.getByLabelText(/^Rol/), "Operaciones");
  return dialog;
}
describe("Mantenimiento de usuarios", () => {
  it("muestra usuarios, rol y estado", async () => {
    render(<App />);
    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText(ana.email)).toBeInTheDocument();
    expect(screen.getByText("Operaciones")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });
  it("envía la búsqueda y permite limpiarla", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Ana Pérez");
    await user.type(screen.getByRole("searchbox"), "Ana");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await waitFor(() =>
      expect(usersApi.list).toHaveBeenLastCalledWith(
        "Ana",
        expect.any(AbortSignal),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    await waitFor(() =>
      expect(usersApi.list).toHaveBeenLastCalledWith(
        "",
        expect.any(AbortSignal),
      ),
    );
  });
  it("crea un usuario y actualiza la lista", async () => {
    const user = await openCreate();
    const dialog = await fillForm(user);
    await user.click(dialog.getByRole("button", { name: "Crear usuario" }));
    await waitFor(() =>
      expect(usersApi.save).toHaveBeenCalledWith(
        {
          firstName: "Ana",
          lastName: "Pérez",
          email: "ana@example.test",
          role: "Operaciones",
          isActive: true,
        },
        undefined,
      ),
    );
    expect(
      await screen.findByText("El usuario se creó correctamente."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("mantiene los datos y señala el correo duplicado", async () => {
    vi.mocked(usersApi.save).mockRejectedValue(
      new ApiError("El correo ya está registrado.", {
        email: ["Ya existe un usuario con este correo."],
      }),
    );
    const user = await openCreate();
    const dialog = await fillForm(user);
    await user.click(dialog.getByRole("button", { name: "Crear usuario" }));
    expect(
      await screen.findByText("Ya existe un usuario con este correo."),
    ).toBeInTheDocument();
    expect(dialog.getByLabelText(/^Correo electrónico/)).toHaveValue(ana.email);
    expect(dialog.getByLabelText(/^Correo electrónico/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
  it("rechaza campos que solo contienen espacios", async () => {
    const user = await openCreate();
    const dialog = await fillForm(user);
    await user.clear(dialog.getByLabelText(/^Nombre/));
    await user.type(dialog.getByLabelText(/^Nombre/), "   ");
    await user.click(dialog.getByRole("button", { name: "Crear usuario" }));
    expect(
      await screen.findByText("Este campo es obligatorio."),
    ).toBeInTheDocument();
    expect(usersApi.save).not.toHaveBeenCalled();
  });
  it("edita los datos existentes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Editar a Ana Pérez" }),
    );
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByLabelText(/^Nombre/)).toHaveValue("Ana");
    await user.clear(dialog.getByLabelText(/^Nombre/));
    await user.type(dialog.getByLabelText(/^Nombre/), "Andrea");
    await user.click(dialog.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(usersApi.save).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: "Andrea" }),
        ana.id,
      ),
    );
  });
  it("requiere confirmar la desactivación", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Desactivar a Ana Pérez" }),
    );
    expect(usersApi.status).not.toHaveBeenCalled();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Desactivar usuario",
      }),
    );
    await waitFor(() =>
      expect(usersApi.status).toHaveBeenCalledWith(ana.id, false),
    );
    expect(
      await screen.findByText("El usuario se desactivó correctamente."),
    ).toBeInTheDocument();
  });
  it("permite activar a un usuario inactivo", async () => {
    vi.mocked(usersApi.list).mockResolvedValue([{ ...ana, isActive: false }]);
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Activar a Ana Pérez" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Activar usuario",
      }),
    );
    await waitFor(() =>
      expect(usersApi.status).toHaveBeenCalledWith(ana.id, true),
    );
  });
  it("cancelar conserva el estado", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Desactivar a Ana Pérez" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancelar",
      }),
    );
    expect(usersApi.status).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("muestra el error de estado y mantiene abierto el diálogo", async () => {
    vi.mocked(usersApi.status).mockRejectedValue(
      new Error("Servicio no disponible."),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Desactivar a Ana Pérez" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Desactivar usuario",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Servicio no disponible.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("muestra los errores de carga y permite reintentar", async () => {
    vi.mocked(usersApi.list).mockRejectedValueOnce(new Error("Sin conexión."));
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión.");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
  });
  it("presenta un estado vacío sin registros inventados", async () => {
    vi.mocked(usersApi.list).mockResolvedValue([]);
    render(<App />);
    expect(
      await screen.findByText("Tu equipo comienza aquí"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
  });
});
