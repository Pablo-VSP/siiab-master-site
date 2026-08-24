import { getStore } from "./store"

// Datos seed del portal. Se ejecuta una sola vez si la tabla de usuarios
// está vacía (base de datos recién creada). Al bakear los datos aquí, un
// clon nuevo del repositorio reconstruye el catálogo automáticamente sin
// necesidad de versionar el archivo binario portal.db.

function seedHash(password: string): string {
  return `plain:${password}`
}

// Catálogo de proyectos. `logoUrl` apunta a public/logos/*.png
const PROJECTS: Array<{ name: string; description: string; logoUrl: string }> = [
  { name: "Agente IA", description: "", logoUrl: "/logos/Logos_Agente IA.png" },
  { name: "Ahorrobus", description: "", logoUrl: "/logos/Logos_Ahorrobus.png" },
  { name: "AVA", description: "", logoUrl: "/logos/Logos_AVA.png" },
  { name: "CAN", description: "", logoUrl: "/logos/Logos_CAN.png" },
  { name: "CONDUSAT", description: "", logoUrl: "/logos/Logos_CONDUSAT.png" },
  { name: "LAE", description: "", logoUrl: "/logos/Logos_LAE.png" },
  { name: "MyTools", description: "MyTools", logoUrl: "/logos/Logos_MyTools.png" },
  { name: "PLAT", description: "", logoUrl: "/logos/Logos_PLAT.png" },
  { name: "Prepago", description: "", logoUrl: "/logos/Logos_Prepago.png" },
  { name: "SAE Comercial", description: "", logoUrl: "/logos/Logos_SAE Comercial.png" },
  { name: "SAE Interno", description: "", logoUrl: "/logos/Logos_SAE Interno.png" },
  { name: "SIA", description: "", logoUrl: "/logos/Logos_SIA.png" },
  { name: "SIM", description: "", logoUrl: "/logos/Logos_SIM.png" },
  { name: "SIT", description: "Sistema Integral de Tarifas", logoUrl: "/logos/Logos_SIT.png" },
  { name: "SIVA", description: "", logoUrl: "/logos/Logos_SIVA.png" },
  { name: "SPOTS", description: "", logoUrl: "/logos/Logos_SPOTS.png" },
  { name: "TEPER", description: "", logoUrl: "/logos/Logos_TEPER.png" },
  { name: "Telemetría", description: "Telemetría a bordo", logoUrl: "/logos/Logos_Telemetría.png" },
  { name: "Torre de control", description: "", logoUrl: "/logos/Logos_Torre de control.png" },
  { name: "Tu Viaje ADO", description: "", logoUrl: "/logos/Logos_Tu Viaje ADO.png" },
  { name: "VMD", description: "", logoUrl: "/logos/Logos_VMD.png" },
]

// Recursos (sitios y reportes) asociados a cada proyecto por nombre.
const RESOURCES: Array<{
  projectName: string
  title: string
  type: "site" | "report"
  url: string
  description: string
}> = [
  {
    projectName: "MyTools",
    title: "MyTools",
    type: "site",
    url: "https://mytools.siiab.app/login",
    description: "Sitio de MyTools Productivo",
  },
  {
    projectName: "SIT",
    title: "SIT",
    type: "site",
    url: "http://sitv3.ado.net/",
    description: "Sitio de SIT Productivo",
  },
  {
    projectName: "Telemetría",
    title: "Gasto MB Starlink",
    type: "report",
    url: "https://datastudio.google.com/embed/reporting/bed2a1d5-6a8b-432c-8418-8c5af64617e2/page/p_r8lkddeg6d",
    description: "Gasto de envío de información Telemetría y TuViajeADO",
  },
  {
    projectName: "Telemetría",
    title: "Monitoreo Viajes Telemetría",
    type: "report",
    url: "https://datastudio.google.com/embed/reporting/a7365a4e-7a2d-4667-98f4-ffb993848dec/page/qlD",
    description: "Monitoreo de viajes de Telemetría y TuViajeADO",
  },
  {
    projectName: "Telemetría",
    title: "Telemetría",
    type: "site",
    url: "https://telemetriat2.siiab.dev/Account/Login?ReturnUrl=%2F",
    description: "Sitio de Telemetría Productivo",
  },
]

export async function seedIfEmpty(): Promise<void> {
  const store = getStore()
  const existing = await store.listUsers()
  if (existing.length > 0) return // Ya tiene datos, no hacemos nada.

  console.log("[seed] Base de datos vacía, insertando datos iniciales...")

  // ---- Usuarios ----
  await store.createUser({
    name: "Ana Admin",
    email: "admin@portal.com",
    passwordHash: seedHash("admin123"),
    role: "admin",
    hireDate: "2020-01-15",
  })
  await store.createUser({
    name: "Beto Encargado",
    email: "encargado@portal.com",
    passwordHash: seedHash("encargado123"),
    role: "approver",
    hireDate: "2021-03-10",
  })
  const employee = await store.createUser({
    name: "Carla Empleada",
    email: "empleado@portal.com",
    passwordHash: seedHash("empleado123"),
    role: "employee",
    hireDate: "2022-06-01",
  })

  // ---- Proyectos ----
  for (const p of PROJECTS) {
    await store.createProject(p)
  }

  // Mapa nombre -> id para vincular recursos.
  const projects = await store.listProjects()
  const projectIdByName = new Map(projects.map((p) => [p.name, p.id]))

  // ---- Recursos ----
  for (const r of RESOURCES) {
    const projectId = projectIdByName.get(r.projectName)
    if (!projectId) {
      console.warn(`[seed] Proyecto no encontrado para recurso "${r.title}": ${r.projectName}`)
      continue
    }
    await store.createResource({
      projectId,
      title: r.title,
      type: r.type,
      url: r.url,
      description: r.description,
    })
  }

  // ---- Solicitud de vacaciones de ejemplo ----
  await store.createVacationRequest({
    userId: employee.id,
    employeeName: employee.name,
    hireDate: employee.hireDate,
    startDate: "2026-09-01",
    endDate: "2026-09-10",
    delegateName: "Beto Encargado",
    delegateProject: "SIT",
    delegateActivity: "Atención de solicitudes y monitoreo diario.",
  })

  console.log("[seed] Datos iniciales insertados correctamente.")
}
