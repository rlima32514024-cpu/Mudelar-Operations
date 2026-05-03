import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInDays, addBusinessDays, isAfter } from 'date-fns'
import { pt } from 'date-fns/locale'
import { StartRiskLevel, GeneralStatus } from '@/types'

// ─── Tailwind class merger ────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date utilities ───────────────────────────────────────────────────────────

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy', { locale: pt })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: pt })
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function daysSince(date: string | null | undefined): number {
  if (!date) return 0
  return differenceInDays(new Date(), new Date(date))
}

/**
 * Calculates estimated completion date in business days (skipping weekends).
 */
export function calculateEstimatedCompletion(
  startDate: string | Date,
  businessDays: number
): Date {
  return addBusinessDays(new Date(startDate), businessDays)
}

/**
 * Calculates the delay in days between estimated and actual completion.
 * Positive = delayed, Negative = ahead of schedule, 0 = on time.
 */
export function calculateDelay(
  estimatedDate: string | null,
  actualDate: string | null
): number | null {
  if (!estimatedDate || !actualDate) return null
  return differenceInDays(new Date(actualDate), new Date(estimatedDate))
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false
  return isAfter(new Date(), new Date(date))
}

// ─── Risk level calculation ───────────────────────────────────────────────────

export function computeStartRiskLevel(
  daysSinceSignature: number,
  actualStartDate: string | null
): StartRiskLevel {
  if (actualStartDate) return 'started'
  if (daysSinceSignature < 30) return 'green'
  if (daysSinceSignature < 45) return 'yellow'
  if (daysSinceSignature < 60) return 'orange'
  if (daysSinceSignature < 90) return 'red'
  return 'critical'
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export function isActiveProject(status: GeneralStatus): boolean {
  return ['1_aguarda_atribuicao', '2_aguarda_retificacao', '3_aguarda_compras', '4_aguarda_arranque', '5_em_execucao'].includes(status)
}

export function isCompletedProject(status: GeneralStatus): boolean {
  return ['6_concluida', '7_fechada'].includes(status)
}

// ─── Contract number generator ────────────────────────────────────────────────

export function formatContractNumber(sequence: number): string {
  return `MD-${String(sequence).padStart(4, '0')}`
}

// ─── General helpers ──────────────────────────────────────────────────────────

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}
