<script lang="ts">
	import '../main.css';
	import { base } from '$app/paths';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
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
		{@render children?.()}
	</main>
</div>
