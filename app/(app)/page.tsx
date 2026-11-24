import { getToken, requireUser } from "@/lib/auth"
import { fetchAuthorizedMenu } from "@/lib/services/keymaster"
import { HomeProjects } from "@/components/home-projects"

export const metadata = { title: "Inicio" }

export default async function DashboardPage() {
  const user = await requireUser()

  // Los proyectos son las secciones del menú autorizado de Keymaster, ya
  // filtradas por los permisos del usuario del token. Si Keymaster no responde,
  // la lista queda vacía y la UI lo indica.
  const token = await getToken()
  const result = token ? await fetchAuthorizedMenu(token) : null
  const groups = result?.ok ? result.groups : []

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Hola, {user.name.split(" ")[0]}
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Tus sistemas
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground text-pretty">
          Elige un sistema para ver sus reportes, sitios y herramientas.
        </p>
      </header>

      <HomeProjects menu={groups} />
    </div>
  )
}
