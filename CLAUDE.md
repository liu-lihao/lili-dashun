# 工程架构

## 开发路线

1. 分析每个 cases 的考点
2. 硬编码得出所有 cases 的还款计划
3. 以硬编码的输出结果作为测试用例
4. 分析所有 cases，梳理逻辑关系，设计整体架构
5. 实现核心逻辑，并满足所有测试用例
6. 实现交互界面 + 支持多贷款组合（如：房贷+车贷）

## 技术栈

- react
- typescript
- zustand
- zod
- vitest
- tailwindcss

## 模块划分

src/core -> 贷款利率+事件的纯计算逻辑
src/views -> UI界面交互逻辑
