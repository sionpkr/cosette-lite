<script lang="ts">
	import type { ITournamentConfig } from 'config';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
		config?: ITournamentConfig;
	}

	let { data, config = data.config }: Props = $props();
</script>

<div class="start">
	<div>
		<h1>{config.name} 참가 신청</h1>
	</div>
	<div>
		<p>계정 인증이 완료되었습니다!</p>
		<p>이제 이 탭을 닫으셔도 됩니다.</p>
	</div>
</div>
