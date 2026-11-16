---
name: add-crud-feature
description: >-
  Implementa o modifica un módulo de negocio CRUD siguiendo estrictamente las 4
  capas de Clean Architecture en .NET 10, React + TypeScript en Frontend,
  principio DRY, cero fallbacks silenciosos y pruebas automatizadas.
---

# Skill: Agregar o Modificar Módulo de Negocio (Clean Architecture)

Usa este skill cuando el usuario pida agregar una nueva entidad, campo o funcionalidad sobre una aplicación existente.

## Reglas Previas antes de Codificar
1. **Revisa `MEMORY.md`:** Confirma que el requerimiento esté aprobado y registrado en `MEMORY.md`.
2. **Verifica la Rama Activa:** Asegúrate de estar en una rama `feat/<nombre-feature>` o `fix/<nombre-fix>`. **Nunca trabajes sobre `main`.**
3. **Cero Suposiciones / Cero Fallbacks Silenciosos:** Si algún tipo de dato, validación u obligatoriedad de campo no está claro, **pregunta primero al usuario**.

---

## Orden de Implementación Capa por Capa

1. **Capa `Domain`:**
   - Crea o actualiza la entidad en `Domain/Entities/` y su contrato en `Domain/Interfaces/`.
   - **Prohibido** agregar atributos o dependencias de Entity Framework o paquetes externos en esta capa.
2. **Capa `Application`:**
   - Crea o actualiza los DTOs (`record`) en `Application/DTOs/` y el servicio de aplicación en `Application/Services/`.
   - Aplica **DRY**: centraliza aquí las reglas de negocio (como asignación de `FechaRegistro` y `FechaActualizacion`).
3. **Capa `Infrastructure`:**
   - Registra el `DbSet<T>` en `BookDbContext`, implementa el repositorio en `Infrastructure/Repositories/` y regístralo en `DependencyInjection.cs`.
4. **Capa `Api`:**
   - Expone los endpoints Minimal API en `Program.cs` delegando toda la lógica al servicio de `Application`.
5. **Capa `Frontend` (`React + TypeScript`):**
   - Actualiza las interfaces TypeScript, el formulario y la tabla reutilizando componentes o funciones auxiliares (**DRY**).
   - Maneja los errores HTTP de forma explícita en la interfaz (**nunca uses `catch {}` vacíos ni fallbacks silenciosos**).
6. **Pruebas Automatizadas Obligatorias:**
   - Agrega o actualiza los tests en `backend/*.Tests` (`xUnit`) y `frontend/src/*.test.tsx` (`Vitest`).
   - Ejecuta `dotnet test` y `npm test`. **No des por terminada la tarea ni pases a la siguiente hasta que todos los tests estén en verde.**
7. **Cierre de Tarea:**
   - Actualiza `MEMORY.md` y `README.md`, y usa el skill `git-pr-workflow` para subir los cambios y crear el PR.
