// Ambient declarations for Cloudflare Workers bindings and the cloudflare:workers virtual module.
// This file must NOT have any import/export statements — that would turn it into a module
// and break the global ambient module declaration for "cloudflare:workers".

interface CfKVNamespace {
	get(key: string): Promise<string | null>;
	put(key: string, value: string): Promise<void>;
	delete(key: string): Promise<void>;
	list(opts?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

interface CloudflareEnv {
	SUBSCRIBERS: CfKVNamespace;
	RESEND_API_KEY: string;
	NOTIFY_SECRET: string;
}

declare module "cloudflare:workers" {
	export const env: CloudflareEnv;
}
