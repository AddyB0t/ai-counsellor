'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Task {
  id: string
  title: string
  description?: string
  category?: string
  is_completed: boolean
  due_date?: string
}

interface University {
  id: string
  name: string
  country: string
  ranking?: number
}

interface Props {
  university: University
  category: 'dream' | 'target' | 'safe'
  tasks: Task[]
  completedCount: number
  totalCount: number
  onTaskToggle: () => void
}

export default function UniversityTaskBox({
  university,
  category,
  tasks,
  completedCount,
  totalCount,
  onTaskToggle
}: Props) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const supabase = createClient()
      await supabase.from('tasks').update({ is_completed: !completed }).eq('id', taskId)
      onTaskToggle()
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const categoryColors = {
    dream: 'from-purple-400 to-violet-500',
    target: 'from-blue-400 to-indigo-500',
    safe: 'from-emerald-400 to-green-500'
  }

  const categoryBg = {
    dream: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
    target: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
    safe: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
  }

  return (
    <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-white/10 overflow-hidden">
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${categoryColors[category]} p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-lg truncate">{university.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/80 text-sm">{university.country}</span>
              {university.ranking && (
                <span className="text-white/60 text-xs">#{university.ranking}</span>
              )}
            </div>
          </div>
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${categoryBg[category]} bg-opacity-90`}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {completedCount}/{totalCount}
            <span className="text-sm font-normal text-gray-400 ml-1">tasks</span>
          </span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${categoryColors[category]} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && totalCount > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All tasks completed!
          </p>
        )}
      </div>

      {/* Tasks List */}
      <div className="p-4 pt-3">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-6">
              <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-gray-400 dark:text-gray-500">No tasks yet</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Tasks will appear when you chat with AI</p>
            </div>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                className={`
                  rounded-xl border transition-all
                  ${task.is_completed
                    ? 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5'
                    : 'bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                  }
                `}
              >
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTask(task.id, task.is_completed)
                    }}
                    className={`
                      w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5
                      ${task.is_completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-400'
                      }
                    `}
                  >
                    {task.is_completed && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                      {task.title}
                    </p>
                    {task.category && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{task.category}</span>
                    )}
                  </div>

                  {task.description && (
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${expandedTask === task.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>

                {/* Expanded description */}
                {expandedTask === task.id && task.description && (
                  <div className="px-3 pb-3 pt-0 ml-8">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {task.description}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
