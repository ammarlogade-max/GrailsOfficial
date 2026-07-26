-- ============================================================================
-- Grail's Official - 0011_fix_audit_trigger_non_uuid_ids.sql
-- Audit triggers are shared by normal UUID tables and singleton CMS tables
-- whose primary key is boolean (`id = true`). Do not cast/log non-UUID IDs
-- into audit_logs.entity_id, otherwise updates to homepage_hero fail.
-- ============================================================================

create or replace function public.audit_trigger_fn()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name_col text := coalesce(TG_ARGV[0], 'name');
  v_entity_name text;
  v_actor_email text;
  v_actor_role text;
  v_changed_fields text[];
  v_raw_entity_id text;
  v_entity_id uuid;
begin
  v_entity_name := coalesce(to_jsonb(NEW) ->> v_name_col, to_jsonb(OLD) ->> v_name_col, TG_TABLE_NAME);
  v_raw_entity_id := coalesce(to_jsonb(NEW) ->> 'id', to_jsonb(OLD) ->> 'id');

  if v_raw_entity_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    v_entity_id := v_raw_entity_id::uuid;
  else
    v_entity_id := null;
  end if;

  select sm.email, r.id into v_actor_email, v_actor_role
  from public.staff_members sm join public.roles r on r.id = sm.role_id
  where sm.id = auth.uid();

  if TG_OP = 'UPDATE' then
    select array_agg(key) into v_changed_fields
    from jsonb_each(to_jsonb(NEW))
    where to_jsonb(NEW) -> key is distinct from to_jsonb(OLD) -> key
      and key not in ('updated_at');
  end if;

  insert into public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id, entity_name,
    old_values, new_values, changed_fields
  ) values (
    auth.uid(), coalesce(v_actor_email, 'system'), coalesce(v_actor_role, 'system'),
    case TG_OP when 'INSERT' then 'created' when 'UPDATE' then 'updated' when 'DELETE' then 'deleted' end,
    TG_TABLE_NAME, v_entity_id, v_entity_name,
    case when TG_OP != 'INSERT' then to_jsonb(OLD) else null end,
    case when TG_OP != 'DELETE' then to_jsonb(NEW) else null end,
    v_changed_fields
  );
  return coalesce(NEW, OLD);
end;
$$;
