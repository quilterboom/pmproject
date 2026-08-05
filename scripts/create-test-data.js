/**
 * 创建测试数据脚本
 * 为每个项目类型创建 20 条测试数据，内容参数各不相同
 */

const dm = require('dmdb');

const dbConfig = {
  host: '129.226.220.194',
  port: 5236,
  user: 'SYSDBA',
  password: 'SYSDBA000',
};

const connectionString = `dm://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}`;

// 项目类型数据
const projectTypes = [
  { id: 1, name: '专项任务', priority: 1 },
  { id: 2, name: '日常任务-短期', priority: 2 },
  { id: 3, name: '日常任务-长期', priority: 2 }
];

// 负责人数据
const managers = [
  { name: '张怡波', phone: '17328775339' },
  { name: '刘宇鹏', phone: '13713977396' },
  { name: '魏嘉昕', phone: '15350400815' },
  { name: '王建国', phone: '13812345678' },
  { name: '李明', phone: '13987654321' },
  { name: '赵红', phone: '13656789012' },
  { name: '孙伟', phone: '13567890123' },
  { name: '周丽', phone: '13789012345' },
  { name: '吴强', phone: '13890123456' },
  { name: '郑华', phone: '13901234567' }
];

// 专项任务名称和描述
const specialTaskData = [
  { name: '第二季度工业机监督检查', desc: '对专用工具库和仪控部的工业机进行全面检查，确保设备运行正常', progress: 40, days: 60 },
  { name: '核安全级DCS系统升级改造', desc: '实施核安全级DCS系统软件升级，提高系统可靠性和安全性', progress: 25, days: 120 },
  { name: '反应堆冷却剂泵定期维护', desc: '完成2号机组反应堆冷却剂泵的年度检修和维护工作', progress: 60, days: 45 },
  { name: '汽轮机振动监测系统改造', desc: '升级汽轮机振动监测系统，引入智能诊断功能', progress: 10, days: 90 },
  { name: '核燃料运输容器检查', desc: '对库存核燃料运输容器进行全面检测和评估', progress: 80, days: 30 },
  { name: '应急柴油发电机测试', desc: '执行每月一次的应急柴油发电机带载试验', progress: 55, days: 7 },
  { name: '主控室人机界面优化', desc: '优化主控室操作界面，提升人机交互效率', progress: 35, days: 75 },
  { name: '电气系统绝缘监测', desc: '对1-4号机组电气系统进行绝缘在线监测改造', progress: 45, days: 50 },
  { name: '核岛通风系统改造', desc: '更换核岛通风系统过滤器，提升通风效率', progress: 20, days: 40 },
  { name: '汽轮机高中压缸检修', desc: '完成3号机组汽轮机高中压缸的内缸检修', progress: 70, days: 55 },
  { name: '核废料处理系统升级', desc: '升级核废料处理系统，增加智能化监控功能', progress: 15, days: 100 },
  { name: '循环水系统防腐处理', desc: '对循环水系统管道进行防腐涂层施工', progress: 50, days: 35 },
  { name: '电气保护装置校验', desc: '完成全厂电气保护装置的年度校验工作', progress: 65, days: 25 },
  { name: '控制棒驱动机构检查', desc: '对控制棒驱动机构进行全面检查和测试', progress: 30, days: 70 },
  { name: '蒸汽发生器水化学控制', desc: '优化蒸汽发生器水化学控制策略，减少腐蚀', progress: 40, days: 45 },
  { name: '稳压器安全阀校验', desc: '完成稳压器安全阀的拆卸校验和回装', progress: 75, days: 20 },
  { name: '核岛消防系统检测', desc: '对核岛消防系统进行年度功能测试', progress: 85, days: 15 },
  { name: '仪表控制系统校准', desc: '对关键仪表控制系统进行全面校准', progress: 55, days: 30 },
  { name: '主变压器绝缘测试', desc: '完成主变压器的绝缘电阻和介质损耗测试', progress: 40, days: 10 },
  { name: '应急电源系统演练', desc: '组织全厂应急电源系统切换演练', progress: 90, days: 5 }
];

// 日常任务-短期名称和描述
const shortTaskData = [
  { name: '整理硬盘消磁记录', desc: '整理2024年度硬盘消磁处理记录并归档', progress: 100, days: 5 },
  { name: '巡检记录整理归档', desc: '将本月设备巡检记录整理并上传至档案系统', progress: 80, days: 3 },
  { name: '备件库存盘点', desc: '完成仪控备件仓库月度盘点，更新库存台账', progress: 60, days: 4 },
  { name: '仪表周检计划制定', desc: '制定下月仪表周检计划并通知相关部门', progress: 50, days: 2 },
  { name: '设备运行日志审核', desc: '审核上周设备运行日志，整理异常记录', progress: 70, days: 3 },
  { name: '工具借用登记整理', desc: '整理本月工具借用记录，催还逾期借用', progress: 85, days: 2 },
  { name: '温度传感器校验', desc: '对10个关键温度传感器进行现场校验', progress: 45, days: 4 },
  { name: '压力变送器清洁', desc: '清洁并检查现场压力变送器显示面板', progress: 55, days: 3 },
  { name: '执行器月度维护', desc: '对电动执行器进行月度润滑和检查', progress: 65, days: 5 },
  { name: '控制柜防潮检查', desc: '检查控制柜防潮措施，更换失效干燥剂', progress: 40, days: 2 },
  { name: '仪表接地检测', desc: '测量关键仪表接地电阻，确保接地良好', progress: 75, days: 3 },
  { name: '液位计清洗', desc: '对雷达液位计进行窗口清洗和校准', progress: 60, days: 4 },
  { name: '电动阀手动测试', desc: '执行重要电动阀的手动操作测试', progress: 50, days: 3 },
  { name: '热电阻更换准备', desc: '准备热电阻备件，编写更换方案', progress: 35, days: 2 },
  { name: '仪表电缆标识', desc: '完善仪表电缆标识牌，整理电缆走向', progress: 80, days: 5 },
  { name: '执行器反馈信号检查', desc: '检查执行器反馈信号与DCS显示一致性', progress: 45, days: 3 },
  { name: '仪表伴热系统检查', desc: '检查冬季仪表伴热系统运行状态', progress: 55, days: 4 },
  { name: '阀门填料紧固', desc: '对现场阀门填料函进行紧固检查', progress: 70, days: 3 },
  { name: '仪表防护箱清洁', desc: '清洁仪表防护箱，检查密封性能', progress: 40, days: 2 },
  { name: '月度工作总结编写', desc: '编写本部门月度工作总结报告', progress: 90, days: 3 }
];

// 日常任务-长期名称和描述
const longTaskData = [
  { name: '设备台账完善工程', desc: '完善仪控设备台账，补充设备技术参数和维护记录', progress: 35, days: 180 },
  { name: '备件管理系统优化', desc: '优化备件管理系统，增加库存预警和采购建议功能', progress: 20, days: 150 },
  { name: '仪表技术标准修编', desc: '修订仪表技术标准，补充新型仪表选型要求', progress: 15, days: 200 },
  { name: '设备健康管理系统建设', desc: '建立设备健康管理系统，实现设备状态在线监测', progress: 25, days: 240 },
  { name: '应急预案演练计划', desc: '制定年度应急预案演练计划，组织实施桌面演练', progress: 40, days: 120 },
  { name: '技术人才培养计划', desc: '实施仪控技术人才培养计划，提高团队技术水平', progress: 30, days: 180 },
  { name: '仪表进口备件国产化', desc: '推进仪表进口备件国产化替代研究', progress: 10, days: 300 },
  { name: '设备缺陷管理系统升级', desc: '升级设备缺陷管理系统，增加智能分析和跟踪功能', progress: 45, days: 100 },
  { name: '仪器校验周期优化', desc: '研究并优化仪表校验周期，降低校验成本', progress: 55, days: 90 },
  { name: '控制逻辑标准化工作', desc: '推进控制逻辑标准化，提高软件复用率', progress: 20, days: 200 },
  { name: '设备可靠性分析', desc: '建立设备可靠性分析模型，预测设备故障趋势', progress: 35, days: 180 },
  { name: '仪表节能改造方案', desc: '研究仪表节能改造方案，降低生产能耗', progress: 25, days: 150 },
  { name: '备件最低库存优化', desc: '优化备件最低库存设置，减少资金占用', progress: 50, days: 120 },
  { name: '设备腐蚀监测网络', desc: '建设设备腐蚀在线监测网络，实现腐蚀实时监控', progress: 15, days: 250 },
  { name: '智能巡检系统开发', desc: '开发智能巡检系统，实现巡检数据自动采集和分析', progress: 30, days: 200 },
  { name: '仪表技术档案数字化', desc: '推进仪表技术档案数字化，建立电子档案库', progress: 60, days: 90 },
  { name: '设备寿命评估研究', desc: '开展关键设备寿命评估研究，延长设备服役周期', progress: 20, days: 180 },
  { name: '仪表可靠性数据库建设', desc: '建设仪表可靠性数据库，积累运行和维护数据', progress: 40, days: 150 },
  { name: '设备故障案例库建设', desc: '收集整理设备故障案例，建立故障知识库', progress: 45, days: 100 },
  { name: '仪控系统安全评估', desc: '完成全厂仪控系统安全评估，提出改进建议', progress: 10, days: 300 }
];

// 当前日期
const today = new Date();

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 计算结束日期
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return formatDate(result);
}

// 获取随机负责人
function getRandomManager(index) {
  const manager = managers[index % managers.length];
  return manager;
}

// 获取随机进度（添加一些变化）
function getProgress(baseProgress, index) {
  const variation = (index % 5) * 5;
  return Math.min(100, Math.max(0, baseProgress - variation));
}

async function createTestData() {
  console.log('正在连接到数据库...');
  
  const conn = await dm.getConnection(connectionString);
  
  try {
    console.log('开始创建测试数据...\n');
    
    let totalCreated = 0;
    
    // 创建专项任务测试数据
    console.log('=== 创建专项任务 (类型ID=1) ===');
    for (let i = 0; i < 20; i++) {
      const data = specialTaskData[i];
      const manager = getRandomManager(i);
      const endDate = addDays(today, data.days);
      const progress = getProgress(data.progress, i);
      const priority = (i % 3) + 1; // 1, 2, 3 循环
      
      const sql = `
        INSERT INTO "SYSDBA"."projects" (
          name, description, project_type_id, priority, progress,
          end_date, manager_name, manager_phone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await conn.execute(sql, [
        data.name,
        data.desc,
        1,
        priority,
        progress,
        endDate,
        manager.name,
        manager.phone,
        progress === 100 ? 'completed' : (progress > 50 ? 'in_progress' : 'planning')
      ]);
      
      totalCreated++;
      console.log(`  ✓ 创建专项任务: ${data.name} (优先级${priority}, 进度${progress}%)`);
    }
    
    // 创建日常任务-短期测试数据
    console.log('\n=== 创建日常任务-短期 (类型ID=2) ===');
    for (let i = 0; i < 20; i++) {
      const data = shortTaskData[i];
      const manager = getRandomManager(i + 5);
      const endDate = addDays(today, data.days);
      const progress = getProgress(data.progress, i + 20);
      const priority = ((i + 1) % 3) || 3; // 2, 3, 1 循环
      
      const sql = `
        INSERT INTO "SYSDBA"."projects" (
          name, description, project_type_id, priority, progress,
          end_date, manager_name, manager_phone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await conn.execute(sql, [
        data.name,
        data.desc,
        2,
        priority,
        progress,
        endDate,
        manager.name,
        manager.phone,
        progress === 100 ? 'completed' : (progress > 50 ? 'in_progress' : 'planning')
      ]);
      
      totalCreated++;
      console.log(`  ✓ 创建短期任务: ${data.name} (优先级${priority}, 进度${progress}%)`);
    }
    
    // 创建日常任务-长期测试数据
    console.log('\n=== 创建日常任务-长期 (类型ID=3) ===');
    for (let i = 0; i < 20; i++) {
      const data = longTaskData[i];
      const manager = getRandomManager(i + 10);
      const endDate = addDays(today, data.days);
      const progress = getProgress(data.progress, i + 40);
      const priority = ((i + 2) % 3) + 1; // 3, 1, 2 循环
      
      const sql = `
        INSERT INTO "SYSDBA"."projects" (
          name, description, project_type_id, priority, progress,
          end_date, manager_name, manager_phone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await conn.execute(sql, [
        data.name,
        data.desc,
        3,
        priority,
        progress,
        endDate,
        manager.name,
        manager.phone,
        progress === 100 ? 'completed' : (progress > 50 ? 'in_progress' : 'planning')
      ]);
      
      totalCreated++;
      console.log(`  ✓ 创建长期任务: ${data.name} (优先级${priority}, 进度${progress}%)`);
    }
    
    console.log(`\n✅ 测试数据创建完成！共创建 ${totalCreated} 条记录`);
    console.log('  - 专项任务: 20 条');
    console.log('  - 日常任务-短期: 20 条');
    console.log('  - 日常任务-长期: 20 条');
    
  } catch (error) {
    console.error('创建测试数据失败:', error);
    throw error;
  } finally {
    await conn.close();
  }
}

createTestData().catch(err => {
  console.error(err);
  process.exit(1);
});