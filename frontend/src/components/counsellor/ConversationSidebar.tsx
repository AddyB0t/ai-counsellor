'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  last_message_at: string
}

interface Props {
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  isOpen: boolean
  onClose: () => void
  refreshTrigger?: number
}

export default function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onClose,
  refreshTrigger = 0
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [refreshTrigger])

  const loadConversations = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found when loading conversations')
        return
      }

      console.log('Loading conversations for user:', user.id)
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        return
      }

      console.log('Loaded conversations:', data?.length || 0)
      if (data) setConversations(data)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const supabase = createClient()
      await supabase.from('conversations').delete().eq('id', id)
      setConversations(prev => prev.filter(c => c.id !== id))

      if (currentConversationId === id) {
        onNewConversation()
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups, conv) => {
    const date = formatDate(conv.last_message_at)
    if (!groups[date]) groups[date] = []
    groups[date].push(conv)
    return groups
  }, {} as Record<string, Conversation[]>)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 bg-white/95 dark:bg-[#0f1419]/95 backdrop-blur-xl
        border-r border-gray-200 dark:border-white/10
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <button
            onClick={() => {
              onNewConversation()
              onClose()
            }}
            className="w-full px-4 py-3 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No conversations yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedConversations).map(([date, convs]) => (
                <div key={date}>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 px-3 py-1 uppercase tracking-wider">
                    {date}
                  </p>
                  <div className="space-y-1">
                    {convs.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          onSelectConversation(conv.id)
                          onClose()
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            onSelectConversation(conv.id)
                            onClose()
                          }
                        }}
                        className={`
                          w-full text-left px-3 py-2.5 rounded-xl transition-all group cursor-pointer
                          flex items-center justify-between gap-2
                          ${currentConversationId === conv.id
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <svg className="w-4 h-4 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="truncate text-sm">{conv.title}</span>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all flex-shrink-0"
                          title="Delete conversation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </>
  )
}
