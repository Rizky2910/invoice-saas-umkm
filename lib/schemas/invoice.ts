import { z } from 'zod'

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Deskripsi item harus diisi'),
  quantity: z.number().min(0.01, 'Quantity harus lebih dari 0'),
  unitPrice: z.number().min(0, 'Harga tidak boleh negatif'),
})

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid('Client tidak valid'),
  status: z.enum(['draft', 'sent', 'paid', 'partial', 'overdue']).default('draft'),
  issueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Format tanggal tidak valid',
  }),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Format tanggal tidak valid',
  }),
  currency: z.string().default('IDR'),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Minimal harus ada satu item'),
})

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  id: z.string().uuid('ID invoice tidak valid'),
})

export const updateInvoiceStatusSchema = z.object({
  id: z.string().uuid('ID invoice tidak valid'),
  status: z.enum(['draft', 'sent', 'paid', 'partial', 'overdue']),
  paymentMethod: z.string().optional(),
  paymentDate: z.string().optional(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>