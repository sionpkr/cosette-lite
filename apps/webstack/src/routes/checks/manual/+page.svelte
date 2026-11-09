<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<div id="start">
	<div>
		<h1>수동 검증 필요</h1>
		<p>다음 텍스트로 검증 채널에서 @garalulu 를 멘션해주세요:</p>
		<p>수동 검증 사유: {data.reason}</p>
		<p style="margin-top: 0.75rem; font-size: 0.9rem; opacity: 0.3;">
			<a
				href="/checks/discord"
				aria-label="Proceed to verification anyway"
				style="color: inherit; text-decoration: underline;"
				>verify me anyway</a
			>
		</p>
	</div>
</div>
