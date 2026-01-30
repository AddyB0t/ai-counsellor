'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn, getCategoryColor } from '@/lib/utils'
import type { Task, ShortlistedUniversity } from '@/types'

const CATEGORIES = ['All', 'Exams', 'Documents', 'Applications', 'Other']

// SVG Icons
const Icons = {
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  ),
  building: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
    </svg>
  ),
  lock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>
  ),
  lockClosed: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>
  ),
  tasks: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
    </svg>
  ),
  checkCircle: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  ),
  unlock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
    </svg>
  ),
}

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [lockedUniversities, setLockedUniversities] = useState<ShortlistedUniversity[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showCompleted, setShowCompleted] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('Other')
  const [showAddTask, setShowAddTask] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Load locked universities
    const { data: shortlistData } = await supabase
      .from('shortlisted_universities')
      .select('*, university:universities(*)')
      .eq('user_id', user.id)
      .eq('is_locked', true)

    if (shortlistData) setLockedUniversities(shortlistData)

    // Load tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*, university:universities(*)')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })

    if (tasksData) setTasks(tasksData)

    setLoading(false)
  }

  const toggleTask = async (task: Task) => {
    const supabase = createClient()

    await supabase
      .from('tasks')
      .update({ is_completed: !task.is_completed })
      .eq('id', task.id)

    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, is_completed: !t.is_completed } : t)))
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('tasks').insert({
      user_id: user.id,
      title: newTaskTitle,
      category: newTaskCategory,
    })

    setNewTaskTitle('')
    setShowAddTask(false)
    loadData()
  }

  const deleteTask = async (taskId: string) => {
    const supabase = createClient()
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const unlockUniversity = async (shortlistId: string) => {
    const supabase = createClient()
    await supabase
      .from('shortlisted_universities')
      .update({ is_locked: false })
      .eq('id', shortlistId)

    setLockedUniversities(lockedUniversities.filter(u => u.id !== shortlistId))
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory
    // When showCompleted is true, show only completed tasks
    // When showCompleted is false, show only incomplete tasks
    const matchesCompleted = showCompleted ? task.is_completed : !task.is_completed
    return matchesCategory && matchesCompleted
  })

  // Group tasks by university
  const tasksByUniversity = filteredTasks.reduce((groups, task) => {
    const uniId = task.university_id || 'general'
    if (!groups[uniId]) {
      groups[uniId] = {
        university: task.university || null,
        tasks: []
      }
    }
    groups[uniId].tasks.push(task)
    return groups
  }, {} as Record<string, { university: any; tasks: Task[] }>)

  // Calculate progress per university
  const getUniversityProgress = (uniId: string) => {
    const uniTasks = tasks.filter(t => (t.university_id || 'general') === uniId)
    const completed = uniTasks.filter(t => t.is_completed).length
    return { completed, total: uniTasks.length }
  }

  const completedCount = tasks.filter((t) => t.is_completed).length
  const totalCount = tasks.length

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center animate-pulse">
          <div className="text-white">{Icons.tasks}</div>
        </div>
      </div>
    )
  }

  if (lockedUniversities.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <div className="text-gray-400 dark:text-gray-500 w-10 h-10">{Icons.lock}</div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            No Universities Locked Yet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Lock at least one university from your shortlist to unlock application tasks and guidance.
          </p>
          <a
            href="/universities"
            className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all hover:scale-[1.02]"
          >
            <span className="w-5 h-5">{Icons.building}</span>
            Go to Universities
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
              Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your application progress and tasks
            </p>
          </div>
          <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg shadow-emerald-500/5">
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
              {completedCount}/{totalCount}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">tasks completed</p>
          </div>
        </div>

        {/* Locked Universities */}
        <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-transparent dark:border-white/10 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-500/20 dark:to-green-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {Icons.lockClosed}
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Locked Universities</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {lockedUniversities.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium group',
                  item.category === 'dream' && 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
                  item.category === 'target' && 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                  item.category === 'safe' && 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                )}
              >
                <span className="w-4 h-4">{Icons.lockClosed}</span>
                <span>{item.university.name}</span>
                <span className="text-sm opacity-75 capitalize">({item.category})</span>
                <button
                  onClick={() => unlockUniversity(item.id)}
                  className="ml-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                  title="Unlock university"
                >
                  {Icons.unlock}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Task Filters */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-4 py-2.5 rounded-xl transition-all font-medium',
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-white/70 dark:bg-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.12]'
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(
              'px-4 py-2.5 rounded-xl transition-all font-medium flex items-center gap-2',
              showCompleted
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white/70 dark:bg-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.12]'
            )}
          >
            <span className="w-4 h-4">{Icons.check}</span>
            {showCompleted ? 'Showing Completed' : 'Show Completed'}
          </button>

          <button
            onClick={() => setShowAddTask(true)}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all hover:scale-[1.02]"
          >
            {Icons.plus}
            Add Task
          </button>
        </div>

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Task</h3>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500"
                >
                  {Icons.close}
                </button>
              </div>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-0 focus:outline-none transition-colors"
                autoFocus
              />
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-6 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-0 focus:outline-none transition-colors"
              >
                <option value="Exams">Exams</option>
                <option value="Documents">Documents</option>
                <option value="Applications">Applications</option>
                <option value="Other">Other</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List - Grouped by University */}
        <div className="space-y-6">
          {Object.entries(tasksByUniversity).map(([uniId, { university, tasks: uniTasks }]) => {
            const progress = getUniversityProgress(uniId)
            const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0

            return (
              <div key={uniId} className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-transparent dark:border-white/10">
                {/* University Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      university ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    )}>
                      {university ? Icons.building : Icons.tasks}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {university?.name || 'General Tasks'}
                      </h3>
                      {university?.country && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{university.country}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {progress.completed}/{progress.total} completed
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  {uniTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-white/5 group',
                        task.is_completed && 'opacity-60'
                      )}
                    >
                      <button
                        onClick={() => toggleTask(task)}
                        className={cn(
                          'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0',
                          task.is_completed
                            ? 'bg-gradient-to-br from-emerald-400 to-green-500 border-emerald-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500'
                        )}
                      >
                        {task.is_completed && Icons.check}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-gray-900 dark:text-white font-medium text-sm',
                          task.is_completed && 'line-through'
                        )}>
                          {task.title}
                        </p>
                      </div>

                      {task.category && (
                        <span className={cn(
                          'px-2 py-1 rounded-md text-xs font-medium',
                          task.category === 'Exams' && 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
                          task.category === 'Documents' && 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                          task.category === 'Applications' && 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
                          task.category === 'Other' && 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                        )}>
                          {task.category}
                        </span>
                      )}

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete task"
                      >
                        {Icons.trash}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {filteredTasks.length === 0 && (
            <div className="text-center py-16 bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-transparent dark:border-white/10">
              <div className="text-emerald-500 mx-auto mb-4 w-12 h-12">{Icons.checkCircle}</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {tasks.length === 0
                  ? 'No tasks yet. Add some to get started!'
                  : 'All tasks in this category are completed!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
