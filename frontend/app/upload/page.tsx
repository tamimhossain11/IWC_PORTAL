'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, Clock, XCircle, AlertCircle, Eye, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { documentAPI } from '@/utils/api'

const DOCUMENT_TYPES = [
  { value: 'PASSPORT_ORIGINAL', label: 'Passport Original & Copy' },
  { value: 'PASSPORT_PHOTOS', label: 'Passport-sized Photographs (2 copies)' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement (Last 3 months)' },
  { value: 'BANK_CHEQUE', label: 'Bank Cheque (Original one-leaf copy)' },
  { value: 'COVER_LETTER', label: 'Cover Letter & Travel Itinerary' },
  { value: 'INVITATION_LETTER', label: 'Invitation/Guarantee Letter' },
  { value: 'TICKET_BOOKING', label: 'Flight Ticket Booking' },
  { value: 'HOTEL_BOOKING', label: 'Hotel Booking Confirmation' },
  { value: 'TRAVEL_INSURANCE', label: 'Travel Insurance' },
  { value: 'MARRIAGE_CERTIFICATE', label: 'Marriage Certificate (if applicable)' },
  { value: 'NOC_LETTER', label: 'NOC/Reference Letter from Institution' },
  { value: 'TRADE_LICENSE', label: 'Trade License & Business TIN' },
  { value: 'AUTHORIZATION_LETTER', label: 'Authorization Letter (if through agent)' },
  { value: 'MISSION_LETTER', label: 'Mission/Assignment Letter' },
  { value: 'EMPLOYEE_ID', label: 'Employee ID (National & Company)' },
  { value: 'OTHER', label: 'Other Supporting Document' },
]

export default function UploadPage() {
  const [selectedDocType, setSelectedDocType] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: myDocuments, isLoading } = useQuery({
    queryKey: ['my-documents'],
    queryFn: documentAPI.getMyDocuments,
  })

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => documentAPI.uploadDocument(formData),
    onSuccess: () => {
      setUploadSuccess('Document uploaded successfully!')
      setUploadError('')
      setSelectedDocType('')
      queryClient.invalidateQueries({ queryKey: ['my-documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: (error: any) => {
      setUploadError(error.response?.data?.message || 'Upload failed')
      setUploadSuccess('')
    },
  })

  const onDrop = (acceptedFiles: File[]) => {
    if (!selectedDocType) {
      setUploadError('Please select a document type first')
      return
    }

    if (acceptedFiles.length === 0) {
      setUploadError('Please select a valid file (PDF, JPG, PNG)')
      return
    }

    const file = acceptedFiles[0]
    const formData = new FormData()
    formData.append('document', file)
    formData.append('docType', selectedDocType)

    uploadMutation.mutate(formData)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  })

  const documents = myDocuments?.data?.data || []

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
          <p className="text-gray-600">Upload your required documents for Indonesian Visa Application. Please ensure all documents meet embassy requirements.</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload New Document</CardTitle>
            <CardDescription>
              Select document type and upload your file (PDF, JPG, PNG - Max 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                {uploadSuccess}
              </div>
            )}

            <div className="space-y-2">
              <Label>Document Type</Label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select document type...</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-primary">Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag and drop your file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported formats: PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
              )}
            </div>

            {uploadMutation.isPending && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                <span>Uploading...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>
              Essential documents for Indonesian Visa Application as per Embassy requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DOCUMENT_TYPES.slice(0, 8).map((docType) => {
                const uploaded = documents.find((doc: any) => doc.docType === docType.value)
                return (
                  <div key={docType.value} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{docType.label}</span>
                    </div>
                    {uploaded ? (
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(uploaded.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(uploaded.status)}`}>
                          {uploaded.status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not uploaded</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Documents */}
      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>All your uploaded documents and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <p className="text-sm text-gray-400">Start by uploading your first document above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">{doc.docType.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">{doc.fileName}</p>
                      <p className="text-xs text-gray-400">
                        Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(doc.status)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
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
                    </div>
                    {doc.adminComment && (
                      <p className="text-xs text-gray-600 max-w-xs">
                        <strong>Comment:</strong> {doc.adminComment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {showDocumentViewer && viewingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  {viewingDoc.docType.replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-gray-600">
                  {viewingDoc.fileName}
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
                  ✕
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
