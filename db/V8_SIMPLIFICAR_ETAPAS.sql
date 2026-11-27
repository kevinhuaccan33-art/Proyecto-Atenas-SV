-- ATENAS IA LAB V8
-- Simplificación académica:
-- Etapa 1: Identidad /4
-- Etapa 2: Canvas /4
-- Etapas 3+4: Prototipo IA visible como una sola evaluación /8
-- Etapa 5: Exposición final /4
-- La Etapa 4 permanece solo como soporte interno para conservar el total 20/20.

begin;

create table if not exists public.stage_work_archive_v8 (
  group_id smallint not null,
  stage_id smallint not null,
  snapshot jsonb not null,
  archived_at timestamptz not null default now(),
  primary key (group_id, stage_id)
);

alter table public.stage_work_archive_v8 enable row level security;
revoke all on table public.stage_work_archive_v8 from anon, authenticated;
grant select, insert, update, delete on table public.stage_work_archive_v8 to service_role;

insert into public.stage_work_archive_v8 (group_id, stage_id, snapshot, archived_at)
select
  w.group_id,
  w.stage_id,
  jsonb_build_object(
    'status', w.status,
    'score', w.score,
    'content', w.content,
    'evidence_url', w.evidence_url,
    'student_comment', w.student_comment,
    'teacher_comment', w.teacher_comment,
    'revision', w.revision,
    'submitted_at', w.submitted_at,
    'reviewed_at', w.reviewed_at,
    'updated_at', w.updated_at
  ),
  now()
from public.group_stage_work w
where w.stage_id in (3,4,5)
on conflict (group_id, stage_id)
do update set
  snapshot = excluded.snapshot,
  archived_at = excluded.archived_at;

update public.stages
set
  name = 'Probar mi proyecto IA',
  description = 'Prototipo funcional y demostración de la función principal. Esta etapa visible reúne las antiguas Etapas 3 y 4.',
  celebration_message = '¡Prototipo listo! La IA ya puede probarse y evaluarse.'
where id = 3;

update public.stages
set
  name = 'Prototipo IA (interno)',
  description = 'Registro interno complementario de la evaluación del prototipo. No se muestra como etapa separada al estudiante.',
  celebration_message = 'Registro interno del prototipo completado.'
where id = 4;

update public.stages
set
  name = 'Exposición final',
  description = 'Exposición guiada de máximo 4 minutos con problema, solución, uso de IA, demostración, beneficio, limitación y cierre.',
  celebration_message = '¡Exposición final completada!'
where id = 5;

-- Reiniciar el nuevo flujo desde el prototipo.
-- El contenido antiguo de Etapa 3 se conserva en la misma fila y además
-- queda respaldado en stage_work_archive_v8.
update public.group_stage_work w
set
  status = case
    when w.stage_id = 3
      and exists (
        select 1
        from public.group_stage_work previous
        where previous.group_id = w.group_id
          and previous.stage_id = 2
          and previous.status = 'approved'
      )
      then 'editable'
    else 'locked'
  end,
  score = 0,
  student_comment = '',
  teacher_comment = '',
  submitted_by = null,
  submitted_at = null,
  reviewed_by = null,
  reviewed_at = null,
  revision = 0,
  updated_by = null,
  updated_at = now()
where w.stage_id in (3,4,5);

update public.groups
set
  completion_approved = false,
  completion_approved_at = null,
  completion_approved_by = null,
  updated_at = now()
where completion_approved = true;

commit;
