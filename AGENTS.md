# Reglas de Ingeniería, Arquitectura y Flujo de Trabajo (AGENTS.md)

Este repositorio se rige por las reglas obligatorias del **Golden Path Corporativo**. Todo agente de IA (**Codex**, **Antigravity**, **GitHub Copilot**) debe obedecer estas directrices sin excepción:

---

## 1. Fuente de Verdad y Documentación (`MEMORY.md` y `README.md`)
1. **`MEMORY.md` es tu Fuente de Verdad:** Antes de iniciar cualquier tarea, lee `MEMORY.md`. Una vez que un plan sea aprobado por el usuario, **debes registrarlo inmediatamente en `MEMORY.md`** antes de escribir código.
2. **Actualización Continua:** Al completar cada tarea y antes de abrir un Pull Request, actualiza obligatoriamente tanto `MEMORY.md` (estado de tareas, decisiones técnicas y progreso) como `README.md` (si hubo cambios en uso, estructura o endpoints).
3. **Secuencialidad Estricta:** **No se avanza a la siguiente tarea si no se ha terminado y validado por completo la tarea anterior.**

---

## 2. Flujo de Git, Ramas y Pull Requests (`gh` CLI)
1. **Prohibido trabajar directo sobre `main`:** Nunca implementes ni hagas commits directamente en `main`. Crea siempre una rama siguiendo la convención:
   - `feat/<descripcion-corta>` (nuevas funcionalidades)
   - `fix/<descripcion-corta>` (corrección de errores)
   - `docs/<descripcion-corta>` (documentación)
   - `refactor/<descripcion-corta>` (refactorización de código)
   - `chore/<descripcion-corta>` (configuración, mantenimiento, CI/CD)
2. **Conventional Commits v1.0.0 Obligatorios (`https://www.conventionalcommits.org/es/v1.0.0/`):**
   - Formato obligatorio: `<tipo>[alcance opcional]: <descripción en minúsculas>`
   - Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
   - Ejemplo: `feat(books): add isbn uniqueness validation` o `fix(api): return 404 when book does not exist`.
3. **Subida al Remoto y Creación de PR con `gh`:**
   - Todo cambio se sube al repositorio remoto y **siempre se crea un Pull Request (`PR`)** usando GitHub CLI (`gh pr create`).
4. **Prohibido Fusionar a `main` sin Orden Explícita:**
   - **Nunca ejecutes `git merge` ni `gh pr merge` hacia `main` por iniciativa propia.** Solo fusiona cuando el usuario lo ordene explícitamente.

---

## 3. Higiene del Repositorio y Seguridad (Cero Exposición)
1. **Cero Archivos Basura:** No subas archivos temporales, logs, artefactos de compilación, scripts de prueba sueltos ni archivos que no pertenezcan al core del proyecto. **Si tienes duda sobre si un archivo debe subirse, pregunta al usuario antes de hacer `git add`.**
2. **Cero Datos Sensibles:** Jamás subas contraseñas, cadenas de conexión, tokens, IPs privadas, claves `.json` ni archivos `.env`.
   - En producción/QA (GCP Cloud Run), las credenciales se inyectan exclusivamente desde **GCP Secret Manager**.
   - En local, usa `dotnet user-secrets` o variables de entorno no versionadas.

---

## 4. Calidad de Código y Arquitectura Limpia
1. **Stack Tecnológico Fijo:**
   - **Backend:** C# sobre `.NET 10` (`net10.0`) con Minimal APIs y Entity Framework Core (SQL Server).
   - **Frontend:** React con TypeScript (Vite) sobre **Node.js 26 LTS** (`v26.x`).
   - **Tests:** `xUnit` en Backend y `Vitest` + `@testing-library/react` en Frontend.
2. **Clean Architecture Estricta (`backend/`):**
   - `Domain`: Entidades e interfaces de repositorio. Cero dependencias a otros proyectos o paquetes de persistencia.
   - `Application`: Casos de uso, DTOs y servicios de negocio. Solo depende de `Domain`.
   - `Infrastructure`: EF Core (`DbContext`), SQL Server e implementación de repositorios. Depende de `Domain` y `Application`.
   - `Api`: Minimal APIs, inyección de dependencias y CORS.
3. **DRY (Don't Repeat Yourself):** Reúsa el código existente. Extrae lógica repetida en funciones, servicios o componentes reutilizables.
4. **Prohibido Crear Fallbacks Silenciosos:** No ocultes errores con `catch {}` vacíos, valores mágicos inventados ni caminos alternativos silenciosos cuando falle una configuración o dependencia. **Si existe cualquier duda técnica o de negocio, detente y pregunta al usuario; nunca asumas.**
