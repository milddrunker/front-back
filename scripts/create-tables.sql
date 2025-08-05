-- 创建任务表（如果不存在）
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_title TEXT NOT NULL,
  task_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  group_order INTEGER NOT NULL,
  task_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 去除RLS (Row Level Security) - Demo产品设置
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- 创建或替换更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除现有触发器（如果存在）
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;

-- 创建更新时间触发器
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 插入初始任务数据（仅在表为空时）
INSERT INTO public.tasks (group_title, task_text, group_order, task_order, completed)
SELECT * FROM (VALUES
  -- 第一阶段：准备与规划
  ('第一阶段：准备与规划', '用10分钟，列出对报告的所有疑问（不求完美，目标是头脑风暴）', 1, 1, false),
  ('第一阶段：准备与规划', '创建一个简单的报告大纲，确定需要分析的关键维度', 1, 2, false),
  ('第一阶段：准备与规划', '安排15分钟与主管沟通，确认报告范围和期望（记住：提问是专业的表现，不是能力不足）', 1, 3, false),
  
  -- 第二阶段：数据收集
  ('第二阶段：数据收集', '为每个产品分配30分钟，收集基本信息（使用番茄工作法，每30分钟休息5分钟）', 2, 1, false),
  ('第二阶段：数据收集', '咨询产品部门获取数据或测试（记住：团队合作是工作的一部分）', 2, 2, false),
  
  -- 第三阶段：分析与撰写
  ('第三阶段：分析与撰写', '创建比较表格，突出各产品的优缺点', 3, 1, false),
  ('第三阶段：分析与撰写', '撰写初稿（不求完美，目标是有一个可迭代的版本）', 3, 2, false),
  ('第三阶段：分析与撰写', '请一位信任的同事审阅并提供优化建议', 3, 3, false),
  ('第三阶段：分析与撰写', '根据反馈修改并完善报告', 3, 4, false)
) AS new_tasks(group_title, task_text, group_order, task_order, completed)
WHERE NOT EXISTS (SELECT 1 FROM public.tasks LIMIT 1);
