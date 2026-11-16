import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { ApiError, usersApi, type User, type UserInput } from "./api";

function Icon({
  name,
  size = 20,
}: {
  name:
    | "users"
    | "search"
    | "plus"
    | "check"
    | "pause"
    | "close"
    | "edit"
    | "arrow";
  size?: number;
}) {
  const paths: Record<string, ReactNode> = {
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75" />
        <circle cx="9" cy="7" r="4" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="7" />
        <path d="m16 16 5 5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    pause: <path d="M8 5v14M16 5v14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    edit: (
      <>
        <path d="m16 3 5 5-12 12-6 1 1-6Z M14 5l5 5" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Modal({
  title,
  description,
  busy,
  onClose,
  children,
}: {
  title: string;
  description: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header className="modal-heading">
        <div>
          <h2 id="dialog-title">{title}</h2>
          <p id="dialog-description">{description}</p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Cerrar"
          disabled={busy}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}

const blank: UserInput = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  isActive: true,
};
function UserForm({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [values, setValues] = useState<UserInput>(
    user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        }
      : blank,
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = Object.entries(values).filter(
      ([, value]) => typeof value === "string" && !value.trim(),
    );
    if (invalid.length) {
      setErrors(
        Object.fromEntries(
          invalid.map(([key]) => [key, ["Este campo es obligatorio."]]),
        ),
      );
      return;
    }
    setBusy(true);
    setError("");
    setErrors({});
    try {
      await usersApi.save(values, user?.id);
      onSaved(
        user
          ? "Los cambios se guardaron correctamente."
          : "El usuario se creó correctamente.",
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudo guardar el usuario.",
      );
      if (failure instanceof ApiError) setErrors(failure.errors);
    } finally {
      setBusy(false);
    }
  }
  function field(
    key: "firstName" | "lastName" | "email" | "role",
    label: string,
    max: number,
    placeholder: string,
  ) {
    return (
      <div className="field">
        <label htmlFor={key}>
          {label}
          <span aria-hidden="true"> *</span>
        </label>
        <input
          id={key}
          name={key}
          type={key === "email" ? "email" : "text"}
          required
          maxLength={max}
          autoComplete={
            key === "firstName"
              ? "given-name"
              : key === "lastName"
                ? "family-name"
                : key === "email"
                  ? "email"
                  : "off"
          }
          placeholder={placeholder}
          value={values[key]}
          disabled={busy}
          aria-invalid={!!errors[key]?.length}
          aria-describedby={errors[key]?.length ? `${key}-error` : undefined}
          onChange={(event) => {
            setValues({ ...values, [key]: event.target.value });
            setErrors({ ...errors, [key]: [] });
          }}
        />
        {errors[key]?.length ? (
          <span id={`${key}-error`} className="field-error">
            {errors[key].join(" ")}
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <Modal
      title={user ? "Editar usuario" : "Nuevo usuario"}
      description="Completa la información del usuario. Los campos con * son obligatorios."
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          <div className="form-grid">
            {field("firstName", "Nombre", 100, "Ej. Ana")}
            {field("lastName", "Apellidos", 150, "Ej. Pérez García")}
          </div>
          {field("email", "Correo electrónico", 254, "nombre@empresa.com")}
          {field("role", "Rol", 80, "Ej. Operaciones")}
          <div className="field">
            <label htmlFor="isActive">Estado *</label>
            <select
              id="isActive"
              value={String(values.isActive)}
              disabled={busy}
              onChange={(event) =>
                setValues({
                  ...values,
                  isActive: event.target.value === "true",
                })
              }
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
          <p className="form-hint">
            El rol identifica la función de la persona dentro del equipo.
          </p>
        </div>
        <footer className="modal-footer">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="button primary" disabled={busy} type="submit">
            {busy ? "Guardando…" : user ? "Guardar cambios" : "Crear usuario"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<{ user: User | null } | null>(null);
  const [target, setTarget] = useState<User | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");
  const newButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    usersApi
      .list(query, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setUsers(data);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setError(
            failure instanceof Error
              ? failure.message
              : "No se pudieron cargar los usuarios.",
          );
          setUsers([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, revision]);
  const active = users.filter((user) => user.isActive).length;
  function closeEditor() {
    setEditor(null);
    newButton.current?.focus();
  }
  function saved(message: string) {
    closeEditor();
    setNotice(message);
    setRevision((value) => value + 1);
  }
  async function changeStatus() {
    if (!target) return;
    setStatusBusy(true);
    setStatusError("");
    try {
      await usersApi.status(target.id, !target.isActive);
      setNotice(
        target.isActive
          ? "El usuario se desactivó correctamente."
          : "El usuario se activó correctamente.",
      );
      setTarget(null);
      setRevision((value) => value + 1);
    } catch (failure) {
      setStatusError(
        failure instanceof Error
          ? failure.message
          : "No se pudo cambiar el estado.",
      );
    } finally {
      setStatusBusy(false);
    }
  }
  function searchSubmit(event: FormEvent) {
    event.preventDefault();
    setQuery(search.trim());
    setRevision((value) => value + 1);
    setNotice("");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="/" className="brand" aria-label="Directorio, inicio">
          <span className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>
            directorio<span className="brand-dot">.</span>
          </span>
        </a>
        <p className="nav-caption">ESPACIO DE TRABAJO</p>
        <nav aria-label="Navegación principal">
          <a href="/" className="nav-item" aria-current="page">
            <Icon name="users" />
            <span>Usuarios</span>
            <span className="nav-indicator" />
          </a>
        </nav>
        <div className="sidebar-bottom">
          <span className="workspace-avatar">AD</span>
          <div>
            <strong>Administración</strong>
            <small>Directorio de equipo</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Administración <span>/</span> <strong>Usuarios</strong>
          </div>
          <span className="workspace-label">
            <span />
            Gestión de equipo
          </span>
        </header>
        <main className="main-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">DIRECTORIO DE EQUIPO</p>
              <h1>
                Usuarios<span>.</span>
              </h1>
              <p className="page-description">
                La información de tu equipo, en un solo lugar.
              </p>
            </div>
            <button
              ref={newButton}
              className="button primary"
              onClick={() => {
                setNotice("");
                setEditor({ user: null });
              }}
            >
              <Icon name="plus" size={18} />
              Nuevo usuario
            </button>
          </div>
          <section className="stats" aria-label="Resumen de esta vista">
            {[
              {
                label: "Usuarios en esta vista",
                value: users.length,
                icon: "users",
                className: "blue",
                hint: "Personas registradas",
              },
              {
                label: "Activos",
                value: active,
                icon: "check",
                className: "green",
                hint: "Con estado activo",
              },
              {
                label: "Inactivos",
                value: users.length - active,
                icon: "pause",
                className: "gray",
                hint: "Con estado inactivo",
              },
            ].map((stat) => (
              <article className="stat" key={stat.label}>
                <div>
                  <p>{stat.label}</p>
                  <strong>
                    {loading || error
                      ? "—"
                      : stat.value.toString().padStart(2, "0")}
                  </strong>
                  <small>{stat.hint}</small>
                </div>
                <span className={`stat-icon ${stat.className}`}>
                  <Icon
                    name={stat.icon as "users" | "check" | "pause"}
                    size={22}
                  />
                </span>
              </article>
            ))}
          </section>
          {notice && (
            <div className="success-box" role="status">
              <Icon name="check" size={18} />
              {notice}
              <button
                className="icon-button"
                aria-label="Cerrar aviso"
                onClick={() => setNotice("")}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          <section className="directory-card" aria-labelledby="directory-title">
            <div className="card-heading">
              <div>
                <h2 id="directory-title">
                  Directorio de usuarios{" "}
                  <span>{!loading && !error ? users.length : "—"}</span>
                </h2>
                <p>
                  Consulta, actualiza y organiza a las personas de tu equipo.
                </p>
              </div>
              <span className="table-caption">Todos los estados</span>
            </div>
            <form
              className="search-toolbar"
              role="search"
              onSubmit={searchSubmit}
            >
              <label className="search-input">
                <Icon name="search" size={19} />
                <span className="sr-only">Buscar usuarios</span>
                <input
                  type="search"
                  placeholder="Buscar por nombre, correo o rol…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <button
                className="button secondary search-button"
                type="submit"
                disabled={loading}
              >
                Buscar
              </button>
              {query && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setQuery("");
                    setNotice("");
                  }}
                >
                  Limpiar
                </button>
              )}
            </form>
            <div aria-busy={loading} className="table-area">
              {loading ? (
                <div className="empty-state" role="status">
                  <span className="spinner" />
                  <h3>Cargando usuarios</h3>
                  <p>Estamos consultando el directorio.</p>
                </div>
              ) : error ? (
                <div className="empty-state error-state" role="alert">
                  <span className="empty-icon">
                    <Icon name="users" size={28} />
                  </span>
                  <h3>No pudimos cargar el directorio</h3>
                  <p>{error}</p>
                  <button
                    className="button secondary"
                    onClick={() => setRevision((value) => value + 1)}
                  >
                    Reintentar
                  </button>
                </div>
              ) : users.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <Icon name="users" size={30} />
                  </span>
                  <h3>
                    {query
                      ? "No encontramos coincidencias"
                      : "Tu equipo comienza aquí"}
                  </h3>
                  <p>
                    {query
                      ? "Prueba con otro nombre, correo o rol."
                      : "Crea el primer usuario para comenzar a organizar tu directorio."}
                  </p>
                  {!query && (
                    <button
                      className="button secondary"
                      onClick={() => setEditor({ user: null })}
                    >
                      <Icon name="plus" size={17} />
                      Crear primer usuario
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">USUARIO</th>
                        <th scope="col">CORREO ELECTRÓNICO</th>
                        <th scope="col">ROL</th>
                        <th scope="col">ESTADO</th>
                        <th scope="col" className="actions-heading">
                          ACCIONES
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => (
                        <tr key={user.id}>
                          <td>
                            <div className="person">
                              <span
                                className={`person-avatar tone-${index % 4}`}
                              >
                                {user.firstName.charAt(0)}
                                {user.lastName.charAt(0)}
                              </span>
                              <div>
                                <strong>
                                  {user.firstName} {user.lastName}
                                </strong>
                                <small>Usuario del equipo</small>
                              </div>
                            </div>
                          </td>
                          <td className="email-cell">{user.email}</td>
                          <td>
                            <span className="role-pill">{user.role}</span>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${user.isActive ? "active" : "inactive"}`}
                            >
                              <span />
                              {user.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                className="edit-button"
                                aria-label={`Editar a ${user.firstName} ${user.lastName}`}
                                onClick={() => setEditor({ user })}
                              >
                                <Icon name="edit" size={16} />
                                <span>Editar</span>
                              </button>
                              <button
                                className="status-button"
                                onClick={() => {
                                  setTarget(user);
                                  setStatusError("");
                                }}
                                aria-label={`${user.isActive ? "Desactivar" : "Activar"} a ${user.firstName} ${user.lastName}`}
                              >
                                {user.isActive ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <footer className="table-footer">
              <span>
                {loading
                  ? "Consultando directorio…"
                  : error
                    ? "Directorio no disponible"
                    : `${users.length} ${users.length === 1 ? "usuario" : "usuarios"}${query ? ` para “${query}”` : " en el directorio"}`}
              </span>
              <span className="footer-note">Información de tu equipo</span>
            </footer>
          </section>
          <p className="page-footnote">
            Un equipo organizado empieza con información actualizada.
          </p>
        </main>
      </div>
      {editor && (
        <UserForm user={editor.user} onClose={closeEditor} onSaved={saved} />
      )}
      {target && (
        <Modal
          title={target.isActive ? "Desactivar usuario" : "Activar usuario"}
          description={`Cambiarás el estado de ${target.firstName} ${target.lastName} a ${target.isActive ? "inactivo" : "activo"}. Sus datos se conservarán.`}
          busy={statusBusy}
          onClose={() => setTarget(null)}
        >
          <div className="modal-body">
            {statusError && (
              <div className="error-box" role="alert">
                {statusError}
              </div>
            )}
            <p className="confirmation-person">{target.email}</p>
          </div>
          <footer className="modal-footer">
            <button
              className="button secondary"
              disabled={statusBusy}
              onClick={() => setTarget(null)}
            >
              Cancelar
            </button>
            <button
              className={`button ${target.isActive ? "danger" : "primary"}`}
              disabled={statusBusy}
              onClick={changeStatus}
            >
              {statusBusy
                ? "Guardando…"
                : target.isActive
                  ? "Desactivar usuario"
                  : "Activar usuario"}
            </button>
          </footer>
        </Modal>
      )}
    </div>
  );
}
