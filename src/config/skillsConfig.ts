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
	title: " 我的技能", // 区块标题
	itemsPerPage: 8, // 每页显示的技能数量（超过则自动分页）

	categories: [
		{
			id: "frontend",
			name: "前端",
			skills: [
				{ name: "HTML5", level: 70, icon: "simple-icons:html5", color: "#E34F26" },
				{ name: "JavaScript", level: 80, icon: "simple-icons:javascript", color: "#F7DF1E" },
				{ name: "Vue.js", level: 65, icon: "simple-icons:vuedotjs", color: "#4FC08D" },
				{ name: "React", level: 75, icon: "simple-icons:react", color: "#61DAFB" },
				{ name: "Vite", level: 70, icon: "simple-icons:vite", color: "#646CFF" },
			],
		},
		{
			id: "backend",
			name: "后端",
			skills: [
				{ name: "Python", level: 80, icon: "simple-icons:python", color: "#3776AB" },
				{ name: "Java", level: 70, icon: "devicon:java", color: "#d59815" },
				{ name: "Node.js", level: 40, icon: "simple-icons:nodedotjs", color: "#5FA04E" },
				{ name: "MySQL", level: 30, icon: "simple-icons:mysql", color: "#4479A1" },
				{ name: "Redis", level: 40, icon: "simple-icons:redis", color: "#FF4438" },
			],
		},
		{
			id: "tools",
			name: "工具 & 其它",
			skills: [
				{ name: "Git", level: 85, icon: "simple-icons:git", color: "#F05032" },
				{ name: "GitHub", level: 30, icon: "simple-icons:github" },
				{ name: "Linux", level: 70, icon: "simple-icons:linux", color: "#FCC624" },
				{ name: "Postman", level: 50, icon: "simple-icons:postman", color: "#FF6C37" },
			],
		},
		{
			id: "other",
			name: "办公软件",
			skills: [
				{ name: "Word", level: 80, icon: "simple-icons:microsoftword", color: "#2B579A" },
				{ name: "Excel", level: 80, icon: "simple-icons:microsoftexcel", color: "#217346" },
				{ name: "PowerPoint", level: 80, icon: "simple-icons:microsoftpowerpoint", color: "#D24726" },
			]
		},
		{
			id: "design",
			name: "设计工具",
			skills: [
				{ name: "Photoshop", level: 70, icon: "simple-icons:adobephotoshop", color: "#31A8FF" },
				{ name: "Illustrator", level: 60, icon: "simple-icons:adobeillustrator", color: "#FF9A00" },
				{ name: "Premiere Pro", level: 50, icon: "simple-icons:adobepremierepro", color: "#9999FF" },
			]
		}
	],
};
