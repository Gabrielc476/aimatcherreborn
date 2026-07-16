# Kanban Board and Custom Recruitment Stages

## Goal
Implement a Kanban board for recruiters to manage candidate stages per job, allowing fully customizable stages, stage-specific email templates, and automated email client opening on candidate stage transition.

## Tasks

### Phase 1: Database and Schema Updates
- [ ] Add `etapas` Json field to `Vaga` model in `schema.prisma` → Verify: Check if `etapas` is present in `prisma/schema.prisma`
- [ ] Run Prisma migration `npx prisma migrate dev --name add_etapas_to_vaga` to update the database → Verify: Migration folder created and executed successfully against Supabase
- [ ] Update `PrismaMatchingRepository.buscarPorVaga` in `prisma-matching.repository.ts` to retrieve all candidates (remove `status: { not: 'rejeitado' }` filter) → Verify: Verify that matching query does not exclude rejected status

### Phase 2: Backend Controllers & DTOS
- [ ] Implement `PATCH /vaga/:id` endpoint in `VagaController` to update job details (specifically `etapas`) → Verify: Check that `vaga.controller.ts` includes `atualizar` method
- [ ] Implement `PUT /matching/:usuarioId/:vagaId/status` endpoint in `MatchingController` to update candidate stage → Verify: Check that `matching.controller.ts` includes `atualizarStatus` method
- [ ] Expose new database save logic in matching repository or controller to update only status → Verify: Verify DB updates when status endpoint is called

### Phase 3: Frontend API Integrations
- [ ] Add `atualizarVaga` method in `RecruiterVagasApi` (`recruiterVagasApi.ts`) to save stages/templates → Verify: Method exists in file and sends PATCH request to `/vaga/:id`
- [ ] Add `atualizarStatusMatching` method in `RecruiterVagasApi` to save candidate stage → Verify: Method exists in file and sends PUT request to `/matching/:usuarioId/:vagaId/status`

### Phase 4: Frontend UI Components
- [ ] Create `StageConfigDialog.tsx` dialog to allow recruiters to add, delete, reorder, and configure templates for job stages → Verify: Component renders forms for subject/body templates per stage
- [ ] Create `KanbanView.tsx` component with drag-and-drop support representing stages as columns and candidates as cards → Verify: Cards can be dragged between columns, invoking state updates
- [ ] Modify `JobCandidatesList.tsx` to include List / Kanban Toggle, integrate `StageConfigDialog`, and show `ContactCandidateDialog` automatically on stage transition → Verify: Switching views works, moving card triggers email dialog with custom template

### Phase 5: Verification & Walkthrough
- [ ] Run typescript compiler and eslint checks in frontend and backend to verify code quality → Verify: `npx tsc --noEmit` and `npm run lint` pass successfully
- [ ] Create walkthrough documenting implementation and visual updates → Verify: `walkthrough.md` is updated in the artifacts directory

## Done When
- [ ] Recruiters can toggle between Table list view and Kanban board view of candidates for a job.
- [ ] Recruiters can configure custom stages (add/edit/delete/reorder) and templates for a job.
- [ ] Moving a candidate to a new stage updates their database status and triggers the pre-filled email client opener dialog.
