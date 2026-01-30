'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import ConversationSidebar from '@/components/counsellor/ConversationSidebar'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  isTyping?: boolean
  actions?: Array<{ type: string; args: any; result: string }>
}

interface ServerStatus {
  isWakingUp: boolean
  retryCount: number
  lastError: string | null
}

// Simple markdown renderer
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let keyIndex = 0
  let ulItems: string[] = []

  const processInlineMarkdown = (line: string) => {
    let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>')
    processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    processed = processed.replace(/_([^_]+)_/g, '<em>$1</em>')
    processed = processed.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-sm">$1</code>')
    return processed
  }

  const flushUlList = () => {
    if (ulItems.length > 0) {
      elements.push(
        <ul key={keyIndex++} className="list-disc ml-5 space-y-1 my-2">
          {ulItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(item) }} />
          ))}
        </ul>
      )
      ulItems = []
    }
  }

  lines.forEach((line) => {
    const olMatch = line.match(/^\d+\.\s+(.*)/)
    if (olMatch) {
      flushUlList()
      elements.push(
        <p key={keyIndex++} className="my-1" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(olMatch[1]) }} />
      )
      return
    }

    const ulMatch = line.match(/^[-*]\s+(.*)/)
    if (ulMatch) {
      ulItems.push(ulMatch[1])
      return
    }

    flushUlList()

    if (line.startsWith('### ')) {
      elements.push(<h3 key={keyIndex++} className="font-bold text-base mt-3 mb-1">{line.slice(4)}</h3>)
      return
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={keyIndex++} className="font-bold text-lg mt-3 mb-1">{line.slice(3)}</h2>)
      return
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={keyIndex++} className="font-bold text-xl mt-3 mb-1">{line.slice(2)}</h1>)
      return
    }

    if (line.trim() === '') {
      elements.push(<div key={keyIndex++} className="h-2" />)
      return
    }

    elements.push(
      <p key={keyIndex++} className="my-1" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(line) }} />
    )
  })

  flushUlList()
  return elements
}

// Typing animation component
function TypewriterText({ content, onComplete }: { content: string; onComplete: () => void }) {
  const [displayedContent, setDisplayedContent] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (isComplete) return

    let index = 0
    const speed = 15

    const timer = setInterval(() => {
      if (index < content.length) {
        setDisplayedContent(content.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        setIsComplete(true)
        onComplete()
      }
    }, speed)

    return () => clearInterval(timer)
  }, [content, isComplete, onComplete])

  const rendered = useMemo(() => renderMarkdown(displayedContent), [displayedContent])

  return <div className="text-gray-700 dark:text-gray-200 text-sm sm:text-base leading-relaxed">{rendered}</div>
}

// Static rendered message
function RenderedMessage({ content }: { content: string }) {
  const rendered = useMemo(() => renderMarkdown(content), [content])
  return <div className="text-gray-700 dark:text-gray-200 text-sm sm:text-base leading-relaxed">{rendered}</div>
}

export default function CounsellorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null)
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    isWakingUp: false,
    retryCount: 0,
    lastError: null
  })
  const [backendReady, setBackendReady] = useState(false)
  const [checkingBackend, setCheckingBackend] = useState(true)

  // Conversation state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarRefresh, setSidebarRefresh] = useState(0)

  // Voice state
  const [isRecording, setIsRecording] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const shouldScrollRef = useRef(false)

  const hasConversation = messages.length > 0

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Check if backend is ready on mount
  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    setCheckingBackend(true)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(`${API_URL}/health`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        setBackendReady(true)
        setServerStatus({ isWakingUp: false, retryCount: 0, lastError: null })
      } else {
        throw new Error('Backend not healthy')
      }
    } catch (error) {
      console.log('Backend not ready, will retry...')
      setBackendReady(false)
      setServerStatus(prev => ({
        isWakingUp: true,
        retryCount: prev.retryCount + 1,
        lastError: 'AI Counsellor is waking up. This may take up to 2 minutes...'
      }))

      // Retry after 5 seconds
      setTimeout(checkBackendHealth, 5000)
    } finally {
      setCheckingBackend(false)
    }
  }

  // Load most recent conversation on mount (only after backend is ready)
  useEffect(() => {
    if (backendReady) {
      loadRecentConversation()
    }
  }, [backendReady])

  const loadRecentConversation = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoadingHistory(false)
        return
      }

      // Get most recent conversation
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(1)

      if (conversations && conversations.length > 0) {
        conversationIdRef.current = conversations[0].id
        setCurrentConversationId(conversations[0].id)
        await loadChatHistory(conversations[0].id)
      } else {
        setLoadingHistory(false)
      }
    } catch (error) {
      console.error('Error loading recent conversation:', error)
      setLoadingHistory(false)
    }
  }

  const loadChatHistory = async (conversationId: string) => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading chat history:', error)
        return
      }

      if (data && data.length > 0) {
        setMessages(data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })))
        setTimeout(() => scrollToBottom(), 100)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Use ref to track conversation ID to avoid async state issues
  const conversationIdRef = useRef<string | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    conversationIdRef.current = currentConversationId
  }, [currentConversationId])

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return null

      let convId = conversationIdRef.current

      // Create conversation if first message
      if (!convId) {
        const title = content.substring(0, 50) + (content.length > 50 ? '...' : '')
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title
          })
          .select()
          .single()

        if (convError) {
          console.error('Error creating conversation:', convError)
          return null
        }

        if (newConv) {
          console.log('Created new conversation:', newConv.id)
          convId = newConv.id
          conversationIdRef.current = newConv.id
          setCurrentConversationId(newConv.id)
          // Refresh sidebar to show new conversation
          setSidebarRefresh(prev => prev + 1)
        }
      }

      // Update last_message_at
      if (convId) {
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', convId)
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          conversation_id: convId,
          role,
          content
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving message:', error)
        return null
      }

      return data?.id
    } catch (error) {
      console.error('Error saving message:', error)
      return null
    }
  }

  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToBottom()
      shouldScrollRef.current = false
    }
  }, [messages, typingMessageIndex])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleTypingComplete = useCallback(() => {
    setTypingMessageIndex(null)
  }, [])

  // Voice Input - Speech to Text using OpenAI Whisper
  const startVoiceInput = async () => {
    // If already recording, stop it
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsRecording(false)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        if (audioChunksRef.current.length === 0) {
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType
        })

        // Send to backend for transcription
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()

          if (!session) {
            alert('Please log in to use voice input')
            return
          }

          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/stt`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || 'Speech-to-text failed')
          }

          const result = await response.json()
          if (result.text) {
            setInput(prev => prev + (prev ? ' ' : '') + result.text)
          }
        } catch (error: any) {
          console.error('STT error:', error)
          if (error.message?.includes('API key')) {
            alert('Speech-to-text is not configured. Please add your OpenAI API key.')
          } else {
            alert('Failed to transcribe audio. Please try again.')
          }
        }
      }

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error)
        setIsRecording(false)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err: any) {
      console.error('Failed to start recording:', err)
      if (err.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone permissions in your browser settings.')
      } else {
        alert('Failed to start recording. Please try again.')
      }
      setIsRecording(false)
    }
  }

  // Audio ref for TTS playback
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Voice Output - Text to Speech using ElevenLabs
  const speakMessage = async (messageId: string, content: string) => {
    // Stop if already speaking this message
    if (speakingMessageId === messageId) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
      setSpeakingMessageId(null)
      return
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setSpeakingMessageId(messageId)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        alert('Please log in to use text-to-speech')
        setSpeakingMessageId(null)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text: content }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || 'TTS failed')
      }

      // Get audio blob and play it
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setSpeakingMessageId(null)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }

      audio.onerror = () => {
        console.error('Audio playback error')
        setSpeakingMessageId(null)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }

      await audio.play()

    } catch (error: any) {
      console.error('TTS error:', error)
      setSpeakingMessageId(null)
      // Fallback message
      if (error.message?.includes('API key')) {
        alert('Text-to-speech is not configured. Please add your ElevenLabs API key.')
      }
    }
  }

  const handleSend = async (retryMessage?: string) => {
    const messageToSend = retryMessage || input.trim()
    if (!messageToSend || loading) return

    if (!retryMessage) {
      setInput('')
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }

      saveMessage('user', messageToSend)

      shouldScrollRef.current = true
      setMessages((prev) => [...prev, { role: 'user', content: messageToSend }])
    }

    setLoading(true)
    setServerStatus(prev => ({ ...prev, lastError: null }))

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/counsellor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: messageToSend,
          conversation_id: conversationIdRef.current
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 503 || response.status === 502) {
          setServerStatus({
            isWakingUp: true,
            retryCount: serverStatus.retryCount + 1,
            lastError: errorData?.detail?.message || 'Server is starting up...'
          })
          throw new Error('SERVER_WAKING_UP')
        }

        throw new Error(errorData?.detail?.message || 'Failed to get response')
      }

      const data = await response.json()

      setServerStatus({ isWakingUp: false, retryCount: 0, lastError: null })

      saveMessage('assistant', data.response)

      shouldScrollRef.current = true
      setMessages((prev) => {
        const newIndex = prev.length
        setTypingMessageIndex(newIndex)
        return [...prev, {
          role: 'assistant',
          content: data.response,
          isTyping: true,
          actions: data.actions
        }]
      })
    } catch (error: any) {
      console.error('Chat error:', error)

      if (error.name === 'AbortError' || error.message === 'Failed to fetch' || error.message === 'SERVER_WAKING_UP') {
        setServerStatus({
          isWakingUp: true,
          retryCount: serverStatus.retryCount + 1,
          lastError: 'AI Counsellor is waking up. This may take up to 2 minutes on first request.'
        })
        return
      }

      const errorMessage = "I'm sorry, I encountered an error. Please try again."
      saveMessage('assistant', errorMessage)
      shouldScrollRef.current = true
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMessage },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      handleSend(lastUserMessage.content)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewConversation = () => {
    conversationIdRef.current = null
    setCurrentConversationId(null)
    setMessages([])
    window.speechSynthesis.cancel()
    setSpeakingMessageId(null)
  }

  const handleSelectConversation = (id: string) => {
    conversationIdRef.current = id
    setCurrentConversationId(id)
    setLoadingHistory(true)
    window.speechSynthesis.cancel()
    setSpeakingMessageId(null)
    loadChatHistory(id)
  }

  const quickPrompts = [
    {
      title: 'Recommend universities',
      subtitle: 'for my profile',
      prompt: 'Recommend universities for my profile',
      icon: (
        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      ),
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    },
    {
      title: 'What are my chances',
      subtitle: 'at top schools?',
      prompt: 'What are my chances at top schools?',
      icon: (
        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      ),
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    },
    {
      title: 'Help me build',
      subtitle: 'my shortlist',
      prompt: 'Help me build my shortlist',
      icon: (
        <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      ),
      iconBg: 'bg-orange-100 dark:bg-orange-500/20',
    },
    {
      title: 'What should I improve',
      subtitle: 'in my profile?',
      prompt: 'What should I work on to improve my profile?',
      icon: (
        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      ),
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    },
  ]

  // Backend wake-up state
  if (!backendReady) {
    return (
      <div className="flex h-[calc(100vh-5rem)] lg:h-[calc(100vh-4rem)]">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-md text-center">
            {/* Animated server icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
                </svg>
              </div>
              {/* Spinning loader */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-emerald-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Waking up AI Buddy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {serverStatus.lastError || 'Connecting to the server...'}
            </p>

            {/* Progress indicator */}
            <div className="w-full max-w-xs mx-auto mb-4">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-500">
              {serverStatus.retryCount > 0 && `Attempt ${serverStatus.retryCount} • `}
              Free tier servers sleep after inactivity
            </p>

            {serverStatus.retryCount >= 3 && (
              <button
                onClick={checkBackendHealth}
                className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loadingHistory) {
    return (
      <div className="flex h-[calc(100vh-5rem)] lg:h-[calc(100vh-4rem)]">
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          refreshTrigger={sidebarRefresh}
        />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-7.5-8-11a8 8 0 1116 0c0 3.5-4 7-8 11z"/>
              <circle cx="12" cy="10" r="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path fill="currentColor" d="M12 7.5l-3 1.5 3 1.5 3-1.5-3-1.5z"/>
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Loading your conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] lg:h-[calc(100vh-4rem)]">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        refreshTrigger={sidebarRefresh}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Buddy</h1>
          </div>
          <button
            onClick={handleNewConversation}
            className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            New Chat
          </button>
        </div>

        {/* Initial centered view when no messages */}
        {!hasConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/25">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-7.5-8-11a8 8 0 1116 0c0 3.5-4 7-8 11z"/>
                  <circle cx="12" cy="10" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path fill="currentColor" d="M12 7.5l-3 1.5 3 1.5 3-1.5-3-1.5z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5v1.5c0 .5 1.1 1 2.5 1s2.5-.5 2.5-1V9.5"/>
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                How can I help you today?
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-md">
                Your AI study abroad counsellor is here to guide your journey
              </p>
            </div>

            <div className="w-full max-w-2xl mb-6">
              <div className="flex items-end gap-2 bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-gray-200/50 dark:border-white/10 p-2 sm:p-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about studying abroad..."
                  rows={1}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none text-sm sm:text-base"
                  disabled={loading}
                />
                {/* Mic Button */}
                <button
                  onClick={startVoiceInput}
                  disabled={loading}
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all flex-shrink-0 ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="p-2.5 sm:p-3 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex-shrink-0"
                >
                  {loading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="w-full max-w-2xl grid grid-cols-2 gap-2 sm:gap-3">
              {quickPrompts.map((item) => (
                <button
                  key={item.prompt}
                  onClick={() => setInput(item.prompt)}
                  className="text-left p-3 sm:p-4 bg-white/60 dark:bg-white/[0.05] hover:bg-white/80 dark:hover:bg-white/[0.08] rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-white/10 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-shrink-0 mt-1">
                        {message.role === 'assistant' ? (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-7.5-8-11a8 8 0 1116 0c0 3.5-4 7-8 11z"/>
                              <circle cx="12" cy="10" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                              <path fill="currentColor" d="M12 7.5l-3 1.5 3 1.5 3-1.5-3-1.5z"/>
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white'
                              : 'bg-white/80 dark:bg-white/[0.08] shadow-lg border border-gray-100 dark:border-white/10'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <p className="text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            index === typingMessageIndex ? (
                              <TypewriterText content={message.content} onComplete={handleTypingComplete} />
                            ) : (
                              <RenderedMessage content={message.content} />
                            )
                          )}
                        </div>

                        {/* Read Aloud Button for Assistant Messages */}
                        {message.role === 'assistant' && index !== typingMessageIndex && (
                          <div className="flex items-center gap-2 ml-1">
                            <button
                              onClick={() => speakMessage(message.id || `msg-${index}`, message.content)}
                              className={`p-1.5 rounded-lg transition-all ${
                                speakingMessageId === (message.id || `msg-${index}`)
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                              }`}
                              title={speakingMessageId === (message.id || `msg-${index}`) ? 'Stop' : 'Read aloud'}
                            >
                              {speakingMessageId === (message.id || `msg-${index}`) ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                                </svg>
                              )}
                            </button>

                            {/* Action badges */}
                            {message.actions && message.actions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {message.actions.map((action, i) => (
                                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${
                                    action.type === 'create_task' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300' :
                                    action.type === 'lock_university' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300' :
                                    action.type === 'shortlist_university' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                  }`}>
                                    {action.type === 'create_task' ? 'Task created' :
                                     action.type === 'lock_university' ? 'Locked' :
                                     action.type === 'shortlist_university' ? 'Shortlisted' :
                                     action.type}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Server Waking Up Indicator */}
                {serverStatus.isWakingUp && !loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[90%] sm:max-w-[85%]">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 mt-1">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-500/10 shadow-lg border border-amber-200 dark:border-amber-500/20 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="font-medium text-amber-700 dark:text-amber-300 text-sm">AI Counsellor is waking up...</span>
                        </div>
                        <p className="text-amber-600 dark:text-amber-400 text-sm mb-3">
                          Our free server goes to sleep after 15 minutes of inactivity. Please wait up to 2 minutes while it starts up.
                        </p>
                        <button
                          onClick={handleRetry}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[85%] sm:max-w-[80%]">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mt-1">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-7.5-8-11a8 8 0 1116 0c0 3.5-4 7-8 11z"/>
                          <circle cx="12" cy="10" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                          <path fill="currentColor" d="M12 7.5l-3 1.5 3 1.5 3-1.5-3-1.5z"/>
                        </svg>
                      </div>
                      <div className="bg-white/80 dark:bg-white/[0.08] shadow-lg border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-3">
                        {serverStatus.isWakingUp ? (
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Waking up server... please wait</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Bottom Input */}
            <div className="border-t border-gray-200/50 dark:border-white/10 bg-gradient-to-t from-emerald-50/50 via-green-50/50 to-transparent dark:from-[#0a0a12]/80 dark:via-[#13131f]/50 dark:to-transparent">
              <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
                <div className="flex items-end gap-2 bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-gray-200/50 dark:border-white/10 p-2 sm:p-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message StudyBuddy..."
                    rows={1}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none text-sm sm:text-base"
                    disabled={loading}
                  />
                  {/* Mic Button */}
                  <button
                    onClick={startVoiceInput}
                    disabled={loading}
                    className={`p-2 sm:p-2.5 rounded-xl transition-all flex-shrink-0 ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Voice input'}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="p-2 sm:p-2.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex-shrink-0"
                  >
                    {loading ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                  StudyBuddy can make mistakes. Verify important information.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
