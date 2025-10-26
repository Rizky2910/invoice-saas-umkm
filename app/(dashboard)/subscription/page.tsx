'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { getProfile, getSubscriptionLimits, updateSubscriptionTier } from '@/app/actions/profiles'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSubscriptionLimits as getLimits, getTierPrice, getTierName, hasFeature } from '@/lib/utils/subscription'
import {
  Crown,
  Check,
  X,
  Zap,
  TrendingUp,
  Users,
  FileText,
  Star,
  CreditCard,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

const tiers = [
  {
    id: 'tier1' as const,
    name: 'Starter',
    description: 'Untuk UMKM yang baru memulai',
    price: 50000,
    features: [
      'Maksimal 10 klien',
      'Maksimal 20 invoice/bulan',
      'Template invoice dasar',
      'Support email',
      'Dengan branding aplikasi',
    ],
    limitations: [
      'Tidak ada template custom',
      'Tidak ada pengingat otomatis',
      'Tidak ada white-label',
    ],
    popular: false,
  },
  {
    id: 'tier2' as const,
    name: 'Professional',
    description: 'Untuk UMKM yang sedang berkembang',
    price: 150000,
    features: [
      'Klien tidak terbatas',
      'Invoice tidak terbatas',
      'Template invoice custom',
      'Pengingat pembayaran otomatis',
      'Laporan keuangan',
      'Support prioritas',
      'Tanpa branding aplikasi (white-label)',
      'Export data',
    ],
    limitations: [],
    popular: true,
  },
]

export default function SubscriptionPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const queryClient = useQueryClient()

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

  const upgradeMutation = useMutation({
    mutationFn: updateSubscriptionTier,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Berhasil upgrade paket!')
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        queryClient.invalidateQueries({ queryKey: ['subscription-limits'] })
      } else {
        toast.error(result.error || 'Gagal upgrade paket')
      }
      setIsProcessing(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal upgrade paket')
      setIsProcessing(false)
    },
  })

  const handleUpgrade = async (tierId: 'tier1' | 'tier2') => {
    if (!profile) return

    setIsProcessing(true)

    if (tierId === profile.subscription_tier) {
      toast.info('Anda sudah menggunakan paket ini')
      setIsProcessing(false)
      return
    }

    // TODO: Implement Stripe checkout
    // For now, just update the tier directly (for demo purposes)
    upgradeMutation.mutate(tierId)
  }

  const currentTier = profile?.subscription_tier || 'tier1'
  const currentTierLimits = limits ? getLimits(limits.tier) : null

  const clientProgress = currentTierLimits ? (limits.clientsCount / currentTierLimits.maxClients) * 100 : 0
  const invoiceProgress = currentTierLimits ? (limits.invoicesCount / currentTierLimits.maxInvoices) * 100 : 0

  if (profileLoading || limitsLoading) {
    return <SubscriptionSkeleton />
  }

  if (profileError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">Kelola paket subscription Anda</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Gagal memuat data subscription
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">Kelola paket subscription Anda</p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Paket Saat Ini: {getTierName(currentTier)}
          </CardTitle>
          <CardDescription>
            Status subscription dan penggunaan fitur Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Stats */}
          {currentTierLimits && limits && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Klien</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {limits.clientsCount} / {currentTierLimits.maxClients === Infinity ? '∞' : currentTierLimits.maxClients}
                  </span>
                </div>
                {currentTierLimits.maxClients !== Infinity && (
                  <Progress value={Math.min(clientProgress, 100)} className="h-2" />
                )}
                {clientProgress >= 90 && clientProgress < 100 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Anda hampir mencapai batas klien. Pertimbangkan untuk upgrade paket.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Invoice</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {limits.invoicesCount} / {currentTierLimits.maxInvoices === Infinity ? '∞' : currentTierLimits.maxInvoices}
                  </span>
                </div>
                {currentTierLimits.maxInvoices !== Infinity && (
                  <Progress value={Math.min(invoiceProgress, 100)} className="h-2" />
                )}
                {invoiceProgress >= 90 && invoiceProgress < 100 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Anda hampir mencapai batas invoice bulan ini. Pertimbangkan untuk upgrade paket.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Current Tier Features */}
          <div>
            <h3 className="font-medium mb-3">Fitur Tersedia:</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {hasFeature(currentTier, 'hasCustomTemplates') && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Template invoice custom</span>
                </div>
              )}
              {hasFeature(currentTier, 'hasAutoReminders') && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Pengingat pembayaran otomatis</span>
                </div>
              )}
              {hasFeature(currentTier, 'hasWhiteLabel') && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Tanpa branding aplikasi</span>
                </div>
              )}
              {!hasFeature(currentTier, 'hasCustomTemplates') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>Template invoice custom</span>
                </div>
              )}
              {!hasFeature(currentTier, 'hasAutoReminders') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>Pengingat pembayaran otomatis</span>
                </div>
              )}
              {!hasFeature(currentTier, 'hasWhiteLabel') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>Tanpa branding aplikasi</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Pilihan Paket</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {tiers.map((tier) => {
            const isCurrentTier = tier.id === currentTier
            const isUpgrade = tier.id === 'tier2' && currentTier === 'tier1'

            return (
              <Card
                key={tier.id}
                className={`relative ${
                  isCurrentTier
                    ? 'border-primary ring-2 ring-primary/20'
                    : isUpgrade
                    ? 'border-green-600 ring-2 ring-green-600/20'
                    : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 hover:bg-green-600">
                      <Star className="h-3 w-3 mr-1" />
                      Paling Populer
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="flex items-center justify-center gap-2 text-xl">
                    {tier.id === 'tier2' ? (
                      <Crown className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <Zap className="h-6 w-6 text-blue-600" />
                    )}
                    {tier.name}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {tier.description}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(tier.price)}
                      </span>
                      <span className="text-muted-foreground ml-2">/bulan</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Fitur:</h4>
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}

                    {tier.limitations.length > 0 && (
                      <>
                        <Separator />
                        <h4 className="font-medium text-sm text-muted-foreground">Keterbatasan:</h4>
                        {tier.limitations.map((limitation, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <X className="h-4 w-4 flex-shrink-0" />
                            <span>{limitation}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full"
                    disabled={isCurrentTier || isProcessing}
                    variant={isCurrentTier ? 'secondary' : isUpgrade ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(tier.id)}
                  >
                    {isCurrentTier ? (
                      <>Paket Saat Ini</>
                    ) : isUpgrade ? (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Upgrade Sekarang
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Downgrade
                      </>
                    )}
                  </Button>

                  {isCurrentTier && (
                    <p className="text-center text-sm text-muted-foreground">
                      Anda sedang menggunakan paket ini
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Billing Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informasi Pembayaran
          </CardTitle>
          <CardDescription>
            Kelola metode pembayaran dan riwayat tagihan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Kelola Pembayaran</h3>
            <p className="text-muted-foreground mb-4">
              Kelola metode pembayaran dan lihat riwayat tagihan Anda
            </p>
            <Button variant="outline">
              <ArrowRight className="h-4 w-4 mr-2" />
              Buka Dashboard Stripe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="text-center">
                <Skeleton className="h-6 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-48 mx-auto" />
                <Skeleton className="h-8 w-20 mx-auto mt-4" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}