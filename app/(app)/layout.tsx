import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getToken, getSummoner } from "@/lib/auth"
import { fetchAuthorizedMenu } from "@/lib/services/keymaster"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { ExternalViewerProvider } from "@/components/external-viewer"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const token = await getToken()
  if (!token) redirect("/login")

  const menuResult = await fetchAuthorizedMenu(token)
  if (!menuResult.ok && menuResult.unauthorized) {
    // Token rechazado por Keymaster (firma inválida / expirado). Limpiamos la
    // cookie vía /logout para evitar un ciclo de redirecciones con el
    // middleware (que solo comprueba presencia + expiración del token).
    redirect("/logout")
  }

  const summoner = await getSummoner()
  const groups = menuResult.ok ? menuResult.groups : []

  // El nombre a mostrar proviene del summoner (Keymaster) y, como respaldo,
  // del payload del token.
  const summonerName = menuResult.ok
    ? [menuResult.summoner.nombre, menuResult.summoner.apellido].filter(Boolean).join(" ").trim()
    : ""
  const fallbackName = summoner
    ? [summoner.nombre, summoner.apellido].filter(Boolean).join(" ").trim()
    : ""
  const userName = summonerName || fallbackName || "Usuario"

  return (
    <ExternalViewerProvider>
      <div className="flex min-h-svh bg-background">
        <AppSidebar userName={userName} menu={groups} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav userName={userName} menu={groups} />
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </ExternalViewerProvider>
  )
}
