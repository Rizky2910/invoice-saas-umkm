'use server'

import { createClient } from '@/lib/supabase/server'
import { createClientSchema, updateClientSchema, CreateClientInput, UpdateClientInput } from '@/lib/schemas/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { canCreateClient } from '@/lib/utils/subscription'

export async function getClients() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      throw new Error('Failed to fetch clients')
    }

    return data
  } catch (error) {
    console.error('Error in getClients:', error)
    throw error
  }
}

export async function getClientById(clientId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      throw new Error('Failed to fetch client')
    }

    return data
  } catch (error) {
    console.error('Error in getClientById:', error)
    throw error
  }
}

export async function createClient(input: CreateClientInput) {
  try {
    const validatedInput = createClientSchema.parse(input)

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

    const { data: existingClients } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)

    if (!canCreateClient(profile.subscription_tier, existingClients?.length || 0)) {
      throw new Error('Anda telah mencapai batas maksimal klien untuk paket Anda. Upgrade paket untuk menambah klien baru.')
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        ...validatedInput,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      throw new Error('Failed to create client')
    }

    revalidatePath('/clients')
    return { success: true, data }
  } catch (error) {
    console.error('Error in createClient:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    return { success: false, error: error instanceof Error ? error.message : 'Failed to create client' }
  }
}

export async function updateClient(input: UpdateClientInput) {
  try {
    const validatedInput = updateClientSchema.parse(input)
    const { id, ...updateData } = validatedInput

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      throw new Error('Failed to update client')
    }

    revalidatePath('/clients')
    revalidatePath(`/clients/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateClient:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    return { success: false, error: error instanceof Error ? error.message : 'Failed to update client' }
  }
}

export async function deleteClient(clientId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Check if client has invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .limit(1)

    if (invoices && invoices.length > 0) {
      throw new Error('Tidak dapat menghapus client yang memiliki invoice. Hapus invoice terlebih dahulu.')
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting client:', error)
      throw new Error('Failed to delete client')
    }

    revalidatePath('/clients')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteClient:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete client' }
  }
}

export async function searchClients(query: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .or(`name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name')
      .limit(10)

    if (error) {
      console.error('Error searching clients:', error)
      throw new Error('Failed to search clients')
    }

    return data
  } catch (error) {
    console.error('Error in searchClients:', error)
    throw error
  }
}