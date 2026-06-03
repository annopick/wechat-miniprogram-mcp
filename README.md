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
| `WECHAT_DEVTOOLS_PORT` | 微信开发者工具 HTTP 服务端口 | 是 |
| `WECHAT_DEVTOOLS_CLI_PATH` | 微信开发者工具 CLI 路径 | 否（自动化 API 需要） |
| `WECHAT_PROJECT_PATH` | 小程序项目路径 | 否（自动化 API 需要） |
| `LOG_LEVEL` | 日志级别 (DEBUG/INFO/ERROR) | 否，默认 INFO |

### 微信开发者工具设置

1. 打开微信开发者工具
2. 设置 -> 安全 -> 开启服务端口
3. 记录端口号（默认随机分配）

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

- `wechat_auto_connect` - 连接自动化工具
- `wechat_auto_disconnect` - 断开连接
- `wechat_auto_navigate` - 页面导航
- `wechat_auto_get_page_data` - 获取页面数据
- `wechat_auto_set_page_data` - 设置页面数据
- `wechat_auto_select_component` - 选择组件
- `wechat_auto_tap` - 点击组件
- `wechat_auto_screenshot` - 截图
- `wechat_auto_set_simulator_size` - 设置模拟器尺寸

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
