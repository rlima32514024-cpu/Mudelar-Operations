-- ─── Grants para PostgREST / service_role ─────────────────────────────────────
-- As migrações personalizadas não recebem grants automáticos do Supabase.
-- Este ficheiro restaura os grants padrão que o dashboard aplicaria.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO service_role;

GRANT SELECT                        ON ALL TABLES    IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES   IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT                 ON ALL SEQUENCES IN SCHEMA public TO authenticated;
