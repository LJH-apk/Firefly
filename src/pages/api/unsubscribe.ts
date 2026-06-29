export const prerender = false;

import type { APIRoute } from "astro";

const SITE_URL = "https://cf-blog.liujiahang.icu";

function escapeHtml(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderPage(title: string, message: string): string {
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:40px 16px;display:flex;align-items:center;justify-content:center;min-height:100vh;box-sizing:border-box}
    .card{max-width:400px;width:100%;background:#fff;border-radius:12px;padding:40px 32px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    h1{color:#111827;font-size:20px;margin:0 0 12px}
    p{color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px}
    a{color:#6366f1;font-size:14px;text-decoration:none}
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

export const GET: APIRoute = async ({ locals, url }) => {
	const htmlHeaders = { "Content-Type": "text/html;charset=utf-8" };
	const env = locals.runtime?.env;

	if (!env?.SUBSCRIBERS) {
		return new Response(renderPage("服务错误", "服务暂不可用，请稍后重试。"), { status: 503, headers: htmlHeaders });
	}

	const token = url.searchParams.get("token");
	if (!token) {
		return new Response(renderPage("退订失败", "缺少退订令牌。"), { status: 400, headers: htmlHeaders });
	}

	const raw = await env.SUBSCRIBERS.get(`sub:${token}`);
	if (!raw) {
		return new Response(renderPage("退订失败", "该链接已失效或已退订。"), { status: 404, headers: htmlHeaders });
	}

	const subscriber = JSON.parse(raw) as { email: string; token: string };
	await env.SUBSCRIBERS.delete(`sub:${token}`);
	await env.SUBSCRIBERS.delete(`email_index:${subscriber.email}`);

	return new Response(
		renderPage("退订成功", `${subscriber.email} 已成功退订，您将不再收到新文章通知。`),
		{ status: 200, headers: htmlHeaders },
	);
};
