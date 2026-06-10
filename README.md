# 家族拜年排期日历

一个跨时区家族春节拜年排期应用，基于 Solid.js + FullCalendar 构建。

## 功能特性

- 📅 **日历视图**: 月/周/日/列表多视图切换 (FullCalendar)
- 🌏 **多时区支持**: 自动换算成员所在时区的时间
- 🧧 **农历高亮**: 正月初一到十五金色高亮，显示节日名称
- ⏰ **可接听窗口**: 成员标记自己方便接听视频的时间段
- 🔍 **智能推荐**: 自动计算全员重叠空档，推荐 Top 3 最佳时段
- 📋 **预约排队**: 时段满员后自动进入候补队列
- 🔒 **私密备注**: 仅长辈可见的私密备注字段
- 📤 **iCal 导出**: 一键导出日历到系统日历
- 👥 **角色权限**: 长辈/成年/晚辈 + 管理员权限体系

## 快速开始

### 方式一：本地开发

```bash
# 安装依赖
npm install

# 同时启动前端和 mock 服务
npm run dev:all
```

- 前端地址: http://localhost:3000
- Mock API: http://localhost:3001

### 方式二：Docker Compose

```bash
docker-compose up -d
```

访问 http://localhost:3000

## 项目结构

```
src/
├── components/     # UI 组件
├── services/       # API 服务层
├── utils/          # 工具函数 (时区/重叠/农历/iCal)
├── types/          # TypeScript 类型
├── App.tsx         # 主应用
└── main.tsx        # 入口
```

## 技术栈

- **框架**: Solid.js 1.8
- **日历**: FullCalendar 6
- **时区**: Luxon 3 (IANA 时区)
- **农历**: lunar-javascript
- **导出**: ics
- **Mock**: json-server

## 详细文档

- [架构说明](./ARCHITECTURE.md)
- [时区边界测试清单](./TIMEZONE_TESTS.md)
