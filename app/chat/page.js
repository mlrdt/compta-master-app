'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FileUp, Send, Paperclip, X, ChevronRight, AlertCircle, Loader } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Modal from '@/components/Modal'
import InvoiceEditor from '@/components/InvoiceEditor'
import {
  getChatMessages,
  addChatMessage,
  clearChat,
  uploadFile,
  createInvoice,
  getClients,
  getSettings
} from '@/lib/supabase'
import { fileToBase64, formatCurrency } from '@/lib/utils'

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)

  // Strip invoice_json blocks from markdown content
  const stripInvoiceJsonBlocks = (content) => {
    if (!content) return ''
    // Remove ```invoice_json ... ``` blocks
    return content.replace(/```invoice_json[\s\S]*?```/g, '').trim()
  }

  // Load chat history on mount
  useEffect(() => {
    const loadChat = async () => {
      try {
        const chatMessages = await getChatMessages()
        setMessages(chatMessages || [])
      } catch (err) {
        console.error('Erreur lors du chargement du chat:', err)
        setError('Impossible de charger l\'historique du chat')
      }
    }
    loadChat()
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Handle new conversation
  const handleNewConversation = async () => {
    if (confirm('Êtes-vous sûr de vouloir démarrer une nouvelle conversation ?')) {
      try {
        await clearChat()
        setMessages([])
        setPendingFiles([])
        setInputValue('')
        setError('')
        setSuccessMessage('')
      } catch (err) {
        console.error('Erreur lors de la suppression du chat:', err)
        setError('Impossible de créer une nouvelle conversation')
      }
    }
  }

  // Handle drag & drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items?.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === messagesContainerRef.current) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }, [])

  // Process and validate files
  const processFiles = (files) => {
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'
      return isImage || isPdf
    })

    if (validFiles.length === 0) {
      setError('Veuillez glisser des images ou des PDF')
      return
    }

    setPendingFiles((prev) => [...prev, ...validFiles])
  }

  // Handle file input change
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  // Remove file from pending
  const removeFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Send message
  const handleSendMessage = async () => {
    if (!inputValue.trim() && pendingFiles.length === 0) {
      setError('Veuillez entrer un message ou ajouter un fichier')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      // Prepare file data
      let fileData = []
      if (pendingFiles.length > 0) {
        fileData = await Promise.all(
          pendingFiles.map(async (file) => {
            const isImage = file.type.startsWith('image/')
            let base64 = null
            let storageUrl = null

            if (isImage) {
              base64 = await fileToBase64(file)
            }

            // Upload to Supabase
            const url = await uploadFile(file, 'chat-files')
            storageUrl = url

            return {
              name: file.name,
              type: file.type,
              base64: isImage ? base64 : null,
              storageUrl,
              isImage
            }
          })
        )
      }

      // Add user message
      const userMessage = {
        role: 'user',
        content: inputValue.trim(),
        files: fileData.length > 0 ? fileData : null,
        timestamp: new Date().toISOString()
      }

      setMessages((prev) => [...prev, userMessage])
      await addChatMessage(userMessage)

      // Reset input
      setInputValue('')
      setPendingFiles([])

      // Call AI API
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          files: fileData
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec l\'IA')
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage = {
        role: 'assistant',
        content: data.content,
        invoice_data: data.invoice_data || null,
        timestamp: new Date().toISOString()
      }

      setMessages((prev) => [...prev, assistantMessage])
      await addChatMessage(assistantMessage)
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err)
      setError(err.message || 'Erreur lors de la communication avec l\'IA')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle keyboard in input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Create invoice from extracted data
  const handleCreateInvoice = async (invoiceData) => {
    try {
      setIsLoading(true)
      const invoiceId = await createInvoice(invoiceData)
      setSuccessMessage(
        `Facture créée avec succès ! Rendez-vous sur la page des factures.`
      )
      // Redirect to invoices page after 2 seconds
      setTimeout(() => {
        window.location.href = '/invoices'
      }, 2000)
    } catch (err) {
      console.error('Erreur lors de la création de la facture:', err)
      setError('Impossible de créer la facture')
    } finally {
      setIsLoading(false)
    }
  }

  // Open editor modal
  const handleOpenEditor = (invoiceData) => {
    setSelectedInvoiceData(invoiceData)
    setIsEditorOpen(true)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Chat IA — Génération de factures
          </h1>
          <button
            onClick={handleNewConversation}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Nouvelle conversation
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto w-full"
      >
        {/* Drag & Drop Overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-indigo-50 border-2 border-dashed border-indigo-400 flex items-center justify-center z-40 pointer-events-none">
            <div className="text-center">
              <FileUp className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
              <p className="text-lg font-medium text-indigo-600">
                Dépose tes fichiers ici
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Débute une conversation
              </h2>
              <p className="text-gray-500 max-w-md">
                Décris ta facture, ajoute une image ou un PDF, et l'IA générera les données
                pour toi
              </p>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-6 flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-2xl ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-tl-sm'
              } p-4`}
            >
              {/* File Previews */}
              {message.files && message.files.length > 0 && (
                <div className="mb-3 flex gap-2 flex-wrap">
                  {message.files.map((file, fileIdx) => (
                    <div
                      key={fileIdx}
                      className={`rounded-lg overflow-hidden border ${
                        message.role === 'user'
                          ? 'border-indigo-400'
                          : 'border-gray-200'
                      }`}
                    >
                      {file.isImage ? (
                        <img
                          src={file.storageUrl}
                          alt={file.name}
                          className="h-20 w-20 object-cover"
                        />
                      ) : (
                        <div
                          className={`h-20 w-20 flex items-center justify-center ${
                            message.role === 'user'
                              ? 'bg-indigo-500'
                              : 'bg-gray-100'
                          }`}
                        >
                          <FileUp
                            className={`w-8 h-8 ${
                              message.role === 'user'
                                ? 'text-white'
                                : 'text-gray-400'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              {message.role === 'user' ? (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              ) : (
                <div className="prose prose-sm prose-indigo max-w-none prose-p:my-2 prose-headings:my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {stripInvoiceJsonBlocks(message.content)}
                  </ReactMarkdown>
                </div>
              )}

              {/* Invoice Proposal Card */}
              {message.invoice_data && (
                <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 text-gray-900">
                  <h3 className="font-semibold text-lg mb-3">Facture proposée</h3>
                  <div className="space-y-2 mb-4 text-sm">
                    <p>
                      <span className="text-gray-600">Client:</span>{' '}
                      <span className="font-medium">
                        {message.invoice_data.client_name || 'Non spécifié'}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Nombre d'articles:</span>{' '}
                      <span className="font-medium">
                        {message.invoice_data.items?.length || 0}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Total TTC:</span>{' '}
                      <span className="font-bold text-indigo-600">
                        {formatCurrency(
                          message.invoice_data.total_ttc ||
                            message.invoice_data.total ||
                            0
                        )}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCreateInvoice(message.invoice_data)}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Créer cette facture
                    </button>
                    <button
                      onClick={() => handleOpenEditor(message.invoice_data)}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-6 flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-tl-sm p-4">
              <div className="flex gap-2">
                <Loader className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-gray-600">L'IA réfléchit...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-5xl mx-auto w-full px-6 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-5xl mx-auto w-full px-6 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 text-green-700">
            <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {/* File Previews */}
          {pendingFiles.length > 0 && (
            <div className="mb-4 flex gap-2 flex-wrap">
              {pendingFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="relative rounded-lg overflow-hidden border border-gray-200 group"
                >
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-20 w-20 object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 flex items-center justify-center bg-gray-100">
                      <FileUp className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Field */}
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Décris ta facture ou glisse un document..."
              rows="3"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            <div className="flex flex-col gap-2">
              {/* Attachment Button */}
              <label className="p-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={isLoading || (!inputValue.trim() && pendingFiles.length === 0)}
                className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Maj + Entrée pour une nouvelle ligne, Entrée pour envoyer
          </p>
        </div>
      </div>

      {/* Invoice Editor Modal */}
      <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)}>
        {selectedInvoiceData && (
          <InvoiceEditor
            initialData={selectedInvoiceData}
            onSave={async (data) => {
              await handleCreateInvoice(data)
              setIsEditorOpen(false)
            }}
            onCancel={() => setIsEditorOpen(false)}
          />
        )}
      </Modal>
    </div>
  )
}
