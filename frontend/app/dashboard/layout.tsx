import dynamic from 'next/dynamic'

const TeamLayout = dynamic(() => import('@/components/team/layout'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TeamLayout>{children}</TeamLayout>
}
