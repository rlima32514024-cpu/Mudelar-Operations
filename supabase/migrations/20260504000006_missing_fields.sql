ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS notas_iniciais text,
  ADD COLUMN IF NOT EXISTS project_documents_url text;
