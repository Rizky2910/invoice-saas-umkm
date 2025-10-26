'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Users,
  FileText,
  Settings,
  Receipt,
  Plus,
  CreditCard,
} from 'lucide-react'

const navigation = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    title: 'Invoice',
    href: '/invoices',
    icon: FileText,
    actions: [
      {
        title: 'Buat Invoice',
        href: '/invoices/new',
        icon: Plus,
      },
    ]
  },
  {
    title: 'Klien',
    href: '/clients',
    icon: Users,
    actions: [
      {
        title: 'Tambah Klien',
        href: '/clients/new',
        icon: Plus,
      },
    ]
  },
  {
    title: 'Subscription',
    href: '/subscription',
    icon: CreditCard,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar variant="sidebar" {...props}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-lg font-bold">Invoice UMKM</h2>
            <p className="text-xs text-muted-foreground">Kelola bisnis Anda</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.actions && pathname.startsWith(item.href) && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.actions.map((action) => (
                    <SidebarMenuButton
                      key={action.href}
                      asChild
                      variant="ghost"
                      size="sm"
                      isActive={pathname === action.href}
                    >
                      <Link href={action.href}>
                        <action.icon className="h-3 w-3" />
                        <span className="text-sm">{action.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ))}
                </div>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">
          <p>Invoice SaaS UMKM v1.0</p>
          <p>&copy; 2024 All rights reserved</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}