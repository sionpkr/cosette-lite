<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { LayoutData } from './$types';
	import { registrationClosedMessage, registrationSecondsLeft } from '$lib/registration';
	import '../main.css';
	import { base } from '$app/paths';
	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { children, data }: Props = $props();
	let now = $state<number | null>(null);
	const secondsLeft = $derived(registrationSecondsLeft(now ?? data.serverNow));
	const days = $derived(Math.floor(secondsLeft / 86400));
	const hours = $derived(Math.floor((secondsLeft % 86400) / 3600));
	const minutes = $derived(Math.floor((secondsLeft % 3600) / 60));
	const seconds = $derived(secondsLeft % 60);

	onMount(() => {
		const started = performance.now();
		const serverNow = data.serverNow;
		const timer = setInterval(() => {
			now = serverNow + performance.now() - started;
		}, 250);
		return () => clearInterval(timer);
	});
</script>

<div class="site-shell container">
	<header>
		<img
			class="tournament-banner"
			src="{base}/krc-banner.png"
			alt="대한민국지역대항전 — Korea Regional Cup"
			width="1500"
			height="500"
		/>
	</header>
	<main>
		{#if secondsLeft > 0 || page.url.pathname === '/done'}
			{@render children?.()}
		{:else}
			<section class="text-centered" role="status">
				<h1>참가 신청 마감</h1>
				<p>{registrationClosedMessage}</p>
			</section>
		{/if}
	</main>
	<footer class="text-centered">
		<p>참가 신청 마감: 2026년 12월 7일 23:59:59 (UTC+9)</p>
		{#if secondsLeft > 0}
			<p role="timer" aria-label="참가 신청 마감까지 남은 시간">
				남은 시간: {days}일 {hours}시간 {minutes}분 {seconds}초
			</p>
		{:else}
			<p role="status">{registrationClosedMessage}</p>
		{/if}
	</footer>
</div>

<style>
	footer {
		margin-top: 2rem;
		padding-block: 1rem;
		border-top: 1px solid #8886;
		font-variant-numeric: tabular-nums;
	}
	footer p {
		margin: 0.5rem 0;
	}
</style>
