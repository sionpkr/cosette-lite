<script lang="ts">
	import type { ITournamentConfig } from 'config';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
		config?: ITournamentConfig;
	}

	let { data, config = data.config }: Props = $props();
</script>

<svelte:head>
	<meta property="og:title" content="{config.name} 참가 신청" />
	<meta property="og:type" content="website" />
	<meta
		property="og:description"
		content="osu! 계정과 Discord 계정을 연결하여 {config.name}에 참가하세요."
	/>
</svelte:head>

<div class="start">
	<div>
		<h1>{config.name} 참가 신청</h1>
	</div>
	<div>
		<p>osu! 계정 연동</p>
		<p>
			먼저 osu! 계정으로 로그인하여 본인 확인을 진행한 후, Discord 계정과 연결하여 서버에 참가할 수 있습니다.
		</p>
		<p>osu! 계정 정보는 다음 용도로 사용됩니다:</p>
		<ul>
			<li>타인 사칭 방지</li>
			<li>Discord 서버에서 osu! 닉네임 확인</li>
		</ul>
		<p>Discord 계정 정보는 다음 용도로 사용됩니다:</p>
		<ul>
			<li>아직 Discord 서버에 참가하지 않은 경우 서버 참가</li>
			<li>서버용 닉네임을 osu! 닉네임으로 변경</li>
			<li>호스트 대신 Discord 서버 내 역할 부여</li>
		</ul>
	</div>
	<a href="/auth/osu" class="flex button osu"> osu! 로그인 </a>
	{#if data.error}
		<p style="color:#FF4C4C; font-weight:bold; font-size: 1.2rem">{data.error}</p>
	{/if}
</div>
