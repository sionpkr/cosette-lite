<script lang="ts">
	import type { ITournamentConfig } from 'config';
	import type { ActionData, PageData } from './$types';
	import RegionMap from '$lib/RegionMap.svelte';
	import { regionMembers } from '$lib/regionMap';

	interface Props {
		data: PageData;
		form: ActionData;
		config?: ITournamentConfig;
	}

	let { data, form, config = data.config }: Props = $props();

	// Verified is always granted; every other configured role is a selectable region.
	const regions = config.discord.roles.filter((r) => r.name !== 'Verified');
	const idByName = new Map(regions.map((r) => [r.name, r.id]));

	let selectedId = $state('');
	let dialog: HTMLDialogElement;
	const selectedName = $derived(regions.find((r) => r.id === selectedId)?.name ?? '');
</script>

<div class="start">
	<div class="user-info">
		<p class="right-align">
			현재 osu! 계정: {data.username || ''} ({data.osuId || ''})
			<a href="/logout"><strong>로그아웃</strong></a>
		</p>
		<p class="right-align">
			현재 Discord 계정: {data.discordName || data.discordId} ({data.discordId})
			<a href="/logout/discord"><strong>로그아웃</strong></a>
		</p>
	</div>
	<div>
		<h1>거주 지역 선택</h1>
	</div>
	<form method="POST" class="layout">
		<div>
			<p>선택한 지역 역할과 Verified 역할이 Discord 서버에 부여됩니다.</p>
			<p>
				<label for="region"><strong>지역</strong></label><br />
				<select id="region" name="region" bind:value={selectedId} required>
					<option value="" disabled>지역 선택</option>
					{#each regions as r (r.id)}
						<option value={r.id}>{r.name}</option>
					{/each}
				</select>
			</p>
			<p>서울과 경기도는 다음과 같이 나뉩니다:</p>
			<ul>
				{#each Object.entries(regionMembers) as [name, list] (name)}
					<li><strong>{name}</strong>: {list.join(', ')}</li>
				{/each}
			</ul>
			{#if form?.error}<p style="color:#FF4C4C; font-weight:bold;">{form.error}</p>{/if}
			<button
				type="button"
				class="flex button discord"
				disabled={!selectedId}
				onclick={() => dialog.showModal()}
			>
				서버 참가 및 역할 받기
			</button>
		</div>
		<div class="map-col">
			<RegionMap {idByName} bind:selectedId />
		</div>
		<dialog bind:this={dialog}>
			<h2>최종 확인</h2>
			<ul>
				<li>osu! 계정: {data.username} ({data.osuId})</li>
				<li>Discord 계정: {data.discordName || data.discordId} ({data.discordId})</li>
				<li>지역: {selectedName}</li>
			</ul>
			<p><strong>정말 진행하시겠습니까?</strong></p>
			<button type="button" onclick={() => dialog.close()}>취소</button>
			<button type="submit">확인</button>
		</dialog>
	</form>
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
	.map-col {
		flex: 0 1 340px;
		min-width: 0;
	}
	select {
		margin-top: 0.4rem;
		padding: 0.4rem;
		font-size: 1rem;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
