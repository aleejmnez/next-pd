'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Pencil, Plus, Power } from 'lucide-react'
import Link from 'next/link'
import {
  spaceCreateSchema,
  spaceUpdateSchema,
  type SpaceCreateInput,
} from '@/lib/validations'

type SpaceRecord = {
  id: string
  name: string
  description: string | null
  capacity: number
  pricePerHour: number
  imageUrl: string | null
  isActive: boolean
}

type SpaceFormValues = {
  name: string
  description: string
  capacity: string
  pricePerHour: string
  imageUrl: string
}

const emptyForm: SpaceFormValues = {
  name: '',
  description: '',
  capacity: '1',
  pricePerHour: '',
  imageUrl: '',
}

const priceFormatter: Intl.NumberFormat = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseSpace(value: unknown): SpaceRecord | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    (value.description !== null && typeof value.description !== 'string') ||
    typeof value.capacity !== 'number' ||
    typeof value.pricePerHour !== 'number' ||
    (value.imageUrl !== null && typeof value.imageUrl !== 'string') ||
    typeof value.isActive !== 'boolean'
  ) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    description: value.description,
    capacity: value.capacity,
    pricePerHour: value.pricePerHour,
    imageUrl: value.imageUrl,
    isActive: value.isActive,
  }
}

function parseSpaces(value: unknown): SpaceRecord[] | null {
  if (!isRecord(value) || !Array.isArray(value.spaces)) return null

  const spaces: SpaceRecord[] = []
  for (const item of value.spaces) {
    const space: SpaceRecord | null = parseSpace(item)
    if (!space) return null
    spaces.push(space)
  }

  return spaces
}

function getErrorMessage(value: unknown, fallback: string): string {
  if (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.message === 'string'
  ) {
    return value.error.message
  }

  return fallback
}

function createInput(form: SpaceFormValues): SpaceCreateInput {
  return {
    name: form.name,
    description: form.description.trim() || undefined,
    capacity: Number(form.capacity),
    pricePerHour: Number(form.pricePerHour),
    imageUrl: form.imageUrl.trim() || undefined,
  }
}

export function SpaceManagementPanel() {
  const [spaces, setSpaces] = useState<SpaceRecord[]>([])
  const [form, setForm] = useState<SpaceFormValues>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [busySpaceId, setBusySpaceId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const abortController: AbortController = new AbortController()

    async function loadSpaces(): Promise<void> {
      try {
        const response = await fetch('/api/spaces?includeInactive=true', {
          signal: abortController.signal,
        })
        const payload: unknown = await response.json()

        if (!response.ok) {
          throw new Error(getErrorMessage(payload, 'No se pudieron cargar los espacios'))
        }

        const parsedSpaces: SpaceRecord[] | null = parseSpaces(payload)
        if (!parsedSpaces) throw new Error('El servidor devolvió datos de espacios no válidos')

        setSpaces(parsedSpaces)
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        const message: string = error instanceof Error
          ? error.message
          : 'No se pudieron cargar los espacios'
        setErrorMessage(message)
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false)
      }
    }

    void loadSpaces()
    return () => abortController.abort()
  }, [])

  function startEditing(space: SpaceRecord): void {
    setEditingId(space.id)
    setForm({
      name: space.name,
      description: space.description ?? '',
      capacity: String(space.capacity),
      pricePerHour: String(space.pricePerHour),
      imageUrl: space.imageUrl ?? '',
    })
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  function resetForm(): void {
    setEditingId(null)
    setForm(emptyForm)
    setErrorMessage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const input: SpaceCreateInput = createInput(form)
    const validation = editingId
      ? spaceUpdateSchema.safeParse(input)
      : spaceCreateSchema.safeParse(input)

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message ?? 'Revisa los datos del espacio')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(
        editingId ? `/api/spaces/${editingId}` : '/api/spaces',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validation.data),
        }
      )
      const payload: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'No se pudo guardar el espacio'))
      }

      const savedSpace: SpaceRecord | null =
        isRecord(payload) ? parseSpace(payload.space) : null
      if (!savedSpace) throw new Error('El servidor devolvió un espacio no válido')

      setSpaces((currentSpaces: SpaceRecord[]): SpaceRecord[] => {
        const nextSpaces: SpaceRecord[] = editingId
          ? currentSpaces.map((space: SpaceRecord): SpaceRecord =>
              space.id === savedSpace.id ? savedSpace : space
            )
          : [...currentSpaces, savedSpace]
        return nextSpaces.sort((first: SpaceRecord, second: SpaceRecord): number =>
          first.name.localeCompare(second.name, 'es')
        )
      })
      setSuccessMessage(editingId ? 'Espacio actualizado.' : 'Espacio creado.')
      setEditingId(null)
      setForm(emptyForm)
    } catch (error: unknown) {
      const message: string = error instanceof Error
        ? error.message
        : 'No se pudo guardar el espacio'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeactivate(space: SpaceRecord): Promise<void> {
    const confirmed: boolean = window.confirm(`¿Desactivar ${space.name}?`)
    if (!confirmed) return

    setBusySpaceId(space.id)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/spaces/${space.id}`, { method: 'DELETE' })
      const payload: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'No se pudo desactivar el espacio'))
      }

      const deactivatedSpace: SpaceRecord | null =
        isRecord(payload) ? parseSpace(payload.space) : null
      if (!deactivatedSpace) throw new Error('El servidor devolvió un espacio no válido')

      setSpaces((currentSpaces: SpaceRecord[]): SpaceRecord[] =>
        currentSpaces.map((item: SpaceRecord): SpaceRecord =>
          item.id === deactivatedSpace.id ? deactivatedSpace : item
        )
      )
      setSuccessMessage('Espacio desactivado; el registro se conservó.')
    } catch (error: unknown) {
      const message: string = error instanceof Error
        ? error.message
        : 'No se pudo desactivar el espacio'
      setErrorMessage(message)
    } finally {
      setBusySpaceId(null)
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-8 flex flex-col gap-5 border-b border-emerald-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            CoSpace / Administración
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Gestión de espacios</h1>
          <p className="mt-2 text-sm text-slate-600">
            Crea espacios, actualiza sus datos y desactiva los que ya no estén disponibles.
          </p>
        </div>
        <Link
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
          href="/spaces"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Volver a Espacios
        </Link>
      </header>

      {errorMessage ? (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          {successMessage}
        </p>
      ) : null}

      <div className="grid items-start gap-10 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.6fr)]">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              {editingId ? 'Editar espacio' : 'Crear espacio'}
            </h2>
            {editingId ? (
              <button
                className="text-xs font-medium text-slate-600 hover:text-emerald-800"
                onClick={resetForm}
                type="button"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>

          <label className="block text-xs font-medium text-slate-700" htmlFor="space-name">
            Nombre
            <input
              className="mt-1.5 h-10 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              id="space-name"
              maxLength={120}
              onChange={(event) => setForm((current: SpaceFormValues) => ({ ...current, name: event.target.value }))}
              required
              value={form.name}
            />
          </label>

          <label className="block text-xs font-medium text-slate-700" htmlFor="space-description">
            Descripción
            <textarea
              className="mt-1.5 min-h-24 w-full resize-y rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              id="space-description"
              maxLength={2000}
              onChange={(event) => setForm((current: SpaceFormValues) => ({ ...current, description: event.target.value }))}
              value={form.description}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-700" htmlFor="space-capacity">
              Capacidad
              <input
                className="mt-1.5 h-10 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                id="space-capacity"
                min={1}
                onChange={(event) => setForm((current: SpaceFormValues) => ({ ...current, capacity: event.target.value }))}
                required
                step={1}
                type="number"
                value={form.capacity}
              />
            </label>
            <label className="block text-xs font-medium text-slate-700" htmlFor="space-price">
              COP por hora
              <input
                className="mt-1.5 h-10 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                id="space-price"
                min={1}
                onChange={(event) => setForm((current: SpaceFormValues) => ({ ...current, pricePerHour: event.target.value }))}
                required
                step={1}
                type="number"
                value={form.pricePerHour}
              />
            </label>
          </div>

          <label className="block text-xs font-medium text-slate-700" htmlFor="space-image">
            URL de imagen (opcional)
            <input
              className="mt-1.5 h-10 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              id="space-image"
              onChange={(event) => setForm((current: SpaceFormValues) => ({ ...current, imageUrl: event.target.value }))}
              type="url"
              value={form.imageUrl}
            />
          </label>

          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            type="submit"
          >
            {editingId ? <Check aria-hidden="true" className="h-4 w-4" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
            {isSaving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear espacio'}
          </button>
        </form>

        <section aria-labelledby="spaces-list-title" className="min-w-0">
          <div className="mb-3 flex items-center justify-between border-b border-emerald-200 pb-3">
            <h2 className="text-base font-semibold text-slate-900" id="spaces-list-title">Espacios</h2>
            <span className="text-xs text-slate-600">
              {isLoading ? 'Cargando…' : `${spaces.length} registros`}
            </span>
          </div>

          {isLoading ? (
            <p aria-live="polite" className="py-8 text-sm text-slate-600">Cargando espacios…</p>
          ) : spaces.length === 0 ? (
            <p className="py-8 text-sm text-slate-600">Todavía no hay espacios.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-152 border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-200 text-xs text-slate-600">
                    <th className="py-3 pr-4 font-medium">Espacio</th>
                    <th className="py-3 pr-4 font-medium">Capacidad</th>
                    <th className="py-3 pr-4 font-medium">COP / hora</th>
                    <th className="py-3 pr-4 font-medium">Estado</th>
                    <th className="py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {spaces.map((space: SpaceRecord) => (
                    <tr className="border-b border-emerald-100" key={space.id}>
                      <td className="max-w-64 py-3 pr-4">
                        <p className="truncate font-medium text-slate-900">{space.name}</p>
                        {space.description ? (
                          <p className="mt-1 truncate text-xs text-slate-600">{space.description}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{space.capacity}</td>
                      <td className="py-3 pr-4 text-slate-700">{priceFormatter.format(space.pricePerHour)}</td>
                      <td className="py-3 pr-4">
                        <span className={space.isActive ? 'text-emerald-800' : 'text-slate-600'}>
                          {space.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            aria-label={`Editar ${space.name}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-2.5 text-xs text-emerald-800 hover:bg-emerald-50"
                            onClick={() => startEditing(space)}
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          {space.isActive ? (
                            <button
                              aria-label={`Desactivar ${space.name}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 text-xs text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={busySpaceId === space.id}
                              onClick={() => handleDeactivate(space)}
                              type="button"
                            >
                              <Power aria-hidden="true" className="h-3.5 w-3.5" />
                              {busySpaceId === space.id ? 'Desactivando…' : 'Desactivar'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
