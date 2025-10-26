import { Database } from '@/types/supabase'

export type SubscriptionTier = Database['public']['Enums']['subscription_tier']

export interface SubscriptionLimits {
  maxClients: number
  maxInvoices: number
  hasCustomTemplates: boolean
  hasAutoReminders: boolean
  hasWhiteLabel: boolean
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  tier1: {
    maxClients: 10,
    maxInvoices: 20,
    hasCustomTemplates: false,
    hasAutoReminders: false,
    hasWhiteLabel: false,
  },
  tier2: {
    maxClients: Infinity,
    maxInvoices: Infinity,
    hasCustomTemplates: true,
    hasAutoReminders: true,
    hasWhiteLabel: true,
  },
}

export function getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[tier]
}

export function canCreateClient(tier: SubscriptionTier, currentClientCount: number): boolean {
  const limits = getSubscriptionLimits(tier)
  return currentClientCount < limits.maxClients
}

export function canCreateInvoice(tier: SubscriptionTier, currentInvoiceCount: number): boolean {
  const limits = getSubscriptionLimits(tier)
  return currentInvoiceCount < limits.maxInvoices
}

export function hasFeature(tier: SubscriptionTier, feature: keyof Omit<SubscriptionLimits, 'maxClients' | 'maxInvoices'>): boolean {
  const limits = getSubscriptionLimits(tier)
  return limits[feature]
}

export function getTierPrice(tier: SubscriptionTier): number {
  const prices = {
    tier1: 50000, // Rp 50k/bulan
    tier2: 150000, // Rp 150k/bulan
  }
  return prices[tier]
}

export function getTierName(tier: SubscriptionTier): string {
  const names = {
    tier1: 'Starter',
    tier2: 'Professional',
  }
  return names[tier]
}