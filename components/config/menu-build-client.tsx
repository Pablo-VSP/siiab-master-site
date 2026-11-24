"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Menu as MenuIcon, X, Plus } from "lucide-react"
import type {
  MenuBuild,
  MenuPerfil,
  MenuMenu,
  MenuOptionRow,
} from "@/lib/services/keymaster-crud"
import {
  createMenuBuild,
  updateMenuBuild,
  deleteMenuBuild,
} from "@/app/actions/menu-admin"
import { CONFIG_PURPLE, CONFIG_PURPLE_TEXT } from "./config-ui"
import { ConfigModal, ConfigModalActions } from "./config-modal"

// -----------------------------------------------------------------------------
// MenuBuild: construcción del menú en 3 columnas maestro–detalle.
//
//   Menús (perfil)  ->  Secciones (menu_menu del perfil)  ->  Opciones
//
// Cada fila de `menu_build` une perfil + sección (menu_menu) + opción
// (menu_option). Una "sección" de un perfil es un menu_menu_id distinto dentro
// de los builds de ese perfil; sus "opciones" son los menu_option_id de los
// builds con ese perfil + esa sección.
//
//  - Badge del perfil   = nº de secciones distintas del perfil.
//  - Badge de la sección = nº de opciones de esa sección en el perfil.
//  - "x" en una sección  = borra TODOS los builds de esa sección en el perfil.
//  - "x" en una opción   = borra ese build puntual.
//  - "+" en Secciones    = agrega un menu_menu (nuevo build con una opción).
//  - "+" en Opciones     = agrega un menu_option a la sección (nuevo build).
//  - "Orden"             = sequence (opción) / menu_sequence (sección), editable.
// -----------------------------------------------------------------------------

interface SectionAgg {
  menuMenuId: number
  name: string
  menuSequence: number
  optionCount: number
}

export function MenuBuildClient({
  builds,
  perfiles,
  menus,
  options,
}: {
  builds: MenuBuild[]
  perfiles: MenuPerfil[]
  menus: MenuMenu[]
  options: MenuOptionRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [selectedPerfil, setSelectedPerfil] = useState<number | null>(
    perfiles[0]?.pk_id ?? null,
  )
  const [selectedSection, setSelectedSection] = useState<number | null>(null)

  // Modal para "+": agregar sección o agregar opción.
  const [addMode, setAddMode] = useState<"section" | "option" | null>(null)
  const [pickMenu, setPickMenu] = useState("")
  const [pickOption, setPickOption] = useState("")

  const menuName = (id: number) =>
    menus.find((m) => m.pk_id === id)?.name ?? `#${id}`
  const optionName = (id: number) =>
    options.find((o) => o.pk_id === id)?.name ?? `#${id}`

  // Secciones (menu_menu distintos) del perfil seleccionado.
  const sections: SectionAgg[] = useMemo(() => {
    if (selectedPerfil == null) return []
    const map = new Map<number, SectionAgg>()
    for (const b of builds) {
      if (b.menu_id !== selectedPerfil) continue
      const cur = map.get(b.menu_menu_id)
      if (cur) {
        cur.optionCount += 1
      } else {
        map.set(b.menu_menu_id, {
          menuMenuId: b.menu_menu_id,
          name: b.menu_menu?.name ?? menuName(b.menu_menu_id),
          menuSequence: b.menu_sequence,
          optionCount: 1,
        })
      }
    }
    return [...map.values()].sort(
      (a, b) => a.menuSequence - b.menuSequence || a.name.localeCompare(b.name),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builds, selectedPerfil])

  // Builds (opciones) de la sección seleccionada en el perfil seleccionado.
  const sectionBuilds = useMemo(() => {
    if (selectedPerfil == null || selectedSection == null) return []
    return builds
      .filter(
        (b) => b.menu_id === selectedPerfil && b.menu_menu_id === selectedSection,
      )
      .sort((a, b) => a.sequence - b.sequence)
  }, [builds, selectedPerfil, selectedSection])

  // nº de secciones por perfil (para el badge de la primera columna).
  const sectionCountByPerfil = useMemo(() => {
    const m = new Map<number, Set<number>>()
    for (const b of builds) {
      if (!m.has(b.menu_id)) m.set(b.menu_id, new Set())
      m.get(b.menu_id)!.add(b.menu_menu_id)
    }
    return m
  }, [builds])

  function selectPerfil(id: number) {
    setSelectedPerfil(id)
    setSelectedSection(null)
    setError(null)
  }

  // Opciones ya presentes en la sección seleccionada (para no duplicar en el +).
  const optionsInSection = new Set(sectionBuilds.map((b) => b.menu_option_id))
  // Secciones (menu_menu) que aún no están en el perfil.
  const menusNotInPerfil = menus.filter(
    (m) => !sections.some((s) => s.menuMenuId === m.pk_id),
  )
  const availableOptions = options.filter((o) => !optionsInSection.has(o.pk_id))

  function openAddSection() {
    setAddMode("section")
    setPickMenu("")
    setPickOption("")
    setError(null)
  }

  function openAddOption() {
    if (selectedSection == null) return
    setAddMode("option")
    setPickOption("")
    setError(null)
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault()
    if (selectedPerfil == null) return
    setError(null)

    if (addMode === "section") {
      // Un menu_menu solo existe en el build si tiene al menos una opción.
      if (!pickMenu || !pickOption) {
        setError("Elige la sección y una primera opción.")
        return
      }
      const nextMenuSeq =
        sections.reduce((max, s) => Math.max(max, s.menuSequence), 0) + 1
      startTransition(async () => {
        const r = await createMenuBuild({
          menu_id: selectedPerfil,
          menu_menu_id: Number(pickMenu),
          menu_option_id: Number(pickOption),
          sequence: 1,
          menu_sequence: nextMenuSeq,
          active: 1,
        })
        if (!r.ok) setError(r.error ?? "Error")
        else {
          setAddMode(null)
          setSelectedSection(Number(pickMenu))
          router.refresh()
        }
      })
    } else if (addMode === "option") {
      if (!pickOption || selectedSection == null) {
        setError("Elige una opción.")
        return
      }
      const section = sections.find((s) => s.menuMenuId === selectedSection)
      const nextSeq = sectionBuilds.reduce((max, b) => Math.max(max, b.sequence), 0) + 1
      startTransition(async () => {
        const r = await createMenuBuild({
          menu_id: selectedPerfil,
          menu_menu_id: selectedSection,
          menu_option_id: Number(pickOption),
          sequence: nextSeq,
          menu_sequence: section?.menuSequence ?? 1,
          active: 1,
        })
        if (!r.ok) setError(r.error ?? "Error")
        else {
          setAddMode(null)
          router.refresh()
        }
      })
    }
  }

  function removeSection(menuMenuId: number) {
    const toDelete = builds.filter(
      (b) => b.menu_id === selectedPerfil && b.menu_menu_id === menuMenuId,
    )
    startTransition(async () => {
      for (const b of toDelete) {
        const r = await deleteMenuBuild(b.pk_id)
        if (!r.ok) {
          setError(r.error ?? "Error")
          return
        }
      }
      if (selectedSection === menuMenuId) setSelectedSection(null)
      router.refresh()
    })
  }

  function removeOption(buildPk: number) {
    startTransition(async () => {
      const r = await deleteMenuBuild(buildPk)
      if (!r.ok) setError(r.error ?? "Error")
      else router.refresh()
    })
  }

  function changeSectionOrder(menuMenuId: number, value: number) {
    const toUpdate = builds.filter(
      (b) => b.menu_id === selectedPerfil && b.menu_menu_id === menuMenuId,
    )
    startTransition(async () => {
      for (const b of toUpdate) {
        const r = await updateMenuBuild(b.pk_id, { menu_sequence: value })
        if (!r.ok) {
          setError(r.error ?? "Error")
          return
        }
      }
      router.refresh()
    })
  }

  function changeOptionOrder(buildPk: number, value: number) {
    startTransition(async () => {
      const r = await updateMenuBuild(buildPk, { sequence: value })
      if (!r.ok) setError(r.error ?? "Error")
      else router.refresh()
    })
  }

  const selectedPerfilName =
    perfiles.find((p) => p.pk_id === selectedPerfil)?.name ?? ""
  const selectedSectionName =
    selectedSection != null ? menuName(selectedSection) : ""

  return (
    <div>
      <h1
        className="mb-6 text-2xl font-bold tracking-tight"
        style={{ color: CONFIG_PURPLE_TEXT }}
      >
        Construcción del menú
      </h1>

      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Columna 1: Menús (perfiles) */}
        <Column title="Menús">
          <div className="divide-y divide-border">
            {perfiles.map((p) => {
              const count = sectionCountByPerfil.get(p.pk_id)?.size ?? 0
              const active = p.pk_id === selectedPerfil
              return (
                <button
                  key={p.pk_id}
                  type="button"
                  onClick={() => selectPerfil(p.pk_id)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                    active ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <MenuIcon className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                  </span>
                  <CountBadge n={count} />
                </button>
              )
            })}
          </div>
        </Column>

        {/* Columna 2: Secciones del perfil */}
        <Column
          title="Secciones"
          subtitle={selectedPerfilName}
          onAdd={selectedPerfil != null ? openAddSection : undefined}
        >
          {selectedPerfil == null ? (
            <Hint>Selecciona un menú.</Hint>
          ) : sections.length === 0 ? (
            <Hint>Sin secciones. Usa “+” para agregar.</Hint>
          ) : (
            <div className="divide-y divide-border">
              {sections.map((s) => {
                const active = s.menuMenuId === selectedSection
                return (
                  <div
                    key={s.menuMenuId}
                    className={`flex items-center justify-between gap-2 px-4 py-3 ${
                      active ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSection(s.menuMenuId)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {s.name}
                      </p>
                      <OrderInput
                        value={s.menuSequence}
                        onCommit={(v) => changeSectionOrder(s.menuMenuId, v)}
                        disabled={isPending}
                      />
                    </button>
                    <CountBadge n={s.optionCount} />
                    <RemoveBtn
                      onClick={() => removeSection(s.menuMenuId)}
                      disabled={isPending}
                      title={`Quitar sección ${s.name}`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </Column>

        {/* Columna 3: Opciones de la sección */}
        <Column
          title="Opciones"
          subtitle={selectedSectionName}
          onAdd={selectedSection != null ? openAddOption : undefined}
        >
          {selectedSection == null ? (
            <Hint>Selecciona una sección.</Hint>
          ) : sectionBuilds.length === 0 ? (
            <Hint>Sin opciones. Usa “+” para agregar.</Hint>
          ) : (
            <div className="divide-y divide-border">
              {sectionBuilds.map((b) => (
                <div
                  key={b.pk_id}
                  className="flex items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {b.menu_option?.name ?? optionName(b.menu_option_id)}
                    </p>
                    <OrderInput
                      value={b.sequence}
                      onCommit={(v) => changeOptionOrder(b.pk_id, v)}
                      disabled={isPending}
                    />
                  </div>
                  <RemoveBtn
                    onClick={() => removeOption(b.pk_id)}
                    disabled={isPending}
                    title="Quitar opción"
                  />
                </div>
              ))}
            </div>
          )}
        </Column>
      </div>

      {/* Modal "+" */}
      <ConfigModal
        open={addMode !== null}
        onClose={() => setAddMode(null)}
        title={addMode === "section" ? "Agregar sección" : "Agregar opción"}
      >
        <form onSubmit={submitAdd} className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          {addMode === "section" && (
            <>
              <PickField label="Sección (submenú)" htmlFor="pick-menu">
                <select
                  id="pick-menu"
                  value={pickMenu}
                  onChange={(e) => setPickMenu(e.target.value)}
                  required
                  className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
                >
                  <option value="">Seleccionar submenú</option>
                  {menusNotInPerfil.map((m) => (
                    <option key={m.pk_id} value={m.pk_id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </PickField>
              <PickField label="Primera opción" htmlFor="pick-option-s">
                <select
                  id="pick-option-s"
                  value={pickOption}
                  onChange={(e) => setPickOption(e.target.value)}
                  required
                  className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
                >
                  <option value="">Seleccionar opción</option>
                  {options.map((o) => (
                    <option key={o.pk_id} value={o.pk_id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </PickField>
            </>
          )}

          {addMode === "option" && (
            <PickField label="Opción" htmlFor="pick-option">
              <select
                id="pick-option"
                value={pickOption}
                onChange={(e) => setPickOption(e.target.value)}
                required
                className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
              >
                <option value="">Seleccionar opción</option>
                {availableOptions.map((o) => (
                  <option key={o.pk_id} value={o.pk_id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </PickField>
          )}

          <ConfigModalActions
            onCancel={() => setAddMode(null)}
            submitLabel="Agregar"
            pending={isPending}
          />
        </form>
      </ConfigModal>
    </div>
  )
}

function Column({
  title,
  subtitle,
  onAdd,
  children,
}: {
  title: string
  subtitle?: string
  onAdd?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: CONFIG_PURPLE }}
      >
        <h2 className="text-sm font-semibold">
          {title}
          {subtitle ? (
            <span className="ml-2 font-normal text-white/70">({subtitle})</span>
          ) : null}
        </h2>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Agregar en ${title}`}
            title={`Agregar en ${title}`}
            className="inline-flex size-6 items-center justify-center rounded-full text-white hover:bg-white/20"
          >
            <Plus className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="max-h-[520px] overflow-y-auto">{children}</div>
    </div>
  )
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {n}
    </span>
  )
}

function RemoveBtn({
  onClick,
  disabled,
  title,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      title={title}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
      style={{ backgroundColor: CONFIG_PURPLE }}
    >
      <X className="size-3.5" />
    </button>
  )
}

function OrderInput({
  value,
  onCommit,
  disabled,
}: {
  value: number
  onCommit: (v: number) => void
  disabled?: boolean
}) {
  const [local, setLocal] = useState(String(value))
  return (
    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
      Orden:
      <input
        type="number"
        min={0}
        value={local}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const n = Number(local)
          if (!Number.isNaN(n) && n !== value) onCommit(n)
        }}
        className="w-12 rounded border border-border bg-card px-1 py-0.5 text-xs text-foreground outline-none"
      />
    </span>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-sm text-muted-foreground">{children}</p>
}

function PickField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
