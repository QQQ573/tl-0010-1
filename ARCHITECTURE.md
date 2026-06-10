# 家族拜年排期日历 - 架构说明

## 项目概述

一个基于 Solid.js + FullCalendar 的家族拜年排期日历应用，解决跨时区家族成员春节视频拜年的时间协调问题。

## 技术栈

### 前端
- **框架**: Solid.js 1.8 (响应式 UI 库)
- **构建工具**: Vite 5
- **语言**: TypeScript 5
- **日历组件**: FullCalendar 6 (daygrid, timegrid, list, interaction)
- **时区处理**: Luxon 3 (IANA 时区支持)
- **日期工具**: date-fns + date-fns-tz
- **农历计算**: lunar-javascript
- **iCal 导出**: ics

### Mock 服务
- **Mock Server**: json-server 0.17
- **数据持久化**: JSON 文件

### 部署
- **容器化**: Docker + docker-compose

## 项目结构

```
tl-0010-1/
├── src/
│   ├── components/          # UI 组件
│   │   ├── CalendarView.tsx         # 日历主视图 (FullCalendar 封装)
│   │   ├── MemberList.tsx           # 家族成员列表
│   │   ├── RecommendedSlots.tsx     # 推荐时段展示
│   │   ├── SlotDetailModal.tsx      # 时段详情弹窗 (含预约/候补)
│   │   ├── AvailabilityEditor.tsx   # 可接听时间编辑器
│   │   ├── CreateSlotModal.tsx      # 创建时段弹窗 (管理员)
│   │   └── UserSelector.tsx         # 用户切换器 (演示用)
│   ├── services/            # API 服务层
│   │   └── api.ts                   # REST API 封装 (预留后端接口)
│   ├── utils/               # 工具函数
│   │   ├── timezone.ts              # 时区工具 (夏令时、跨日切片)
│   │   ├── overlap.ts               # 重叠空档计算与推荐算法
│   │   ├── lunar.ts                 # 农历日期计算
│   │   ├── ical.ts                  # iCal 导出
│   │   └── storage.ts               # 本地存储工具
│   ├── types/               # 类型定义
│   │   └── index.ts                 # 所有 TypeScript 类型
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 入口文件
│   └── index.css            # 全局样式
├── mock/                    # Mock 数据与服务
│   ├── db.json              # Mock 数据库
│   ├── middleware.js        # json-server 中间件
│   └── Dockerfile           # Mock 服务 Dockerfile
├── Dockerfile               # 前端 Dockerfile
├── docker-compose.yml       # Docker Compose 配置
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目依赖
```

## 核心架构设计

### 1. 时区处理架构

**原则**: 所有时间存储用 UTC，展示用本地时区

```
存储层 (UTC ISO 8601)
    ↓
工具层 (Luxon 时区转换)
    ↓
展示层 (用户所在时区)
```

关键模块: `src/utils/timezone.ts`

- `convertTime()`: UTC → 本地时区转换
- `sliceTimeToDays()`: 跨日时段切片处理
- `isDSTTransitionDay()`: 夏令时边界检测
- `getDSTTransitionInfo()`: 夏令时转换详情

### 2. 重叠空档算法

**算法流程**:
1. 将所有成员的可接听窗口转换为 UTC 时间区间
2. 以 15-30 分钟为粒度生成候选时间槽
3. 统计每个时间槽的可用成员数
4. 计算时间槽评分 (人数权重 + 时段适宜度 + 长辈优先)
5. 合并连续的同组成员时间槽
6. 按评分排序，返回 Top 3 推荐

评分维度:
- 参与人数 (权重最高)
- 时长 (最多 2 小时加分)
- 当地时段适宜度 (9-12点、14-20点加分)
- 长辈时段适宜度 (额外加权)
- 是否包含长辈 (额外加分)

### 3. 预约与排队机制

```
用户点击预约
    ↓
检查是否已满员
    ├─ 未满 → 直接确认 (status: confirmed)
    └─ 已满 → 加入候补队列 (status: waitlist, waitlistPosition: N)

有人取消预约
    ↓
候补队首自动递补 (需后端实现，mock 版本简化处理)
```

### 4. 权限与私密字段

**角色体系**:
- `elder` (长辈): 可查看私密备注
- `adult` (成年): 普通权限
- `child` (晚辈): 普通权限，不参与推荐计算

**私密备注 (`privateNote`)**:
- 仅 `canViewPrivateNotes = true` 的用户可见
- 存储在数据库中，前端根据权限条件渲染
- 创建时段时管理员可设置

### 5. API 接口设计 (预留 REST)

```
GET    /api/members                     # 获取所有成员
GET    /api/members/:id                 # 获取成员详情

GET    /api/slots                       # 获取所有时段 (支持 start/end 过滤)
GET    /api/slots/:id                   # 获取时段详情
POST   /api/slots                       # 创建时段 (管理员)
PUT    /api/slots/:id                   # 更新时段 (管理员)
DELETE /api/slots/:id                   # 删除时段 (管理员)

GET    /api/availabilities              # 获取可接听时间
GET    /api/availabilities?memberId=X   # 获取某成员的可接听时间
POST   /api/availabilities              # 添加可接听时间
PUT    /api/availabilities/:id         # 更新可接听时间
DELETE /api/availabilities/:id         # 删除可接听时间

GET    /api/bookings                    # 获取所有预约
GET    /api/bookings?slotId=X           # 获取某时段的预约
POST   /api/bookings                    # 创建预约/加入候补
PATCH  /api/bookings/:id                # 取消预约 (status: cancelled)
```

### 6. 农历高亮

- 正月初一到十五：金色背景高亮
- 节日名称显示（春节、初五迎财神、元宵节等）
- 使用 `lunar-javascript` 库进行农历计算

## 数据流

```
用户操作 → 组件事件 → API 服务层 → Mock Server
                ↑                        ↓
                └── 状态更新 ← 数据返回 ←┘
```

Solid.js 响应式系统自动处理状态变化到 UI 的映射。

## 部署方式

### 本地开发
```bash
npm run dev:all   # 同时启动前端 (3000) 和 mock 服务 (3001)
```

### Docker 部署
```bash
docker-compose up -d
```

- 前端: http://localhost:3000
- Mock API: http://localhost:3001

## 后续扩展建议

1. **后端对接**: 替换 `src/services/api.ts` 中的 mock 调用为真实后端
2. **真实认证**: 替换演示用的用户切换为真实登录系统
3. **实时同步**: 加入 WebSocket 实现预约状态实时更新
4. **通知系统**: 预约成功/候补递补时邮件/短信通知
5. **多家族支持**: 扩展数据模型支持多个家族群组
