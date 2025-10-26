'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getProfile, updateProfile } from '@/app/actions/profiles'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSubscription } from '@/hooks/useSubscription'
import { getTierName } from '@/lib/utils/subscription'
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Upload,
  Save,
  Crown,
  Camera,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    business_logo: '',
    business_address: '',
    business_phone: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const queryClient = useQueryClient()

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { tier } = useSubscription()

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Profil berhasil diperbarui')
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      } else {
        toast.error(result.error || 'Gagal memperbarui profil')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui profil')
    },
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        business_name: profile.business_name || '',
        business_logo: profile.business_logo || '',
        business_address: profile.business_address || '',
        business_phone: profile.business_phone || '',
      })
    }
  }, [profile])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 2MB')
      return
    }

    setIsUploading(true)

    try {
      // TODO: Implement image upload to storage
      // For now, just simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create a fake URL for demo
      const imageUrl = URL.createObjectURL(file)
      handleInputChange('business_logo', imageUrl)
      toast.success('Logo berhasil diunggah')
    } catch (error) {
      toast.error('Gagal mengunggah logo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    updateProfileMutation.mutate(formData)
  }

  if (profileLoading) {
    return <SettingsSkeleton />
  }

  if (profileError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Kelola profil dan pengaturan Anda</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Gagal memuat data profil
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
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Kelola profil dan pengaturan Anda</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informasi Profil
                </CardTitle>
                <CardDescription>
                  Informasi dasar profil Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errors.root && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.root}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Email tidak dapat diubah. Hubungi support jika perlu perubahan.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Business Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informasi Bisnis
                </CardTitle>
                <CardDescription>
                  Informasi bisnis untuk ditampilkan di invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo Bisnis</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={formData.business_logo} />
                      <AvatarFallback>
                        <Building2 className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="logo-upload"
                        disabled={isUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Mengunggah...' : 'Upload Logo'}
                      </Button>
                      <p className="text-sm text-muted-foreground mt-1">
                        PNG, JPG hingga 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_name">Nama Bisnis</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="PT. Example"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_phone">Telepon Bisnis</Label>
                  <Input
                    id="business_phone"
                    value={formData.business_phone}
                    onChange={(e) => handleInputChange('business_phone', e.target.value)}
                    placeholder="+62 812-3456-7890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_address">Alamat Bisnis</Label>
                  <Textarea
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => handleInputChange('business_address', e.target.value)}
                    placeholder="Jl. Example No. 123, Jakarta Selatan"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Paket Saat Ini
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">{getTierName(tier)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tier === 'tier1' ? 'Paket dasar untuk memulai' : 'Paket lengkap untuk bisnis berkembang'}
                    </p>
                  </div>

                  <Separator />

                  <Button className="w-full" asChild>
                    <a href="/subscription">
                      <Crown className="h-4 w-4 mr-2" />
                      Kelola Subscription
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Simpan Perubahan</CardTitle>
                <CardDescription>
                  Simpan semua perubahan profil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>

                {updateProfileMutation.isSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Profil berhasil diperbarui
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24 mb-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-32" />
                <Separator />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}