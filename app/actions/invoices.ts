'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  UpdateInvoiceStatusInput
} from '@/lib/schemas/invoice'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { canCreateInvoice, calculateTaxAmount } from '@/lib/utils/invoice'
import { canCreateInvoice as canCreateInvoiceByTier } from '@/lib/utils/subscription'

export async function getInvoices() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          name,
          company,
          email
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      throw new Error('Failed to fetch invoices')
    }

    return data
  } catch (error) {
    console.error('Error in getInvoices:', error)
    throw error
  }
}

export async function getInvoiceById(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          name,
          company,
          email,
          whatsapp,
          address,
          phone
        ),
        invoice_items (*)
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      throw new Error('Failed to fetch invoice')
    }

    return data
  } catch (error) {
    console.error('Error in getInvoiceById:', error)
    throw error
  }
}

export async function createInvoice(input: CreateInvoiceInput) {
  try {
    const validatedInput = createInvoiceSchema.parse(input)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Check subscription limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('clerk_user_id', user.id)
      .single()

    if (!profile) {
      throw new Error('Profile not found')
    }

    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', user.id)

    if (!canCreateInvoiceByTier(profile.subscription_tier, existingInvoices?.length || 0)) {
      throw new Error('Anda telah mencapai batas maksimal invoice untuk paket Anda. Upgrade paket untuk menambah invoice baru.')
    }

    // Calculate totals
    const subtotal = validatedInput.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = Math.round(subtotal * (validatedInput.taxRate / 100))
    const total = subtotal + taxAmount

    // Create invoice with items
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: validatedInput.clientId,
        status: validatedInput.status,
        issue_date: validatedInput.issueDate,
        due_date: validatedInput.dueDate,
        currency: validatedInput.currency,
        subtotal,
        tax_rate: validatedInput.taxRate,
        tax_amount: taxAmount,
        total,
        notes: validatedInput.notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      throw new Error('Failed to create invoice')
    }

    // Create invoice items
    const itemsToInsert = validatedInput.items.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Error creating invoice items:', itemsError)
      throw new Error('Failed to create invoice items')
    }

    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    return { success: true, data: invoice }
  } catch (error) {
    console.error('Error in createInvoice:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    return { success: false, error: error instanceof Error ? error.message : 'Failed to create invoice' }
  }
}

export async function updateInvoice(input: UpdateInvoiceInput) {
  try {
    const validatedInput = updateInvoiceSchema.parse(input)
    const { id, items, ...updateData } = validatedInput

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Calculate totals if items are provided
    if (items && items.length > 0) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      const taxAmount = Math.round(subtotal * (updateData.taxRate || 0) / 100)
      const total = subtotal + taxAmount

      updateData.subtotal = subtotal
      updateData.tax_amount = taxAmount
      updateData.total = total
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({
        ...updateData,
        client_id: updateData.clientId,
        issue_date: updateData.issueDate,
        due_date: updateData.dueDate,
        tax_rate: updateData.taxRate,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      throw new Error('Failed to update invoice')
    }

    // Update items if provided
    if (items) {
      // Delete existing items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id)

      // Insert new items
      const itemsToInsert = items.map((item) => ({
        invoice_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('Error updating invoice items:', itemsError)
        throw new Error('Failed to update invoice items')
      }
    }

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${id}`)
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateInvoice:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    return { success: false, error: error instanceof Error ? error.message : 'Failed to update invoice' }
  }
}

export async function updateInvoiceStatus(input: UpdateInvoiceStatusInput) {
  try {
    const validatedInput = updateInvoiceStatusSchema.parse(input)
    const { id, ...updateData } = validatedInput

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({
        ...updateData,
        payment_date: updateData.paymentDate ? new Date(updateData.paymentDate).toISOString() : null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice status:', error)
      throw new Error('Failed to update invoice status')
    }

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${id}`)
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateInvoiceStatus:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    return { success: false, error: error instanceof Error ? error.message : 'Failed to update invoice status' }
  }
}

export async function deleteInvoice(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting invoice:', error)
      throw new Error('Failed to delete invoice')
    }

    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteInvoice:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete invoice' }
  }
}

export async function getInvoicesByStatus(status: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          name,
          company
        )
      `)
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices by status:', error)
      throw new Error('Failed to fetch invoices')
    }

    return data
  } catch (error) {
    console.error('Error in getInvoicesByStatus:', error)
    throw error
  }
}

export async function getDashboardStats() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get total invoices by status
    const { data: invoices } = await supabase
      .from('invoices')
      .select('status, total')
      .eq('user_id', user.id)

    if (!invoices) {
      return {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        overdueAmount: 0,
        recentInvoices: []
      }
    }

    const paidInvoices = invoices.filter(inv => inv.status === 'paid')
    const unpaidInvoices = invoices.filter(inv => inv.status === 'sent')
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)

    // Get recent invoices
    const { data: recentInvoices } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        status,
        total,
        due_date,
        clients (
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      totalInvoices: invoices.length,
      totalAmount,
      paidAmount,
      unpaidAmount,
      overdueAmount,
      recentInvoices: recentInvoices || []
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    throw error
  }
}