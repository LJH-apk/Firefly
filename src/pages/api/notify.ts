export const prerender = false;

import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";

const SITE_URL = "https://cf-blog.liujiahang.icu";
const FROM_EMAIL = "noreply@cf-blog.liujiahang.icu";
const FROM_NAME = "小刘の神秘小站";

interface PostMeta {
	id: string;
	title: string;
	description: string;
	published: number;
	password: boolean;
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const POST: APIRoute = async ({ request }) => {
	const jsonHeaders = { "Content-Type": "application/json" };

	const authHeader = request.headers.get("Authorization");
	if (!authHeader || authHeader !== `Bearer ${env.NOTIFY_SECRET}`) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
	}

	let posts: PostMeta[];
	try {
		const res = await fetch(`${SITE_URL}/api/allPostMeta.json`);
		posts = await res.json();
	} catch {
		return new Response(JSON.stringify({ error: "Failed to fetch post list" }), { status: 500, headers: jsonHeaders });
	}

	const publicPosts = posts.filter((p) => !p.password);

	const lastNotifiedRaw = await env.SUBSCRIBERS.get("last_notified_ids");
	const lastNotifiedIds: string[] = lastNotifiedRaw ? JSON.parse(lastNotifiedRaw) : [];
	const newPosts = publicPosts.filter((p) => !lastNotifiedIds.includes(p.id));

	if (newPosts.length === 0) {
		return new Response(JSON.stringify({ message: "No new posts", notified: 0 }), { status: 200, headers: jsonHeaders });
	}

	const { keys } = await env.SUBSCRIBERS.list({ prefix: "sub:" });
	const subscribers: { email: string; token: string }[] = [];
	for (const key of keys) {
		const raw = await env.SUBSCRIBERS.get(key.name);
		if (raw) subscribers.push(JSON.parse(raw));
	}

	let successCount = 0;
	for (const subscriber of subscribers) {
		const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${subscriber.token}`;
		const postCards = newPosts.map((post) => {
			const postUrl = `${SITE_URL}/posts/${post.id}/`;
			return `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px">
  <h2 style="font-size:16px;font-weight:700;margin:0 0 8px">
    <a href="${postUrl}" style="color:#6366f1;text-decoration:none">${escapeHtml(post.title)}</a>
  </h2>
  ${post.description ? `<p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0 0 12px">${escapeHtml(post.description)}</p>` : ""}
  <a href="${postUrl}" style="display:inline-block;background:#6366f1;color:#fff;font-size:13px;padding:6px 14px;border-radius:6px;text-decoration:none">阅读全文 →</a>
</div>`;
		}).join("");

		const subject = newPosts.length === 1
			? `新文章：${newPosts[0].title}`
			: `${newPosts.length} 篇新文章发布了 — 小刘の神秘小站`;

		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				from: `${FROM_NAME} <${FROM_EMAIL}>`,
				to: [subscriber.email],
				subject,
				html: `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:24px">
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
</body></html>`,
			}),
		});
		if (res.ok) successCount++;
	}

	await env.SUBSCRIBERS.put("last_notified_ids", JSON.stringify(publicPosts.map((p) => p.id)));

	return new Response(
		JSON.stringify({ message: "Notifications sent", newPosts: newPosts.length, notified: successCount, total: subscribers.length }),
		{ status: 200, headers: jsonHeaders },
	);
};
