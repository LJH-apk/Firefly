<script lang="ts">
import { marked } from "marked";
import { onMount } from "svelte";

marked.setOptions({ breaks: true, gfm: true });

type Config = { pat: string; owner: string; repo: string; branch: string };
type TreeItem = { path: string; sha: string; type: string };
type PostItem = { path: string; sha: string; name: string; filename: string };
type Post = {
	title: string;
	published: string;
	updated: string;
	description: string;
	image: string;
	tags: string;
	category: string;
	draft: boolean;
	pinned: boolean;
	lang: string;
	author: string;
	comment: boolean;
	password: string;
	passwordHint: string;
	body: string;
	_sha: string;
	_path: string;
	_filename: string;
	_isNew: boolean;
};

let view = $state<"setup" | "list" | "editor">("setup");
let cfg = $state<Config>({ pat: "", owner: "", repo: "", branch: "master" });
let postList = $state<PostItem[]>([]);
let post = $state<Post | null>(null);
let loading = $state(false);
let saving = $state(false);
let errorMsg = $state("");
let successMsg = $state("");
let searchQ = $state("");
let isDemo = $state(false);
let editorMode = $state<"edit" | "split" | "preview">("split");

const previewHtml = $derived(post ? (marked(post.body) as string) : "");

const DEMO_POSTS: PostItem[] = [
	{
		path: "src/content/posts/hello-world.md",
		sha: "demo1",
		name: "hello-world.md",
		filename: "hello-world.md",
	},
	{
		path: "src/content/posts/astro-svelte-guide.md",
		sha: "demo2",
		name: "astro-svelte-guide.md",
		filename: "astro-svelte-guide.md",
	},
	{
		path: "src/content/posts/cloudflare-workers-tips.md",
		sha: "demo3",
		name: "cloudflare-workers-tips.md",
		filename: "cloudflare-workers-tips.md",
	},
	{
		path: "src/content/posts/draft-post.md",
		sha: "demo4",
		name: "draft-post.md",
		filename: "draft-post.md",
	},
	{
		path: "src/content/posts/life/weekend-trip.md",
		sha: "demo5",
		name: "life/weekend-trip.md",
		filename: "weekend-trip.md",
	},
];

const DEMO_POST_CONTENT: Record<string, Post> = {
	demo1: {
		title: "你好，世界",
		published: "2025-01-01",
		updated: "2025-03-10",
		description: "博客的第一篇文章，介绍这个站点的由来和目标。",
		image: "./images/cover.jpg",
		tags: "随笔, 生活",
		category: "碎碎念",
		draft: false,
		pinned: true,
		lang: "",
		author: "",
		comment: true,
		password: "",
		passwordHint: "",
		body: `## 开始

欢迎来到我的博客！这里会记录我的技术探索和生活感悟。

## 为什么写博客

- 梳理自己的知识体系
- 和更多人交流想法
- 记录成长的轨迹

> 人生就是一场旅行，重要的不是目的地，而是沿途的风景。
`,
		_sha: "demo1",
		_path: "src/content/posts/hello-world.md",
		_filename: "hello-world.md",
		_isNew: false,
	},
	demo2: {
		title: "Astro + Svelte 5 开发指南",
		published: "2025-06-01",
		updated: "",
		description:
			"详细介绍如何在 Astro 项目中使用 Svelte 5 的新特性，包括 Runes 语法和响应式状态管理。",
		image: "",
		tags: "Astro, Svelte, 前端",
		category: "技术",
		draft: false,
		pinned: false,
		lang: "",
		author: "",
		comment: true,
		password: "",
		passwordHint: "",
		body: "## 前言\n\nSvelte 5 带来了全新的 Runes 语法，配合 Astro 的岛屿架构，可以打造极致性能的静态站点。\n\n## 安装\n\n```bash\npnpm create astro@latest\npnpm add svelte @astrojs/svelte\n```\n\n## 使用 $state\n\n响应式状态用 `$state()` 声明，`$derived()` 声明计算值，`onclick` 代替 `on:click`。\n",
		_sha: "demo2",
		_path: "src/content/posts/astro-svelte-guide.md",
		_filename: "astro-svelte-guide.md",
		_isNew: false,
	},
	demo3: {
		title: "Cloudflare Workers 实用技巧",
		published: "2025-08-15",
		updated: "",
		description:
			"总结在使用 Cloudflare Workers 部署静态博客时踩过的坑和积累的经验。",
		image: "",
		tags: "Cloudflare, 部署, 运维",
		category: "技术",
		draft: false,
		pinned: false,
		lang: "",
		author: "",
		comment: true,
		password: "",
		passwordHint: "",
		body: `## wrangler.jsonc 配置

最简静态资源托管配置：

\`\`\`json
{
  "name": "blog",
  "compatibility_date": "2025-01-01",
  "assets": { "directory": "./dist" }
}
\`\`\`

## 自动部署

推送到 GitHub 后，Cloudflare 会自动触发构建和部署。
`,
		_sha: "demo3",
		_path: "src/content/posts/cloudflare-workers-tips.md",
		_filename: "cloudflare-workers-tips.md",
		_isNew: false,
	},
	demo4: {
		title: "未发布的草稿",
		published: "2026-06-26",
		updated: "",
		description: "",
		image: "",
		tags: "",
		category: "",
		draft: true,
		pinned: false,
		lang: "",
		author: "",
		comment: true,
		password: "",
		passwordHint: "",
		body: "## 待续\n\n这篇文章还没写完...\n",
		_sha: "demo4",
		_path: "src/content/posts/draft-post.md",
		_filename: "draft-post.md",
		_isNew: false,
	},
	demo5: {
		title: "周末出游记",
		published: "2025-05-20",
		updated: "",
		description: "趁着五一假期，去了附近的山里转了转。",
		image: "",
		tags: "生活, 旅行",
		category: "生活",
		draft: false,
		pinned: false,
		lang: "",
		author: "",
		comment: true,
		password: "",
		passwordHint: "",
		body: `## 出发

早上六点出门，天色还没全亮，空气格外清新。

## 山顶

爬到顶上的时候已经快十点了，俯瞰山下的城市，感觉平时的烦恼都变小了。
`,
		_sha: "demo5",
		_path: "src/content/posts/life/weekend-trip.md",
		_filename: "weekend-trip.md",
		_isNew: false,
	},
};

function enterDemo() {
	isDemo = true;
	postList = DEMO_POSTS;
	view = "list";
}

function exitDemo() {
	isDemo = false;
	postList = [];
	post = null;
	view = "setup";
}

function openDemoPost(item: PostItem) {
	const content = DEMO_POST_CONTENT[item.sha];
	if (content) {
		post = { ...content };
		view = "editor";
	}
}

const filtered = $derived(
	searchQ.trim()
		? postList.filter((p) =>
				p.name.toLowerCase().includes(searchQ.toLowerCase()),
			)
		: postList,
);

onMount(() => {
	const saved = localStorage.getItem("blog-admin-cfg");
	if (saved) {
		try {
			cfg = JSON.parse(saved);
			view = "list";
			loadList();
		} catch {}
	}
});

function ghHeaders(extra: Record<string, string> = {}) {
	return {
		Authorization: `Bearer ${cfg.pat}`,
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		...extra,
	};
}

async function ghFetch(path: string, opts: RequestInit = {}) {
	const r = await fetch(`https://api.github.com${path}`, {
		...opts,
		headers: {
			...ghHeaders(),
			...((opts.headers as Record<string, string>) || {}),
		},
	});
	const d = await r.json();
	if (!r.ok) throw new Error(d.message || `HTTP ${r.status}`);
	return d;
}

function b64decode(s: string): string {
	const bin = atob(s.replace(/\s/g, ""));
	return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function b64encode(s: string): string {
	const bytes = new TextEncoder().encode(s);
	const chunk = 8192;
	let bin = "";
	for (let i = 0; i < bytes.length; i += chunk)
		bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
	return btoa(bin);
}

async function loadList() {
	loading = true;
	errorMsg = "";
	try {
		const tree = await ghFetch(
			`/repos/${cfg.owner}/${cfg.repo}/git/trees/${cfg.branch}?recursive=1`,
		);
		postList = (tree.tree as TreeItem[])
			.filter(
				(i) =>
					i.type === "blob" &&
					i.path.startsWith("src/content/posts/") &&
					/\.(md|mdx)$/.test(i.path),
			)
			.map((i) => ({
				path: i.path,
				sha: i.sha,
				name: i.path.replace("src/content/posts/", ""),
				filename: i.path.split("/").pop() ?? i.path,
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	} catch (e) {
		errorMsg = String(e);
	} finally {
		loading = false;
	}
}

function parseFM(raw: string): Post {
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!m) return { ...emptyPost(), body: raw };

	const fm = m[1];
	const body = m[2].replace(/^\n/, "");

	const s = (k: string) => {
		const x = fm.match(new RegExp(`^${k}:\\s*(.+)$`, "m"));
		return x ? x[1].trim().replace(/^['"]|['"]$/g, "") : "";
	};
	const b = (k: string, def: boolean) => {
		const v = s(k);
		return v === "" ? def : v === "true";
	};

	let tags = "";
	const tagsInline = fm.match(/^tags:\s*\[([^\]]*)\]/m);
	const tagsMulti = fm.match(/^tags:\s*\n((?:[ \t]*-[ \t]*.+\n?)*)/m);
	if (tagsInline) {
		tags = tagsInline[1]
			.replace(/['"]/g, "")
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean)
			.join(", ");
	} else if (tagsMulti) {
		tags = tagsMulti[1]
			.split("\n")
			.map((l) =>
				l
					.replace(/^\s*-\s*/, "")
					.replace(/['"]/g, "")
					.trim(),
			)
			.filter(Boolean)
			.join(", ");
	}

	return {
		title: s("title"),
		published: s("published"),
		updated: s("updated"),
		description: s("description"),
		image: s("image"),
		tags,
		category: s("category"),
		draft: b("draft", false),
		pinned: b("pinned", false),
		lang: s("lang"),
		author: s("author"),
		comment: b("comment", true),
		password: s("password"),
		passwordHint: s("passwordHint"),
		body,
		_sha: "",
		_path: "",
		_filename: "",
		_isNew: false,
	};
}

function emptyPost(): Post {
	return {
		title: "",
		published: new Date().toISOString().slice(0, 10),
		updated: "",
		description: "",
		image: "",
		tags: "",
		category: "",
		draft: true,
		pinned: false,
		lang: "",
		author: "",
		comment: true,
		password: "",
		passwordHint: "",
		body: "## 正文\n\n",
		_sha: "",
		_path: "",
		_filename: "",
		_isNew: true,
	};
}

function buildContent(p: Post): string {
	const tags = `[${p.tags
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean)
		.join(", ")}]`;
	const lines = ["---", `title: ${p.title}`, `published: ${p.published}`];
	if (p.updated) lines.push(`updated: ${p.updated}`);
	if (p.description) lines.push(`description: ${p.description}`);
	if (p.image) lines.push(`image: ${p.image}`);
	lines.push(`tags: ${tags}`);
	if (p.category) lines.push(`category: ${p.category}`);
	lines.push(`draft: ${p.draft}`);
	if (p.pinned) lines.push(`pinned: ${p.pinned}`);
	if (p.lang) lines.push(`lang: ${p.lang}`);
	if (p.author) lines.push(`author: ${p.author}`);
	lines.push(`comment: ${p.comment}`);
	if (p.password) lines.push(`password: ${p.password}`);
	if (p.passwordHint) lines.push(`passwordHint: ${p.passwordHint}`);
	lines.push("---", "");
	return lines.join("\n") + p.body;
}

async function openPost(item: PostItem) {
	if (isDemo) {
		openDemoPost(item);
		return;
	}
	loading = true;
	errorMsg = "";
	try {
		const data = await ghFetch(
			`/repos/${cfg.owner}/${cfg.repo}/contents/${item.path}`,
		);
		const raw = b64decode(data.content);
		post = {
			...parseFM(raw),
			_sha: data.sha,
			_path: item.path,
			_filename: item.filename,
			_isNew: false,
		};
		view = "editor";
	} catch (e) {
		errorMsg = String(e);
	} finally {
		loading = false;
	}
}

function newPost() {
	post = emptyPost();
	view = "editor";
}

async function save() {
	if (!post) return;
	if (isDemo) {
		successMsg = "✓ 演示模式：已模拟保存成功（不会真正提交到 GitHub）";
		return;
	}
	if (!post.title.trim()) {
		errorMsg = "标题不能为空";
		return;
	}
	saving = true;
	errorMsg = "";
	successMsg = "";
	try {
		const filename = post._filename || `${slugify(post.title)}.md`;
		const path = post._path || `src/content/posts/${filename}`;
		const body: Record<string, string> = {
			message: post._isNew
				? `feat: 新增文章「${post.title}」`
				: `chore: 更新文章「${post.title}」`,
			content: b64encode(buildContent(post)),
			branch: cfg.branch,
		};
		if (post._sha) body.sha = post._sha;
		const data = await ghFetch(
			`/repos/${cfg.owner}/${cfg.repo}/contents/${path}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			},
		);
		post._sha = data.content.sha;
		post._path = path;
		post._filename = filename;
		post._isNew = false;
		successMsg = "✓ 保存成功，Cloudflare 正在自动重新部署...";
		loadList();
	} catch (e) {
		errorMsg = String(e);
	} finally {
		saving = false;
	}
}

async function deletePost() {
	if (isDemo) {
		successMsg = "✓ 演示模式：不会真正删除";
		return;
	}
	if (!post?._sha || !confirm(`确定删除「${post.title}」吗？此操作不可撤销。`))
		return;
	saving = true;
	errorMsg = "";
	try {
		await ghFetch(`/repos/${cfg.owner}/${cfg.repo}/contents/${post._path}`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: `chore: 删除文章「${post.title}」`,
				sha: post._sha,
				branch: cfg.branch,
			}),
		});
		post = null;
		view = "list";
		loadList();
	} catch (e) {
		errorMsg = String(e);
	} finally {
		saving = false;
	}
}

function slugify(t: string) {
	return (
		t
			.replace(/[^a-z0-9一-龥]/gi, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/, "") || "post"
	);
}

function setup() {
	if (!cfg.pat || !cfg.owner || !cfg.repo) {
		errorMsg = "请填写所有必填项";
		return;
	}
	localStorage.setItem("blog-admin-cfg", JSON.stringify(cfg));
	errorMsg = "";
	view = "list";
	loadList();
}

function logout() {
	if (!confirm("确定退出？")) return;
	localStorage.removeItem("blog-admin-cfg");
	cfg = { pat: "", owner: "", repo: "", branch: "master" };
	postList = [];
	post = null;
	view = "setup";
}

function dismissSuccess() {
	successMsg = "";
}
function dismissError() {
	errorMsg = "";
}
</script>

<!-- ===== SETUP VIEW ===== -->
{#if view === 'setup'}
<div class="setup-wrap">
	<div class="setup-card">
		<div class="setup-header">
			<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
			<h1>博客后台</h1>
			<p>通过 GitHub API 管理文章，保存后 Cloudflare 自动部署</p>
		</div>

		<div class="field">
			<label>GitHub Personal Access Token <span class="req">*</span></label>
			<input type="password" bind:value={cfg.pat} placeholder="ghp_xxxxxxxxxxxx" autocomplete="off" />
			<small>需要 <code>repo</code> 权限（或 fine-grained 的 Contents: Write）</small>
		</div>
		<div class="field-row">
			<div class="field">
				<label>GitHub 用户名 / 组织 <span class="req">*</span></label>
				<input type="text" bind:value={cfg.owner} placeholder="your-username" />
			</div>
			<div class="field">
				<label>仓库名 <span class="req">*</span></label>
				<input type="text" bind:value={cfg.repo} placeholder="blog" />
			</div>
		</div>
		<div class="field">
			<label>分支</label>
			<input type="text" bind:value={cfg.branch} placeholder="master" />
		</div>

		{#if errorMsg}
		<div class="alert error">{errorMsg} <button onclick={dismissError}>×</button></div>
		{/if}

		<button class="btn-primary" onclick={setup}>连接仓库</button>
		<div class="demo-divider"><span>或者</span></div>
		<button class="btn-demo" onclick={enterDemo}>预览演示模式</button>
	</div>
</div>

<!-- ===== LIST VIEW ===== -->
{:else if view === 'list'}
<div class="app">
	<header class="app-header">
		<div class="header-left">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
			<span class="header-title">博客后台</span>
			{#if isDemo}
			<span class="demo-badge">演示模式</span>
			{:else}
			<span class="header-sub">{cfg.owner}/{cfg.repo}</span>
			{/if}
		</div>
		<div class="header-right">
			<button class="btn-primary" onclick={newPost}>+ 新建文章</button>
			{#if !isDemo}
			<button class="btn-ghost" onclick={() => loadList()} title="刷新">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
			</button>
			{/if}
			<button class="btn-ghost" onclick={isDemo ? exitDemo : logout}>{isDemo ? '退出演示' : '退出'}</button>
		</div>
	</header>

	<div class="list-body">
		{#if errorMsg}
		<div class="alert error">{errorMsg} <button onclick={dismissError}>×</button></div>
		{/if}

		<div class="list-toolbar">
			<input class="search-input" type="text" bind:value={searchQ} placeholder="搜索文章..." />
			<span class="post-count">{filtered.length} 篇</span>
		</div>

		{#if loading}
		<div class="loading">加载中...</div>
		{:else if filtered.length === 0}
		<div class="empty">{postList.length === 0 ? '暂无文章，点击「新建文章」开始写作' : '没有匹配的文章'}</div>
		{:else}
		<div class="post-list">
			{#each filtered as item}
			<button class="post-item" onclick={() => openPost(item)}>
				<div class="post-name">{item.name.replace(/\.(md|mdx)$/, '')}</div>
				<div class="post-path">{item.path}</div>
				<svg class="post-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
			</button>
			{/each}
		</div>
		{/if}
	</div>
</div>

<!-- ===== EDITOR VIEW ===== -->
{:else if view === 'editor' && post}
<div class="app">
	<header class="app-header">
		<div class="header-left">
			<button class="btn-ghost" onclick={() => { view = 'list'; successMsg = ''; errorMsg = '' }}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
				返回
			</button>
			<span class="header-sub">{post._isNew ? '新建文章' : post._filename}</span>
			{#if isDemo}<span class="demo-badge">演示模式</span>{/if}
		</div>
		<div class="header-right">
			{#if !post._isNew}
			<button class="btn-danger" onclick={deletePost} disabled={saving}>删除</button>
			{/if}
			<button class="btn-primary" onclick={save} disabled={saving}>
				{saving ? '保存中...' : '保存并发布'}
			</button>
		</div>
	</header>

	{#if errorMsg}
	<div class="alert error editor-alert">{errorMsg} <button onclick={dismissError}>×</button></div>
	{/if}
	{#if successMsg}
	<div class="alert success editor-alert">{successMsg} <button onclick={dismissSuccess}>×</button></div>
	{/if}

	<div class="editor-layout">
		<!-- Left: Frontmatter Form -->
		<div class="fm-panel">
			<div class="fm-section">
				<div class="field">
					<label>标题 <span class="req">*</span></label>
					<input type="text" bind:value={post.title} placeholder="文章标题" />
				</div>
				<div class="field-row">
					<div class="field">
						<label>发布日期</label>
						<input type="date" bind:value={post.published} />
					</div>
					<div class="field">
						<label>更新日期</label>
						<input type="date" bind:value={post.updated} />
					</div>
				</div>
				<div class="field">
					<label>描述</label>
					<textarea bind:value={post.description} rows="2" placeholder="文章简介..."></textarea>
				</div>
				<div class="field">
					<label>标签（逗号分隔）</label>
					<input type="text" bind:value={post.tags} placeholder="技术, 生活, 随笔" />
				</div>
				<div class="field">
					<label>分类</label>
					<input type="text" bind:value={post.category} placeholder="文章分类" />
				</div>
			</div>

			<details class="fm-section collapsible">
				<summary>更多选项</summary>
				<div class="field">
					<label>封面图片路径</label>
					<input type="text" bind:value={post.image} placeholder="./images/cover.jpg" />
				</div>
				<div class="field">
					<label>语言</label>
					<input type="text" bind:value={post.lang} placeholder="zh-CN" />
				</div>
				<div class="field">
					<label>作者</label>
					<input type="text" bind:value={post.author} placeholder="作者名" />
				</div>
				<div class="field">
					<label>文章密码</label>
					<input type="text" bind:value={post.password} placeholder="加密文章密码" />
				</div>
				<div class="field">
					<label>密码提示</label>
					<input type="text" bind:value={post.passwordHint} placeholder="密码提示语" />
				</div>
			</details>

			<div class="fm-section toggle-group">
				<label class="toggle">
					<input type="checkbox" bind:checked={post.draft} />
					<span class="toggle-track"></span>
					<span>草稿</span>
				</label>
				<label class="toggle">
					<input type="checkbox" bind:checked={post.pinned} />
					<span class="toggle-track"></span>
					<span>置顶</span>
				</label>
				<label class="toggle">
					<input type="checkbox" bind:checked={post.comment} />
					<span class="toggle-track"></span>
					<span>允许评论</span>
				</label>
			</div>
		</div>

		<!-- Right: Markdown Editor / Preview -->
		<div class="md-panel" class:split={editorMode === 'split'}>
			<div class="md-toolbar">
				<span class="md-label">Markdown 正文</span>
				<div class="mode-tabs">
					<button class:active={editorMode === 'edit'} onclick={() => editorMode = 'edit'}>编辑</button>
					<button class:active={editorMode === 'split'} onclick={() => editorMode = 'split'}>分屏</button>
					<button class:active={editorMode === 'preview'} onclick={() => editorMode = 'preview'}>预览</button>
				</div>
			</div>
			<div class="md-body">
				{#if editorMode !== 'preview'}
				<textarea class="md-editor" bind:value={post.body} placeholder="在此编写正文..."></textarea>
				{/if}
				{#if editorMode !== 'edit'}
				<div class="md-preview prose">{@html previewHtml}</div>
				{/if}
			</div>
		</div>
	</div>
</div>
{/if}

<style>
:global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
:global(html, body) { height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

:global(:root) {
	--bg: #f1f5f9;
	--surface: #ffffff;
	--surface2: #f8fafc;
	--border: #e2e8f0;
	--text: #1e293b;
	--text-muted: #64748b;
	--primary: #6366f1;
	--primary-hover: #4f46e5;
	--danger: #ef4444;
	--danger-hover: #dc2626;
	--success-bg: #f0fdf4;
	--success-text: #166534;
	--error-bg: #fef2f2;
	--error-text: #991b1b;
	--header-h: 56px;
}

@media (prefers-color-scheme: dark) {
	:global(:root) {
		--bg: #0f172a;
		--surface: #1e293b;
		--surface2: #152032;
		--border: #334155;
		--text: #e2e8f0;
		--text-muted: #94a3b8;
		--success-bg: #052e16;
		--success-text: #86efac;
		--error-bg: #2d0f0f;
		--error-text: #fca5a5;
	}
}

:global(body) { background: var(--bg); color: var(--text); }

/* Setup */
.setup-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
.setup-card { width: 100%; max-width: 520px; background: var(--surface); border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 24px rgba(0,0,0,.1); }
.setup-header { text-align: center; margin-bottom: 2rem; color: var(--primary); }
.setup-header h1 { font-size: 1.5rem; margin: .5rem 0 .25rem; color: var(--text); }
.setup-header p { color: var(--text-muted); font-size: .875rem; }

/* App layout */
.app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.app-header {
	height: var(--header-h); min-height: var(--header-h);
	display: flex; align-items: center; justify-content: space-between;
	padding: 0 1.25rem; background: var(--surface); border-bottom: 1px solid var(--border);
	gap: 1rem;
}
.header-left { display: flex; align-items: center; gap: .75rem; overflow: hidden; }
.header-right { display: flex; align-items: center; gap: .5rem; flex-shrink: 0; }
.header-title { font-weight: 600; font-size: 1rem; white-space: nowrap; }
.header-sub { color: var(--text-muted); font-size: .8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* List */
.list-body { flex: 1; overflow-y: auto; padding: 1.25rem; max-width: 800px; width: 100%; margin: 0 auto; }
.list-toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.search-input {
	flex: 1; padding: .5rem .75rem; border: 1px solid var(--border); border-radius: 8px;
	background: var(--surface); color: var(--text); font-size: .875rem;
}
.search-input:focus { outline: none; border-color: var(--primary); }
.post-count { color: var(--text-muted); font-size: .8rem; white-space: nowrap; }
.post-list { display: flex; flex-direction: column; gap: .5rem; }
.post-item {
	display: flex; align-items: center; gap: .75rem;
	padding: .875rem 1rem; background: var(--surface); border: 1px solid var(--border);
	border-radius: 10px; cursor: pointer; text-align: left; width: 100%;
	transition: border-color .15s, box-shadow .15s;
}
.post-item:hover { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
.post-name { font-weight: 500; font-size: .9rem; flex: 1; }
.post-path { color: var(--text-muted); font-size: .75rem; font-family: monospace; }
.post-arrow { color: var(--text-muted); flex-shrink: 0; }
.loading, .empty { text-align: center; color: var(--text-muted); padding: 3rem; }

/* Editor layout */
.editor-layout {
	flex: 1; display: grid; grid-template-columns: 340px 1fr; overflow: hidden;
}
.fm-panel { overflow-y: auto; border-right: 1px solid var(--border); background: var(--surface2); }
.fm-section { padding: 1rem; border-bottom: 1px solid var(--border); }
.collapsible summary { cursor: pointer; font-size: .8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: .75rem; }
.collapsible[open] summary { color: var(--text); }
.toggle-group { display: flex; flex-wrap: wrap; gap: .75rem; }

.md-panel { display: flex; flex-direction: column; overflow: hidden; }
.md-toolbar {
	display: flex; align-items: center; justify-content: space-between;
	padding: .35rem .75rem .35rem 1rem; border-bottom: 1px solid var(--border); background: var(--surface); flex-shrink: 0;
}
.md-label { font-size: .75rem; color: var(--text-muted); }
.mode-tabs { display: flex; gap: 2px; background: var(--bg); border-radius: 6px; padding: 2px; }
.mode-tabs button {
	padding: .25rem .65rem; font-size: .75rem; border: none; border-radius: 5px;
	background: transparent; color: var(--text-muted); cursor: pointer; transition: all .15s;
}
.mode-tabs button.active { background: var(--surface); color: var(--text); font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.mode-tabs button:hover:not(.active) { color: var(--text); }

.md-body { flex: 1; display: flex; overflow: hidden; }
.md-editor {
	flex: 1; resize: none; border: none; padding: 1rem; font-family: 'JetBrains Mono', 'Fira Code', monospace;
	font-size: .875rem; line-height: 1.75; background: var(--surface); color: var(--text); outline: none;
}
.md-panel.split .md-editor { border-right: 1px solid var(--border); }
.md-preview {
	flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; background: var(--surface);
	font-size: .9rem; line-height: 1.8; color: var(--text);
}
/* Prose styles for preview */
.prose :global(h1), .prose :global(h2), .prose :global(h3),
.prose :global(h4), .prose :global(h5), .prose :global(h6) {
	font-weight: 600; margin: 1.5em 0 .5em; line-height: 1.3; color: var(--text);
}
.prose :global(h1) { font-size: 1.6rem; }
.prose :global(h2) { font-size: 1.3rem; border-bottom: 1px solid var(--border); padding-bottom: .3em; }
.prose :global(h3) { font-size: 1.1rem; }
.prose :global(p) { margin: .75em 0; }
.prose :global(ul), .prose :global(ol) { padding-left: 1.5em; margin: .75em 0; }
.prose :global(li) { margin: .3em 0; }
.prose :global(blockquote) {
	border-left: 3px solid var(--primary); margin: 1em 0; padding: .5em 1em;
	color: var(--text-muted); background: var(--bg); border-radius: 0 6px 6px 0;
}
.prose :global(code) {
	font-family: 'JetBrains Mono', monospace; font-size: .85em;
	background: var(--bg); padding: .15em .4em; border-radius: 4px;
}
.prose :global(pre) {
	background: var(--bg); padding: 1em; border-radius: 8px; overflow-x: auto;
	margin: 1em 0; border: 1px solid var(--border);
}
.prose :global(pre code) { background: none; padding: 0; font-size: .85rem; }
.prose :global(a) { color: var(--primary); text-decoration: none; }
.prose :global(a:hover) { text-decoration: underline; }
.prose :global(img) { max-width: 100%; border-radius: 8px; margin: .5em 0; }
.prose :global(table) { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: .875rem; }
.prose :global(th), .prose :global(td) { border: 1px solid var(--border); padding: .5em .75em; }
.prose :global(th) { background: var(--bg); font-weight: 600; }
.prose :global(hr) { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }

/* Forms */
.field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: .75rem; }
.field:last-child { margin-bottom: 0; }
.field label { font-size: .8rem; font-weight: 500; color: var(--text-muted); }
.field input, .field textarea, .search-input {
	padding: .45rem .7rem; border: 1px solid var(--border); border-radius: 7px;
	background: var(--surface); color: var(--text); font-size: .875rem; font-family: inherit;
	transition: border-color .15s;
}
.field input:focus, .field textarea:focus { outline: none; border-color: var(--primary); }
.field textarea { resize: vertical; }
.field small { font-size: .75rem; color: var(--text-muted); }
.field small code { background: var(--bg); padding: .1em .3em; border-radius: 4px; font-size: .85em; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: .75rem; }
.req { color: var(--danger); }

/* Toggle */
.toggle { display: flex; align-items: center; gap: .5rem; cursor: pointer; font-size: .875rem; }
.toggle input { display: none; }
.toggle-track {
	width: 36px; height: 20px; background: var(--border); border-radius: 10px; flex-shrink: 0;
	position: relative; transition: background .15s;
}
.toggle-track::after {
	content: ''; position: absolute; top: 2px; left: 2px;
	width: 16px; height: 16px; border-radius: 50%; background: #fff;
	transition: transform .15s;
}
.toggle input:checked + .toggle-track { background: var(--primary); }
.toggle input:checked + .toggle-track::after { transform: translateX(16px); }

/* Buttons */
.btn-primary {
	padding: .45rem 1rem; background: var(--primary); color: #fff; border: none;
	border-radius: 7px; cursor: pointer; font-size: .875rem; font-weight: 500;
	transition: background .15s; white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-ghost {
	padding: .45rem .7rem; background: transparent; color: var(--text-muted);
	border: 1px solid var(--border); border-radius: 7px; cursor: pointer;
	font-size: .875rem; display: flex; align-items: center; gap: .35rem;
	transition: color .15s, border-color .15s; white-space: nowrap;
}
.btn-ghost:hover { color: var(--text); border-color: var(--text-muted); }
.btn-danger {
	padding: .45rem .9rem; background: transparent; color: var(--danger);
	border: 1px solid var(--danger); border-radius: 7px; cursor: pointer;
	font-size: .875rem; font-weight: 500; transition: background .15s, color .15s;
}
.btn-danger:hover:not(:disabled) { background: var(--danger); color: #fff; }
.btn-danger:disabled { opacity: .6; cursor: not-allowed; }

/* Alerts */
.alert {
	display: flex; align-items: center; justify-content: space-between; gap: .75rem;
	padding: .65rem 1rem; border-radius: 8px; font-size: .85rem;
}
.alert button { background: none; border: none; cursor: pointer; font-size: 1.1rem; line-height: 1; opacity: .7; }
.alert button:hover { opacity: 1; }
.alert.error { background: var(--error-bg); color: var(--error-text); }
.alert.success { background: var(--success-bg); color: var(--success-text); }
.editor-alert { margin: .5rem 1rem 0; }

/* Demo mode */
.demo-divider { display: flex; align-items: center; gap: .75rem; margin: 1rem 0; color: var(--text-muted); font-size: .8rem; }
.demo-divider::before, .demo-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.btn-demo {
	width: 100%; padding: .55rem; background: transparent; color: var(--text-muted);
	border: 1px dashed var(--border); border-radius: 7px; cursor: pointer;
	font-size: .875rem; transition: color .15s, border-color .15s;
}
.btn-demo:hover { color: var(--primary); border-color: var(--primary); }
.demo-badge {
	font-size: .7rem; font-weight: 600; padding: .2em .55em; border-radius: 4px;
	background: #fef3c7; color: #92400e; letter-spacing: .03em;
}
@media (prefers-color-scheme: dark) {
	.demo-badge { background: #451a03; color: #fcd34d; }
}

@media (max-width: 768px) {
	.editor-layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
	.fm-panel { border-right: none; border-bottom: 1px solid var(--border); max-height: 55vh; }
	.md-editor { min-height: 300px; }
	.md-panel.split .md-body { flex-direction: column; }
	.md-panel.split .md-editor { border-right: none; border-bottom: 1px solid var(--border); flex: none; height: 40%; }
}
</style>
