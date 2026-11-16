---
name: scaffold-clean-fullstack
description: >-
  Inicializa el esqueleto completo de código de una aplicación Fullstack (.NET 10
  Minimal API en Clean Architecture de 4 capas + React TypeScript en Node 26 LTS
  + Docker + Tests de Arquitectura e Integración) sobre el repositorio plantilla.
---

# Skill: Inicializar Esqueleto Fullstack en Clean Architecture

Usa este skill cuando el usuario solicite iniciar el desarrollo de una aplicación sobre este template y aún no existan las carpetas `backend/` y `frontend/`.

## Pre-requisitos Obligatorios
1. Lee `MEMORY.md` y verifica que el plan de implementación haya sido aprobado por el usuario y esté registrado en `MEMORY.md`.
2. Verifica que **no estás en la rama `main`**. Si estás en `main`, crea primero una rama de trabajo (`git checkout -b feat/initial-scaffold`).
3. Si tienes alguna duda técnica sobre los campos de la entidad principal o reglas de negocio, **pregunta al usuario antes de generar código (no asumas ni crees fallbacks silenciosos)**.

---

## Procedimiento Paso a Paso

### Paso 1: Crear la Solución Backend en Clean Architecture (`backend/`)
Crea la solución `backend/Books.sln` (o el nombre del dominio indicado en `MEMORY.md`) con **5 proyectos sobre `.NET 10` (`net10.0`)**:

1. **`Domain` (`*.Domain.csproj`):**
   - Cero referencias a otros proyectos o paquetes NuGet.
   - Contiene `Entities/` (entidades de dominio) e `Interfaces/` (contratos de repositorio).
2. **`Application` (`*.Application.csproj`):**
   - Referencia **únicamente** a `Domain`.
   - Contiene `DTOs/` y `Services/` (casos de uso y reglas de negocio).
3. **`Infrastructure` (`*.Infrastructure.csproj`):**
   - Referencia a `Domain` y `Application`.
   - Paquetes: `Microsoft.EntityFrameworkCore.SqlServer` (`10.0.*`) y `Microsoft.EntityFrameworkCore.InMemory` (`10.0.*`).
   - Contiene `Data/AppDbContext.cs`, `Repositories/` y `DependencyInjection.cs`.
4. **`Api` (`*.Api.csproj`):**
   - Referencia a `Application` e `Infrastructure`.
   - `appsettings.json` con `"DefaultConnection": ""` (vacío por seguridad; nunca hardcodear secretos).
   - `Program.cs` con Minimal APIs, `/health`, CORS y `EnsureCreated()` / migración inicial.
5. **`Tests` (`*.Tests.csproj`):**
   - Paquetes: `xunit`, `xunit.runner.visualstudio`, `Microsoft.NET.Test.Sdk`, `Microsoft.AspNetCore.Mvc.Testing` (`10.0.*`).
   - Incluye obligatoriamente `ArchitectureTests.cs` validando por reflexión que `Domain` no dependa de nada y `Application` solo dependa de `Domain`.
   - Incluye pruebas de integración con `WebApplicationFactory<Program>`.

### Paso 2: Crear el Frontend en React + TypeScript (`frontend/`)
1. Configura `package.json`, `tsconfig.json` (con `"types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]`) y `vite.config.ts`.
2. Lee la URL del backend desde `import.meta.env.VITE_API_URL` (sin crear fallbacks silenciosos que oculten errores de red: muestra el estado de error claramente en la UI si la petición falla).
3. Agrega pruebas unitarias en `src/App.test.tsx` con `Vitest` y `@testing-library/react`.

### Paso 3: Contenedores Docker (`Dockerfile` y `docker-compose.yml`)
1. `backend/Dockerfile`: Multi-stage con `mcr.microsoft.com/dotnet/sdk:10.0` y `mcr.microsoft.com/dotnet/aspnet:10.0` en puerto `8080`.
2. `frontend/Dockerfile` + `frontend/nginx.conf`: Multi-stage con `node:26-alpine` (recibiendo `ARG VITE_API_URL`) y `nginx:alpine` en puerto `8080`.
3. `docker-compose.yml`: Servicios `sqlserver`, `books-api` y `books-web`.

### Paso 4: Verificación y Documentación
1. Ejecuta `dotnet test backend/*.sln` y verifica que todos los tests pasen.
2. Ejecuta `cd frontend && npm install && npm test && npm run build` usando **Node 26 LTS**.
3. Actualiza `MEMORY.md` y `README.md` y utiliza el skill `git-pr-workflow` para subir la rama y crear el Pull Request con `gh`.
