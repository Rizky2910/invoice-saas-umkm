import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Invoice SaaS UMKM</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Card>
                    <CardContent className="p-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </CardContent>
                  </Card>
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}