-- Equilibrium and acid–base V1 session types on existing pro_lab_sessions.
-- Recomputes from saved inputs; do not store trusted client results.

alter table public.pro_lab_sessions
  drop constraint if exists pro_lab_sessions_session_type_check;

alter table public.pro_lab_sessions
  add constraint pro_lab_sessions_session_type_check
  check (
    session_type in (
      'calculation',
      'element_compare',
      'molecule_compare',
      'atomic_compare',
      'reaction',
      'formula_solver',
      'solution_builder',
      'equilibrium',
      'acid_base'
    )
  );
