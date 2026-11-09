<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let errorMessage: string = '';

	onMount(async () => {
		await new Promise((r) => setTimeout(r, 450));
		try {
			const res = await fetch('/api/discord/setup', {
				method: 'POST'
			});
			if (res.ok) {
				const data = await res.json();
				if (data.result === 'success') {
					await new Promise((r) => setTimeout(r, 350));
					goto('/done');
					return;
				}
				if (data.result === 'full') {
					errorMessage =
						'Discord 서버 가입 한도에 도달했습니다. 다른 서버에서 나간 후 다시 시도해주세요.';
					return;
				}
				errorMessage = data.message || '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.';
				return;
			}
			errorMessage = '서버에 연결할 수 없습니다. 페이지를 새로 고침해주세요.';
		} catch {
			errorMessage = '네트워크 오류입니다. 연결 상태를 확인하고 다시 시도해주세요.';
		}
	});
</script>

<div class="start">
	<div class="text-centered">
		<div class="spinner"></div>
		<h1>Discord 설정 마무리 중...</h1>
		<p>사용자의 역할을 설정하고 서버에 참가하는 동안 잠시 기다려 주세요.</p>
		{#if errorMessage}
			<p style="color:#FF4C4C; font-weight:bold;">{errorMessage}</p>
		{/if}
	</div>
</div>
