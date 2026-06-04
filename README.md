# wechat-miniprogram-mcp

用于连接微信开发者工具的 MCP Server，支持通过微信开发者工具的 HTTP API 和自动化 API 进行小程序开发自动化操作。

## 安装

```bash
npm install -g wechat-miniprogram-mcp
```

## 配置

### 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `WECHAT_DEVTOOLS_PORT` | 微信开发者工具 HTTP 服务端口（控制 API 使用） | 控制 API 需要 |
| `WECHAT_DEVTOOLS_CLI_PATH` | 微信开发者工具 CLI 路径 | 否（不填则使用平台默认路径） |
| `WECHAT_PROJECT_PATH` | 小程序项目绝对路径 | 自动化 API 必填 |
| `LOG_LEVEL` | 日志级别 (DEBUG/INFO/ERROR) | 否，默认 INFO |

> **注意**：至少需要配置 `WECHAT_DEVTOOLS_PORT` 或 `WECHAT_DEVTOOLS_CLI_PATH` 其中之一。自动化 API 使用 `automator.launch()` 启动项目，需要 `WECHAT_PROJECT_PATH`。

### 微信开发者工具设置

1. 打开微信开发者工具
2. 设置 -> 安全 -> 开启服务端口（控制 API 需要）
3. 设置 -> 安全 -> 开启 CLI/HTTP 调用功能（自动化 API 需要）
4. 记录端口号（默认随机分配）

## 使用

在 MCP 客户端配置中添加：

```json
{
  "mcpServers": {
    "wechat-miniprogram": {
      "command": "wechat-miniprogram-mcp",
      "env": {
        "WECHAT_DEVTOOLS_PORT": "端口号",
        "WECHAT_DEVTOOLS_CLI_PATH": "/Applications/wechatdevtools.app/Contents/MacOS/cli",
        "WECHAT_PROJECT_PATH": "/path/to/your/project"
      }
    }
  }
}
```

## 支持的 Tools

### 控制 API (wechat_control_*)

- `wechat_control_status` - 检查开发者工具状态
- `wechat_control_open` - 打开项目
- `wechat_control_preview` - 预览项目
- `wechat_control_upload` - 上传代码
- `wechat_control_close` - 关闭项目
- `wechat_control_quit` - 退出开发者工具
- `wechat_control_login` - 登录
- `wechat_control_autopreview` - 自动预览
- `wechat_control_buildnpm` - 构建 npm
- `wechat_control_cleancache` - 清除缓存
- `wechat_control_resetfileutils` - 重置文件工具

### 自动化 API (wechat_auto_*)

#### 会话管理
- `wechat_auto_connect` - 启动/断开/关闭自动化会话（connect, disconnect, close, remote），支持 ticket 和 account 参数

#### 页面导航
- `wechat_auto_navigate` - 页面导航（navigateTo, redirectTo, navigateBack, reLaunch, switchTab）

#### 页面操作
- `wechat_auto_page_info` - 获取页面信息（currentPage, pageStack, systemInfo, size, scrollTop, pageScrollTo）
- `wechat_auto_page_data` - 页面数据读写（data, setData）
- `wechat_auto_page_query` - 页面元素查询与等待（$, $$, waitFor）
- `wechat_auto_page_call_method` - 调用页面方法（callMethod）

#### wx 方法
- `wechat_auto_call_wx_method` - 调用 wx 对象方法（callWxMethod, callPluginWxMethod）
- `wechat_auto_mock_wx_method` - Mock/恢复 wx 方法（mockWxMethod, restoreWxMethod 及插件版本）

#### 代码执行
- `wechat_auto_evaluate` - 在 AppService 中执行代码片段

#### 截图
- `wechat_auto_screenshot` - 对当前页面截图

#### 元素操作
- `wechat_auto_element_info` - 获取元素信息（text, value, attribute, property, style, wxml, outerWxml, size, offset）
- `wechat_auto_element_action` - 元素交互（tap, longpress, input, trigger）
- `wechat_auto_element_touch` - 触摸事件（touchstart, touchmove, touchend）
- `wechat_auto_element_scroll` - 滚动操作（scrollTo, scrollWidth, scrollHeight）
- `wechat_auto_element_special` - 特殊组件操作（swipeTo, moveTo, slideTo）
- `wechat_auto_element_data` - 组件数据与方法（data, setData, callMethod, callContextMethod）

#### 工具管理
- `wechat_auto_ticket` - 登录票据管理（getTicket, setTicket, refreshTicket）
- `wechat_auto_test_accounts` - 获取多账号调试用户列表
- `wechat_auto_stop_audits` - 停止体验评分并获取报告

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm run test
```

## 发布

打 tag 后自动触发 GitHub Actions 发布到 npm：

```bash
git tag v1.0.0
git push --tags
```

## 许可证

MIT
