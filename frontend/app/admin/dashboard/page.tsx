'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, FileText, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { documentAPI, adminAPI } from '@/utils/api'

export default function AdminDashboardPage() {
  const { data: documentStats, isLoading: statsLoading } = useQuery({
    queryKey: ['document-stats'],
    queryFn: documentAPI.getDocumentStats,
  })

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', { limit: 5 }],
    queryFn: () => adminAPI.getTeams({ limit: 5 }),
  })

  const { data: documentsData, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', { limit: 10 }],
    queryFn: () => documentAPI.getAllDocuments({ limit: 10 }),
  })

  if (statsLoading || teamsLoading || docsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = documentStats?.data?.data
  const teams = teamsData?.data?.data?.teams || []
  const documents = documentsData?.data?.data?.documents || []

  const statCards = [
    {
      title: 'Total Teams',
      value: stats?.totalTeams || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Members',
      value: stats?.totalMembers || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Documents',
      value: stats?.totalDocuments || 0,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pending Review',
      value: stats?.statusStats?.PENDING || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of the IWC document management system.</p>
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
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Document Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Document Status Overview</CardTitle>
          <CardDescription>Current status distribution of all documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">{stats?.statusStats?.APPROVED || 0}</p>
              <p className="text-sm text-green-700">Approved</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-900">{stats?.statusStats?.PENDING || 0}</p>
              <p className="text-sm text-yellow-700">Pending</p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-900">{stats?.statusStats?.REJECTED || 0}</p>
              <p className="text-sm text-red-700">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Teams */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Teams</CardTitle>
            <CardDescription>Latest registered teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No teams found</p>
              ) : (
                teams.map((team: any) => (
                  <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{team.teamName}</p>
                      <p className="text-sm text-gray-500">ID: {team.teamId}</p>
                      <p className="text-xs text-gray-400">
                        {team._count.members} members
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {new Date(team.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Latest document submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No documents found</p>
              ) : (
                documents.slice(0, 5).map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{doc.docType.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">{doc.member.name}</p>
                        <p className="text-xs text-gray-400">{doc.member.team.teamName}</p>
                      </div>
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
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/teams"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="font-medium">Manage Teams</p>
                <p className="text-sm text-gray-500">Create and manage teams</p>
              </div>
            </a>

            <a
              href="/admin/documents"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="font-medium">Review Documents</p>
                <p className="text-sm text-gray-500">Approve or reject submissions</p>
              </div>
            </a>

            <a
              href="/admin/reports"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="font-medium">View Reports</p>
                <p className="text-sm text-gray-500">Generate and download reports</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
