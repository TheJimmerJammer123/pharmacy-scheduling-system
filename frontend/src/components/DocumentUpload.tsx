import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface DocumentImport {
  id: string
  file_name: string
  file_type: string
  file_size: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  created_at: string
  updated_at: string
  metadata?: any
}

export function DocumentUpload() {
  const [imports, setImports] = useState<DocumentImport[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Fetch existing imports
  const fetchImports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('document_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setImports(data || [])
    } catch (error) {
      console.error('Error fetching imports:', error)
    }
  }, [])

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    
    for (const file of acceptedFiles) {
      try {
        // Convert file to base64
        const base64 = await fileToBase64(file)
        
        // Determine file type
        const fileType = getFileType(file.name)
        
        // Upload file
        const response = await fetch('/functions/v1/document-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            file_name: file.name,
            file_type: fileType,
            file_size: file.size,
            content: base64,
            metadata: {
              description: `Uploaded ${file.name}`,
              tags: ['pharmacy', 'data'],
              priority: 'medium'
            }
          })
        })

        const result = await response.json()
        
        if (result.success) {
          toast({
            title: "Upload Successful",
            description: `${file.name} uploaded and processing started`,
          })
          
          // Refresh imports list
          await fetchImports()
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive"
        })
      }
    }
    
    setIsUploading(false)
  }, [toast, fetchImports])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isUploading
  })

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result as string
        resolve(base64.split(',')[1]) // Remove data URL prefix
      }
      reader.onerror = error => reject(error)
    })
  }

  // Determine file type from extension
  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return 'excel'
      case 'csv':
        return 'csv'
      case 'pdf':
        return 'pdf'
      default:
        return 'excel'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
          <CardDescription>
            Upload Excel files, PDFs, or CSV files for data processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports Excel (.xlsx, .xls), CSV (.csv), and PDF (.pdf) files up to 50MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            Recent document uploads and their processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {imports.map((importItem) => (
              <div key={importItem.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium">{importItem.file_name}</h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(importItem.file_size)} • {formatDate(importItem.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(importItem.status)}
                    <Badge className={getStatusColor(importItem.status)}>
                      {importItem.status}
                    </Badge>
                  </div>
                </div>
                
                {importItem.status === 'processing' && (
                  <div className="mb-2">
                    <Progress value={importItem.progress} className="h-2" />
                    <p className="text-sm text-gray-600 mt-1">{importItem.message}</p>
                  </div>
                )}
                
                {importItem.status === 'completed' && importItem.metadata && (
                  <div className="text-sm text-gray-600">
                    <p>Sheets processed: {importItem.metadata.sheets_processed}</p>
                    <p>Total records: {importItem.metadata.total_records}</p>
                  </div>
                )}
                
                {importItem.status === 'failed' && (
                  <p className="text-sm text-red-600">{importItem.message}</p>
                )}
              </div>
            ))}
            
            {imports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>No imports yet. Upload your first document to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 