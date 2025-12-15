'use client'

import { useQuery } from '@tanstack/react-query'
import { FileText, CheckCircle, Clock, XCircle, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { userAPI, documentAPI } from '@/utils/api'

export default function DashboardPage() {
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: userAPI.getDashboardStats,
  })

  const { data: myDocuments, isLoading: docsLoading } = useQuery({
    queryKey: ['my-documents'],
    queryFn: documentAPI.getMyDocuments,
  })

  const { data: teamProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['team-progress'],
    queryFn: documentAPI.getTeamProgress,
  })

  if (statsLoading || docsLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = dashboardStats?.data?.data
  const documents = myDocuments?.data?.data || []
  const progress = teamProgress?.data?.data

  const statCards = [
    {
      title: 'Total Documents',
      value: stats?.totalDocuments || 0,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Approved',
      value: stats?.documentStats?.APPROVED || 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Pending',
      value: stats?.documentStats?.PENDING || 0,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Rejected',
      value: stats?.documentStats?.REJECTED || 0,
      icon: XCircle,
      color: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your document submission overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Your latest document submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
              ) : (
                documents.slice(0, 5).map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{doc.docType}</p>
                      <p className="text-sm text-gray-500">{doc.fileName}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        doc.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : doc.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Team Progress</CardTitle>
            <CardDescription>Document submission progress by team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progress?.teamProgress?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No team data available</p>
              ) : (
                progress?.teamProgress?.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">
                          {member.approvedDocuments}/{member.totalRequired} documents
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{member.progressPercentage}%</p>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${member.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      {stats?.recentNotifications?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Latest updates and messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentNotifications.map((notification: any) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
