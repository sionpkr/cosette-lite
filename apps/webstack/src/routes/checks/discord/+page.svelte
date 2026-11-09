<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
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
	<div>
		<p>Discord 계정 정보는 다음 용도로 사용됩니다:</p>
		<ul>
			<li>아직 Discord 서버에 참가하지 않은 경우 서버 참가</li>
			<li>서버용 닉네임을 osu! 닉네임으로 변경</li>
			<li>호스트 대신 Discord 서버 내 역할(Verified + 거주 지역) 부여</li>
		</ul>
		<p>Discord 로그인 후 다음 단계에서 거주 지역을 선택합니다.</p>
		<p>
			<strong
				>아래 버튼을 누르기 전에 올바른 Discord 계정에 로그인되어 있는지 반드시 확인하세요.</strong
			>
		</p>
	</div>
	<a href="/auth/discord" class="flex button discord"> Log in with Discord! </a>
</div>
