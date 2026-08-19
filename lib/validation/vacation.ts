import { z } from "zod"

// Esquema compartido (cliente y servidor) para la solicitud de vacaciones.
export const vacationRequestSchema = z
  .object({
    employeeName: z.string().min(2, "Ingresa el nombre completo"),
    hireDate: z.string().min(1, "Ingresa la fecha de contratación"),
    startDate: z.string().min(1, "Ingresa la fecha de inicio"),
    endDate: z.string().min(1, "Ingresa la fecha de fin"),
    delegateName: z.string().min(2, "Ingresa el nombre del delegado"),
    delegateProject: z.string().min(2, "Ingresa el proyecto delegado"),
    delegateActivity: z
      .string()
      .min(10, "Describe la actividad específica delegada (mín. 10 caracteres)"),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "La fecha de fin debe ser posterior o igual a la de inicio",
    path: ["endDate"],
  })

export type VacationRequestInput = z.infer<typeof vacationRequestSchema>

export const rejectSchema = z.object({
  reason: z.string().min(5, "Indica el motivo del rechazo (mín. 5 caracteres)"),
})
