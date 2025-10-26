'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Crown,
  Star,
  Check,
  Zap,
  TrendingUp,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface UpgradePromptProps {
  children: React.ReactNode
  type: 'client' | 'invoice'
  currentCount?: number
  maxCount?: number
}

export function UpgradePrompt({ children, type, currentCount = 0, maxCount = 0 }: UpgradePromptProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getTitle = () => {
    if (type === 'client') {
      return 'Batasi Klien Tercapai!'
    } else {
      return 'Batasi Invoice Tercapai!'
    }
  }

  const getDescription = () => {
    if (type === 'client') {
      return `Anda telah mencapai batas maksimal ${maxCount} klien pada paket Starter. Upgrade ke Professional untuk menambah klien tidak terbatas.`
    } else {
      return `Anda telah mencapai batas maksimal ${maxCount} invoice pada paket Starter. Upgrade ke Professional untuk membuat invoice tidak terbatas.`
    }
  }

  const handleUpgrade = () => {
    setIsOpen(false)
    // Navigate to subscription page
    window.location.href = '/subscription'
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-6 w-6 text-orange-500" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-base">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Usage */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Penggunaan saat ini: {currentCount} / {maxCount} {type === 'client' ? 'klien' : 'invoice'}
            </AlertDescription>
          </Alert>

          {/* Professional Plan Benefits */}
          <Card className="border-green-600">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-8 w-8 text-yellow-600" />
                <Badge className="bg-green-600 hover:bg-green-600">Recommended</Badge>
              </div>
              <CardTitle className="text-xl">Professional Plan</CardTitle>
              <CardDescription className="text-base">
                Unlock unlimited possibilities for your business
              </CardDescription>
              <div className="flex items-baseline justify-center">
                <span className="text-3xl font-bold">
                  Rp 150.000
                </span>
                <span className="text-muted-foreground ml-2">/bulan</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Klien tidak terbatas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Invoice tidak terbatas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Template invoice custom</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Pengingat pembayaran otomatis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Laporan keuangan lengkap</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Tanpa branding aplikasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Support prioritas</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button onClick={handleUpgrade} className="w-full" size="lg">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade Sekarang
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full">
                  Nanti Saja
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Compare Plans */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Rp 50.000/bulan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>10 klien</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>20 invoice/bulan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">Template dasar</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-600">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="h-6 w-6 text-yellow-600" />
                  <Badge className="bg-green-600 hover:bg-green-600">Best Value</Badge>
                </div>
                <CardTitle>Professional</CardTitle>
                <CardDescription>Rp 150.000/bulan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Klien tidak terbatas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Invoice tidak terbatas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Semua fitur premium</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}