import { createClient } from "@supabase/supabase-js"

// 直接使用提供的Supabase配置
const supabaseUrl = "https://jnjxhjwyfsznyidxmdxt.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impuanhoand5ZnN6bnlpZHhtZHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTQxODUsImV4cCI6MjA2OTk3MDE4NX0.UTEU4k00XY5fIVhXtJWcxOZjdAevXoe8wqXnkEZrhbY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          group_title: string
          task_text: string
          completed: boolean
          group_order: number
          task_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_title: string
          task_text: string
          completed?: boolean
          group_order: number
          task_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_title?: string
          task_text?: string
          completed?: boolean
          group_order?: number
          task_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
