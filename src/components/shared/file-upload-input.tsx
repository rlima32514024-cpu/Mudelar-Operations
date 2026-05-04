'use client'

import { useState } from 'react'
import { Paperclip, Loader2, CheckCircle2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FileUploadInputProps {
  name: string
  storagePath: string
  accept?: string
  label: string
  existingUrl?: string | null
  required?: boolean
}

export function FileUploadInput({
  name,
  storagePath,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
  label,
  existingUrl,
  required,
}: FileUploadInputProps) {
  const [url, setUrl] = useState(existingUrl ?? '')
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${storagePath}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('project-documents')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data } = supabase.storage.from('project-documents').getPublicUrl(path)
      setUrl(data.publicUrl)
      setFileName(file.name)
    } catch (err) {
      setError('Erro no upload. Tenta novamente.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  function handleClear() {
    setUrl('')
    setFileName('')
    setError('')
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-green-200 bg-green-50 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-sm text-green-700 truncate flex-1">
            {fileName || 'Ficheiro carregado'}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-500 shrink-0" />
          ) : (
            <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
          )}
          <span className="text-sm text-gray-500">
            {uploading ? 'A carregar...' : 'Seleccionar ficheiro'}
          </span>
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
