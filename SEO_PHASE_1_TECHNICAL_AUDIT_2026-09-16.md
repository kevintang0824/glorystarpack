# SEO Phase 1 — Technical Audit and Measurement Baseline

日期：2026-09-16  
站点：`https://www.glorystarpack.com`  
范围：GSC、GA4、Bing 接入状态，以及静态源代码、线上关键 URL、收录信号和询盘归因基础。

## 当前结论

站点的基础抓取与页面质量检查通过。本次发现并修复了四类多语言 SEO 问题：

1. 部分压缩的旧模板使用 XHTML 风格的 `/>` 标签，生成器没有更新这些页面的 `og:title`、`og:description`、`twitter:title` 和 `twitter:description`。
2. 部分本地化页面使用通用或英文 meta description，降低了语言页面之间的搜索意图区分度。
3. 部分本地化页面的可见 FAQ 已翻译，但 FAQ JSON-LD 仍是英文，且 About 页的一组 FAQ 文本与可见内容不完全一致。
4. 资源指南和站点导航页存在本地化 title/description 重复；已为玻璃瓶指南和站点索引补充独立文案。

同时，sitemap 的本地化 URL 原先全部使用旧的统一日期；现在改为继承对应英文页面的实际 `lastmod`，避免更新信号失真。

## 本地源代码基线

- 862 个 HTML 文件：152 个英文页面、710 个本地化页面。
- 844 个可索引页面和 844 个 sitemap URL。
- 6 个语言版本：英文、法语、西班牙语、葡萄牙语、俄语和简体中文。
- 所有可索引 canonical 均已出现在 sitemap，sitemap 无重复 URL。
- 18 个非索引文件属于 404、旧的 airless 分类重定向占位页和站点索引页等既有规则。

## 自动化检查结果

以下检查在 2026-09-16 通过：

- `node scripts/check-seo.mjs`
- `node scripts/audit-content.mjs`
- `node scripts/check-localized-site.mjs`
- `node scripts/check-inquiry-attribution.mjs`
- `node scripts/check-phase-5-tracker.mjs`
- `node scripts/check-live-site.mjs`
- `git diff --check`

线上检查确认 sitemap 中的 844 个 URL、关键页面、robots.txt、image sitemap、RSS、IndexNow key 和自定义 404 均可访问。

## GSC 状态

仓库内最近的 Search Console 快照日期为 2026-09-08，不代表当前实时数据：

| 指标 | 快照值 |
| --- | ---: |
| 点击 | 66 |
| 展示 | 5,853 |
| CTR | 1.1% |
| 平均排名 | 25.4 |
| 已收录 | 128 |
| 已抓取但未收录 | 98 |

本次无法读取授权后的 GSC 实时页面和查询明细，因此没有把这些历史数值当作本次优化结果。发布后需要：

1. 在 Domain property 中确认 `glorystarpack.com`，并检查 www 与非 www 的统一情况。
2. 在 Sitemaps 报告重新确认 `https://www.glorystarpack.com/sitemap.xml`。
3. 对首页、核心商业页和本次修改的多语言页面使用 URL Inspection 检查 Google 渲染 HTML。
4. 按页面导出展示、点击、CTR、平均排名和索引状态，优先处理有展示且排名 8–20 的页面。
5. 生产部署并完成一次新抓取后，再验证首页结构化数据历史问题是否关闭。

## GA4 状态

源代码使用 Measurement ID `G-NYY1MTZ6HM`。询盘链路包含：

- `inquiry_click`：点击 WhatsApp、邮件或 RFQ 入口。
- `rfq_form_start`：开始填写询盘表单。
- `rfq_form_error`：表单错误诊断。
- `generate_lead`：服务器确认接受 RFQ 后的有效提交。

代码与归因检查通过，但当前没有 GA4 授权 UI 数据。本次未发送虚假询盘。上线后需要在 GA4 DebugView 或一次真实、已批准的询盘中确认事件，并将 `inquiry_click` 与 `generate_lead` 分别设为 Key event；不能把入口点击当作已提交询盘。

## Bing 状态

线上检查确认 IndexNow key 与 844 个 sitemap URL 的站点基础配置可用。当前没有授权后的 Bing Webmaster 报表，因此不能报告实际 Bing 收录或流量。上线后需要登录 Bing Webmaster：

1. 验证域名归属。
2. 提交 `https://www.glorystarpack.com/sitemap.xml`。
3. 检查 sitemap processing、crawl errors 和 URL Inspection。
4. 记录 IndexNow accepted 与实际抓取/收录的区别。

## 本次代码修复

- 本地化生成器现在优先从翻译后的页面首屏摘要生成独立 meta description。
- 资源指南、产品索引和站点索引的本地化 title/description 已拆分，避免同语言重复 metadata。
- 兼容 `>` 与 `/>` 两种 HTML meta 标签写法。
- 本地化页面的 Open Graph 标题、描述、Twitter 标题和描述与本地化页面同步。
- 本地化 FAQ JSON-LD 使用现有人工翻译词典，并修正 About 页 FAQ 与可见内容不一致的问题。
- sitemap 本地化 URL 继承对应英文 URL 的 `lastmod`。
- 新增本地化回归规则，防止 title、description 和社交 metadata 再次回退为英文。

## 发布前后边界

当前改动已在本地通过检查，但尚未替用户提交生产部署。部署后需重新运行线上检查、提交 sitemap/IndexNow，并等待 Google 重新抓取；本文件不宣称本次改动已经带来新增流量、收录或 AI 推荐。
