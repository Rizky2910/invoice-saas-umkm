'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getInvoiceById, deleteInvoice, updateInvoiceStatus } from '@/app/actions/invoices'
import { useMutation, useQuery } from '@tanstack/react-query'
import { formatCurrency, formatDateString, getInvoiceStatusColor, getInvoiceStatusText } from '@/lib/utils/invoice'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Download,
  CheckCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Building2,
  Eye,
  Share,
  Printer
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function InvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string
  const [isPDFDialogOpen, setIsPDFDialogOpen] = useState(false)

  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoiceById(invoiceId),
    enabled: !!invoiceId,
  })

  const deleteInvoiceMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      toast.success('Invoice berhasil dihapus')
      router.push('/invoices')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus invoice')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: updateInvoiceStatus,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Status invoice berhasil diperbarui')
        refetch()
      } else {
        toast.error(result.error || 'Gagal memperbarui status')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui status')
    },
  })

  const handleMarkAsPaid = () => {
    updateStatusMutation.mutate({
      id: invoiceId,
      status: 'paid',
      paymentDate: new Date().toISOString(),
    })
  }

  const handleSendInvoice = () => {
    updateStatusMutation.mutate({
      id: invoiceId,
      status: 'sent',
    })
  }

  const handleGeneratePDF = () => {
    // TODO: Implement PDF generation
    toast.info('Fitur PDF akan segera tersedia')
  }

  const handleShareInvoice = () => {
    // TODO: Implement sharing
    toast.info('Fitur berbagi akan segera tersedia')
  }

  if (isLoading) {
    return <InvoiceDetailSkeleton />
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              {error instanceof Error ? error.message : 'Invoice tidak ditemukan'}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detail Invoice</h1>
            <p className="text-muted-foreground">{invoice.invoice_number}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <Button variant="outline" onClick={handleSendInvoice}>
              <Send className="h-4 w-4 mr-2" />
              Kirim
            </Button>
          )}

          {(invoice.status === 'sent' || invoice.status === 'partial') && (
            <Button onClick={handleMarkAsPaid}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Tandai Lunas
            </Button>
          )}

          <Dialog open={isPDFDialogOpen} onOpenChange={setIsPDFDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Preview Invoice</DialogTitle>
                <DialogDescription>
                  Preview tampilan invoice yang akan dikirim ke klien
                </DialogDescription>
              </DialogHeader>
              <InvoiceTemplate invoice={invoice} />
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleGeneratePDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>

          <Button variant="outline" onClick={handleShareInvoice}>
            <Share className="h-4 w-4 mr-2" />
            Bagikan
          </Button>

          <Button variant="outline" asChild>
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Invoice?</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus invoice "{invoice.invoice_number}"? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteInvoiceMutation.mutate(invoiceId)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informasi Invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nomor Invoice</Label>
                  <p className="font-mono">{invoice.invoice_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={getInvoiceStatusColor(invoice.status)}
                    >
                      {getInvoiceStatusText(invoice.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Mata Uang</Label>
                  <p>{invoice.currency}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tanggal Invoice</Label>
                  <p>{formatDateString(invoice.issue_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tanggal Jatuh Tempo</Label>
                  <p>{formatDateString(invoice.due_date)}</p>
                </div>
              </div>

              {invoice.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Catatan</Label>
                  <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {invoice.payment_date && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tanggal Pembayaran</Label>
                  <p>{formatDateString(invoice.payment_date)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Klien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nama</Label>
                <p className="font-medium">{invoice.clients.name}</p>
                {invoice.clients.company && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {invoice.clients.company}
                  </p>
                )}
              </div>

              {(invoice.clients.email || invoice.clients.phone || invoice.clients.whatsapp) && (
                <div className="space-y-2">
                  {invoice.clients.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {invoice.clients.email}
                    </div>
                  )}
                  {invoice.clients.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {invoice.clients.phone}
                    </div>
                  )}
                  {invoice.clients.whatsapp && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      WA: {invoice.clients.whatsapp}
                    </div>
                  )}
                </div>
              )}

              {invoice.clients.address && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Alamat</Label>
                  <p className="text-sm mt-1 flex items-start gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    {invoice.clients.address}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Item Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.invoice_items?.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-medium text-right ml-4">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax_rate > 0 && (
                    <div className="flex justify-between">
                      <span>Pajak ({invoice.tax_rate}%)</span>
                      <span>{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoice.status === 'draft' && (
                <Button className="w-full" onClick={handleSendInvoice}>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Invoice
                </Button>
              )}

              {(invoice.status === 'sent' || invoice.status === 'partial') && (
                <Button className="w-full" onClick={handleMarkAsPaid}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tandai Lunas
                </Button>
              )}

              <Button variant="outline" className="w-full" onClick={handleGeneratePDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/invoices/${invoice.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Invoice
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Dibuat</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateString(invoice.created_at)}
                    </p>
                  </div>
                </div>

                {invoice.status !== 'draft' && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Terkirim</p>
                      <p className="text-sm text-muted-foreground">
                        Invoice telah dikirim ke klien
                      </p>
                    </div>
                  </div>
                )}

                {invoice.status === 'paid' && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Lunas</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.payment_date && formatDateString(invoice.payment_date)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>
}

function InvoiceTemplate({ invoice }: any) {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      <div className="border-2 border-gray-200 rounded-lg p-8">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-gray-600 mt-2">#{invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Tanggal: {formatDateString(invoice.issue_date)}</p>
              <p className="text-sm text-gray-600">Jatuh Tempo: {formatDateString(invoice.due_date)}</p>
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={getInvoiceStatusColor(invoice.status)}
                >
                  {getInvoiceStatusText(invoice.status)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Bill To:</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="font-medium">{invoice.clients.name}</p>
            {invoice.clients.company && <p>{invoice.clients.company}</p>}
            {invoice.clients.address && <p className="text-sm text-gray-600">{invoice.clients.address}</p>}
            {(invoice.clients.email || invoice.clients.phone) && (
              <div className="mt-2 text-sm text-gray-600">
                {invoice.clients.email && <p>{invoice.clients.email}</p>}
                {invoice.clients.phone && <p>{invoice.clients.phone}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-center py-2">Quantity</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_items?.map((item: any) => (
                <tr key={item.id} className="border-b">
                  <td className="py-4">{item.description}</td>
                  <td className="text-center py-4">{item.quantity}</td>
                  <td className="text-right py-4">{formatCurrency(item.unit_price)}</td>
                  <td className="text-right py-4">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right py-2 font-medium">Subtotal:</td>
                <td className="text-right py-2">{formatCurrency(invoice.subtotal)}</td>
              </tr>
              {invoice.tax_rate > 0 && (
                <tr>
                  <td colSpan={3} className="text-right py-2 font-medium">Tax ({invoice.tax_rate}%):</td>
                  <td className="text-right py-2">{formatCurrency(invoice.tax_amount)}</td>
                </tr>
              )}
              <tr className="font-bold text-lg border-t-2 border-gray-300">
                <td colSpan={3} className="text-right py-4">Total:</td>
                <td className="text-right py-4">{formatCurrency(invoice.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Notes:</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="text-center text-sm text-gray-600">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}

function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-20" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j}>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-4 w-48" />
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
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}