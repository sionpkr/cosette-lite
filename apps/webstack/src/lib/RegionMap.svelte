<script lang="ts">
	import { regionPaths, REGION_MAP_VIEWBOX } from '$lib/regionMap';

	interface Props {
		/** region name -> role id (only selectable regions) */
		idByName: Map<string, string>;
		selectedId: string;
	}

	let { idByName, selectedId = $bindable() }: Props = $props();

	const W = 530;
	const H = 560;
	const MAX = 8;

	let svg: SVGSVGElement;
	let s = $state(1);
	let tx = $state(0);
	let ty = $state(0);
	let hoverName = $state('');
	let moved = false;

	const selectedName = $derived([...idByName].find(([, id]) => id === selectedId)?.[0] ?? '');
	const label = $derived(hoverName || selectedName);

	const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

	// Zoom by factor k around viewBox point (px, py), keeping the map inside the frame.
	function zoom(k: number, px = W / 2, py = H / 2) {
		const ns = clamp(s * k, 1, MAX);
		tx = clamp(px - ((px - tx) * ns) / s, W * (1 - ns), 0);
		ty = clamp(py - ((py - ty) * ns) / s, H * (1 - ns), 0);
		s = ns;
	}

	function toView(e: { clientX: number; clientY: number }) {
		const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
		return p;
	}

	// Non-passive wheel listener so the page doesn't scroll while zooming.
	function wheel(node: SVGSVGElement) {
		const h = (e: WheelEvent) => {
			e.preventDefault();
			const p = toView(e);
			zoom(e.deltaY < 0 ? 1.25 : 0.8, p.x, p.y);
		};
		node.addEventListener('wheel', h, { passive: false });
		return { destroy: () => node.removeEventListener('wheel', h) };
	}

	let drag: { x: number; y: number } | null = null;
	function down(e: PointerEvent) {
		drag = { x: e.clientX, y: e.clientY };
		moved = false;
	}
	function move(e: PointerEvent) {
		if (!drag) return;
		const dx = e.clientX - drag.x;
		const dy = e.clientY - drag.y;
		if (!moved && Math.hypot(dx, dy) < 4) return;
		moved = true;
		const r = svg.getBoundingClientRect();
		tx = clamp(tx + (dx * W) / r.width, W * (1 - s), 0);
		ty = clamp(ty + (dy * H) / r.height, H * (1 - s), 0);
		drag = { x: e.clientX, y: e.clientY };
	}
	function pick(name: string) {
		if (!moved) selectedId = idByName.get(name) ?? '';
	}
</script>

<div class="map">
	<div class="frame">
		<svg
			bind:this={svg}
			use:wheel
			viewBox={REGION_MAP_VIEWBOX}
			role="group"
			aria-label="대한민국 지역 지도"
			onpointerdown={down}
			onpointermove={move}
			onpointerup={() => (drag = null)}
			onpointerleave={() => (drag = null)}
		>
			<g transform="translate({tx} {ty}) scale({s})">
				{#each regionPaths as p (p.name)}
					<g
						class="region"
						class:selected={idByName.get(p.name) === selectedId}
						role="button"
						tabindex="0"
						aria-label={p.name}
						onmouseenter={() => (hoverName = p.name)}
						onmouseleave={() => (hoverName = '')}
						onfocus={() => (hoverName = p.name)}
						onblur={() => (hoverName = '')}
						onclick={() => pick(p.name)}
						onkeydown={(e) => e.key === 'Enter' && (selectedId = idByName.get(p.name) ?? '')}
					>
						<!-- outline layer: wide stroke; fill layer on top hides it along inner city seams -->
						<path d={p.d} class="outline" />
						<path d={p.d} class="fill" />
					</g>
				{/each}
			</g>
		</svg>
		<div class="zoom">
			<button type="button" aria-label="확대" onclick={() => zoom(1.5)}>+</button>
			<button type="button" aria-label="축소" onclick={() => zoom(1 / 1.5)}>−</button>
		</div>
	</div>
	<p class="map-label">{label || ' '}</p>
</div>

<style>
	.map {
		text-align: center;
	}
	.frame {
		position: relative;
		touch-action: none;
	}
	svg {
		width: 100%;
		height: auto;
		cursor: grab;
		overflow: hidden;
	}
	.region {
		cursor: pointer;
		outline: none;
		--c: #6b7280;
	}
	.region:hover,
	.region:focus-visible {
		--c: #f472b6;
	}
	.region.selected {
		--c: #5865f2;
	}
	path {
		vector-effect: non-scaling-stroke; /* constant line width at any zoom */
		stroke-linejoin: round;
	}
	.outline {
		fill: #fff;
		stroke: #fff;
		stroke-width: 3.5;
	}
	.fill {
		fill: var(--c);
		stroke: var(--c);
		stroke-width: 1.5;
	}
	.zoom {
		position: absolute;
		right: 0.5rem;
		bottom: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.zoom button {
		width: 2rem;
		height: 2rem;
		font-size: 1.2rem;
		line-height: 1;
		cursor: pointer;
	}
	.map-label {
		font-weight: bold;
		min-height: 1.5em;
	}
</style>
