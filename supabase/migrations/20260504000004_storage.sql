-- ─── Supabase Storage: bucket para documentos de obra ────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  true,
  20971520,   -- 20 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Qualquer utilizador autenticado pode fazer upload
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-documents');

-- Ficheiros são públicos para leitura
CREATE POLICY "Public read for project documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-documents');

-- Utilizadores autenticados podem apagar os seus próprios ficheiros
CREATE POLICY "Authenticated users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-documents');
