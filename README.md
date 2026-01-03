# WeeklyTool - VSCode 扩展

WeeklyTool 是一个为周报管理优化的 VSCode 扩展,提供智能粘贴和快速创建周报文件夹的功能。

## 功能模块

### 功能 1: Markdown 智能粘贴 URL

在 Markdown 文件中粘贴 URL 时,自动解析网页标题,并根据上下文按不同格式插入链接。

#### 特性

- 仅在 `.md` 文件中生效
- 根据光标上方的上下文自动识别插入格式:
  - **文章区域** (`## 📖好文章` 或 `* 📄` 开头): 按 `* 📄[标题](url)` 格式插入
  - **其他标题区域** (其他 `##` 开头的行): 按 `**标题**  \n url` 格式插入(两个空格+换行)
  - **通用格式** (开启 fallback 选项时): 按 `* [标题](url)` 格式插入
- 智能跳过空行,继续向上查找有效的标题
- 若遇到其他非空格式内容且未启用通用格式则不触发
- 粘贴 URL 时:
  - 自动获取网页标题(优先使用 og:title,其次使用 `<title>` 标签)
  - 弹出确认对话框显示解析的标题
  - 确认后按相应格式插入

#### 使用方法

**场景 1: 在文章区域粘贴**

1. 在 Markdown 文件中添加文章区块:
   ```md
   ## 📖好文章
   ```

2. 复制网页地址(如 `https://example.com`)

3. 在该区块下方粘贴 URL

4. 在弹出的确认对话框中点击"是"

5. 自动插入格式化的链接:`* 📄[网页标题](https://example.com)`

**场景 2: 在其他标题区域粘贴**

1. 在 Markdown 文件中添加任意标题区块:
   ```md
   ## 🔨好工具
   ```
   或
   ```md
   ## 📝记录
   ```

2. 复制网页地址(如 `https://example.com`)

3. 在该区块下方粘贴 URL

4. 在弹出的确认对话框中点击"是"

5. 自动插入格式化的内容:
   ```md
   **网页标题**
   https://example.com
   ```

**场景 3: 在任意位置粘贴 (启用通用格式)**

1. 在 VSCode 设置中启用 `weeklytool.smartPaste.fallbackFormat` 选项

2. 在 Markdown 文件的任意位置(不需要特定标题上下文)

3. 复制网页地址(如 `https://example.com`)

4. 粘贴 URL

5. 在弹出的确认对话框中点击"是"

6. 自动插入通用格式的链接:`* [网页标题](https://example.com)`

#### 配置选项

- `weeklytool.smartPaste.enabled` - 启用/禁用智能粘贴功能(默认: `true`)
- `weeklytool.smartPaste.fallbackFormat` - 当未识别到特定上下文时,是否使用通用列表格式插入(默认: `false`)
- `weeklytool.smartPaste.requestTimeoutMs` - 获取网页标题的超时时间(默认: `5000` 毫秒)

**实现文件**: [src/smartPaste.ts](src/smartPaste.ts)

---

### 功能 2: 快速创建周报文件夹

在资源管理器中右键快速创建递增编号的周报文件夹和对应的 Markdown 文件。

#### 特性

- 在资源管理器中右键显示 "New Weekly" 选项
- 扫描当前目录下的一级文件夹,查找符合 `NoXX` 格式的文件夹(如 `No1`, `No50`)
- 自动计算最大编号并加 1
- 创建新文件夹 `No{编号}`(如 `No51`)
- 在新文件夹中自动创建同名 `.md` 文件(如 `No51.md`)
- 自动填充周报模板内容:
  ```markdown
  ## 📕精选文章

  ## 🤖AI前沿

  ## 🔨实用工具

  ## 📚宝藏资源

  ## 💡优秀作品

  ## 🎮好玩有趣

  ## 📝日常记录
  ```
- 创建完成后自动打开新建的 Markdown 文件

#### 使用方法

1. 在 VSCode 资源管理器中,找到包含周报文件夹的目录(如包含 `No1`, `No2`, ..., `No50` 的目录)

2. 右键点击该目录或目录中的任意文件/文件夹

3. 选择 "New Weekly"

4. 自动创建 `No51` 文件夹和 `No51.md` 文件

5. 新建的 Markdown 文件会自动在编辑器中打开

#### 注意事项

- 如果目录下没有符合 `NoXX` 格式的文件夹,会提示无法创建
- 如果目标文件夹已存在,会提示错误
- 仅扫描一级子文件夹,不会递归扫描

**实现文件**: [src/newWeekly.ts](src/newWeekly.ts)

---

## 安装

### 方式 1: 从 VSIX 文件安装(本地使用)

1. 下载或构建 `.vsix` 文件
2. 在 VSCode 中按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows/Linux)
3. 输入 "Extensions: Install from VSIX..."
4. 选择 `weeklytool-markdown-smart-paste-0.0.1.vsix` 文件
5. 重新加载 VSCode 窗口

### 方式 2: 从源码构建

```bash
# 安装依赖
npm install

# 编译代码
npm run compile

# 打包成 VSIX 文件
npm run package -- --baseContentUrl .
```

生成的 `.vsix` 文件会在项目根目录下。

---

## 开发

### 项目结构

```
src/
├── extension.ts      # 扩展入口,注册所有功能模块
├── smartPaste.ts     # 功能 1: Markdown 智能粘贴 URL
└── newWeekly.ts      # 功能 2: 快速创建周报文件夹
```

### 开发流程

```bash
# 安装依赖
npm install

# 监听模式编译(自动重新编译)
npm run watch

# 在 VS Code 中按 F5 启动调试
# 会打开一个新的扩展开发宿主窗口进行测试
```

### 打包流程

执行 `npm run package` 时会自动:

1. 运行 `npm run vscode:prepublish` (预发布脚本)
2. 执行 `npm run compile` (编译 TypeScript)
3. 使用 `vsce package` 打包成 `.vsix` 文件

推荐命令:
```bash
npm run package -- --baseContentUrl .
```

---

## 许可证

ISC

---

## 更新日志

### 0.0.1

- ✨ 新增功能 1: Markdown 智能粘贴 URL
- ✨ 新增功能 2: 快速创建周报文件夹
