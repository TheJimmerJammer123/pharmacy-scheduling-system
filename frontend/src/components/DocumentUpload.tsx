import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, AlertCircle, Clock, Trash2, Settings, Download, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
// Note: Document upload feature is not yet implemented in the new backend
// This component provides a placeholder interface

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

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  importId?: string
  template?: ProcessingTemplate
}

interface ProcessingTemplate {
  id: string
  name: string
  description: string
  file_type: string
  template_config: any
  is_default: boolean
}

interface UploadStats {
  totalFiles: number
  completedFiles: number
  failedFiles: number
  totalSize: number
}

export function DocumentUpload() {
  const [imports, setImports] = useState<DocumentImport[]>([])
  const [files, setFiles] = useState<UploadFile[]>([])
  const [templates, setTemplates] = useState<ProcessingTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessingTemplate | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    totalSize: 0
  })
  const { toast } = useToast()

  // Initialize component
  useEffect(() => {
    fetchTemplates()
    fetchImports()
  }, [])

  // Fetch processing templates - placeholder implementation
  const fetchTemplates = useCallback(async () => {
    try {
      // TODO: Implement template fetching in the new backend
      const placeholderTemplates: ProcessingTemplate[] = [
        {
          id: '1',
          name: 'Default Excel Template',
          description: 'Standard template for Excel files',
          file_type: 'excel',
          template_config: {},
          is_default: true
        }
      ];
      
      setTemplates(placeholderTemplates);
      setSelectedTemplate(placeholderTemplates[0]);
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }, [])

  // Fetch existing imports - placeholder implementation
  const fetchImports = useCallback(async () => {
    try {
      // TODO: Implement import history fetching in the new backend
      // For now, show empty state
      setImports([]);
    } catch (error) {
      console.error('Error fetching imports:', error)
    }
  }, [])

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'application/pdf']
    
    if (file.size > maxSize) {
      return `File too large. Maximum size is 50MB.`
    }
    
    if (!allowedTypes.includes(file.type)) {
      return `Unsupported file type. Please upload Excel, CSV, or PDF files.`
    }
    
    return null
  }

  // Enhanced file drop handler
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => {
      const validationError = validateFile(file)
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: validationError ? 'failed' : 'pending',
        progress: 0,
        error: validationError || undefined,
        template: selectedTemplate || undefined
      }
    })

    // Handle rejected files
    rejectedFiles.forEach(rejection => {
      const error = rejection.errors.map((e: any) => e.message).join(', ')
      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file: rejection.file,
        status: 'failed',
        progress: 0,
        error: error
      })
    })

    setFiles(prev => [...prev, ...newFiles])
    
    // Update stats
    setUploadStats(prev => ({
      ...prev,
      totalFiles: prev.totalFiles + newFiles.length,
      totalSize: prev.totalSize + newFiles.reduce((sum, f) => sum + f.file.size, 0)
    }))
  }, [selectedTemplate])

  // Process file uploads
  const processUploads = async () => {
    setIsUploading(true)
    const filesToProcess = files.filter(f => f.status === 'pending')
    
    for (const fileItem of filesToProcess) {
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'uploading', progress: 10 } : f
        ))

        // Convert file to base64
        const base64 = await fileToBase64(fileItem.file)
        
        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, progress: 30 } : f
        ))

        // Determine file type
        const fileType = getFileType(fileItem.file.name)
        
        // TODO: Implement document upload in the new backend
        // For now, simulate upload completion
        const response = { 
          ok: true,
          json: async () => ({ 
            success: true, 
            id: `upload-${Date.now()}`,
            message: 'Document upload feature coming soon' 
          })
        }

        const result = await response.json()
        
        if (result.success) {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { 
              ...f, 
              status: 'processing', 
              progress: 60, 
              importId: result.import_id 
            } : f
          ))
          
          // Start monitoring processing status
          monitorProcessingStatus(fileItem.id, result.import_id)
        } else {
          throw new Error(result.error)
        }
      } catch (error: any) {
        console.error('Upload error:', error)
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { 
            ...f, 
            status: 'failed', 
            error: error.message 
          } : f
        ))
        
        setUploadStats(prev => ({ ...prev, failedFiles: prev.failedFiles + 1 }))
      }
    }
    
    setIsUploading(false)
  }

  // Monitor processing status
  const monitorProcessingStatus = async (fileId: string, importId: string) => {
    const checkStatus = async () => {
      try {
        // TODO: Implement status checking in the new backend
        // For now, just mark as completed after a delay
        const data = { progress: 100, status: 'completed', message: 'Upload completed (placeholder)' };

        if (data) {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { 
              ...f, 
              progress: data.progress,
              status: data.status === 'completed' ? 'completed' : 
                      data.status === 'failed' ? 'failed' : 'processing'
            } : f
          ))

          if (data.status === 'completed') {
            setUploadStats(prev => ({ ...prev, completedFiles: prev.completedFiles + 1 }))
            toast({
              title: "Processing Complete",
              description: `Successfully processed file with ${data.metadata?.total_records || 0} records`,
            })
            fetchImports() // Refresh imports list
          } else if (data.status === 'failed') {
            setUploadStats(prev => ({ ...prev, failedFiles: prev.failedFiles + 1 }))
            setFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, error: data.message } : f
            ))
          } else if (data.status === 'processing') {
            // Continue monitoring
            setTimeout(checkStatus, 2000)
          }
        }
      } catch (error) {
        console.error('Error checking status:', error)
      }
    }

    checkStatus()
  }

  // Remove file from queue
  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove) {
        setUploadStats(current => ({
          ...current,
          totalFiles: current.totalFiles - 1,
          totalSize: current.totalSize - fileToRemove.file.size
        }))
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  // Clear completed/failed files
  const clearProcessed = () => {
    setFiles(prev => prev.filter(f => f.status === 'pending' || f.status === 'uploading' || f.status === 'processing'))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isUploading,
    multiple: true
  })

  // Utility functions
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'processing':
      case 'uploading':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'processing':
      case 'uploading':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const pendingFiles = files.filter(f => f.status === 'pending')
  const processingFiles = files.filter(f => f.status === 'uploading' || f.status === 'processing')
  const completedFiles = files.filter(f => f.status === 'completed')
  const failedFiles = files.filter(f => f.status === 'failed')

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{uploadStats.totalFiles}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{uploadStats.completedFiles}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{uploadStats.failedFiles}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{formatFileSize(uploadStats.totalSize)}</p>
              </div>
              <Upload className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Upload Interface */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="queue">
            Processing Queue 
            {(processingFiles.length + pendingFiles.length) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {processingFiles.length + pendingFiles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Processing Template
              </CardTitle>
              <CardDescription>
                Choose a template to define how your files will be processed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedTemplate?.id || ''} 
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value)
                  setSelectedTemplate(template || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a processing template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{template.name}</span>
                        {template.is_default && (
                          <Badge variant="secondary" className="ml-2">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

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
                    <p className="text-sm text-muted-foreground">
                      Supports Excel (.xlsx, .xls), CSV (.csv), and PDF (.pdf) files up to 50MB
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Selected template: {selectedTemplate?.name || 'None'}
                    </p>
                  </div>
                )}
              </div>

              {/* File Queue Preview */}
              {files.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Uploaded Files ({files.length})</h4>
                    <div className="flex gap-2">
                      {pendingFiles.length > 0 && (
                        <Button 
                          onClick={processUploads}
                          disabled={isUploading}
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                        >
                          {isUploading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Process {pendingFiles.length} Files
                            </>
                          )}
                        </Button>
                      )}
                      {(completedFiles.length > 0 || failedFiles.length > 0) && (
                        <Button 
                          onClick={clearProcessed}
                          variant="outline" 
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear Processed
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <ScrollArea className="h-48 w-full border rounded-lg p-2">
                    <div className="space-y-2">
                      {files.map((fileItem) => (
                        <div key={fileItem.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(fileItem.file.size)} • {fileItem.template?.name || 'No template'}
                            </p>
                            {fileItem.progress > 0 && fileItem.status !== 'completed' && (
                              <Progress value={fileItem.progress} className="h-1 mt-1" />
                            )}
                            {fileItem.error && (
                              <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(fileItem.status)}
                            <Badge className={getStatusColor(fileItem.status)}>
                              {fileItem.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(fileItem.id)}
                              disabled={fileItem.status === 'uploading' || fileItem.status === 'processing'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Processing Queue</CardTitle>
              <CardDescription>
                Monitor file processing status and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>No files in processing queue</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {processingFiles.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Currently Processing ({processingFiles.length})</h4>
                      <div className="space-y-2">
                        {processingFiles.map((fileItem) => (
                          <div key={fileItem.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4" />
                                <div>
                                  <p className="font-medium">{fileItem.file.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatFileSize(fileItem.file.size)} • Processing...
                                  </p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(fileItem.status)}>
                                {fileItem.status}
                              </Badge>
                            </div>
                            <Progress value={fileItem.progress} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pendingFiles.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Pending ({pendingFiles.length})</h4>
                      <div className="space-y-2">
                        {pendingFiles.map((fileItem) => (
                          <div key={fileItem.id} className="border rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{fileItem.file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatFileSize(fileItem.file.size)} • Ready for processing
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(fileItem.status)}>
                              {fileItem.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(completedFiles.length > 0 || failedFiles.length > 0) && (
                    <div>
                      <h4 className="font-medium mb-2">
                        Completed ({completedFiles.length}) / Failed ({failedFiles.length})
                      </h4>
                      <div className="space-y-2">
                        {[...completedFiles, ...failedFiles].map((fileItem) => (
                          <div key={fileItem.id} className="border rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{fileItem.file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatFileSize(fileItem.file.size)}
                                </p>
                                {fileItem.error && (
                                  <p className="text-sm text-red-600">{fileItem.error}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(fileItem.status)}
                              <Badge className={getStatusColor(fileItem.status)}>
                                {fileItem.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Import History
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchImports}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}