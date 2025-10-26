'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getClients, createInvoice } from '@/app/actions/clients'
import { getInvoices } from '@/app/actions/invoices'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCanCreateInvoice } from '@/hooks/useSubscription'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  FileText,
  User,
  DollarSign,
  Calculator
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export default function NewInvoicePage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    currency: 'IDR',
    taxRate: 0,
    notes: '',
  })

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const { canCreateInvoice, showUpgradePrompt } = useCanCreateInvoice()

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  const createInvoiceMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Invoice berhasil dibuat')
        router.push('/invoices')
      } else {
        toast.error(result.error || 'Gagal membuat invoice')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat invoice')
    },
  })

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = Math.round(subtotal * (formData.taxRate / 100))
  const total = subtotal + taxAmount

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
        }
        return updatedItem
      }
      return item
    })
    setItems(updatedItems)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.clientId) {
      newErrors.clientId = 'Pilih klien terlebih dahulu'
    }

    if (!formData.issueDate) {
      newErrors.issueDate = 'Tanggal invoice harus diisi'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Tanggal jatuh tempo harus diisi'
    }

    items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item-${index}-description`] = 'Deskripsi harus diisi'
      }
      if (item.quantity <= 0) {
        newErrors[`item-${index}-quantity`] = 'Quantity harus lebih dari 0'
      }
      if (item.unitPrice < 0) {
        newErrors[`item-${index}-unitPrice`] = 'Harga tidak boleh negatif'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Mohon perbaiki error pada form')
      return
    }

    const validItems = items.filter(item => item.description.trim() && item.quantity > 0 && item.unitPrice >= 0)

    createInvoiceMutation.mutate({
      clientId: formData.clientId,
      status: 'draft',
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      currency: formData.currency,
      taxRate: formData.taxRate,
      notes: formData.notes,
      items: validItems,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Buat Invoice Baru</h1>
          <p className="text-muted-foreground">Buat invoice untuk klien Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informasi Klien
                </CardTitle>
                <CardDescription>Pilih klien untuk invoice ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="client">Klien <span className="text-red-500">*</span></Label>
                  <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
                    <SelectTrigger className={errors.clientId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih klien" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsLoading ? (
                        <div className="p-2 text-center">Memuat...</div>
                      ) : clients.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground">
                          Belum ada klien.{' '}
                          <Link href="/clients/new" className="text-primary underline">
                            Tambah klien
                          </Link>
                        </div>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div>
                              <div className="font-medium">{client.name}</div>
                              {client.company && (
                                <div className="text-sm text-muted-foreground">{client.company}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.clientId && (
                    <p className="text-sm text-red-500">{errors.clientId}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detail Invoice
                </CardTitle>
                <CardDescription>Informasi dasar invoice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Tanggal Invoice <span className="text-red-500">*</span></Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      className={errors.issueDate ? 'border-red-500' : ''}
                    />
                    {errors.issueDate && (
                      <p className="text-sm text-red-500">{errors.issueDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Tanggal Jatuh Tempo <span className="text-red-500">*</span></Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className={errors.dueDate ? 'border-red-500' : ''}
                    />
                    {errors.dueDate && (
                      <p className="text-sm text-red-500">{errors.dueDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Mata Uang</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IDR">IDR - Rupiah</SelectItem>
                        <SelectItem value="USD">USD - Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Pajak (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.taxRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Item Invoice
                    </CardTitle>
                    <CardDescription>Detail produk/jasa yang diinvoice</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="grid gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item #{index + 1}</h4>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-12">
                      <div className="md:col-span-6 space-y-2">
                        <Label>Deskripsi <span className="text-red-500">*</span></Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Deskripsi produk/jasa"
                          className={errors[`item-${index}-description`] ? 'border-red-500' : ''}
                        />
                        {errors[`item-${index}-description`] && (
                          <p className="text-sm text-red-500">{errors[`item-${index}-description`]}</p>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label>Quantity <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className={errors[`item-${index}-quantity`] ? 'border-red-500' : ''}
                        />
                        {errors[`item-${index}-quantity`] && (
                          <p className="text-sm text-red-500">{errors[`item-${index}-quantity`]}</p>
                        )}
                      </div>

                      <div className="md:col-span-3 space-y-2">
                        <Label>Harga Satuan <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                          className={errors[`item-${index}-unitPrice`] ? 'border-red-500' : ''}
                        />
                        {errors[`item-${index}-unitPrice`] && (
                          <p className="text-sm text-red-500">{errors[`item-${index}-unitPrice`]}</p>
                        )}
                      </div>

                      <div className="md:col-span-1 space-y-2">
                        <Label>Total</Label>
                        <div className="h-10 px-3 flex items-center border rounded-md bg-muted">
                          <span className="text-sm font-medium">
                            {new Intl.NumberFormat('id-ID').format(item.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Catatan</CardTitle>
                <CardDescription>Informasi tambahan untuk invoice</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Catatan atau informasi tambahan..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Ringkasan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: formData.currency,
                        minimumFractionDigits: 0,
                      }).format(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Pajak ({formData.taxRate}%)</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: formData.currency,
                        minimumFractionDigits: 0,
                      }).format(taxAmount)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-lg">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: formData.currency,
                        minimumFractionDigits: 0,
                      }).format(total)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  {showUpgradePrompt ? (
                    <UpgradePrompt type="invoice" currentCount={20} maxCount={20}>
                      <Button type="button" className="w-full" disabled>
                        <Save className="h-4 w-4 mr-2" />
                        Upgrade untuk Buat Invoice
                      </Button>
                    </UpgradePrompt>
                  ) : (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createInvoiceMutation.isPending || !formData.clientId || items.length === 0}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createInvoiceMutation.isPending ? 'Menyimpan...' : 'Simpan Invoice'}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <Link href="/invoices">Batal</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}