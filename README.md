# Directorio de usuarios

Mantenimiento de usuarios con .NET 10, SQL Server y React + TypeScript (Node 26).

## Funciones
- Listar y buscar por nombre completo, correo o rol.
- Crear y editar nombre, apellidos, correo, rol y estado.
- Activar y desactivar con confirmación, conservando los datos.
- Correo único sin distinguir mayúsculas ni espacios externos; validación en la API e índice único en SQL Server.
- Indicadores de esta vista, formularios accesibles y estados explícitos de carga, error y lista vacía.

Rol es una etiqueta de texto libre que describe la función de la persona. Esta aplicación administra registros; no incluye inicio de sesión ni control de permisos. La configuración de acceso de una publicación debe ser revisada por TI.

## Requisitos
- SDK .NET 10 o compatible con net10.0 y runtime .NET 10.
- Node.js 26.x y npm.
- SQL Server y ConnectionStrings__DefaultConnection configurada por TI mediante entorno o user-secrets. Nunca agregar conexiones al repositorio.

## Ejecutar en local
En Windows, si la conexión está guardada como variable de usuario y la terminal no la heredó, cárgala explícitamente en ese proceso. No se modifica su valor persistente ni se muestra la conexión:
```powershell
$env:ConnectionStrings__DefaultConnection = [Environment]::GetEnvironmentVariable('ConnectionStrings__DefaultConnection', 'User')
dotnet run --project backend/Users.Api --urls http://localhost:5080
```
En otra terminal:
```powershell
cd frontend
npm ci
$env:VITE_API_URL = 'http://localhost:5080'
npm run dev
```
Abrir http://localhost:5173. La API permite los orígenes locales localhost:5173 y 127.0.0.1:5173 por configuración; para otros orígenes establecer AllowedOrigins__0. VITE_API_URL es una URL pública de la API, nunca una credencial.

La API falla explícitamente si falta la conexión o la base no está disponible. Al iniciar aplica las migraciones EF Core, que crean ManagedUsers y su índice único. TI debe confirmar la base destino y conceder permisos de migración al proceso correspondiente. No se crean datos de ejemplo. Con la autorización del usuario se creó la base local indicada por la variable existente y se aplicó la migración de usuarios. No se cambió la variable persistente ni se conservaron registros de prueba.

## API
| Método | Ruta | Función |
| --- | --- | --- |
| GET | /health | Salud del proceso |
| GET | /api/users?search=texto | Listado y búsqueda |
| GET | /api/users/{id} | Detalle |
| POST | /api/users | Crear |
| PUT | /api/users/{id} | Editar |
| PATCH | /api/users/{id}/status | Cambiar estado |

Entrada de alta/edición: firstName (100), lastName (150), email (254), role (80), isActive (booleano). Todos obligatorios. Cambiar estado recibe {"isActive": false} o true. La API devuelve 201 al crear, 200 al consultar/actualizar, 400 por validación, 404 para IDs inexistentes y 409 por correo duplicado, con errores por campo. Fechas UTC de creación y actualización las asigna el servicio. No hay eliminación física.

## Arquitectura y pruebas
- Users.Domain: entidad y contratos; sin dependencias de persistencia.
- Users.Application: DTOs, validaciones y casos de uso; depende solo de Domain.
- Users.Infrastructure: EF Core, SQL Server, repositorio y migraciones.
- Users.Api: Minimal APIs, CORS y respuestas Problem Details.
- Users.Tests: xUnit, arquitectura, integración HTTP con InMemory, CORS y prueba optativa sobre SQL Server real con rollback.
- frontend/: React, Vite, Vitest y Testing Library.

```powershell
dotnet test backend/Users.sln --configuration Release
cd frontend
npm ci
npm test
npm run build
```
Por defecto las pruebas HTTP usan InMemory y la prueba SQL real se omite. Para incluirla, primero iniciar la API sobre la base local configurada para aplicar sus migraciones, y después ejecutar desde la raíz:
```powershell
$env:ConnectionStrings__DefaultConnection = [Environment]::GetEnvironmentVariable('ConnectionStrings__DefaultConnection', 'User')
$env:USERS_SQL_INTEGRATION = '1'
dotnet test backend/Users.sln --configuration Release
Remove-Item Env:USERS_SQL_INTEGRATION
```
La prueba SQL solo admite destinos locales y rechaza bases de sistema. Verifica alta, consulta, búsqueda, edición, cambios de estado, validación, correo duplicado e índice único real. Todos sus cambios usan una transacción que se revierte al finalizar, incluso si falla una aserción; después comprueba que sus registros no existen. No elimina ni modifica registros ajenos. En CI se omite esta prueba salvo que se configure expresamente una base local migrada.

Para futuras migraciones:
```powershell
dotnet tool restore
dotnet ef migrations add NombreDelCambio --project backend/Users.Infrastructure --startup-project backend/Users.Api --output-dir Data/Migrations
```

## Contenedores y nube
Dockerfiles multi-stage para cada servicio, Nginx con rutas SPA y docker-compose.yml. Compose requiere SQLSERVER_SA_PASSWORD y ConnectionStrings__DefaultConnection suministradas en el entorno; la conexión debe apuntar al servicio sqlserver. Ejecutar SQL Server primero y esperar a que esté disponible antes de iniciar la API. El frontend se publica en 5173 y la API en 5080. El directorio sql-data persiste los datos.

GitHub Actions ejecuta pruebas y compilación en PR. El despliegue a QA se ejecuta desde main, y producción requiere revisión. Las conexiones de nube se inyectan mediante Secret Manager; el flujo configura CORS con la URL del frontend desplegado. No se ha fusionado ni desplegado esta entrega.

## Revisión de TI pendiente
El aprovisionador rechazó conceder admin a 888Leonidas888. Se envió una invitación de colaboración con permiso de escritura, pendiente de aceptación. GitHub rechazó configurarlo como revisor; production conserva a stn-jescriba. Tras aceptar la invitación, TI debe completar la asignación de su revisor y revisar los accesos antes de desplegar. No se modificó la skill global.

## Validación de esta entrega
16 pruebas backend, incluida SQL Server real, y 18 frontend correctas; build de producción verificado. Migración aplicada correctamente sobre la base local configurada. API y directorio verificados en navegador sin error de conexión y sin registros de prueba persistentes. Docker no está disponible en el equipo, por lo que los contenedores requieren validación en CI/TI.

Entrega para revisión: [PR #1](https://github.com/stn-jescriba/app-usuarios/pull/1), en borrador mientras TI completa los pendientes de entorno.
