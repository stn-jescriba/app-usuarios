# MEMORY.md - Fuente de Verdad del Proyecto

> **Instrucción para el Agente:** Este archivo es la **Fuente de Verdad** del proyecto. Todo plan aprobado por el usuario debe registrarse aquí antes de su implementación, y el estado de cada tarea debe actualizarse conforme avance el proyecto. No avances a la siguiente tarea sin haber completado la anterior.

---

## 1. Contexto y Arquitectura Base Aprobada
- **Propósito:** Plantilla corporativa Golden Path (`app_template_fullstack`) para desarrollo asistido por IA (Vicoders) bajo gobernanza de TI.
- **Stack Oficial:**
  - **Frontend:** React + TypeScript + Vite + Vitest sobre **Node.js 26 LTS**.
  - **Backend:** C# `.NET 10` (`net10.0`) Minimal APIs + Entity Framework Core + `xUnit` en **Clean Architecture** (`Domain`, `Application`, `Infrastructure`, `Api`, `Tests`).
  - **Base de Datos (3 Entornos Separados y Preconfigurados):**
    - **Local:** `VicoderLocalDb` en `localhost\SQLEXPRESS` (configurada una sola vez en variable de entorno de Windows `ConnectionStrings__DefaultConnection` con `Trusted_Connection=True`, cero contraseñas).
    - **QA (GCP Cloud SQL):** `BooksDb_QA` inyectada vía **GCP Secret Manager** (`db-connection-string-qa:latest`).
    - **Producción (GCP Cloud SQL):** `BooksDb_Prod` inyectada vía **GCP Secret Manager** (`db-connection-string-prod:latest`).
  - **Despliegue:** GitHub Actions hacia **Google Cloud Run** (`qa` automático y `production` protegido con aprobación obligatoria de `888Leonidas888`).

---

## 2. Reglas Operativas Activas
1. **Conventional Commits v1.0.0** en todos los commits.
2. **Cero commits directos en `main`** (trabajo exclusivo en ramas `feat/*`, `fix/*`, `docs/*`, `chore/*`, `refactor/*`).
3. **Pull Request obligatorio** vía `gh pr create`; **prohibido fusionar a `main`** sin instrucción explícita del usuario.
4. **Secuencialidad:** Terminar y verificar cada tarea antes de pasar a la siguiente.
5. **Cero archivos basura** y **cero exposición de datos sensibles**.
6. **Principio DRY** y **cero fallbacks silenciosos** (preguntar al usuario ante cualquier duda técnica).
7. **Sincronización documental:** Actualizar `README.md` y `MEMORY.md` en cada entrega.

---

## 3. Historial de Planes y Estado de Tareas

### Plan Inicial: Configuración del Template Corporativo (`app_template_fullstack`)
- [x] **Tarea 1:** Crear estructura documental del template (`README.md`, `plan.md`, `AGENTS.md`, `.gitignore`) y pipeline `.github/workflows/ci-cd.yml` con Node 26 LTS y `.NET 10`.
- [x] **Tarea 2:** Configurar reglas de ingeniería (`.agents/rules/golden-path-rules.md`, `.github/copilot-instructions.md`), inicializar `MEMORY.md` y crear las Skills operativas en `.agents/skills/`.
- [x] **Tarea 3:** Aprobar y fusionar el Pull Request #1 de reglas y skills hacia `main`.
- [x] **Tarea 4:** Separar bases de datos por entorno (`VicoderLocalDb` en local, `BooksDb_QA` con `db-connection-string-qa` para QA, `BooksDb_Prod` con `db-connection-string-prod` para Producción), instalar Skill Global `init-vicoder-project` y asignar a `888Leonidas888` como Revisor Obligatorio en `production`.
- [x] **Tarea 5:** Corregir referencia directa a la imagen Docker del backend en el job `deploy-prod` de `.github/workflows/ci-cd.yml` para evitar que GitHub Actions filtre el output por contener `secrets.GCP_PROJECT_ID`.

### Plan aprobado: mantenimiento de usuarios (2026-11-16)
- Aprobación explícita del usuario: "ok, procede".
- Alcance: listado con búsqueda; alta y edición; nombre, apellidos, correo, rol y estado; activar/desactivar; campos obligatorios y correo único.
- Rol es una etiqueta de registro de texto libre; este módulo administra registros y no implementa autenticación ni autorización.
- [x] Tarea 1: generar y verificar el scaffold corporativo, contenedores y pruebas de arquitectura/salud.
- [x] Tarea 2: implementar y probar el mantenimiento completo en las cuatro capas y React.
- [ ] Tarea 3: verificar ejecución local, actualizar documentación y entregar PR sin fusionar.
- Aprovisionamiento: el script rechazó asignar admin a 888Leonidas888; producción tiene como revisor a stn-jescriba. Pendiente corregir la revisión de TI. No se realizará despliegue ni fusión.
- Entorno: Node 26.13.1, SDK .NET 11.0.100, runtime .NET 10.0.15; proyectos con destino net10.0.

- Scaffold validado: 3 pruebas backend, 1 frontend y build frontend correctos; npm audit: 0 vulnerabilidades.
- Decisión del usuario: usar la conexión que configure TI mediante ConnectionStrings__DefaultConnection. No crear ni modificar bases locales. La variable no está configurada actualmente; verificación real de SQL pendiente de TI.

### Validación de la implementación
- 13 pruebas backend correctas: arquitectura, salud, ciclo alta/consulta/edición/estado, validación, unicidad, búsqueda y metadatos SQL.
- 18 pruebas frontend correctas: interfaz y cliente HTTP. TypeScript y build de producción correctos. npm audit: 0 vulnerabilidades al instalar.
- Migración InitialUsers generada con EF Core 10.0.15; modelo sin cambios pendientes y script idempotente generado sin conexión a SQL Server. Crea ManagedUsers e índice único NormalizedEmail.
- Inspección visual del directorio y formulario en navegador correcta. El error de conexión es visible y esperado mientras falta la configuración de TI.
- Inicio real sin conexión verificado: falla explícitamente solicitando ConnectionStrings__DefaultConnection, sin crear ni modificar bases. La integración SQL real sigue pendiente de TI.
- Backend y frontend formateados. Archivos revisados: sin credenciales, conexiones ni artefactos de build versionables.
- CI adaptado al dominio Users y CORS configurado con el origen del frontend desplegado. Contenedores preparados; Docker no disponible en este equipo, sin validación de ejecución en contenedores.
- Gobernanza: GitHub rechazó configurar a 888Leonidas888 como revisor. Invitación de colaboración con permiso write enviada y pendiente de aceptación; producción mantiene stn-jescriba. No se debilitó esa protección. Tras aceptar, TI debe completar la asignación de revisor.
- Pendiente de cierre: subir rama y abrir PR. Sin fusión ni despliegue.
