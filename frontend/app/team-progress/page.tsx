'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, CheckCircle, Clock, User, Crown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { documentAPI } from '@/utils/api'

export default function TeamProgressPage() {
  const { data: teamProgress, isLoading } = useQuery({
    queryKey: ['team-progress'],
    queryFn: documentAPI.getTeamProgress,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const progress = teamProgress?.data?.data
  const teamMembers = progress?.teamProgress || []
  const requiredDocuments = progress?.requiredDocuments || []

  const totalMembers = teamMembers.length
  const completedMembers = teamMembers.filter((member: any) => member.progressPercentage === 100).length
  const overallProgress = totalMembers > 0 ? Math.round((completedMembers / totalMembers) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Progress</h1>
        <p className="text-gray-600">Track your team's document submission progress.</p>
      </div>

      {/* Overall Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedMembers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">{overallProgress}%</p>
              </div>
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Required Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>
            Each team member must submit these documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {requiredDocuments.map((docType: string) => (
                <div key={docType} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">{docType.replace(/_/g, ' ')}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Member Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Member Progress</CardTitle>
          <CardDescription>
            Individual progress for each team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No team members found</p>
              </div>
            ) : (
              teamMembers.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-lg font-medium text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {member.role === 'LEADER' && (
                        <Crown className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        {member.role === 'LEADER' && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Leader
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {member.approvedDocuments} of {member.totalRequired} documents approved
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {member.progressPercentage}% Complete
                      </p>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            member.progressPercentage === 100
                              ? 'bg-green-500'
                              : member.progressPercentage >= 50
                              ? 'bg-blue-500'
                              : 'bg-yellow-500'
                          }`}
                          style={{ width: `${member.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {member.progressPercentage === 100 ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-yellow-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Summary</CardTitle>
          <CardDescription>
            Quick overview of team completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">{completedMembers}</p>
              <p className="text-sm text-green-700">Completed</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-900">
                {totalMembers - completedMembers}
              </p>
              <p className="text-sm text-yellow-700">In Progress</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">{overallProgress}%</p>
              <p className="text-sm text-blue-700">Team Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
