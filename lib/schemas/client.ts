import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string().min(1, 'Nama client harus diisi'),
  company: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().uuid('ID client tidak valid'),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>