"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Cloud, CloudOff, Loader2, Database } from "lucide-react"
import { supabase, type Database as DatabaseType } from "./lib/supabase"

type Task = DatabaseType["public"]["Tables"]["tasks"]["Row"]

interface TaskGroup {
  title: string
  tasks: Task[]
}

type ConnectionStatus = "connecting" | "connected" | "error" | "needs-setup"

// 默认任务数据（当需要初始化时使用）
const defaultTaskGroups: TaskGroup[] = [
  {
    title: "第一阶段：准备与规划",
    tasks: [
      {
        id: "1-1",
        group_title: "第一阶段：准备与规划",
        task_text: "用10分钟，列出对报告的所有疑问（不求完美，目标是头脑风暴）",
        completed: false,
        group_order: 1,
        task_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "1-2",
        group_title: "第一阶段：准备与规划",
        task_text: "创建一个简单的报告大纲，确定需要分析的关键维度",
        completed: false,
        group_order: 1,
        task_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "1-3",
        group_title: "第一阶段：准备与规划",
        task_text: "安排15分钟与主管沟通，确认报告范围和期望（记住：提问是专业的表现，不是能力不足）",
        completed: false,
        group_order: 1,
        task_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    title: "第二阶段：数据收集",
    tasks: [
      {
        id: "2-1",
        group_title: "第二阶段：数据收集",
        task_text: "为每个产品分配30分钟，收集基本信息（使用番茄工作法，每30分钟休息5分钟）",
        completed: false,
        group_order: 2,
        task_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2-2",
        group_title: "第二阶段：数据收集",
        task_text: "咨询产品部门获取数据或测试（记住：团队合作是工作的一部分）",
        completed: false,
        group_order: 2,
        task_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    title: "第三阶段：分析与撰写",
    tasks: [
      {
        id: "3-1",
        group_title: "第三阶段：分析与撰写",
        task_text: "创建比较表格，突出各产品的优缺点",
        completed: false,
        group_order: 3,
        task_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3-2",
        group_title: "第三阶段：分析与撰写",
        task_text: "撰写初稿（不求完美，目标是有一个可迭代的版本）",
        completed: false,
        group_order: 3,
        task_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3-3",
        group_title: "第三阶段：分析与撰写",
        task_text: "请一位信任的同事审阅并提供优化建议",
        completed: false,
        group_order: 3,
        task_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3-4",
        group_title: "第三阶段：分析与撰写",
        task_text: "根据反馈修改并完善报告",
        completed: false,
        group_order: 3,
        task_order: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
]

export default function Component() {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingUpDatabase, setIsSettingUpDatabase] = useState(false)

  // 设置数据库表
  const setupDatabase = async () => {
    setIsSettingUpDatabase(true)
    try {
      // 检查是否有数据，如果没有则插入默认数据
      const { data: existingTasks, error: selectError } = await supabase.from("tasks").select("id").limit(1)

      if (selectError && !selectError.message.includes("does not exist")) {
        throw selectError
      }

      // 如果没有数据，插入默认数据
      if (!existingTasks || existingTasks.length === 0) {
        const tasksToInsert = defaultTaskGroups.flatMap((group, groupIndex) =>
          group.tasks.map((task, taskIndex) => ({
            group_title: group.title,
            task_text: task.task_text,
            completed: false,
            group_order: groupIndex + 1,
            task_order: taskIndex + 1,
          })),
        )

        const { error: insertError } = await supabase.from("tasks").insert(tasksToInsert)

        if (insertError) {
          throw insertError
        }
      }

      setConnectionStatus("connected")
      setErrorMessage("")
      loadTasks()
    } catch (error) {
      console.error("设置数据库失败:", error)
      setConnectionStatus("error")
      setErrorMessage("数据库设置失败：" + (error instanceof Error ? error.message : "未知错误"))
      // 使用默认数据作为后备
      setTaskGroups(defaultTaskGroups)
    } finally {
      setIsSettingUpDatabase(false)
    }
  }

  // 从Supabase加载任务
  const loadTasks = async () => {
    try {
      setIsLoading(true)
      setConnectionStatus("connecting")

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("group_order", { ascending: true })
        .order("task_order", { ascending: true })

      if (error) {
        if (
          error.message.includes("table") &&
          (error.message.includes("does not exist") || error.message.includes("schema cache"))
        ) {
          setConnectionStatus("needs-setup")
          setErrorMessage("数据库表不存在，需要初始化")
          setTaskGroups(defaultTaskGroups)
          return
        }
        throw error
      }

      // 按组分组任务
      const groupedTasks: { [key: string]: Task[] } = {}
      data.forEach((task) => {
        if (!groupedTasks[task.group_title]) {
          groupedTasks[task.group_title] = []
        }
        groupedTasks[task.group_title].push(task)
      })

      // 转换为TaskGroup格式
      const groups: TaskGroup[] = Object.entries(groupedTasks).map(([title, tasks]) => ({
        title,
        tasks,
      }))

      setTaskGroups(groups)
      setConnectionStatus("connected")
      setErrorMessage("")
    } catch (error) {
      console.error("加载任务失败:", error)
      setConnectionStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "连接数据库失败")
      // 使用默认数据作为后备
      setTaskGroups(defaultTaskGroups)
    } finally {
      setIsLoading(false)
    }
  }

  // 更新任务状态
  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    if (connectionStatus !== "connected") {
      // 本地模式：只更新本地状态
      setTaskGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          tasks: group.tasks.map((task) => (task.id === taskId ? { ...task, completed: !currentStatus } : task)),
        })),
      )
      return
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          completed: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)

      if (error) {
        throw error
      }

      // 更新本地状态
      setTaskGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          tasks: group.tasks.map((task) => (task.id === taskId ? { ...task, completed: !currentStatus } : task)),
        })),
      )
    } catch (error) {
      console.error("更新任务状态失败:", error)
      // 即使更新失败，也更新本地状态以提供更好的用户体验
      setTaskGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          tasks: group.tasks.map((task) => (task.id === taskId ? { ...task, completed: !currentStatus } : task)),
        })),
      )
    }
  }

  // 组件挂载时加载任务
  useEffect(() => {
    loadTasks()
  }, [])

  // 计算总进度
  const totalTasks = taskGroups.reduce((sum, group) => sum + group.tasks.length, 0)
  const completedTasks = taskGroups.reduce((sum, group) => sum + group.tasks.filter((task) => task.completed).length, 0)
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const isAllCompleted = completedTasks === totalTasks && totalTasks > 0

  // 连接状态组件
  const ConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case "connecting":
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">连接云端数据中...</span>
          </div>
        )
      case "connected":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Cloud className="w-4 h-4" />
            <span className="text-sm">已成功连接云端数据</span>
          </div>
        )
      case "needs-setup":
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-orange-600">
              <Database className="w-4 h-4" />
              <span className="text-sm">需要初始化数据库</span>
            </div>
            <p className="text-xs text-orange-600">数据库表不存在，点击下方按钮创建</p>
            <button
              onClick={setupDatabase}
              disabled={isSettingUpDatabase}
              className="text-xs text-green-600 hover:text-green-800 underline disabled:opacity-50 mt-1"
            >
              {isSettingUpDatabase ? "初始化中..." : "初始化数据库"}
            </button>
          </div>
        )
      case "error":
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-red-600">
              <CloudOff className="w-4 h-4" />
              <span className="text-sm">云端连接失败</span>
            </div>
            <p className="text-xs text-red-500">{errorMessage}</p>
            <button onClick={loadTasks} className="text-xs text-blue-600 hover:text-blue-800 underline mt-1">
              重试连接
            </button>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">加载任务列表中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题和进度 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">报告任务清单</h1>

          {/* 连接状态指示器 */}
          <div className="mb-4">
            <ConnectionStatusIndicator />
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-medium text-gray-700">完成进度</span>
              <span className="text-lg font-bold text-blue-600">
                {completedTasks}/{totalTasks}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3 mb-2" />
            <div className="text-center">
              {isAllCompleted ? (
                <span className="text-green-600 font-semibold text-lg">🎉 所有任务已完成！</span>
              ) : (
                <span className="text-gray-600">{progressPercentage}% 完成</span>
              )}
            </div>
          </div>
        </div>

        {/* 任务列表 */}
        <div className="space-y-6">
          {taskGroups.map((group, groupIndex) => (
            <Card key={groupIndex} className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="text-xl md:text-2xl font-bold">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {group.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={`p-4 md:p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                        task.completed ? "bg-green-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {task.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-base md:text-lg leading-relaxed ${
                              task.completed ? "text-green-700 line-through" : "text-gray-800"
                            }`}
                          >
                            {task.task_text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm md:text-base">点击任务可以切换完成状态 • 总共 {totalTasks} 个任务</p>
          {connectionStatus === "connected" && <p className="text-xs mt-2 text-gray-500">数据实时同步到云端</p>}
          {connectionStatus !== "connected" && (
            <p className="text-xs mt-2 text-amber-600">本地模式：数据仅保存在浏览器中</p>
          )}
        </div>
      </div>
    </div>
  )
}
