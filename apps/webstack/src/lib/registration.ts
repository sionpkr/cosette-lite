// Registration includes the entire final second of November 29 in UTC+9.
export const registrationDeadline = Date.parse('2026-11-30T00:00:00+09:00');
export const registrationClosedMessage = '참가 신청이 마감되어 더 이상 등록할 수 없습니다.';

export function registrationSecondsLeft(now: number): number {
	return Math.max(0, Math.ceil((registrationDeadline - now) / 1000));
}
