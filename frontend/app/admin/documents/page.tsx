'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { FileText, Search, CheckCircle, XCircle, Clock, Eye, MessageSquare, Download, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { documentAPI } from '@/utils/api'
import { isDocumentAdmin } from '@/utils/auth'

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', { page: currentPage, search: searchTerm, status: statusFilter }],
    queryFn: () => documentAPI.getAllDocuments({ 
      page: currentPage, 
      search: searchTerm,
      status: statusFilter || undefined
    }),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => 
      documentAPI.approveDocument(id, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document-stats'] })
      setSelectedDoc(null)
      setShowCommentModal(false)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => 
      documentAPI.rejectDocument(id, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document-stats'] })
      setSelectedDoc(null)
      setShowCommentModal(false)
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const handleApprove = (doc: any, comment?: string) => {
    approveMutation.mutate({ id: doc.id, comment })
  }

  const handleReject = (data: any) => {
    if (selectedDoc) {
      rejectMutation.mutate({ id: selectedDoc.id, comment: data.comment })
    }
  }

  const openCommentModal = (doc: any, approving: boolean) => {
    setSelectedDoc(doc)
    setIsApproving(approving)
    setShowCommentModal(true)
    reset()
  }

  const handleViewDocument = (doc: any) => {
    // Ensure mimeType is set, infer from filename if not available
    if (!doc.mimeType && doc.fileName) {
      const ext = doc.fileName.toLowerCase().split('.').pop()
      if (ext === 'pdf') {
        doc.mimeType = 'application/pdf'
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        doc.mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`
      }
    }
    setViewingDoc(doc)
    setShowDocumentViewer(true)
  }

  const handleDownloadDocument = (doc: any) => {
    // Create a temporary link to download the file
    const link = document.createElement('a')
    link.href = doc.fileUrl
    link.download = doc.fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isPDF = (mimeType: string | undefined) => {
    if (!mimeType) return false
    return mimeType === 'application/pdf' || mimeType.includes('pdf')
  }
  
  const isImage = (mimeType: string | undefined) => {
    if (!mimeType) return false
    return mimeType.startsWith('image/') || mimeType.includes('image')
  }

  const documents = documentsData?.data?.data?.documents || []
  const pagination = documentsData?.data?.data?.pagination

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
        <p className="text-gray-600">Review and manage document submissions.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents, members, or teams..."
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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {pagination && `${pagination.total} documents found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4 flex-1">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{doc.docType.replace('_', ' ')}</p>
                        {getStatusIcon(doc.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{doc.fileName}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{doc.member.name}</span>
                        <span>{doc.member.team.teamName}</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                      {doc.adminComment && (
                        <p className="text-xs text-gray-600 mt-1">
                          <strong>Comment:</strong> {doc.adminComment}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(doc)}
                      title="View Document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}
                      title="Download Document"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {doc.status === 'PENDING' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(doc)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCommentModal(doc, false)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {doc.status !== 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCommentModal(doc, doc.status === 'REJECTED')}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
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

      {/* Comment Modal */}
      {showCommentModal && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {isApproving ? 'Approve Document' : 'Reject Document'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>Document:</strong> {selectedDoc.docType.replace('_', ' ')}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Member:</strong> {selectedDoc.member.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Team:</strong> {selectedDoc.member.team.teamName}
              </p>
            </div>

            <form onSubmit={handleSubmit(isApproving ? 
              (data) => handleApprove(selectedDoc, data.comment) : 
              handleReject
            )}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="comment">
                    Comment {!isApproving && <span className="text-red-500">*</span>}
                  </Label>
                  <textarea
                    id="comment"
                    {...register('comment', { 
                      required: !isApproving ? 'Comment is required for rejection' : false 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder={isApproving ? 
                      'Optional comment for approval...' : 
                      'Please provide a reason for rejection...'
                    }
                  />
                  {errors.comment && (
                    <p className="text-sm text-red-600">{errors.comment.message as string}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className={isApproving ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {isApproving ? 'Approve' : 'Reject'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCommentModal(false)
                      setSelectedDoc(null)
                      reset()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && viewingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  {viewingDoc.docType.replace('_', ' ')} - {viewingDoc.member.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {viewingDoc.fileName} • {viewingDoc.member.team.teamName}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(viewingDoc)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDocumentViewer(false)
                    setViewingDoc(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 p-4 overflow-auto">
              {isPDF(viewingDoc.mimeType) ? (
                <div className="w-full h-full">
                  {/* Try multiple PDF viewing methods */}
                  <div className="w-full h-96 mb-4">
                    <object
                      data={viewingDoc.fileUrl}
                      type="application/pdf"
                      className="w-full h-full border rounded"
                    >
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewingDoc.fileUrl)}&embedded=true`}
                        className="w-full h-full border rounded"
                        title={viewingDoc.fileName}
                      >
                        <div className="text-center py-8">
                          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">
                            Cannot display PDF in browser
                          </p>
                        </div>
                      </iframe>
                    </object>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600 mb-2">
                      PDF Viewing Options:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(viewingDoc.fileUrl, '_blank')}
                      >
                        Open in New Tab
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(viewingDoc)}
                      >
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(viewingDoc.fileUrl)}`, '_blank')}
                      >
                        Open in Google Viewer
                      </Button>
                    </div>
                  </div>
                </div>
              ) : isImage(viewingDoc.mimeType) ? (
                <div className="flex justify-center">
                  <img
                    src={viewingDoc.fileUrl}
                    alt={viewingDoc.fileName}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {viewingDoc.mimeType ? 
                      `Cannot preview this file type: ${viewingDoc.mimeType}` : 
                      'Preview not available - file type unknown'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    You can download the file or open it in a new tab to view it.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => handleDownloadDocument(viewingDoc)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(viewingDoc.fileUrl, '_blank')}
                    >
                      Open in New Tab
                    </Button>
                  </div>
                  {/* Also try to display as iframe as fallback */}
                  {viewingDoc.fileUrl && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-600 mb-2">Quick Preview Attempt:</p>
                      <iframe
                        src={viewingDoc.fileUrl}
                        className="w-full h-96 border rounded"
                        title={viewingDoc.fileName}
                        onError={() => console.log('Iframe failed to load')}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Document Info Footer */}
            <div className="border-t p-4 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(viewingDoc.status)}`}>
                    {viewingDoc.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Size:</span>
                  <span className="ml-2">{Math.round(viewingDoc.fileSize / 1024)} KB</span>
                </div>
                <div>
                  <span className="font-medium">Uploaded:</span>
                  <span className="ml-2">{new Date(viewingDoc.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium">Type:</span>
                  <span className="ml-2">{viewingDoc.mimeType}</span>
                </div>
              </div>
              {viewingDoc.adminComment && (
                <div className="mt-3 pt-3 border-t">
                  <span className="font-medium">Admin Comment:</span>
                  <p className="mt-1 text-gray-600">{viewingDoc.adminComment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
