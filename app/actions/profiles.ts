'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().optional(),
  business_name: z.string().optional(),
  business_logo: z.string().url().optional().or(z.literal('')),
  business_address: z.string().optional(),
  business_phone: z.string().optional(),
})

export async function getProfile() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching profile:', error)
      throw new Error('Failed to fetch profile')
    }

    // Create profile if it doesn't exist
    if (!data) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          clerk_user_id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        throw new Error('Failed to create profile')
      }

      return newProfile
    }

    return data
  } catch (error) {
    console.error('Error in getProfile:', error)
    throw error
  }
}

export async function updateProfile(input: Partial<{
  name: string
  business_name: string
  business_logo: string
  business_address: string
  business_phone: string
}>) {
  try {
    const validatedInput = updateProfileSchema.parse(input)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(validatedInput)
      .eq('clerk_user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw new Error('Failed to update profile')
    }

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateProfile:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' }
  }
}

export async function updateSubscriptionTier(tier: 'tier1' | 'tier2') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ subscription_tier: tier })
      .eq('clerk_user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription tier:', error)
      throw new Error('Failed to update subscription tier')
    }

    revalidatePath('/dashboard')
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateSubscriptionTier:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update subscription tier' }
  }
}

export async function getSubscriptionLimits() {
  try {
    const profile = await getProfile()

    if (!profile) {
      throw new Error('Profile not found')
    }

    const supabase = await createClient()

    // Count clients
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', profile.clerk_user_id)

    // Count invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', profile.clerk_user_id)

    return {
      tier: profile.subscription_tier,
      clientsCount: clients?.length || 0,
      invoicesCount: invoices?.length || 0,
    }
  } catch (error) {
    console.error('Error in getSubscriptionLimits:', error)
    throw error
  }
}