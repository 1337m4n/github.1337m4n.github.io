# 路线校准 · MVP v2

单用户、本地保存的职业与人生迁移决策校准工具。记录路线、事实和决策前提；前提失效或复盘到期时提示重新选择。系统不代替本人接受 Offer、提交离职或做关系决定。

## 本轮范围

- 基线、五问首页、轻检查、重大复盘、新事实与确定程度。
- 广东 / 上海机会比较；风险与实际路线独立；提醒与真正行动阻断分开。
- 每次正式选择 2–5 条前提；前提复查、带复查日的手动覆盖、不可回写的当时事实快照。
- 一个月无工资压力测试；上海双维度准入；六个月内重新决策，六月固定复盘；新证据支持的续期。
- 可观察事实生成职业成长参考判断；工作体验生成精力提示。
- 本地存储、v1 存档迁移、加密备份、普通 JSON 兼容导入、通用 ICS 日历提醒。
- 自动规则测试、隔离浏览器流程测试、白名单构建和原站点仓库检查工作流。

**不包含**：自动理解岗位文字 / 截图、OCR、外部 AI 接口、账号、云同步、情侣协同、后台推送、自动金融或离职操作。岗位材料可记录，但当前分数来自用户核实的五项事实，不是文字语义分析。

## 职业价值权重

| 已核实事实 | 权重 |
|---|---:|
| 技术深度 / 新能力 | 25% |
| 复杂责任 / 所有权 | 25% |
| 跨公司可迁移性 | 20% |
| 长期方向匹配 | 20% |
| 可证明的履历成果 | 10% |

五项均需明确“是 / 否”才生成结果；未核实项目不是零分。参考分为 `1 + 加权点数 / 25`，保留一位小数；低 <40 点，中 40–69 点，高 ≥70 点。它是透明的个人参考尺，不是招聘预测概率。人工规则、阈值和分数均不能绕过离职安全检查。

## 开发与验证

需要 Node.js 22 或更新版本。页面没有运行时第三方依赖；Playwright 仅用于开发测试。

```sh
npm ci --ignore-scripts
npm test
npx playwright install chromium
npm run test:browser
npm run build
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

访问 `http://127.0.0.1:4173`。不要直接通过 `file://` 使用模块或加密功能。系统 Chrome 可通过 `PLAYWRIGHT_CHANNEL=chrome` 运行测试。浏览器测试使用独立临时目录及合成数据，不读取用户浏览器资料。

`dist/` 仅允许八个页面资源。发现其他文件时构建失败；禁止把 PRD、设计历史截图、备份、真实个人数据或密钥提交到公开仓库。测试截图和合成备份只写入系统临时目录。

## 隐私与备份

本地数据存在当前浏览器、当前域名的 localStorage 中，**不是本地加密数据库**。同一浏览器资料的其他使用者及有权限的扩展可能访问它。没有埋点、第三方字体或外部接口，页面限制外连。

非安全 HTTP 入口禁止读取、录入和自动保存个人存档；必须使用证书有效的 HTTPS 或本机安全预览，不能绕过浏览器证书警告。

默认导出使用 Web Crypto：PBKDF2-SHA256（600,000 次）、随机盐、AES-256-GCM 和随机 IV。口令至少 12 个字符，不保存口令；忘记口令无法恢复备份。错误口令或损坏备份不覆盖当前存档。普通 JSON 导出仅在明确警告确认后允许。

换域名或换浏览器不会自动迁移数据：先导出加密备份，再在新入口导入。浏览器清理可能删除本地记录，请自行保存备份。上述措施减少暴露，不等于安全认证。

## 提醒边界

页面内显示下一节点；ICS 包含固定轻检查 / 重大复盘和个人复盘日，仅写通用事件名称。日历导入后的提醒由日历软件负责，网页关闭后不主动推送；不同客户端是否接受提醒、重复导入是否重复事件，需要本人验证。修改计划后须重新导出日历。

## GitHub 与域名

现使用已有仓库 `1337m4n/github.1337m4n.github.io`，**不创建新仓库**。程序位于仓库的 `career-route/`；保留原首页、CNAME、栏目及现有同步工作流。

1. 本目录安全文件放入 `career-route/`，唯一例外是检查工作流放入原仓库 `.github/workflows/career-route-test.yml`；不上传历史截图、PRD、真实备份或本地 `.git`。
2. PR 先运行规则及子路径浏览器验证，再合入 `master`；沿用原站点发布方式，不用仅含八个资源的构建覆盖主站。
3. 原站点子路径入口为 `https://1337m4n.beer/career-route/`，其模块和资源均使用相对路径。子路径与主站同 origin，不提供存储隔离。
4. 用户也允许独立子域名 `https://career.1337m4n.beer/`。一个 GitHub Pages 仓库只有一个自定义域名；不能把原站 CNAME 改成 career，否则会影响主站。
5. 要从同一代码仓库发布独立子域名，需要额外静态托管项目或代理入口，并确认 DNS 管理服务和授权。例如单独静态项目可使用构建命令 `node career-route/build.mjs`、输出目录 `career-route/dist`。域名和托管未验证前不宣称独立入口可用。

现有仓库是公开仓库；不购买任何新服务。需要的新授权和域名服务商登录由本人确认，不在聊天里提交 Token。

## 发布门槛

- 所有规则和浏览器测试通过；构建只有白名单文件。
- 工作流成功、Pages 公开地址可访问；自定义域名与 HTTPS 验证通过。
- 线上用合成数据验证保存、刷新恢复、加密导入导出。
- 本人验证一次日历提醒；之后再录入真实资料。

本地验证不能代替线上、DNS、HTTPS 和日历投递验证。

## 官方参考

- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages 自定义域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
- [Web Crypto deriveKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
