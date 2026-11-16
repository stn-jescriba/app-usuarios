# Ruta de Desarrollo Asistido por IA para Usuarios de Negocio (Vicoders)

## Objetivo Operativo
Establecer un **"Golden Path"** automatizado que permita a usuarios no técnicos (**vicoders**) construir aplicaciones funcionales de forma autónoma. El flujo garantiza que todo el código generado cumpla con los estándares corporativos de arquitectura, seguridad y calidad bajo el control estricto de TI, abstrayendo por completo la complejidad técnica del usuario.

---

## Fase 1: Desarrollo Local y Estandarización (Abstracción Total)
El usuario interactúa exclusivamente en lenguaje natural con la IA, mientras TI controla el andamiaje y la seguridad subyacente.

- **Herramienta Principal**: Agente de IA en local (Codex / Antigravity).
- **Stack Tecnológico Obligatorio**:
  - **Frontend**: React 19 con TypeScript + Vite + Vitest.
  - **Backend**: C# (.NET 10) con Minimal APIs + xUnit.
  - **Base de Datos**: SQL Server (2022 Developer/Express en local; Cloud SQL for SQL Server en GCP).
- **Arquitectura**: **Clean Architecture** con separación estricta de responsabilidades en 4 proyectos dentro de `backend/`:
  1. `Books.Domain`: Entidades de negocio e interfaces de repositorio (cero dependencias externas).
  2. `Books.Application`: Casos de uso, servicios de aplicación y DTOs (depende únicamente de `Domain`).
  3. `Books.Infrastructure`: Persistencia con Entity Framework Core para SQL Server e implementación de repositorios.
  4. `Books.Api`: Punto de entrada HTTP con Minimal APIs e inyección de dependencias.
- **Inicialización Automatizada**: TI aprovisiona el equipo del usuario con las herramientas y el repositorio plantilla corporativo `app_template_fullstack`. Para iniciar un proyecto, el vicoder ejecuta un skill del agente que instancia una carpeta limpia, clona el template base y estructura el esqueleto sin que el usuario manipule archivos de configuración.
- **Gestión de Credenciales (Cero Exposición)**:
  - `appsettings.json` mantiene `"DefaultConnection": ""` vacío en el repositorio.
  - En local con Docker Compose, la cadena se inyecta por variable de entorno (`ConnectionStrings__DefaultConnection`).
  - En local sin Docker, se utiliza `.NET User Secrets` (`dotnet user-secrets`), almacenando la credencial fuera del repositorio Git.

---

## Fase 2: Agent Code Review y CI/CD (El Filtro de TI)
La revisión técnica del código se delega a un pipeline automatizado en GitHub para evitar cuellos de botella en el departamento de TI.

- **Revisor Automatizado**:
  1. **GitHub Copilot Code Review**: Configurado mediante `.github/copilot-instructions.md` y `AGENTS.md` para revisar cada Pull Request bajo las reglas corporativas de TI.
  2. **Gatekeeper de GitHub Actions (`ti-gatekeeper`)**: Ejecutado obligatoriamente en cada Pull Request y `push`.
- **Criterios de Rechazo Inmediato**: El PR es bloqueado automáticamente si:
  - **Faltan pruebas unitarias o fallan**: `dotnet test` (xUnit) y `npm test` (Vitest) son obligatorios.
  - **Se exponen secretos, credenciales o datos sensibles**: El test automatizado y el escaneo en CI verifican que `appsettings.json` y el código fuente no contengan contraseñas ni cadenas de conexión hardcodeadas.
  - **Existen desviaciones de la Clean Architecture**: `ArchitectureTests.cs` valida por reflexión en cada corrida de CI que `Domain` no referencie a ninguna otra capa y que `Application` no dependa de `Infrastructure` ni `Api`.
- **Resolución**: Si el PR es rechazado, el pipeline notifica los errores en GitHub. El vicoder instruye a su agente en local para que aplique las correcciones y vuelve a subir los cambios.

---

## Fase 3: Despliegue Continuo (QA en GCP)
Una vez que el filtro automático aprueba e integra el código en `main`, se inicia la validación en la nube sin intervención manual.

- **Integración y Entrega Continua (CI/CD)**: GitHub Actions compila las imágenes Docker multi-stage de Backend y Frontend y las publica en **Google Artifact Registry**.
- **Despliegue Transparente en Cloud Run (QA)**:
  1. Se despliega primero el contenedor Backend (`books-api`) en **Google Cloud Run**.
  2. El pipeline captura dinámicamente la URL generada del Backend (`steps.deploy-api.outputs.url`), compila el Frontend inyectando `VITE_API_URL` y despliega el servicio Frontend (`books-web`) en **Google Cloud Run**.
- **Inyección de Secretos desde GCP Secret Manager**:
  - La cadena de conexión real de **Cloud SQL (SQL Server)** vive exclusivamente en **GCP Secret Manager** (secreto `db-connection-string`).
  - Durante el despliegue de `books-api`, GitHub Actions configura el flag nativo:
    `--set-secrets="ConnectionStrings__DefaultConnection=db-connection-string:latest"`
  - En tiempo de ejecución, Cloud Run utiliza su Service Account con rol `roles/secretmanager.secretAccessor` para leer el secreto y montarlo en memoria como la variable de entorno `ConnectionStrings__DefaultConnection`, la cual .NET 10 mapea automáticamente a `Configuration.GetConnectionString("DefaultConnection")` sin acoplar SDKs de nube al código C#.

---

## Fase 4: Pase a Producción (Validación y Aprobación)
El único paso de todo el ciclo que requiere intervención humana técnica, garantizando el control de calidad final sobre la infraestructura.

- **Aprobación del Negocio**: El vicoder interactúa con su aplicación viva en las URLs de **Cloud Run (QA)**. Una vez que confirma que la herramienta resuelve su necesidad operativa, da el visto bueno funcional.
- **Aprobación Técnica (1 Clic en GitHub Environments)**:
  - El job `deploy-prod` en GitHub Actions está vinculado al entorno protegido **`production`** de GitHub.
  - Un **Desarrollador Senior de TI** revisa el PR final, el historial en verde del CI/CD y la confirmación del vicoder.
- **Pase a Producción**:
  - El Senior de TI presiona el botón **"Review deployments → Approve and deploy"** en GitHub Actions.
  - Con ese único clic, GitHub Actions despliega las imágenes validadas hacia los servicios productivos en Cloud Run (`books-api-prod` y `books-web-prod`), inyectando el secreto productivo (`db-connection-string-prod:latest`) desde **GCP Secret Manager**.
