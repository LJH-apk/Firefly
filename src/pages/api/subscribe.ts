export const prerender = false;

import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";

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

export const POST: APIRoute = async ({ request }) => {
	const headers = {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": SITE_URL,
	};

	if (!env.SUBSCRIBERS) {
		return new Response(JSON.stringify({ error: "服务暂不可用" }), { status: 503, headers });
	}

	let body: { email?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "请求格式错误" }), { status: 400, headers });
	}

	const email = body.email?.trim().toLowerCase();
	if (!email || !isValidEmail(email)) {
		return new Response(JSON.stringify({ error: "邮箱格式不正确" }), { status: 400, headers });
	}

	const existing = await env.SUBSCRIBERS.get(`email_index:${email}`);
	if (existing) {
		return new Response(JSON.stringify({ error: "该邮箱已订阅" }), { status: 409, headers });
	}

	const token = generateToken();
	await env.SUBSCRIBERS.put(`sub:${token}`, JSON.stringify({ email, token, subscribedAt: new Date().toISOString() }));
	await env.SUBSCRIBERS.put(`email_index:${email}`, token);

	const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${token}`;
	const emailRes = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
		body: JSON.stringify({
			from: `${FROM_NAME} <${FROM_EMAIL}>`,
			to: [email],
			subject: "订阅成功 — 小刘の神秘小站",
			html: `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">订阅成功 ✨</h1>
    </div>
    <div style="padding:28px 24px">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px">感谢订阅「小刘の神秘小站」！</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0">今后每当有新文章发布，您都会第一时间收到通知。</p>
      <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:14px">
        <a href="${unsubscribeUrl}" style="color:#9ca3af;font-size:12px;text-decoration:none">不想再收到通知？点击退订</a>
      </div>
    </div>
  </div>
</body></html>`,
		}),
	});
	if (!emailRes.ok) {
		const errText = await emailRes.text();
		console.error(`[subscribe] Resend error ${emailRes.status}: ${errText}`);
	}

	return new Response(JSON.stringify({ success: true }), { status: 200, headers });
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": SITE_URL,
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
};
