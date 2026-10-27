import { z } from 'zod'

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = LoginInput & {
  fullName: string
}

export type SpaceCreateInput = {
  name: string
  description?: string
  capacity: number
  pricePerHour: number
  imageUrl?: string
  isActive?: boolean
}

export type SpaceUpdateInput = Partial<Omit<SpaceCreateInput, 'isActive'>>

export type SpaceIdInput = {
  id: string
}

export type BookingCreateInput = {
  spaceId: string
  startTime: string
  endTime: string
}

export type BookingIdInput = {
  id: string
}

export const emailSchema: z.ZodString = z
  .string()
  .trim()
  .min(1, 'El correo es obligatorio')
  .max(254, 'El correo es demasiado largo')
  .email('El correo no tiene un formato válido')

export const passwordSchema: z.ZodString = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')
  .max(72, 'La contraseña no puede superar 72 caracteres')

export const fullNameSchema: z.ZodString = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .max(100, 'El nombre no puede superar 100 caracteres')

export const loginSchema: z.ZodType<LoginInput> = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict()

export const registerSchema: z.ZodType<RegisterInput> = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    fullName: fullNameSchema,
  })
  .strict()

export const spaceCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional(),
    capacity: z.number().int().positive(),
    pricePerHour: z.number().int().positive(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

export const spaceUpdateSchema: z.ZodType<SpaceUpdateInput> = spaceCreateSchema
  .omit({ isActive: true })
  .partial()
  .strict()
  .refine(
    (space: SpaceUpdateInput): boolean => Object.keys(space).length > 0,
    { message: 'Debes enviar al menos un campo para actualizar' }
  )

export const spaceIdSchema: z.ZodType<SpaceIdInput> = z
  .object({
    id: z.string().uuid('El identificador del espacio no es válido'),
  })
  .strict()

export const bookingCreateSchema: z.ZodType<BookingCreateInput> = z
  .object({
    spaceId: z.string().uuid('El identificador del espacio no es válido'),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
  })
  .strict()

export const bookingIdSchema: z.ZodType<BookingIdInput> = z
  .object({
    id: z.string().uuid('El identificador de la reserva no es válido'),
  })
  .strict()
