# App Template Fullstack (Golden Path - Vicoders)

Repositorio plantilla corporativo gobernado por TI para la creación de aplicaciones Fullstack asistidas por IA (**Codex / Antigravity**).

> **Nota:** Este repositorio plantilla contiene únicamente la estructura de gobernanza, reglas (`Rules`), procedimientos (`Skills`), memoria del proyecto (`MEMORY.md`), pipelines CI/CD y documentación de uso. El código fuente de cada aplicación (`backend/` en .NET 10 Clean Architecture y `frontend/` en React + TypeScript con Node 26 LTS) es generado automáticamente por el agente mediante las **Skills y Rules** incluidas en `.agents/`.

---

## 📋 Contenido del Template

| Archivo / Ruta | Propósito |
| :--- | :--- |
| [`MEMORY.md`](./MEMORY.md) | **Fuente de Verdad del proyecto.** Registra los planes aprobados por el usuario, decisiones de arquitectura y el estado secuencial de las tareas. |
| [`AGENTS.md`](./AGENTS.md) | Reglas globales leídas automáticamente por **Codex**, **Antigravity** y **GitHub Copilot**. |
| [`.agents/rules/golden-path-rules.md`](./.agents/rules/golden-path-rules.md) | Reglas inquebrantables (`always_on`): Conventional Commits v1.0.0, ramas obligatorias, PR siempre con `gh`, DRY, cero fallbacks silenciosos y cero datos sensibles. |
| [`.agents/skills/scaffold-clean-fullstack/SKILL.md`](./.agents/skills/scaffold-clean-fullstack/SKILL.md) | Skill para inicializar la solución `.NET 10` en 4 capas de Clean Architecture + `React TS` (`Node 26 LTS`) + `Docker`. |
| [`.agents/skills/add-crud-feature/SKILL.md`](./.agents/skills/add-crud-feature/SKILL.md) | Skill para implementar módulos de negocio capa por capa con pruebas obligatorias. |
| [`.agents/skills/git-pr-workflow/SKILL.md`](./.agents/skills/git-pr-workflow/SKILL.md) | Skill para gestionar ramas, auditoría de secretos/archivos basura, Conventional Commits y creación de Pull Requests con `gh`. |
| [`plan.md`](./plan.md) | Definición operativa de las 4 fases del **Golden Path** (Local, Filtro TI, QA en GCP y Pase a Producción). |
| [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) | Criterios de auditoría automática para **GitHub Copilot Code Review** en cada Pull Request. |
| [`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml) | Pipeline automatizado: Filtro de TI (Tests + Clean Architecture + Cero Secretos), Despliegue a Cloud Run (QA) y Pase a Producción con aprobación de 1 clic. |

---

## 🛡️ Las 11 Reglas de Oro del Flujo de Trabajo

1. **Conventional Commits v1.0.0:** Todo commit sigue `<tipo>(<alcance>): <descripción>` (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, etc.).
2. **Prohibido trabajar sobre `main`:** Todo cambio se implementa en una rama (`feat/*`, `fix/*`, `docs/*`, `chore/*`).
3. **No Auto-Merge y Secuencialidad:** No se fusiona a `main` sin orden explícita del usuario y no se avanza a una tarea nueva sin terminar la anterior.
4. **Uso obligatorio de `gh` CLI:** Todo cambio se sube al remoto y se gestiona mediante `gh`.
5. **Pull Request (`PR`) siempre:** Cada entrega genera un PR hacia `main` (`gh pr create`).
6. **Cero archivos basura:** No se suben archivos ajenos al core; ante cualquier duda, el agente pregunta al usuario.
7. **Cero exposición de datos sensibles (3 Entornos Preconfigurados):** Ninguna credencial o secreto en el repositorio:
   * **Local:** Variable de entorno de sistema preconfigurada hacia `localhost\SQLEXPRESS` (`VicoderLocalDb` con autenticación integrada de Windows).
   * **QA (Cloud Run):** Secreto `db-connection-string-qa` en **GCP Secret Manager** apuntando a `BooksDb_QA`.
   * **Producción (Cloud Run):** Secreto `db-connection-string-prod` en **GCP Secret Manager** apuntando a `BooksDb_Prod` (requiere aprobación de 1 clic del revisor `888Leonidas888`).
8. **Código DRY (Don't Repeat Yourself):** Reutilización obligatoria de lógica y componentes.
9. **Cero fallbacks silenciosos:** Prohibido ocultar errores o asumir comportamientos; ante cualquier duda técnica se consulta al usuario.
10. **Sincronización de `README.md` y `MEMORY.md`:** Ambos documentos se mantienen actualizados en cada entrega.
11. **`MEMORY.md` como Fuente de Verdad:** Una vez aprobado el plan por el usuario, se registra en `MEMORY.md` antes de ejecutar.
