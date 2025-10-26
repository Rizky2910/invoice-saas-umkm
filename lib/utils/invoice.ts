export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDateString(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function getInvoiceStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getInvoiceStatusText(status: string): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'sent':
      return 'Terkirim'
    case 'paid':
      return 'Lunas'
    case 'partial':
      return 'Dibayar Sebagian'
    case 'overdue':
      return 'Jatuh Tempo'
    default:
      return status
  }
}

export function isInvoiceOverdue(dueDate: string, status: string): boolean {
  if (status === 'paid') return false
  return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
}

export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice)
}

export function calculateTaxAmount(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * (taxRate / 100))
}

export function calculateGrandTotal(subtotal: number, taxRate: number): number {
  const taxAmount = calculateTaxAmount(subtotal, taxRate)
  return subtotal + taxAmount
}

export function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

  return `INV/${year}${month}/${random}`
}

export function validateInvoiceData(data: {
  clientId: string
  items: Array<{ description: string; quantity: number; unitPrice: number }>
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.clientId) {
    errors.push('Client harus dipilih')
  }

  if (!data.items || data.items.length === 0) {
    errors.push('Minimal harus ada satu item')
  } else {
    data.items.forEach((item, index) => {
      if (!item.description.trim()) {
        errors.push(`Deskripsi item ${index + 1} tidak boleh kosong`)
      }
      if (item.quantity <= 0) {
        errors.push(`Quantity item ${index + 1} harus lebih dari 0`)
      }
      if (item.unitPrice < 0) {
        errors.push(`Harga item ${index + 1} tidak boleh negatif`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}