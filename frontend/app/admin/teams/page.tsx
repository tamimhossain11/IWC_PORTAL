'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Edit, Trash2, Users, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminAPI } from '@/utils/api'
import { isSuperAdmin } from '@/utils/auth'

const teamSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  teamName: z.string().min(1, 'Team name is required'),
  paymentId: z.string().optional(),
  regId: z.string().optional(),
})

type TeamForm = z.infer<typeof teamSchema>

export default function TeamsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams', { page: currentPage, search: searchTerm }],
    queryFn: () => adminAPI.getTeams({ page: currentPage, search: searchTerm }),
  })

  const createTeamMutation = useMutation({
    mutationFn: adminAPI.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setShowCreateForm(false)
      reset()
    },
  })

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setEditingTeam(null)
      reset()
    },
  })

  const deleteTeamMutation = useMutation({
    mutationFn: adminAPI.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
  })

  const onSubmit = (data: TeamForm) => {
    if (editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, data })
    } else {
      createTeamMutation.mutate(data)
    }
  }

  const handleEdit = (team: any) => {
    setEditingTeam(team)
    setShowCreateForm(true)
    reset({
      teamId: team.teamId,
      teamName: team.teamName,
      paymentId: team.paymentId || '',
      regId: team.regId || '',
    })
  }

  const handleDelete = (teamId: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      deleteTeamMutation.mutate(teamId)
    }
  }

  const teams = teamsData?.data?.data?.teams || []
  const pagination = teamsData?.data?.data?.pagination

  if (!isSuperAdmin()) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Access denied. Super Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams Management</h1>
          <p className="text-gray-600">Create and manage competition teams.</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTeam ? 'Edit Team' : 'Create New Team'}</CardTitle>
            <CardDescription>
              {editingTeam ? 'Update team information' : 'Add a new team to the system'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamId">Team ID</Label>
                  <Input
                    id="teamId"
                    {...register('teamId')}
                    disabled={!!editingTeam}
                    placeholder="e.g., TEAM001"
                  />
                  {errors.teamId && (
                    <p className="text-sm text-red-600">{errors.teamId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    {...register('teamName')}
                    placeholder="e.g., Alpha Team"
                  />
                  {errors.teamName && (
                    <p className="text-sm text-red-600">{errors.teamName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentId">Payment ID (Optional)</Label>
                  <Input
                    id="paymentId"
                    {...register('paymentId')}
                    placeholder="e.g., PAY001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regId">Registration ID (Optional)</Label>
                  <Input
                    id="regId"
                    {...register('regId')}
                    placeholder="e.g., REG001"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={createTeamMutation.isPending || updateTeamMutation.isPending}
                >
                  {editingTeam ? 'Update Team' : 'Create Team'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingTeam(null)
                    reset()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Teams List */}
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            {pagination && `${pagination.total} teams found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No teams found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team: any) => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{team.teamName}</p>
                      <p className="text-sm text-gray-500">ID: {team.teamId}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>{team._count.members} members</span>
                        {team.paymentId && <span>Payment: {team.paymentId}</span>}
                        {team.regId && <span>Reg: {team.regId}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/admin/teams/${team.id}`, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(team)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(team.id)}
                      disabled={team._count.members > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {currentPage} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
