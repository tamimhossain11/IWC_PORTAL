'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, Users, BarChart3, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminAPI, documentAPI } from '@/utils/api'
import { isDocumentAdmin } from '@/utils/auth'

export default function ReportsPage() {
  const [selectedTeam, setSelectedTeam] = useState('')

  const { data: teamsData } = useQuery({
    queryKey: ['teams-list'],
    queryFn: () => adminAPI.getTeams({ limit: 100 }),
  })

  const { data: documentStats } = useQuery({
    queryKey: ['document-stats'],
    queryFn: documentAPI.getDocumentStats,
  })

  const { data: documentsData } = useQuery({
    queryKey: ['all-documents'],
    queryFn: () => documentAPI.getAllDocuments({ limit: 1000 }),
  })

  const teams = teamsData?.data?.data?.teams || []
  const stats = documentStats?.data?.data
  const documents = documentsData?.data?.data?.documents || []

  const handleExportCSV = () => {
    if (documents.length === 0) return

    const csvData = documents.map((doc: any) => ({
      'Document Type': doc.docType,
      'File Name': doc.fileName,
      'Member Name': doc.member.name,
      'Member Email': doc.member.email,
      'Team Name': doc.member.team.teamName,
      'Team ID': doc.member.team.teamId,
      'Status': doc.status,
      'Admin Comment': doc.adminComment || '',
      'Verified By': doc.verifier?.name || '',
      'Submitted Date': new Date(doc.createdAt).toLocaleDateString(),
      'Verified Date': doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleDateString() : '',
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iwc-documents-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportTeamCSV = (teamId: string) => {
    const teamDocs = documents.filter((doc: any) => doc.member.team.id === teamId)
    if (teamDocs.length === 0) return

    const team = teams.find((t: any) => t.id === teamId)
    const csvData = teamDocs.map((doc: any) => ({
      'Document Type': doc.docType,
      'File Name': doc.fileName,
      'Member Name': doc.member.name,
      'Member Email': doc.member.email,
      'Status': doc.status,
      'Admin Comment': doc.adminComment || '',
      'Submitted Date': new Date(doc.createdAt).toLocaleDateString(),
      'Verified Date': doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleDateString() : '',
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${team?.teamName || 'team'}-documents-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isDocumentAdmin()) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Access denied. Document Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and download system reports.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalTeams || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalMembers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalDocuments || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalDocuments ? 
                    Math.round((stats.statusStats.APPROVED / stats.totalDocuments) * 100) : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download comprehensive reports in CSV format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              onClick={handleExportCSV}
              className="flex items-center space-x-2"
              disabled={documents.length === 0}
            >
              <Download className="h-4 w-4" />
              <span>Export All Documents (CSV)</span>
            </Button>

            <div className="flex items-center space-x-2">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select team...</option>
                {teams.map((team: any) => (
                  <option key={team.id} value={team.id}>
                    {team.teamName} ({team.teamId})
                  </option>
                ))}
              </select>
              <Button
                onClick={() => selectedTeam && handleExportTeamCSV(selectedTeam)}
                disabled={!selectedTeam}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Team CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Document Status Breakdown</CardTitle>
          <CardDescription>Current status distribution of all documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-900 mb-2">
                {stats?.statusStats?.APPROVED || 0}
              </div>
              <div className="text-sm text-green-700">Approved Documents</div>
              <div className="text-xs text-green-600 mt-1">
                {stats?.totalDocuments ? 
                  Math.round((stats.statusStats.APPROVED / stats.totalDocuments) * 100) : 0}% of total
              </div>
            </div>

            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-900 mb-2">
                {stats?.statusStats?.PENDING || 0}
              </div>
              <div className="text-sm text-yellow-700">Pending Review</div>
              <div className="text-xs text-yellow-600 mt-1">
                {stats?.totalDocuments ? 
                  Math.round((stats.statusStats.PENDING / stats.totalDocuments) * 100) : 0}% of total
              </div>
            </div>

            <div className="text-center p-6 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-900 mb-2">
                {stats?.statusStats?.REJECTED || 0}
              </div>
              <div className="text-sm text-red-700">Rejected Documents</div>
              <div className="text-xs text-red-600 mt-1">
                {stats?.totalDocuments ? 
                  Math.round((stats.statusStats.REJECTED / stats.totalDocuments) * 100) : 0}% of total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Team Progress Overview</CardTitle>
          <CardDescription>Document submission progress by team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teams.map((team: any) => {
              const teamDocs = documents.filter((doc: any) => doc.member.team.id === team.id)
              const approvedDocs = teamDocs.filter((doc: any) => doc.status === 'APPROVED').length
              const totalDocs = teamDocs.length
              const progressPercentage = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0

              return (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{team.teamName}</p>
                      <p className="text-sm text-gray-500">
                        {approvedDocs}/{totalDocs} documents approved
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{progressPercentage}%</p>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportTeamCSV(team.id)}
                      disabled={totalDocs === 0}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
