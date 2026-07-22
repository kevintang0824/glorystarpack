# GloryStarPack 部署手册

目标架构：Namecheap（域名注册）→ Cloudflare（权威 DNS、CDN 与安全）→ Vercel（静态站点）＋ Cloudflare R2（图片资产）。

## 当前状态

- 域名：`glorystarpack.com`
- 正式站点：`https://www.glorystarpack.com`
- GitHub：`kevintang0824/glorystarpack`，本地 `main` 已连接 `origin`
- 网站类型：无需构建的纯静态 HTML/CSS/JavaScript
- 图片目录：`assets/`，约 110MB

## 1. Vercel 导入 GitHub 仓库

1. 在 Vercel 选择 **Add New → Project**。
2. 导入 `kevintang0824/glorystarpack`。
3. Framework Preset 选择 **Other**。
4. Build Command 留空，Output Directory 留空，Root Directory 使用仓库根目录。
5. 部署后先用 Vercel 提供的预览域名检查首页、产品页、询盘按钮、图片、`robots.txt` 和两个 sitemap。
6. 在 Vercel 项目 Domains 中添加：
   - `www.glorystarpack.com`（主域名）
   - `glorystarpack.com`（重定向到 `www`）

仓库内的 `vercel.json` 会给图片设置长期缓存，并添加基础安全响应头。

## 2. 把 DNS 托管迁移到 Cloudflare

1. 在 Cloudflare 添加 `glorystarpack.com`，让 Cloudflare 扫描现有 DNS。
2. 仔细保留所有邮件记录，尤其是 MX、SPF、DKIM、DMARC；不要只复制网站记录。
3. Cloudflare 会提供两条 nameserver。
4. 到 Namecheap 的域名管理页，将 Nameservers 改为 **Custom DNS**，填入 Cloudflare 给出的两条地址。
5. 等 Cloudflare 显示域名为 **Active** 后再调整网站记录。

## 3. 让 Cloudflare 指向 Vercel

以 Vercel 项目 Domains 页面显示的 DNS 值为准，不手写猜测值：

1. 在 Cloudflare DNS 中创建/更新 `www` 的 CNAME，目标填 Vercel 给出的目标值。
2. 根域 `@` 按 Vercel 页面给出的 A/CNAME 方案配置。
3. 初次验证时将代理状态设为 **DNS only（灰云）**。
4. Vercel 显示两个域名均 Valid、SSL 生效后，再按需要打开 Cloudflare 代理（橙云）。
5. Cloudflare SSL/TLS 使用 **Full (strict)**，并开启 Always Use HTTPS。

## 4. 创建并迁移 Cloudflare R2 图片

建议在网站切换稳定后单独执行：

1. 创建 R2 bucket：`glorystarpack-assets`。
2. 上传本仓库的 `assets/`，对象键保留 `assets/...` 路径结构。
3. 给 bucket 绑定生产自定义域名：`assets.glorystarpack.com`。
4. 不要使用 `r2.dev` 作为正式图片地址；它只适合开发测试。
5. 为 `assets.glorystarpack.com/assets/*` 设置浏览器/边缘长期缓存，并启用 Smart Tiered Cache。
6. 抽样确认 R2 图片可访问后，再把 HTML、CSS、JS、结构化数据和 `image-sitemap.xml` 中的 `/assets/` 地址统一改为：
   `https://assets.glorystarpack.com/assets/`
7. 提交到 GitHub，由 Vercel 自动发布；确认无误后再删除 GitHub/Vercel 中重复的图片文件。

## 5. 上线验收

- `https://www.glorystarpack.com/` 返回 200，根域 301/308 到 `www`
- 任意产品分类页和文章页可直接刷新，不出现 404
- 首页和产品图片均返回 200
- `robots.txt`、`sitemap.xml`、`image-sitemap.xml` 可访问
- canonical、Open Graph 和结构化数据仍使用正式域名
- 邮箱收发正常（确认 MX/SPF/DKIM/DMARC 未丢失）
- Vercel 的下一次 GitHub 提交能够自动生成生产部署

## 回滚

在迁移完成前保留原有 DNS 记录和现有托管。若 Vercel 或 R2 验收失败，将 Cloudflare 中网站记录恢复为原值即可；不要更改邮件 DNS 记录。
