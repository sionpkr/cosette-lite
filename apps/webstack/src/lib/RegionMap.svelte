<script lang="ts">
	import { regionPaths, muniPaths, REGION_MAP_VIEWBOX } from '$lib/regionMap';

	interface Props {
		/** region name -> role id (only selectable regions) */
		idByName: Map<string, string>;
		selectedId: string;
	}

	let { idByName, selectedId = $bindable() }: Props = $props();

	const W = 530;
	const H = 560;
	const MAX = 16;
	// Zoom levels: region names appear once they fit, then city/district borders and names take over.
	const MUNI_BORDER_ZOOM = 2.5;
	const MUNI_LABEL_ZOOM = 4.5;
	const REGION_LABEL_FONT = 20; // user units at zoom 1 (kept constant on screen via /s)
	const MUNI_LABEL_FONT = 16;

	const munisByRegion = new Map<string, (typeof muniPaths)[number][]>();
	for (const m of muniPaths) munisByRegion.set(m.region, [...(munisByRegion.get(m.region) ?? []), m]);
	const bboxes = new Map(regionPaths.map((r) => [r.name, r.bbox]));

	let svg: SVGSVGElement;
	let s = $state(1);
	let tx = $state(0);
	let ty = $state(0);
	let smooth = $state(false);
	let hoverName = $state('');
	let moved = false;

	const selectedName = $derived([...idByName].find(([, id]) => id === selectedId)?.[0] ?? '');
	const label = $derived(hoverName || selectedName);
	// Label fits its shape when its width (font/s per char) is below the shape's width.
	const fits = (name: string, w: number, font: number) => (name.length * font) / s <= w * 1.1;
	const showRegionLabel = (r: (typeof regionPaths)[number]) =>
		s < MUNI_LABEL_ZOOM + 1.5 && s >= 1.5 && fits(r.name, r.w, REGION_LABEL_FONT);
	const showMuniLabel = (m: (typeof muniPaths)[number]) =>
		s >= MUNI_LABEL_ZOOM && fits(m.name, m.w, MUNI_LABEL_FONT);

	const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

	// Zoom by factor k around viewBox point (px, py), keeping the map inside the frame.
	function zoom(k: number, px = W / 2, py = H / 2) {
		smooth = false;
		const ns = clamp(s * k, 1, MAX);
		tx = clamp(px - ((px - tx) * ns) / s, W * (1 - ns), 0);
		ty = clamp(py - ((py - ty) * ns) / s, H * (1 - ns), 0);
		s = ns;
	}

	// Animate so the selected region is centred and fits the frame (with margin).
	$effect(() => {
		const b = bboxes.get(selectedName);
		if (!b) return;
		const ns = clamp(0.75 * Math.min(W / (b[2] - b[0]), H / (b[3] - b[1])), 1, MAX);
		smooth = true;
		tx = clamp(W / 2 - ((b[0] + b[2]) / 2) * ns, W * (1 - ns), 0);
		ty = clamp(H / 2 - ((b[1] + b[3]) / 2) * ns, H * (1 - ns), 0);
		s = ns;
	});

	function toView(e: { clientX: number; clientY: number }) {
		return new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
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
		smooth = false;
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
			<g class="view" class:smooth style="transform: translate({tx}px, {ty}px) scale({s})">
				<!-- fills: one group per role region (hover/select by region only) -->
				{#each regionPaths as r (r.name)}
					<g
						class="region"
						class:selected={idByName.get(r.name) === selectedId}
						role="button"
						tabindex="0"
						aria-label={r.name}
						onmouseenter={() => (hoverName = r.name)}
						onmouseleave={() => (hoverName = '')}
						onfocus={() => (hoverName = r.name)}
						onblur={() => (hoverName = '')}
						onclick={() => pick(r.name)}
						onkeydown={(e) => e.key === 'Enter' && (selectedId = idByName.get(r.name) ?? '')}
					>
						{#each munisByRegion.get(r.name) ?? [] as m (m.d)}
							<path d={m.d} />
						{/each}
					</g>
				{/each}

				<!-- city/district borders: appear when zoomed in -->
				{#if s >= MUNI_BORDER_ZOOM}
					<g class="muni-border">
						{#each muniPaths as m (m.d)}
							<path d={m.d} />
						{/each}
					</g>
				{/if}

				<!-- region borders: always on, thicker -->
				<g class="region-border">
					{#each regionPaths as r (r.name)}
						<path d={r.d} />
					{/each}
				</g>

				<!-- labels -->
				<g class="labels" style="font-size: {REGION_LABEL_FONT / s}px; stroke-width: {3 / s}px">
					{#each regionPaths as r (r.name)}
						{#if showRegionLabel(r)}
							<text x={r.c[0]} y={r.c[1]}>{r.name}</text>
						{/if}
					{/each}
				</g>
				<g class="labels" style="font-size: {MUNI_LABEL_FONT / s}px; stroke-width: {2.5 / s}px">
					{#each muniPaths as m (m.d)}
						{#if showMuniLabel(m)}
							<text x={m.c[0]} y={m.c[1]}>{m.name}</text>
						{/if}
					{/each}
				</g>
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
	.view {
		transform-origin: 0 0;
	}
	.view.smooth {
		transition: transform 0.6s ease-in-out;
	}
	path {
		vector-effect: non-scaling-stroke; /* constant line width at any zoom */
		stroke-linejoin: round;
		fill-rule: evenodd;
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
	.region path {
		fill: var(--c);
		stroke: var(--c); /* hides hairline seams between cities of one region */
		stroke-width: 0.8;
	}
	.muni-border path,
	.region-border path {
		fill: none;
		pointer-events: none;
		stroke: #fff;
	}
	.muni-border path {
		stroke-width: 1.2;
		stroke-opacity: 0.9;
	}
	.region-border path {
		stroke-width: 3;
	}
	.labels {
		pointer-events: none;
		fill: #fff;
		stroke: #111827;
		paint-order: stroke;
		stroke-linejoin: round;
		text-anchor: middle;
		dominant-baseline: central;
		font-weight: 600;
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
