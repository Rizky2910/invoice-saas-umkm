import { useQuery } from '@tanstack/react-query'
import { getProfile, getSubscriptionLimits } from '@/app/actions/profiles'
import { getSubscriptionLimits as getLimits, hasFeature } from '@/lib/utils/subscription'

export function useSubscription() {
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const {
    data: limits,
    isLoading: limitsLoading,
  } = useQuery({
    queryKey: ['subscription-limits'],
    queryFn: getSubscriptionLimits,
    enabled: !!profile,
  })

  const tier = profile?.subscription_tier || 'tier1'
  const tierLimits = limits ? getLimits(limits.tier) : null

  const canCreateClient = tierLimits
    ? (limits.clientsCount < tierLimits.maxClients)
    : false

  const canCreateInvoice = tierLimits
    ? (limits.invoicesCount < tierLimits.maxInvoices)
    : false

  const hasCustomTemplates = hasFeature(tier, 'hasCustomTemplates')
  const hasAutoReminders = hasFeature(tier, 'hasAutoReminders')
  const hasWhiteLabel = hasFeature(tier, 'hasWhiteLabel')

  const clientUsagePercentage = tierLimits && tierLimits.maxClients !== Infinity
    ? (limits.clientsCount / tierLimits.maxClients) * 100
    : 0

  const invoiceUsagePercentage = tierLimits && tierLimits.maxInvoices !== Infinity
    ? (limits.invoicesCount / tierLimits.maxInvoices) * 100
    : 0

  const isNearClientLimit = clientUsagePercentage >= 90 && clientUsagePercentage < 100
  const isNearInvoiceLimit = invoiceUsagePercentage >= 90 && invoiceUsagePercentage < 100
  const isAtClientLimit = limits.clientsCount >= tierLimits.maxClients
  const isAtInvoiceLimit = limits.invoicesCount >= tierLimits.maxInvoices

  return {
    tier,
    limits,
    tierLimits,
    canCreateClient,
    canCreateInvoice,
    hasCustomTemplates,
    hasAutoReminders,
    hasWhiteLabel,
    clientUsagePercentage,
    invoiceUsagePercentage,
    isNearClientLimit,
    isNearInvoiceLimit,
    isAtClientLimit,
    isAtInvoiceLimit,
    isLoading: profileLoading || limitsLoading,
    error: profileError,
  }
}

export function useCanCreateClient() {
  const { canCreateClient, isAtClientLimit, tier } = useSubscription()

  const showUpgradePrompt = isAtClientLimit

  return {
    canCreateClient,
    showUpgradePrompt,
    tier,
  }
}

export function useCanCreateInvoice() {
  const { canCreateInvoice, isAtInvoiceLimit, tier } = useSubscription()

  const showUpgradePrompt = isAtInvoiceLimit

  return {
    canCreateInvoice,
    showUpgradePrompt,
    tier,
  }
}

export function useFeature(feature: 'hasCustomTemplates' | 'hasAutoReminders' | 'hasWhiteLabel') {
  const { tier } = useSubscription()

  return hasFeature(tier, feature)
}