// Cloudflare Workers types (inline, avoids requiring @cloudflare/workers-types)
interface KVNamespace {
	get(key: string): Promise<string | null>;
	put(key: string, value: string): Promise<void>;
	delete(key: string): Promise<void>;
	list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

interface Fetcher {
	fetch(request: Request): Promise<Response>;
}

interface Env {
	SUBSCRIBERS: KVNamespace;
	RESEND_API_KEY: string;
	NOTIFY_SECRET: string;
	ASSETS: Fetcher;
}

interface Subscriber {
	email: string;
	token: string;
	subscribedAt: string;
}

interface PostMeta {
	id: string;
	title: string;
	description: string;
	published: number;
	category: string;
	password: boolean;
}

const SITE_URL = "https://cf-blog.liujiahang.icu";
const FROM_EMAIL = "noreply@cf-blog.liujiahang.icu";
const FROM_NAME = "小刘の神秘小站";

function generateToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function corsHeaders(): Record<string, string> {
	return {
		"Access-Control-Allow-Origin": SITE_URL,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};
}

async function handleSubscribe(request: Request, env: Env): Promise<Response> {
	const headers = { ...corsHeaders(), "Content-Type": "application/json" };

	let body: { email?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "请求格式错误" }), {
			status: 400,
			headers,
		});
	}

	const email = body.email?.trim().toLowerCase();
	if (!email || !isValidEmail(email)) {
		return new Response(JSON.stringify({ error: "邮箱格式不正确" }), {
			status: 400,
			headers,
		});
	}

	const existing = await env.SUBSCRIBERS.get(`email_index:${email}`);
	if (existing) {
		return new Response(JSON.stringify({ error: "该邮箱已订阅" }), {
			status: 409,
			headers,
		});
	}

	const token = generateToken();
	const subscriber: Subscriber = {
		email,
		token,
		subscribedAt: new Date().toISOString(),
	};

	await env.SUBSCRIBERS.put(`sub:${token}`, JSON.stringify(subscriber));
	await env.SUBSCRIBERS.put(`email_index:${email}`, token);

	await sendWelcomeEmail(email, token, env);

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers,
	});
}

async function handleUnsubscribe(url: URL, env: Env): Promise<Response> {
	const token = url.searchParams.get("token");
	if (!token) {
		return new Response(
			renderUnsubscribePage("退订失败", "缺少退订令牌。"),
			{ status: 400, headers: { "Content-Type": "text/html;charset=utf-8" } },
		);
	}

	const raw = await env.SUBSCRIBERS.get(`sub:${token}`);
	if (!raw) {
		return new Response(
			renderUnsubscribePage("退订失败", "该链接已失效或已退订。"),
			{ status: 404, headers: { "Content-Type": "text/html;charset=utf-8" } },
		);
	}

	const subscriber: Subscriber = JSON.parse(raw);
	await env.SUBSCRIBERS.delete(`sub:${token}`);
	await env.SUBSCRIBERS.delete(`email_index:${subscriber.email}`);

	return new Response(
		renderUnsubscribePage(
			"退订成功",
			`${subscriber.email} 已成功退订，您将不再收到新文章通知。`,
		),
		{ status: 200, headers: { "Content-Type": "text/html;charset=utf-8" } },
	);
}

async function handleNotify(request: Request, env: Env): Promise<Response> {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader || authHeader !== `Bearer ${env.NOTIFY_SECRET}`) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	let posts: PostMeta[];
	try {
		const res = await fetch(`${SITE_URL}/api/allPostMeta.json`);
		posts = await res.json();
	} catch {
		return new Response(JSON.stringify({ error: "Failed to fetch post list" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	const publicPosts = posts.filter((p) => !p.password);

	const lastNotifiedRaw = await env.SUBSCRIBERS.get("last_notified_ids");
	const lastNotifiedIds: string[] = lastNotifiedRaw
		? JSON.parse(lastNotifiedRaw)
		: [];

	const newPosts = publicPosts.filter((p) => !lastNotifiedIds.includes(p.id));

	if (newPosts.length === 0) {
		return new Response(JSON.stringify({ message: "No new posts", notified: 0 }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { keys } = await env.SUBSCRIBERS.list({ prefix: "sub:" });
	const subscribers: Subscriber[] = [];
	for (const key of keys) {
		const raw = await env.SUBSCRIBERS.get(key.name);
		if (raw) subscribers.push(JSON.parse(raw));
	}

	let successCount = 0;
	for (const subscriber of subscribers) {
		const sent = await sendNotificationEmail(subscriber, newPosts, env);
		if (sent) successCount++;
	}

	await env.SUBSCRIBERS.put(
		"last_notified_ids",
		JSON.stringify(publicPosts.map((p) => p.id)),
	);

	return new Response(
		JSON.stringify({
			message: "Notifications sent",
			newPosts: newPosts.length,
			notified: successCount,
			total: subscribers.length,
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
}

async function sendWelcomeEmail(
	email: string,
	token: string,
	env: Env,
): Promise<void> {
	const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${token}`;
	const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">订阅成功 ✨</h1>
    </div>
    <div style="padding:28px 24px">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px">感谢订阅「小刘の神秘小站」！</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 0">今后每当有新文章发布，您都会第一时间收到通知。</p>
      <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:14px">
        <a href="${unsubscribeUrl}" style="color:#9ca3af;font-size:12px;text-decoration:none">不想再收到通知？点击退订</a>
      </div>
    </div>
  </div>
</body>
</html>`;

	await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: `${FROM_NAME} <${FROM_EMAIL}>`,
			to: [email],
			subject: "订阅成功 — 小刘の神秘小站",
			html,
		}),
	});
}

async function sendNotificationEmail(
	subscriber: Subscriber,
	newPosts: PostMeta[],
	env: Env,
): Promise<boolean> {
	const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${subscriber.token}`;

	const postCards = newPosts
		.map((post) => {
			const postUrl = `${SITE_URL}/posts/${post.id}/`;
			return `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px">
  <h2 style="color:#111827;font-size:16px;font-weight:700;margin:0 0 8px">
    <a href="${postUrl}" style="color:#6366f1;text-decoration:none">${escapeHtml(post.title)}</a>
  </h2>
  ${post.description ? `<p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0 0 12px">${escapeHtml(post.description)}</p>` : ""}
  <a href="${postUrl}" style="display:inline-block;background:#6366f1;color:#fff;font-size:13px;padding:6px 14px;border-radius:6px;text-decoration:none">阅读全文 →</a>
</div>`;
		})
		.join("");

	const subject =
		newPosts.length === 1
			? `新文章：${newPosts[0].title}`
			: `${newPosts.length} 篇新文章发布了 — 小刘の神秘小站`;

	const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 24px;text-align:center">
      <p style="color:rgba(255,255,255,.8);margin:0 0 6px;font-size:13px">小刘の神秘小站</p>
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">有新文章发布了 📝</h1>
    </div>
    <div style="padding:24px">
      ${postCards}
      <div style="border-top:1px solid #e5e7eb;margin-top:16px;padding-top:14px">
        <a href="${unsubscribeUrl}" style="color:#9ca3af;font-size:12px;text-decoration:none">不想再收到通知？点击退订</a>
      </div>
    </div>
  </div>
</body>
</html>`;

	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: `${FROM_NAME} <${FROM_EMAIL}>`,
			to: [subscriber.email],
			subject,
			html,
		}),
	});

	return res.ok;
}

function renderUnsubscribePage(title: string, message: string): string {
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:40px 16px;display:flex;align-items:center;justify-content:center;min-height:100vh;box-sizing:border-box}
    .card{max-width:400px;width:100%;background:#fff;border-radius:12px;padding:40px 32px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    h1{color:#111827;font-size:20px;margin:0 0 12px}
    p{color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px}
    a{display:inline-block;color:#6366f1;font-size:14px;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <a href="${SITE_URL}">返回博客首页</a>
  </div>
</body>
</html>`;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders() });
		}

		if (url.pathname === "/api/subscribe" && request.method === "POST") {
			return handleSubscribe(request, env);
		}
		if (url.pathname === "/api/unsubscribe" && request.method === "GET") {
			return handleUnsubscribe(url, env);
		}
		if (url.pathname === "/api/notify" && request.method === "POST") {
			return handleNotify(request, env);
		}

		return env.ASSETS.fetch(request);
	},
};
