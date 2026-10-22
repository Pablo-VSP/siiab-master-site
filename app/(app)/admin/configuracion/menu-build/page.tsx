import { requireRole } from "@/lib/auth"
import {
  loadMenuBuilds,
  loadMenuPerfiles,
  loadMenuMenus,
  loadMenuOptions,
} from "@/lib/services/menu-admin-data"
import { MenuBuildClient } from "@/components/config/menu-build-client"

export const metadata = { title: "MenuBuild · Configuración" }

export default async function MenuBuildPage() {
  await requireRole("admin")
  const [builds, perfiles, menus, options] = await Promise.all([
    loadMenuBuilds(),
    loadMenuPerfiles(),
    loadMenuMenus(),
    loadMenuOptions(),
  ])
  return (
    <div className="mx-auto max-w-6xl">
      <MenuBuildClient
        builds={builds}
        perfiles={perfiles}
        menus={menus}
        options={options}
      />
    </div>
  )
}
