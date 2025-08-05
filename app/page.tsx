"use client"

import { useState, useEffect } from "react"
import TaskList from "../task-list"
import AuthForm from "@/components/auth-form"
import { sessionManager, type User } from "@/lib/auth"

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检查用户是否已登录
    const currentUser = sessionManager.getSession()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const handleAuthSuccess = (user: User) => {
    setUser(user)
  }

  const handleLogout = () => {
    sessionManager.clearSession()
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onSuccess={handleAuthSuccess} />
  }

  return (
    <div>
      <TaskList currentUser={user} onLogout={handleLogout} />
    </div>
  )
}
