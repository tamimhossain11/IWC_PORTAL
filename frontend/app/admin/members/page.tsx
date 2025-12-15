'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Edit, Trash2, UserPlus, Key, Crown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminAPI } from '@/utils/api'
import { isSuperAdmin } from '@/utils/auth'

const memberSchema = z.object({
  teamId: z.string().min(1, 'Team is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['LEADER', 'MEMBER']),
})

type MemberForm = z.infer<typeof memberSchema>

export default function MembersPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['team-members', { page: currentPage, search: searchTerm, status: statusFilter }],
    queryFn: () => adminAPI.getTeamMembers({ 
      page: currentPage, 
      search: searchTerm,
      status: statusFilter || undefined
    }),
  })

  const { data: teamsData } = useQuery({
    queryKey: ['teams-list'],
    queryFn: () => adminAPI.getTeams({ limit: 100 }),
  })

  const createMemberMutation = useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: any }) => 
      adminAPI.createTeamMember(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      setShowCreateForm(false)
      reset()
    },
  })

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updateTeamMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      setEditingMember(null)
      reset()
    },
  })

  const deleteMemberMutation = useMutation({
    mutationFn: adminAPI.deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: adminAPI.resetMemberPassword,
    onSuccess: (response) => {
      alert(`Password reset successfully. New password: ${response.data.data.tempPassword}`)
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
  })

  const onSubmit = (data: MemberForm) => {
    if (editingMember) {
      updateMemberMutation.mutate({ id: editingMember.id, data })
    } else {
      createMemberMutation.mutate({ teamId: data.teamId, data })
    }
  }

  const handleEdit = (member: any) => {
    setEditingMember(member)
    setShowCreateForm(true)
    reset({
      teamId: member.teamId,
      name: member.name,
      email: member.email,
      role: member.role,
    })
  }

  const handleDelete = (memberId: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      deleteMemberMutation.mutate(memberId)
    }
  }

  const handleResetPassword = (memberId: string) => {
    if (confirm('Are you sure you want to reset this member\'s password?')) {
      resetPasswordMutation.mutate(memberId)
    }
  }

  const members = membersData?.data?.data?.members || []
  const teams = teamsData?.data?.data?.teams || []
  const pagination = membersData?.data?.data?.pagination

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
          <h1 className="text-2xl font-bold text-gray-900">Members Management</h1>
          <p className="text-gray-600">Create and manage team members.</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingMember ? 'Edit Member' : 'Add New Member'}</CardTitle>
            <CardDescription>
              {editingMember ? 'Update member information' : 'Add a new team member to the system'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamId">Team</Label>
                  <select
                    id="teamId"
                    {...register('teamId')}
                    disabled={!!editingMember}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select team...</option>
                    {teams.map((team: any) => (
                      <option key={team.id} value={team.id}>
                        {team.teamName} ({team.teamId})
                      </option>
                    ))}
                  </select>
                  {errors.teamId && (
                    <p className="text-sm text-red-600">{errors.teamId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., John Doe"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    disabled={!!editingMember}
                    placeholder="e.g., john@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    {...register('role')}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="LEADER">Leader</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={createMemberMutation.isPending || updateMemberMutation.isPending}
                >
                  {editingMember ? 'Update Member' : 'Add Member'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingMember(null)
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

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {pagination && `${pagination.total} members found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No members found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {member.role === 'LEADER' && (
                        <Crown className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{member.name}</p>
                        {member.role === 'LEADER' && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Leader
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          member.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>{member.team.teamName}</span>
                        <span>{member._count.documents} documents</span>
                        {member.lastLogin && (
                          <span>Last login: {new Date(member.lastLogin).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(member.id)}
                      title="Reset Password"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
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
