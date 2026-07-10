# Recruiter Management & Matchings Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a comprehensive recruiter profile enabling recruiters to register, create/add jobs, view candidate matchings, and inspect individual candidate compatibility reports with visual feedback.

**Architecture:** 
1. Introduce a `Role` enum (`CANDIDATO`, `RECRUTADOR`) in the database schema (`schema.prisma`) and update domain entities, controllers, and JWT payloads.
2. Update Supabase SQL Row Level Security (RLS) policies to allow recruiters to retrieve matching records and candidate profiles associated with the vacancies they created.
3. Add backend endpoints and repository functions to query recruiter-specific job postings.
4. Implement role-based landing screens on Next.js frontend, adding a Recruiter dashboard with job management, a list of applicants sorted by match score, and compatibility drilldowns.

**Tech Stack:** NestJS (v11), Next.js (v15), Prisma ORM, PostgreSQL (Supabase RLS), Tailwind CSS (v4), TypeScript.

---

### Task 1: Database Migration & RLS Security Configuration

**Files:**
- Modify: [schema.prisma](file:///c:/projetos/aimatcher/backend/prisma/schema.prisma)
- Create: [add_recruiter_rls.sql](file:///c:/projetos/aimatcher/backend/prisma/add_recruiter_rls.sql)

**Step 1: Write the schema changes**
Modify `schema.prisma` to add:
```prisma
enum Role {
  CANDIDATO
  RECRUTADOR
}

model Usuario {
  // ... existing fields
  role              Role           @default(CANDIDATO)
  // ... existing fields
}
```

**Step 2: Generate the Prisma migration**
Run the migration command to apply changes locally and to the remote database:
Run: `npx prisma migrate dev --name add_user_role`
Expected: Migration generated and applied.

**Step 3: Create RLS updates script**
Create a SQL script file `/backend/prisma/add_recruiter_rls.sql` containing:
```sql
-- Allow recruiters to view profiles of candidates who matched their jobs
CREATE POLICY usuario_recrutador_select_policy ON usuarios
    FOR SELECT
    USING (
        id IN (
            SELECT usuario_id FROM matchings 
            WHERE vaga_id IN (
                SELECT id FROM vagas 
                WHERE recrutador_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
        )
    );

-- Allow recruiters to view matchings for jobs they created
CREATE POLICY matching_recrutador_select_policy ON matchings
    FOR SELECT
    USING (
        vaga_id IN (
            SELECT id FROM vagas 
            WHERE recrutador_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        )
    );
```
Apply the script via Supabase SQL editor or run it using Prisma client:
Run: `npx prisma db execute --file ./prisma/add_recruiter_rls.sql`
Expected: Execute successfully.

**Step 4: Commit**
```bash
git add backend/prisma/schema.prisma backend/prisma/add_recruiter_rls.sql
git commit -m "db: add role column and recruiter RLS security policies"
```

---

### Task 2: Update Backend Domain, Use Cases & Token Payload

**Files:**
- Modify: [usuario.entity.ts](file:///c:/projetos/aimatcher/backend/src/domain/entities/usuario.entity.ts)
- Modify: [prisma-usuario.repository.ts](file:///c:/projetos/aimatcher/backend/src/infrastructure/database/repositories/prisma-usuario.repository.ts)
- Modify: [token.service.ts](file:///c:/projetos/aimatcher/backend/src/domain/services/token.service.ts)
- Modify: [jwt-token.service.ts](file:///c:/projetos/aimatcher/backend/src/infrastructure/security/jwt-token.service.ts)
- Modify: [registrar-usuario.use-case.ts](file:///c:/projetos/aimatcher/backend/src/domain/use-cases/registrar-usuario.use-case.ts)
- Modify: [autenticar-usuario.use-case.ts](file:///c:/projetos/aimatcher/backend/src/domain/use-cases/autenticar-usuario.use-case.ts)
- Modify: [cadastro-usuario.dto.ts](file:///c:/projetos/aimatcher/backend/src/presentation/dtos/cadastro-usuario.dto.ts)
- Modify: [usuario.controller.ts](file:///c:/projetos/aimatcher/backend/src/presentation/controllers/usuario.controller.ts)
- Test: [registrar-usuario.use-case.spec.ts](file:///c:/projetos/aimatcher/backend/src/domain/use-cases/registrar-usuario.use-case.spec.ts)
- Test: [autenticar-usuario.use-case.spec.ts](file:///c:/projetos/aimatcher/backend/src/domain/use-cases/autenticar-usuario.use-case.spec.ts)

**Step 1: Implement role additions in Entities, Repository, DTO and Token Service**
- Add `Role = 'CANDIDATO' | 'RECRUTADOR'` type to `usuario.entity.ts` and constructor.
- Update `PrismaUsuarioRepository`'s mapper `mapToDomain` and write queries to include `role`.
- Add `role` to `TokenPayload` in `token.service.ts` and `jwt-token.service.ts`.
- Accept `role?: Role` in `RegistrarUsuarioUseCase` and DTO.
- Pass `role` inside the token payload inside `AutenticarUsuarioUseCase` (login).

**Step 2: Update existing unit tests**
- In `registrar-usuario.use-case.spec.ts` and `autenticar-usuario.use-case.spec.ts`, pass a valid role (or allow it to default) and assert the returned user has a `role` field.
Run: `npm run test`
Expected: PASS

**Step 3: Commit**
```bash
git add backend/src/
git commit -m "feat: implement User Role domain model, token payload, use cases and registration flow"
```

---

### Task 3: Recruiter Vacancy Fetching & Matching Permissions

**Files:**
- Modify: [vaga.repository.ts](file:///c:/projetos/aimatcher/backend/src/domain/repositories/vaga.repository.ts)
- Modify: [prisma-vaga.repository.ts](file:///c:/projetos/aimatcher/backend/src/infrastructure/database/repositories/prisma-vaga.repository.ts)
- Modify: [vaga.controller.ts](file:///c:/projetos/aimatcher/backend/src/presentation/controllers/vaga.controller.ts)
- Modify: [matching.controller.ts](file:///c:/projetos/aimatcher/backend/src/presentation/controllers/matching.controller.ts)

**Step 1: Add Recruiter Vacancy Retrieval**
Add the following method to `VagaRepository` and `PrismaVagaRepository`:
```typescript
abstract buscarPorRecrutador(recrutadorId: string, limite: number, pagina: number): Promise<{ total: number; vagas: Vaga[] }>;
```
Implement it in `prisma-vaga.repository.ts`:
```typescript
async buscarPorRecrutador(recrutadorId: string, limite: number, pagina: number): Promise<{ total: number; vagas: Vaga[] }> {
  return this.prisma.runWithRLS(async (tx) => {
    const skip = (pagina - 1) * limite;
    const [total, dbVagas] = await Promise.all([
      tx.vaga.count({ where: { recrutadorId } }),
      tx.vaga.findMany({
        where: { recrutadorId },
        skip,
        take: limite,
        orderBy: { dataCriacao: 'desc' },
      }),
    ]);
    return {
      total,
      vagas: dbVagas.map((v) => this.mapToDomain(v)!),
    };
  });
}
```

Add endpoint to `VagaController` under `@UseGuards(JwtAuthGuard)`:
```typescript
@Get('minhas-vagas')
@HttpCode(HttpStatus.OK)
async minhasVagas(
  @Req() req: any,
  @Query('pagina') pagina = 1,
  @Query('limite') limite = 20,
) {
  const result = await this.vagaRepository.buscarPorRecrutador(req.user.userId, Number(limite), Number(pagina));
  return {
    total: result.total,
    pagina: Number(pagina),
    limite: Number(limite),
    vagas: result.vagas,
  };
}
```

**Step 2: Update Permission Guard on Matching Details**
Update `obterMatching` and `analisar` in `MatchingController` to check if the current user is either the candidate (`req.user.userId === usuarioId`) OR the recruiter of the vacancy.
```typescript
// Fetch vacancy to verify if req.user.userId matches vaga.recrutadorId
const vaga = await this.vagaRepository.buscarPorId(vagaId);
const isRecrutador = vaga?.recrutadorId === req.user.userId;

if (usuarioId !== req.user.userId && !isRecrutador && !req.query.admin) {
  throw new ForbiddenException('Acesso não autorizado');
}
```

**Step 3: Update `buscarPorVaga` in `PrismaMatchingRepository` to Include Candidate Details**
Update `prisma-matching.repository.ts: buscarPorVaga` to select `usuario`'s name/email, so recruiter dashboard lists applicants' details:
```typescript
const dbMatchings = await tx.matching.findMany({
  where: { vagaId, score: { gte: scoreMinimo } },
  include: {
    usuario: {
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        telefone: true,
      }
    }
  },
  skip,
  take: limite,
  orderBy: { score: 'desc' },
});
```

**Step 4: Run typecheck and tests**
Run: `npm run build`
Run: `npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/src/
git commit -m "feat: implement recruiter job fetching and matching permission relaxation"
```

---

### Task 4: Frontend Types & Authentication Updates

**Files:**
- Modify: [User.ts](file:///c:/projetos/aimatcher/frontend/src/types/user/User.ts)
- Modify: [RegisterRequest.ts](file:///c:/projetos/aimatcher/frontend/src/types/auth/RegisterRequest.ts)
- Modify: [RegisterForm.tsx](file:///c:/projetos/aimatcher/frontend/src/components/auth/RegisterForm.tsx)

**Step 1: Update type definitions**
- Add `role: 'CANDIDATO' | 'RECRUTADOR'` to the `User` type.
- Add `role: 'CANDIDATO' | 'RECRUTADOR'` to `RegisterRequest`.

**Step 2: Update RegisterForm select selector**
In `RegisterForm.tsx`, add a selector for role:
```tsx
const registerFormSchema = z.object({
  // ...
  role: z.enum(["CANDIDATO", "RECRUTADOR"]),
});
```
Add standard Shadcn Select or native HTML Select for `role` in the form JSX.

**Step 3: Commit**
```bash
git add frontend/src/
git commit -m "feat: extend frontend user types and select role component in register"
```

---

### Task 5: Dynamic Role Dashboard Routing

**Files:**
- Modify: [page.tsx](file:///c:/projetos/aimatcher/frontend/src/app/%5Bid%5D/dashboard/page.tsx)
- Create: [RecruiterDashboard.tsx](file:///c:/projetos/aimatcher/frontend/src/components/dashboard/RecruiterDashboard.tsx)
- Create: [RecruiterVagasApi.ts](file:///c:/projetos/aimatcher/frontend/src/lib/api/recruiterVagasApi.ts)

**Step 1: Create Recruiter API Client**
Create `recruiterVagasApi.ts` to call recruiter specific actions:
- `listarMinhasVagas(page, limit)` -> `GET /vaga/minhas-vagas`
- `listarCandidatosVaga(vagaId)` -> `GET /matching/vaga/${vagaId}`
- `obterCandidatoMatching(usuarioId, vagaId)` -> `GET /matching/${usuarioId}/${vagaId}`

**Step 2: Create RecruiterDashboard Component**
Build `RecruiterDashboard.tsx` displaying:
- Job list created by recruiter.
- Button to open Dialog for creating a new job using `VagasApi.adicionarVaga`.
- Button "Ver Candidatos" on each job card to switch view/list candidates who ran matching.

**Step 3: Load correct Dashboard based on Role**
Modify `frontend/src/app/[id]/dashboard/page.tsx` to conditionally render:
```tsx
if (user?.role === "RECRUTADOR") {
  return <RecruiterDashboard user={user} onLogout={handleLogout} />;
}
return <CandidateDashboard ... />;
```

**Step 4: Commit**
```bash
git add frontend/
git commit -m "feat: implement RecruiterDashboard component and dynamic routing"
```

---

### Task 6: Recruiter View Candidates & Matching Details

**Files:**
- Create: [JobCandidatesList.tsx](file:///c:/projetos/aimatcher/frontend/src/components/dashboard/JobCandidatesList.tsx)
- Create: [MatchingDetailsDialog.tsx](file:///c:/projetos/aimatcher/frontend/src/components/dashboard/MatchingDetailsDialog.tsx)

**Step 1: Implement JobCandidatesList**
A screen showing:
- Active job description header.
- Table of matched candidates sorted by score descending (showing: Name, Email, Score, Match Date, Actions).
- Button "Ver Detalhes do Match" which fetches the matching details and opens a dialog.

**Step 2: Implement MatchingDetailsDialog**
Displays the same visual compatibility analysis cards (Strong points, Weak points, recommendations) as `JobDetailsPage` using clean HSL/Tailwind gradients.

**Step 3: Verify build**
Run: `npm run build` in `frontend` directory.
Expected: Build passes with no TypeScript errors.

**Step 4: Commit**
```bash
git add frontend/
git commit -m "feat: add matched candidates list and analysis report dialog for recruiters"
```

---
## Verification Plan

### Automated Tests
- In `/backend` directory, run unit tests to verify:
  `npm run test`
- Verify compiling backend:
  `npm run build`
- Verify compiling frontend:
  `npm run build`

### Manual Verification
1. Open register page, register as a Recruiter.
2. Log in with the recruiter account. Verify the interface shows the Recruiter Dashboard.
3. Click "Adicionar Vaga", paste job description, click save, verify the job is parsed and added.
4. Log in as a Candidate, go to Jobs, view the recruiter's job, click "Analisar Compatibilidade".
5. Log back in as the Recruiter, click "Ver Candidatos" on that job, verify candidate appears in list with correct score.
6. Click "Ver Detalhes do Match" as the recruiter, verify matching details render exactly.
