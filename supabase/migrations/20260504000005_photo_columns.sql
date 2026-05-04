-- Colunas de fotos por fase e medições (uma foto principal por fase)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS initial_measurements_photos_url text,
  ADD COLUMN IF NOT EXISTS photos_phase_1_url text,
  ADD COLUMN IF NOT EXISTS photos_phase_2_url text,
  ADD COLUMN IF NOT EXISTS photos_phase_3_url text,
  ADD COLUMN IF NOT EXISTS photos_phase_4_url text;
