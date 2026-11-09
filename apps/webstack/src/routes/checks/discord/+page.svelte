<script lang="ts">
	import type { ITournamentConfig } from 'config';
	import type { PageData } from './$types';
	import { regionPaths, REGION_MAP_VIEWBOX } from '$lib/regionMap';

	interface Props {
		data: PageData;
		config?: ITournamentConfig;
	}

	let { data, config = data.config }: Props = $props();

	// Verified is always granted; every other configured role is a selectable region.
	const regions = config.discord.roles.filter((r) => r.name !== 'Verified');
	const idByName = new Map(regions.map((r) => [r.name, r.id]));

	let selectedId = $state('');
	let hoverName = $state('');
	const selectedName = $derived(regions.find((r) => r.id === selectedId)?.name ?? '');
	const label = $derived(hoverName || selectedName);
</script>

<div class="start">
	<div class="user-info">
		<p class="right-align">
			현재 osu! 계정: {data.username || ''} ({data.osuId || ''})
			<a href="/logout"><strong>로그아웃</strong></a>
		</p>
	</div>
	<div>
		<h1>Discord 계정 연동</h1>
	</div>
	<div class="layout">
		<div>
			<p>Discord 계정 정보는 다음 용도로 사용됩니다:</p>
			<ul>
				<li>아직 Discord 서버에 참가하지 않은 경우 서버 참가</li>
				<li>서버용 닉네임을 osu! 닉네임으로 변경</li>
				<li>호스트 대신 Discord 서버 내 역할(Verified + 선택한 지역) 부여</li>
			</ul>
			<p>
				<label for="region"><strong>거주 지역을 선택하세요</strong></label><br />
				<select id="region" bind:value={selectedId}>
					<option value="" disabled>지역 선택</option>
					{#each regions as r (r.id)}
						<option value={r.id}>{r.name}</option>
					{/each}
				</select>
			</p>
			<p>
				<strong
					>아래 버튼을 누르기 전에 올바른 Discord 계정에 로그인되어 있는지 반드시 확인하세요.</strong
				>
			</p>
		</div>
		<div class="map">
			<svg viewBox={REGION_MAP_VIEWBOX} role="group" aria-label="대한민국 지역 지도">
				{#each regionPaths as p (p.name)}
					<path
						d={p.d}
						class:selected={idByName.get(p.name) === selectedId}
						role="button"
						tabindex="0"
						aria-label={p.name}
						onmouseenter={() => (hoverName = p.name)}
						onmouseleave={() => (hoverName = '')}
						onfocus={() => (hoverName = p.name)}
						onblur={() => (hoverName = '')}
						onclick={() => (selectedId = idByName.get(p.name) ?? '')}
						onkeydown={(e) => e.key === 'Enter' && (selectedId = idByName.get(p.name) ?? '')}
					/>
				{/each}
			</svg>
			<p class="map-label">{label || ' '}</p>
		</div>
	</div>
	{#if selectedId}
		<a href="/auth/discord?region={selectedId}" class="flex button discord">
			Log in with Discord!
		</a>
	{:else}
		<span class="flex button discord" aria-disabled="true" style="opacity:.5;cursor:not-allowed">
			지역을 먼저 선택하세요
		</span>
	{/if}
</div>

<style>
	.layout {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
		flex-wrap: wrap;
	}
	.layout > div:first-child {
		flex: 1 1 280px;
	}
	.map {
		flex: 0 1 320px;
		text-align: center;
	}
	svg {
		width: 100%;
		height: auto;
	}
	path {
		fill: #6b7280;
		stroke: #6b7280; /* same as fill: hides borders between cities of one region */
		stroke-width: 0.6;
		stroke-linejoin: round;
		cursor: pointer;
		outline: none;
	}
	path:hover,
	path:focus-visible {
		fill: #f472b6;
		stroke: #f472b6;
	}
	path.selected {
		fill: #5865f2;
		stroke: #5865f2;
	}
	.map-label {
		font-weight: bold;
		min-height: 1.5em;
	}
	select {
		margin-top: 0.4rem;
		padding: 0.4rem;
		font-size: 1rem;
	}
</style>
