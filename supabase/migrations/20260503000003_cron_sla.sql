-- Automação 16: SLA Monitor via pg_cron + pg_net
-- Chama a Edge Function sla-monitor todos os dias às 8:00 UTC

-- Requer as extensões pg_cron e pg_net (já ativas no Supabase)
create extension if not exists pg_net;

-- Configurar as credenciais via Supabase Dashboard → Settings → Vault
-- ou via SQL:
--   select vault.create_secret('https://<project>.supabase.co', 'supabase_url');
--   select vault.create_secret('<service-role-key>', 'supabase_service_role_key');
--
-- Alternativa: configurar o cron no Dashboard → Edge Functions → sla-monitor → Schedule

select cron.schedule(
  'sla-monitor-daily',      -- nome único do job
  '0 8 * * *',              -- todos os dias às 08:00 UTC
  $$
  select
    net.http_post(
      url        := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/sla-monitor',
      headers    := jsonb_build_object(
                     'Content-Type', 'application/json',
                     'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key')
                   ),
      body       := '{}'::jsonb,
      timeout_milliseconds := 10000
    ) as request_id;
  $$
);
