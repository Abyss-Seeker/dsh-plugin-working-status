# dsh-plugin-working-status

为运行中轮次的“思考状态”文字（英文界面中为带有流光动画的 “Deep diving...”，
右侧带计时）提供点击即改的全局替换插件。

## 功能

- **点击字段即可编辑。** 点击状态字段（文字或计时区域）会在原位置弹出输入框，
  预填当前文字；`Enter` 或点击别处提交，`Esc` 取消。
- **全局替换。** 修改后的文字会应用到当前与后续所有状态字段——每一轮、每个
  会话，刷新页面、重启应用后依然生效。
- **清空提交 = 恢复原样。** 把输入框清空后提交，即还原为界面默认文字（默认
  文字从实际渲染中捕获，因此任何语言/任何版本下都跟随界面真实显示）。
- **插件配置卡片。** 设置 → 插件 → 插件配置 中会出现 “工作状态” 卡片，用
  同样的字段提供暂存式表单（保存 / 放弃修改 / 恢复默认）。卡片始终可见，
  编辑的是插件自身的覆盖状态，不依赖线上暴露的设置命名空间（见下）。
- **不破坏样式与加载渲染。** 插件只在 React 提交 DOM 后改写标签的文本节点：
  流光动画、计时器、ARIA 实时区域、加载过程的渲染都完全不受影响。

## 持久化

覆盖文字保存在浏览器的 localStorage 镜像（`dsh.turn-status.label`）中：
同源的所有标签页共享，刷新与重启后依然保留，远程页面同样生效。

Host 半边同时注册了 `turn-status` 设置命名空间（`label` 字段），使该值在
未来可以像应用的其它偏好一样存入 Host 用户设置文档。但在当前 DSH 版本中，
这一通道对 Web 客户端是关闭的：`dsh-host-apiproxy` 只向浏览器提供其固定的
`WEB_SETTINGS_NAMESPACES` 白名单（加上模型提供方命名空间），其它命名空间
即使已注册也只会得到 `settings-not-exposed`。让插件在
`settings.register()` 时自行暴露配置，在该包源码中标记为待完成（deferred
work）。待其落地后，本插件会自动优先读取 Host 值，localStorage 镜像作为
兜底。命名空间与存储键沿用了最初的名字，因此旧版本保存的文字不会丢失。

## 安装

本包是一个双面 DSH 插件：极简的 Host 半边（注册设置命名空间）+ 浏览器半边
（`dsh.client`，platform `web`）。

1. 用 `dsh plugin` 把包装进 profile（底层转发给 pnpm；支持本地路径、npm 包名
   与 git 仓库——无需构建步骤，仓库内的 `lib/` 就是最终产物）：

   ```sh
   dsh plugin --profile web add github:Abyss-Seeker/not-deep-diving-dsh-plugin
   ```

   等价写法：

   ```sh
   dsh plugin --profile web add git+https://github.com/Abyss-Seeker/not-deep-diving-dsh-plugin.git
   dsh plugin --profile web add file:<本目录路径>
   ```

   免 pnpm 备选（真实目录拷贝进 profile，与 git 安装的解析形态一致）：

   ```sh
   node scripts/install.mjs "$DSH_HOME/profiles/web"
   ```

2. 在 profile 的补丁层 `$DSH_HOME/profiles/web/cordis.patch.yml` 中启用该行：

   ```yaml
   - insert:
       - id: working-status-editor
         name: dsh-plugin-working-status
   ```

3. 刷新已打开的 GUI 页面（boot 图谱注入于 `index.html`；运行中的服务会实时
   加载新条目，浏览器侧刷新一次即可）。设置 → 插件列表可以看到新条目。

修改源码后重跑第 1 步即可同步安装副本。

## 配置

- 点击状态字段与插件配置卡片是主要入口，两者写入的是同一个覆盖值。
  Host 侧的 `turn-status` 设置命名空间（`label` 字段，字符串）已为未来版本
  注册——详见上文持久化说明。
- `window.__dshWorkingStatusEditor` 提供 `elements()`（已匹配的 DOM 字段）与
  `label()`（当前生效文字），便于排查。

## 兼容性

针对内置 `ui-conversation` 结构：通过 `role="status"`、`aria-live="polite"` 与
稳定的 `turnStatus` CSS-module 本地类名识别（哈希前缀随构建变化，本地类名
不变）。若未来的 DSH 版本重命名了该类，插件会按字段告警并停止改写，而不会
破坏 DOM。插件配置卡片注册进 `ui-settings-plugins` 声明的
`settings.plugin.item` 插槽；没有该设置界面时，点击编辑功能仍然可用。
