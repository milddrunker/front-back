// 动态导入Supabase以处理加载错误
let SupabaseClient: any = null
let createClientFunction: any = null

// 检查Supabase是否可用
let isSupabaseAvailable = false

async function initializeSupabase() {
  try {
    const supabaseModule = await import("@supabase/supabase-js")
    createClientFunction = supabaseModule.createClient
    SupabaseClient = supabaseModule.SupabaseClient
    isSupabaseAvailable = true
    return true
  } catch (error) {
    console.warn("Supabase library not available:", error)
    isSupabaseAvailable = false
    return false
  }
}

class SupabaseManager {
  private client: any = null
  private config: { url: string; key: string } | null = null
  private initialized = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    await initializeSupabase()
    this.initialized = true

    // 尝试从环境变量加载配置
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (envUrl && envKey && isSupabaseAvailable) {
      this.setConfig(envUrl, envKey)
    } else {
      // 尝试从localStorage加载配置
      this.loadConfigFromStorage()
    }
  }

  async setConfig(url: string, key: string) {
    if (!isSupabaseAvailable) {
      throw new Error("Supabase library is not available")
    }

    if (!this.initialized) {
      await this.initialize()
    }

    this.config = { url, key }

    if (createClientFunction) {
      this.client = createClientFunction(url, key)
    }

    // 保存到localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("supabase_config", JSON.stringify({ url, key }))
    }
  }

  private async loadConfigFromStorage() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("supabase_config")
      if (stored && isSupabaseAvailable) {
        try {
          const config = JSON.parse(stored)
          await this.setConfig(config.url, config.key)
        } catch (error) {
          console.error("Failed to load Supabase config from storage:", error)
        }
      }
    }
  }

  getClient() {
    return this.client
  }

  isConfigured(): boolean {
    return this.client !== null && isSupabaseAvailable
  }

  isLibraryAvailable(): boolean {
    return isSupabaseAvailable
  }

  getConfig() {
    return this.config
  }

  clearConfig() {
    this.client = null
    this.config = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("supabase_config")
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client || !isSupabaseAvailable) return false

    try {
      const { error } = await this.client.from("tasks").select("count").limit(1)
      return !error || error.message.includes('relation "tasks" does not exist')
    } catch {
      return false
    }
  }

  async waitForInitialization(): Promise<void> {
    while (!this.initialized) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

export const supabaseManager = new SupabaseManager()
