import { SidebarNav } from '@/components/sidebar-nav'
import { MobileNav } from '@/components/mobile-nav'

const fundName = process.env.FUND_NAME ?? 'Hudson Capital'
const fundLogoUrl = process.env.FUND_LOGO_URL ?? '/placeholder-logo.svg'

export default function LpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SidebarNav fundName={fundName} fundLogoUrl={fundLogoUrl} />
      <div className="md:pl-14 lg:pl-60 pb-16 md:pb-0">
        <div className="mx-auto max-w-content px-4 py-6 md:px-6 md:py-8">
          {children}
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
