-- ─── Phase 7: Notifications, Audit Log, Contract Sequence ────────────────────

-- 1. Sequence for MD-XXXX contract numbers
create sequence if not exists contract_number_seq start 1;

create or replace function get_next_contract_number()
returns text
language plpgsql security definer as $$
begin
  return 'MD-' || lpad(nextval('contract_number_seq')::text, 4, '0');
end;
$$;

-- 2. Project Audit Log ─────────────────────────────────────────────────────────

create table if not exists project_audit_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  user_name text,
  action text not null,
  details jsonb,
  created_at timestamptz default now() not null
);

create index if not exists project_audit_log_project_id_idx
  on project_audit_log(project_id);

create index if not exists project_audit_log_created_at_idx
  on project_audit_log(created_at desc);

alter table project_audit_log enable row level security;

create policy "Authenticated users can insert audit logs"
  on project_audit_log for insert
  to authenticated
  with check (true);

create policy "Authenticated users can read audit logs"
  on project_audit_log for select
  to authenticated
  using (true);

-- 3. Notifications ─────────────────────────────────────────────────────────────

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_role text not null,
  message text not null,
  action_type text not null,
  link_url text,
  project_id uuid references projects(id) on delete set null,
  read_by uuid[] default '{}',
  created_at timestamptz default now() not null
);

create index if not exists notifications_recipient_role_idx
  on notifications(recipient_role);

create index if not exists notifications_created_at_idx
  on notifications(created_at desc);

alter table notifications enable row level security;

create policy "Users read their role notifications"
  on notifications for select
  to authenticated
  using (recipient_role = get_user_role() or recipient_role = 'all');

create policy "Users can mark notifications read"
  on notifications for update
  to authenticated
  using (recipient_role = get_user_role() or recipient_role = 'all')
  with check (true);

-- Safe array-append (avoids duplicate read markers)
create or replace function mark_notification_read(p_notification_id uuid)
returns void
language sql security definer as $$
  update notifications
  set read_by = array_append(read_by, auth.uid())
  where id = p_notification_id
    and not (auth.uid() = any(read_by));
$$;
