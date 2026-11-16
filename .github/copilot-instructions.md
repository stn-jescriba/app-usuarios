# Instrucciones de Revisión de Código para GitHub Copilot (Filtro de TI)

Al revisar cualquier Pull Request en este repositorio, actúa como un Arquitecto de Software Senior de TI y verifica obligatoriamente los siguientes criterios de rechazo:

## 1. Cumplimiento de Clean Architecture y DRY
- Verifica que `backend/*.Domain` **no** tenga dependencias hacia `Application`, `Infrastructure`, `Api` ni paquetes NuGet de persistencia (`Microsoft.EntityFrameworkCore.*`).
- Verifica que `backend/*.Application` dependa únicamente de `Domain` y **nunca** de `Infrastructure`.
- Exige el principio **DRY (Don't Repeat Yourself)**: rechaza código duplicado que deba extraerse a funciones, servicios o componentes reutilizables.

## 2. Prohibición de Fallbacks Silenciosos
- Rechaza bloques `catch {}` vacíos, supresión silenciosa de excepciones o valores de respaldo inventados que oculten fallos de configuración, red o base de datos.

## 3. Cero Exposición de Credenciales y Cero Archivos Basura
- Revisa `appsettings.json`, archivos `.cs`, `.ts`, `.tsx` y workflows para asegurar que **no existan** cadenas de conexión (`Server=...`, `Password=...`), API Keys ni datos sensibles.
- Rechaza la inclusión de archivos temporales, logs, binarios o archivos que no pertenezcan al core de la aplicación.

## 4. Cobertura de Pruebas, Conventional Commits y Documentación (`MEMORY.md` y `README.md`)
- Todo nuevo endpoint en el Backend o vista en el Frontend debe incluir sus pruebas en `xUnit` o `Vitest`.
- Verifica que los commits y el título del PR sigan **Conventional Commits v1.0.0** (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Verifica que `MEMORY.md` y `README.md` hayan sido actualizados reflejando los cambios del Pull Request.
