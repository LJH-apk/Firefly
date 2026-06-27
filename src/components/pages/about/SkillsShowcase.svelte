<script lang="ts">
import { onMount } from "svelte";
import ClientPagination from "@components/common/ClientPagination.svelte";
import Icon from "@components/common/Icon.svelte";
import TabNav from "@components/pages/bangumi/TabNav.svelte";
import type { SkillCategory } from "@/types/skillsConfig";

interface Props {
	categories: SkillCategory[];
	itemsPerPage?: number;
}

let { categories, itemsPerPage = 8 }: Props = $props();

// 状态
let activeTab = $state(categories[0]?.id ?? "");
let currentPage = $state(1);

// 标签数据（分类名 + 该分类技能数）
const tabs = $derived(
	categories.map((c) => ({ id: c.id, name: c.name, count: c.skills.length })),
);

// 当前分类下的技能
const currentSkills = $derived(
	categories.find((c) => c.id === activeTab)?.skills ?? [],
);

// 分页后的技能
const pagedSkills = $derived(
	currentSkills.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	),
);

// 切换分类时回到第一页
function setTab(tabId: string) {
	if (tabId === activeTab) return;
	activeTab = tabId;
	currentPage = 1;
}

function goToPage(page: number) {
	currentPage = page;
}

// 首次挂载时根据 URL hash 定位分类（支持深链/刷新）
onMount(() => {
	try {
		const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
		if (hash && categories.some((c) => c.id === hash)) {
			activeTab = hash;
		}
	} catch {}
});
</script>

<div class="skills-showcase not-prose">
	<!-- 分类标签 -->
	<TabNav {tabs} {activeTab} onTabChange={setTab} />

	<!-- 技能卡片网格 -->
	{#if pagedSkills.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
			{#each pagedSkills as skill (skill.name)}
				<div
					class="skill-card flex items-center gap-3 rounded-xl border border-(--line-divider) bg-(--card-bg) p-3 transition-all duration-300 hover:border-(--primary)/40 hover:shadow-md hover:-translate-y-0.5"
				>
					<!-- 图标 -->
					<div class="flex h-10 w-10 shrink-0 items-center justify-center">
						<Icon name={skill.icon ?? ""} color={skill.color} size="2xl" />
					</div>

					<!-- 名称 + 熟练度 -->
					<div class="min-w-0 flex-1">
						<div class="mb-1.5 flex items-center justify-between gap-2">
							<span
								class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100"
								title={skill.name}>{skill.name}</span
							>
							<span class="shrink-0 text-xs text-neutral-500 dark:text-neutral-400"
								>{skill.level}%</span
							>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-(--btn-regular-bg)">
							<div
								class="skill-bar h-full rounded-full"
								style="width: {skill.level}%; background-color: {skill.color ?? 'var(--primary)'};"
							></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="py-12 text-center text-neutral-500 dark:text-neutral-400">
			该分类暂无技能
		</div>
	{/if}

	<!-- 分页 -->
	<ClientPagination
		totalItems={currentSkills.length}
		{itemsPerPage}
		{currentPage}
		onPageChange={goToPage}
	/>
</div>

<style>
	/* 进度条入场动画：每次切换分类/翻页时随新卡片重新播放 */
	.skill-bar {
		transform-origin: left center;
		animation: skill-bar-grow 0.6s ease-out;
	}

	@keyframes skill-bar-grow {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skill-bar {
			animation: none;
		}
		.skill-card {
			transition: none;
		}
	}
</style>
