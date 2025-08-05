import { supabase } from "./supabase"
import { md5 } from "./utils"

export interface User {
  id: string
  username: string
  created_at: string
}

export interface AuthError {
  message: string
}

// 用户注册
export async function registerUser(username: string, password: string): Promise<{ user?: User; error?: AuthError }> {
  try {
    // 检查用户名是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single()

    if (existingUser) {
      return { error: { message: "用户名已存在" } }
    }

    // 创建新用户
    const passwordHash = md5(password)
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        username,
        password_hash: passwordHash,
      })
      .select("id, username, created_at")
      .single()

    if (insertError) {
      return { error: { message: "注册失败：" + insertError.message } }
    }

    // 为新用户初始化任务列表
    await initializeUserTasks(newUser.id)

    return { user: newUser }
  } catch (error) {
    return { error: { message: "注册失败：" + (error instanceof Error ? error.message : "未知错误") } }
  }
}

// 用户登录
export async function loginUser(username: string, password: string): Promise<{ user?: User; error?: AuthError }> {
  try {
    const passwordHash = md5(password)
    
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, created_at")
      .eq("username", username)
      .eq("password_hash", passwordHash)
      .single()

    if (error || !user) {
      return { error: { message: "用户名或密码错误" } }
    }

    return { user }
  } catch (error) {
    return { error: { message: "登录失败：" + (error instanceof Error ? error.message : "未知错误") } }
  }
}

// 为新用户初始化任务列表
async function initializeUserTasks(userId: string): Promise<void> {
  try {
    // 获取默认任务模板
    const { data: defaultTasks, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .order("group_order", { ascending: true })
      .order("task_order", { ascending: true })

    if (fetchError || !defaultTasks) {
      console.error("获取默认任务失败:", fetchError)
      return
    }

    // 为用户创建任务副本
    const userTasks = defaultTasks.map(task => ({
      user_id: userId,
      group_title: task.group_title,
      task_text: task.task_text,
      completed: false,
      group_order: task.group_order,
      task_order: task.task_order,
    }))

    const { error: insertError } = await supabase
      .from("user_tasks")
      .insert(userTasks)

    if (insertError) {
      console.error("初始化用户任务失败:", insertError)
    }
  } catch (error) {
    console.error("初始化用户任务失败:", error)
  }
}

// 获取用户任务
export async function getUserTasks(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .order("group_order", { ascending: true })
      .order("task_order", { ascending: true })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("获取用户任务失败:", error)
    return []
  }
}

// 更新用户任务状态
export async function updateUserTask(taskId: string, completed: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_tasks")
      .update({
        completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("更新任务状态失败:", error)
    return false
  }
}

// 会话管理
export const sessionManager = {
  // 保存用户会话
  saveSession: (user: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_session", JSON.stringify(user))
    }
  },

  // 获取当前会话
  getSession: (): User | null => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("user_session")
      return session ? JSON.parse(session) : null
    }
    return null
  },

  // 清除会话
  clearSession: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_session")
    }
  },

  // 检查是否已登录
  isLoggedIn: (): boolean => {
    return sessionManager.getSession() !== null
  }
} 