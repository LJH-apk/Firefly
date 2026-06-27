// 技能展示配置类型定义（用于「关于我」页面的技能区）

// 单个技能
export interface Skill {
	name: string; // 技能名，如 "Python"
	level: number; // 熟练度 0–100，用于进度条
	icon?: string; // 图标名（iconify 格式），如 "simple-icons:python"，可选
	color?: string; // 品牌色，用于图标/进度条点缀，如 "#3776AB"，可选
}

// 技能分类（对应一个标签页）
export interface SkillCategory {
	id: string; // 标签 id，兼作 URL hash 锚点，如 "frontend"
	name: string; // 标签显示名，如 "前端"
	skills: Skill[];
}

// 技能区整体配置
export interface SkillsConfig {
	enable: boolean; // 是否在「关于我」页显示技能区
	title: string; // 区块标题，如 "🛠️ 技能栈"
	itemsPerPage: number; // 每页显示的技能数量
	categories: SkillCategory[];
}
