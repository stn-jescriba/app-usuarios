---
name: git-pr-workflow
description: >-
  Gestiona la creación de ramas, auditoría contra archivos basura o datos
  sensibles, actualización de MEMORY.md y README.md, commits con Conventional
  Commits v1.0.0 y creación de Pull Requests con gh CLI sin fusionar a main.
---

# Skill: Flujo Git, Conventional Commits y Pull Request (`gh`)

Usa este skill siempre que vayas a iniciar una tarea en Git o entregar cambios hacia el repositorio remoto.

## 1. Antes de Empezar una Tarea (Creación de Rama)
1. Verifica la rama actual con `git branch --show-current`.
2. **Prohibido trabajar en `main`:** Si estás en `main`, crea una rama nueva siguiendo la convención:
   - `feat/<nombre-corto>` (nueva funcionalidad)
   - `fix/<nombre-corto>` (corrección de bug)
   - `docs/<nombre-corto>` (documentación)
   - `refactor/<nombre-corto>` (refactorización DRY / arquitectura)
   - `chore/<nombre-corto>` (configuración / CI / dependencias)

---

## 2. Antes de Hacer Commit (Auditoría de Higiene y Documentación)
1. **Verifica `MEMORY.md` y `README.md`:**
   - Asegúrate de haber actualizado el estado de la tarea en `MEMORY.md` y cualquier cambio relevante en `README.md`.
2. **Inspecciona `git status`:**
   - **Cero Archivos Basura:** Verifica que no existan archivos temporales, logs o artefactos ajenos al core. Si dudas sobre algún archivo, **pregunta al usuario antes de ejecutar `git add`**.
   - **Cero Datos Sensibles:** Verifica con `git diff` que no se estén subiendo contraseñas, cadenas de conexión, IPs privadas ni secretos en `appsettings.json`, `.env` o código fuente.

---

## 3. Formato de Commit: Conventional Commits v1.0.0
1. Construye el mensaje de commit siguiendo estrictamente **Conventional Commits v1.0.0** (`https://www.conventionalcommits.org/es/v1.0.0/`):
   ```text
   <tipo>(<alcance opcional>): <descripción concisa en minúsculas>
   ```
   - **Tipos válidos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
   - **Ejemplos:**
     - `feat(books): add publication year validation in BookService`
     - `docs(memory): record approved architecture plan in MEMORY.md`

---

## 4. Subida al Remoto y Creación de Pull Request con `gh`
1. Sube la rama al remoto:
   ```powershell
   git push -u origin <nombre-rama>
   ```
2. Crea **siempre** el Pull Request hacia `main` usando GitHub CLI (`gh`):
   ```powershell
   gh pr create --base main --head <nombre-rama> --title "<tipo>(<alcance>): <título>" --body "<resumen de cambios y validación de tests>"
   ```
3. **REGLA DE ORO (NO AUTO-MERGE):**
   - **DETENTE después de crear el PR y entregar el enlace al usuario.**
   - **NUNCA ejecutes `gh pr merge` ni fusiones a `main`** a menos que el usuario te dé la orden explícita de hacerlo.
