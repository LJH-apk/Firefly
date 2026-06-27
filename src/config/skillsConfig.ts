import type { SkillsConfig } from "../types/skillsConfig";

// ============================================================
// 技能展示配置（显示在「关于我」页面）
//
// 用法：
//  - 下面的分类与技能都是「示例数据」，请按自己的情况增删改。
//  - icon 使用 iconify 名称，推荐 simple-icons 图标集（各类技术 logo），
//    在 https://icones.js.org/collection/simple-icons 搜索，复制形如
//    "simple-icons:python" 的名称即可。也可用 material-symbols / mdi 等。
//  - 修改/新增 icon 后，需重新生成内联图标：执行 `pnpm icons`
//    （或直接 `pnpm build`），否则新图标会显示为占位圆圈。
//  - level 为熟练度百分比（0–100），用于进度条。
//  - color 可选，技术品牌色，用于图标与进度条点缀；颜色过深/过浅时
//    建议留空，图标会自动跟随主题文字色。
// ============================================================

export const skillsConfig: SkillsConfig = {
	enable: true, // 是否显示技能区
	title: "🛠️ 我的技能", // 区块标题
	itemsPerPage: 8, // 每页显示的技能数量（超过则自动分页）

	categories: [
		{
			id: "frontend",
			name: "前端",
			skills: [
				{ name: "HTML5", level: 90, icon: "simple-icons:html5", color: "#E34F26" },
				{ name: "JavaScript", level: 85, icon: "simple-icons:javascript", color: "#F7DF1E" },
				{ name: "TypeScript", level: 80, icon: "simple-icons:typescript", color: "#3178C6" },
				{ name: "Vue.js", level: 85, icon: "simple-icons:vuedotjs", color: "#4FC08D" },
				{ name: "React", level: 75, icon: "simple-icons:react", color: "#61DAFB" },
				{ name: "Tailwind CSS", level: 85, icon: "simple-icons:tailwindcss", color: "#06B6D4" },
				{ name: "Astro", level: 80, icon: "simple-icons:astro", color: "#FF5D01" },
				{ name: "Svelte", level: 70, icon: "simple-icons:svelte", color: "#FF3E00" },
				{ name: "Sass", level: 75, icon: "simple-icons:sass", color: "#CC6699" },
				{ name: "Vite", level: 70, icon: "simple-icons:vite", color: "#646CFF" },
			],
		},
		{
			id: "backend",
			name: "后端",
			skills: [
				{ name: "Python", level: 85, icon: "simple-icons:python", color: "#3776AB" },
				{ name: "Node.js", level: 75, icon: "simple-icons:nodedotjs", color: "#5FA04E" },
				{ name: "MySQL", level: 70, icon: "simple-icons:mysql", color: "#4479A1" },
				{ name: "Redis", level: 60, icon: "simple-icons:redis", color: "#FF4438" },
			],
		},
		{
			id: "tools",
			name: "工具 & 其它",
			skills: [
				{ name: "Git", level: 85, icon: "simple-icons:git", color: "#F05032" },
				{ name: "GitHub", level: 85, icon: "simple-icons:github" },
				{ name: "Docker", level: 65, icon: "simple-icons:docker", color: "#2496ED" },
				{ name: "Linux", level: 70, icon: "simple-icons:linux", color: "#FCC624" },
				{ name: "Figma", level: 60, icon: "simple-icons:figma", color: "#F24E1E" },
				{ name: "Postman", level: 70, icon: "simple-icons:postman", color: "#FF6C37" },
			],
		},
	],
};
