const STORAGE_KEY = 'airforce-calendar-state';
const DEFAULT_BALANCES = { 연가: 28, 포상휴가: 0, 위로휴가: 0, 청원휴가: 0, 성과제외박: 0 };
const HOLIDAYS = {
	'2026-01-01': '신정', '2026-02-16': '설날', '2026-02-17': '설날', '2026-02-18': '설날', '2026-03-01': '삼일절', '2026-03-02': '대체공휴일 (삼일절)', '2026-05-05': '어린이날', '2026-05-24': '부처님오신날', '2026-05-25': '대체공휴일 (부처님오신날)', '2026-06-03': '제9회 전국동시지방선거', '2026-06-06': '현충일', '2026-08-15': '광복절', '2026-08-17': '대체공휴일 (광복절)', '2026-09-24': '추석 연휴', '2026-09-25': '추석 연휴', '2026-09-26': '추석 연휴', '2026-10-03': '개천절', '2026-10-05': '대체공휴일 (개천절)', '2026-10-09': '한글날', '2026-12-25': '크리스마스(성탄절)',
	'2027-01-01': '신정', '2027-02-06': '설날', '2027-02-07': '설날', '2027-02-08': '설날', '2027-02-09': '대체공휴일 (설날)', '2027-03-01': '삼일절', '2027-03-03': '제21대 대통령 선거', '2027-05-05': '어린이날', '2027-05-13': '부처님오신날', '2027-06-06': '현충일', '2027-08-15': '광복절', '2027-08-16': '대체공휴일 (광복절)', '2027-09-14': '추석 연휴', '2027-09-15': '추석 연휴', '2027-09-16': '추석 연휴', '2027-10-03': '개천절', '2027-10-04': '대체공휴일 (개천절)', '2027-10-09': '한글날', '2027-10-11': '대체공휴일 (한글날)', '2027-12-25': '크리스마스(성탄절)', '2027-12-27': '대체공휴일 (크리스마스)'
};

const template = `
	<div class="calendar-widget">
		<header class="cw-header"><div><p class="cw-eyebrow">REPUBLIC OF KOREA AIR FORCE</p><h2>휴가 & 일정 관리</h2><p class="cw-intro">복무 일정과 휴가 흐름을 한눈에 관리하세요.</p></div><button class="cw-button" data-action="today">오늘로 이동</button></header>
		<nav class="cw-tabs" aria-label="달력 메뉴"><button class="cw-tab active" data-tab="calendar">달력</button><button class="cw-tab" data-tab="holidays">공휴일</button><button class="cw-tab" data-tab="leave">휴가 · 일정</button></nav>
		<section class="cw-view active" data-view="calendar"><div class="cw-layout" data-calendar-layout><section class="cw-panel cw-calendar-panel" data-calendar-panel><div class="cw-calendar-head"><button class="cw-icon" data-action="previous" aria-label="이전 달">‹</button><strong class="cw-month-title"></strong><div class="cw-calendar-actions"><button class="cw-icon" data-action="next" aria-label="다음 달">›</button><button class="cw-toggle" data-action="wide" aria-pressed="false">복무 기간 전체</button></div></div><div class="cw-weekdays">${['일','월','화','수','목','금','토'].map(day => `<span>${day}</span>`).join('')}</div><div class="cw-grid"></div><div class="cw-wide-scroll"><div class="cw-wide"></div></div><div class="cw-legend"><span>휴가</span><span>일정</span><span>진급일</span><span>성과제외박 주기</span></div></section><aside class="cw-overview"><section class="cw-panel cw-card"><h3>휴가 현황</h3><div class="cw-stats"><div><strong data-stat="remaining">0</strong><span>잔여 휴가 (일)</span></div><div><strong data-stat="used">0</strong><span>사용 휴가 (일)</span></div><div><strong data-stat="total">0</strong><span>총 휴가 (일)</span></div></div></section><section class="cw-panel cw-card"><h3>복무 현황</h3><div class="cw-service-stats"><div><span>진급까지</span><strong data-service="promotion">-</strong></div><div><span>월급까지</span><strong data-service="payday">-</strong></div><div><span>복무 일수</span><strong data-service="days">-</strong></div><div><span>전역까지</span><strong data-service="discharge">-</strong></div><div><span>복무 진행도</span><strong data-service="progress">-</strong></div><div class="cw-progress"><i></i></div></div></section></aside></div></section>
		<section class="cw-view" data-view="holidays"><div class="cw-columns"><section class="cw-panel cw-card"><h3>공휴일 등록</h3><form class="cw-form" data-form="holiday"><label>날짜<input name="date" type="date" required></label><label>공휴일 이름<input name="title" required></label><button class="cw-submit">공휴일 등록</button></form></section><section class="cw-panel cw-card"><h3>등록된 공휴일</h3><div class="cw-list" data-list="holidays"></div></section></div></section>
		<section class="cw-view" data-view="leave"><div class="cw-leave-layout"><aside class="cw-sidebar"><section class="cw-panel cw-card"><h3>휴가 잔여 현황</h3><div class="cw-stats cw-balance-stats"><div><strong data-balance="연가">28</strong><span>연가</span></div><div><strong data-balance="포상휴가">0</strong><span>포상</span></div><div><strong data-balance="위로휴가">0</strong><span>위로</span></div><div><strong data-balance="청원휴가">0</strong><span>청원</span></div><div><strong data-balance="성과제외박">0</strong><span>성과제외박</span></div><div><strong data-stat="used">0</strong><span>사용한 휴가</span></div></div><h4>휴가 추가</h4><form class="cw-form" data-form="award"><label>휴가 유형<select name="type"><option>연가</option><option>포상휴가</option><option>위로휴가</option><option>청원휴가</option><option>성과제외박</option></select></label><label>휴가 개수<input name="days" type="number" min="1" required></label><label>휴가 내용<textarea name="content"></textarea></label><button class="cw-submit">휴가 추가</button></form></section><section class="cw-panel cw-card"><h3>기본 설정</h3><form class="cw-form" data-form="settings"><label>입대일<input name="enlistDate" type="date" required></label><label>전역일<input name="dischargeDate" type="date" required></label><div class="cw-form-row"><label>기본 연가<input name="연가" type="number" min="0" required></label><label>기본 포상<input name="포상휴가" type="number" min="0" required></label></div><div class="cw-form-row"><label>기본 위로<input name="위로휴가" type="number" min="0" required></label><label>기본 청원<input name="청원휴가" type="number" min="0" required></label></div><button class="cw-submit">잔여량 저장</button></form></section><section class="cw-panel cw-card"><h3>휴가 사용</h3><form class="cw-form" data-form="leave"><div class="cw-form-row"><label>시작일<input name="start" type="date" required></label><label>종료일<input name="end" type="date" required></label></div><label>휴가 유형<select name="type"><option>연가</option><option>성과제외박</option><option>위로휴가</option><option>포상휴가</option><option>외출</option><option>청원휴가</option></select></label><label>휴가 내용<textarea name="content"></textarea></label><button class="cw-submit">휴가 사용</button></form></section><section class="cw-panel cw-card"><h3>일정 등록</h3><form class="cw-form" data-form="event"><label>날짜<input name="date" type="date" required></label><label>일정 이름<input name="title" required></label><button class="cw-submit">일정 등록</button></form></section></aside><aside class="cw-sidebar"><section class="cw-panel cw-card"><h3>사용한 휴가 내용</h3><div class="cw-list" data-list="leaves"></div></section><section class="cw-panel cw-card"><h3>추가된 휴가 내용</h3><div class="cw-list" data-list="awards"></div></section><section class="cw-panel cw-card"><h3>추가된 일정 내용</h3><div class="cw-list" data-list="events"></div></section></aside></div></section>
	</div>`;

function parseDate(value) { return new Date(`${value}T00:00:00`); }
function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function daysBetween(start, end) { return Math.floor((parseDate(end) - parseDate(start)) / 86400000) + 1; }
function formatDate(value) { return parseDate(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }); }
function defaultDischargeDate(enlistDate) {
	if (!enlistDate) return '';
	const date = parseDate(enlistDate);
	date.setMonth(date.getMonth() + 21);
	date.setDate(date.getDate() - 1);
	return dateKey(date);
}
function escapeHtml(value = '') {
	return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function mountCalendarWidget(root) {
	if (!root) throw new Error('Calendar widget root element is required');
	root.innerHTML = template;
	const $ = selector => root.querySelector(selector);
	const $$ = selector => [...root.querySelectorAll(selector)];
	const today = new Date();
	let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
	let wideView = false;
	let state;
	try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { state = null; }
	state ||= { enlistDate: '', dischargeDate: '', balances: { ...DEFAULT_BALANCES }, events: [], leaves: [], holidays: [], awardedLeaves: [] };
	state.balances = { ...DEFAULT_BALANCES, ...(state.balances || {}) };
	state.events ||= []; state.leaves ||= []; state.holidays ||= []; state.awardedLeaves ||= [];
	state.events = state.events.filter(item => !item.serviceMarker).map(item => ({ ...item, date: item.date || item.start }));
	state.enlistDate ||= ''; state.dischargeDate ||= '';
	if (!localStorage.getItem('calendar-events-migrated')) {
		try {
			const oldEvents = JSON.parse(localStorage.getItem('myCalEventsV3') || '[]');
			for (const event of oldEvents) {
				const start = parseDate(event.start); const end = parseDate(event.end);
				for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
					const migratedEvent = { date: dateKey(date), title: event.title };
					if (!state.events.some(item => item.date === migratedEvent.date && item.title === migratedEvent.title)) state.events.push(migratedEvent);
				}
			}
		} catch { /* Ignore malformed legacy calendar data. */ }
		localStorage.setItem('calendar-events-migrated', 'true');
	}
	const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	const serviceEnd = () => parseDate(state.dischargeDate || defaultDischargeDate(state.enlistDate));
	const withinService = key => Boolean(state.enlistDate && (parseDate(key) >= parseDate(state.enlistDate)) && (parseDate(key) <= serviceEnd()));
	const trainingDone = () => {
		if (!state.enlistDate) return null;
		const date = parseDate(state.enlistDate); date.setDate(date.getDate() + 35);
		while (date.getDay() !== 5) date.setDate(date.getDate() - 1);
		return date;
	};
	const promotions = () => {
		if (!state.enlistDate) return [];
		let date = trainingDone(); const result = [];
		[2, 6, 6].forEach((months, index) => { date = new Date(date); date.setMonth(date.getMonth() + months, 1); if (date <= serviceEnd()) result.push({ date: dateKey(date), title: `${['일병', '상병', '병장'][index]} 진급 예정` }); });
		return result;
	};
	const cycleStart = key => {
		if (!withinService(key) || !trainingDone()) return false;
		const diff = Math.floor((parseDate(key) - trainingDone()) / 86400000);
		return diff > 0 && diff % 42 === 0;
	};
	const performanceStats = () => {
		if (!state.enlistDate || !withinService(dateKey(today))) return { remaining: 0, used: 0 };
		let remaining = 0; let used = 0; let index = 1;
		while (index <= 200) {
			const date = new Date(trainingDone()); date.setDate(date.getDate() + 42 * index);
			if (date > serviceEnd()) break;
			if (date < parseDate(dateKey(today))) used += 3; else remaining += 3;
			index += 1;
		}
		const logged = state.leaves.reduce((sum, leave) => sum + (leave.type === '성과제외박' && withinService(leave.start) && withinService(leave.end) ? daysBetween(leave.start, leave.end) : 0), 0);
		return { remaining: remaining - logged, used };
	};
	const updateBalance = (type, days, direction) => { if (type in state.balances) state.balances[type] = Number(state.balances[type] || 0) + days * direction; };

	function renderService() {
		const current = parseDate(dateKey(today));
		const end = serviceEnd();
		const values = { promotion: '-', payday: '-', days: '-', discharge: '-', progress: '-' };
		if (state.enlistDate && current >= parseDate(state.enlistDate) && current <= end) {
			const nextPromotion = promotions().map(item => parseDate(item.date)).find(date => date >= current);
			const payday = new Date(current.getFullYear(), current.getMonth(), 10);
			if (payday < current) payday.setMonth(payday.getMonth() + 1);
			const total = Math.floor((end - parseDate(state.enlistDate)) / 86400000);
			const elapsed = Math.floor((current - parseDate(state.enlistDate)) / 86400000);
			values.promotion = nextPromotion ? `${Math.floor((nextPromotion - current) / 86400000)}일` : '-';
			values.payday = payday <= end ? `${Math.floor((payday - current) / 86400000)}일` : '-';
			values.days = `${elapsed + 1}일`; values.discharge = `${Math.floor((end - current) / 86400000)}일`;
			values.progress = `${total ? Math.min(100, Math.round(elapsed / total * 100)) : 100}%`;
		}
		for (const [key, value] of Object.entries(values)) $(`[data-service="${key}"]`).textContent = value;
		$('.cw-progress i').style.width = values.progress;
	}

	function renderCalendar() {
		const grid = $('.cw-grid'); const year = viewDate.getFullYear(); const month = viewDate.getMonth();
		$('.cw-month-title').textContent = `${year}년 ${month + 1}월`; grid.innerHTML = '';
		const firstDay = new Date(year, month, 1).getDay(); const lastDay = new Date(year, month + 1, 0).getDate(); const prevLast = new Date(year, month, 0).getDate();
		for (let cell = 0; cell < 42; cell += 1) {
			const number = cell - firstDay + 1; const date = new Date(year, month, number); const key = dateKey(date); const current = number > 0 && number <= lastDay;
			const day = document.createElement('div'); day.className = `cw-day${current ? '' : ' muted'}${key === dateKey(today) ? ' today' : ''}${cycleStart(key) ? ' performance-cycle' : ''}`; day.dataset.date = key;
			const displayNumber = current ? number : number < 1 ? prevLast + number : number - lastDay;
			const holiday = state.holidays.find(item => item.date === key); const leaves = withinService(key) ? state.leaves.filter(item => key >= item.start && key <= item.end) : [];
			const events = withinService(key) ? state.events.filter(item => item.date === key) : [];
			const promo = withinService(key) ? promotions().find(item => item.date === key) : null;
			const milestone = withinService(key) && key === state.enlistDate ? '입대일' : withinService(key) && key === dateKey(serviceEnd()) ? '전역일' : '';
			const holidayLabel = holiday ? `<span class="cw-holiday">${escapeHtml(holiday.title)}</span>` : '';
			const leaveLabels = leaves.map(item => `<span class="cw-badge leave">${escapeHtml(item.type)}${item.start !== item.end ? ` · ${item.start === key ? '시작' : item.end === key ? '종료' : ''}` : ''}</span>`).join('');
			const eventLabels = events.map(item => `<span class="cw-badge event">${escapeHtml(item.title)}</span>`).join('');
			const selector = withinService(key) ? `<select class="cw-leave-select" aria-label="${key} 휴가 사용"><option value="">휴가 사용</option>${leaves.length ? '<option value="__cancel__">휴가 취소</option>' : ''}<option>연가</option><option>포상휴가</option><option>위로휴가</option><option>성과제외박</option><option>청원휴가</option></select>` : '';
			day.innerHTML = `<span class="cw-day-number ${date.getDay() === 0 ? 'sunday' : date.getDay() === 6 ? 'saturday' : ''}">${displayNumber}</span>${holidayLabel}${leaveLabels}${eventLabels}${number === 10 && withinService(key) ? '<span class="cw-badge promotion">월급날</span>' : ''}${milestone ? `<span class="cw-badge promotion">${milestone}</span>` : ''}${promo ? `<span class="cw-badge promotion">${promo.title}</span>` : ''}${cycleStart(key) ? '<span class="cw-cycle">성과제외박 주기</span>' : ''}${selector}`;
			grid.appendChild(day);
		}
		renderStats();
		if (wideView) renderWide();
	}

	function renderStats() {
		const stats = performanceStats();
		const used = state.leaves.reduce((sum, leave) => sum + (leave.type !== '외출' && ['연가', '포상휴가', '위로휴가', '청원휴가', '성과제외박'].includes(leave.type) && withinService(leave.start) && withinService(leave.end) ? daysBetween(leave.start, leave.end) : 0), 0) + stats.used;
		const remaining = Math.max(0, ...[0, Number(state.balances.연가) + Number(state.balances.포상휴가) + Number(state.balances.위로휴가) + Number(state.balances.청원휴가) + stats.remaining]);
		$('[data-stat="remaining"]').textContent = remaining; $$('[data-stat="used"]').forEach(element => element.textContent = used); $('[data-stat="total"]').textContent = remaining + used;
		for (const [type, value] of Object.entries({ ...state.balances, 성과제외박: stats.remaining })) {
			const element = $(`[data-balance="${type}"]`); element.textContent = value; element.classList.toggle('overdrawn', Number(value) < 0);
		}
		for (const form of $$('[data-form="settings"]')) {
			form.elements.enlistDate.value = state.enlistDate;
			form.elements.dischargeDate.value = state.dischargeDate || defaultDischargeDate(state.enlistDate);
			for (const type of ['연가', '포상휴가', '위로휴가', '청원휴가']) form.elements[type].value = state.balances[type];
		}
		renderService();
	}

	function renderWide() {
		const container = $('.cw-wide'); container.innerHTML = '';
		if (!state.enlistDate) { container.innerHTML = '<p class="cw-empty">기본 설정에서 입대일과 전역일을 입력하면 복무기간 달력이 표시됩니다.</p>'; return; }
		const start = parseDate(state.enlistDate); const end = serviceEnd(); const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
		while (cursor <= end) {
			const year = cursor.getFullYear(); const month = cursor.getMonth(); const card = document.createElement('section'); card.className = 'cw-mini-month';
			card.innerHTML = `<h3>${year}년 ${month + 1}월</h3><div class="cw-mini-weekdays">${['일','월','화','수','목','금','토'].map(day => `<span>${day}</span>`).join('')}</div><div class="cw-mini-grid"></div>`;
			const monthGrid = card.querySelector('.cw-mini-grid'); const first = new Date(year, month, 1).getDay(); const last = new Date(year, month + 1, 0).getDate();
			for (let cell = 0; cell < 42; cell += 1) {
				const number = cell - first + 1; const day = document.createElement('div'); day.className = 'cw-mini-day';
				if (number > 0 && number <= last) {
					const key = dateKey(new Date(year, month, number)); day.dataset.date = key;
					if (!withinService(key)) day.classList.add('outside');
					else {
						const holiday = state.holidays.find(item => item.date === key);
						const leave = state.leaves.find(item => key >= item.start && key <= item.end);
						const event = state.events.find(item => item.date === key);
						day.innerHTML = `<b>${number}</b>${holiday ? `<span>${escapeHtml(holiday.title)}</span>` : ''}${leave ? `<span>${escapeHtml(leave.type)}</span>` : ''}${event ? `<span>${escapeHtml(event.title)}</span>` : ''}<select class="cw-leave-select" aria-label="${key} 휴가 사용"><option value="">휴가 사용</option>${leave ? '<option value="__cancel__">휴가 취소</option>' : ''}<option>연가</option><option>포상휴가</option><option>위로휴가</option><option>성과제외박</option><option>청원휴가</option></select>`;
					}
				}
				monthGrid.appendChild(day);
			}
			container.appendChild(card); cursor.setMonth(cursor.getMonth() + 1);
		}
	}

	function renderLists() {
		const items = {
			leaves: state.leaves.map((item, index) => `<div class="cw-list-item"><span>${escapeHtml(item.type)} · ${formatDate(item.start)}${item.start !== item.end ? ` ~ ${formatDate(item.end)}` : ''}<small>${daysBetween(item.start, item.end)}일 차감${item.content ? ` · ${escapeHtml(item.content)}` : ''}</small></span><span><button data-edit="leave" data-index="${index}">수정</button><button data-delete="leave" data-index="${index}" aria-label="휴가 삭제">×</button></span></div>`).join(''),
			awards: state.awardedLeaves.map((item, index) => `<div class="cw-list-item"><span>${escapeHtml(item.type)} · ${item.days}일<small>${escapeHtml(item.content || '내용 없음')}</small></span><button data-delete="award" data-index="${index}" aria-label="추가 휴가 삭제">×</button></div>`).join(''),
			events: state.events.map((item, index) => `<div class="cw-list-item"><span>${formatDate(item.date)} · ${escapeHtml(item.title)}<small>일정</small></span><span><button data-edit="event" data-index="${index}">수정</button><button data-delete="event" data-index="${index}" aria-label="일정 삭제">×</button></span></div>`).join(''),
			holidays: state.holidays.map((item, index) => `<div class="cw-list-item"><span>${formatDate(item.date)} · ${escapeHtml(item.title)}</span><span><button data-edit="holiday" data-index="${index}">수정</button><button data-delete="holiday" data-index="${index}" aria-label="공휴일 삭제">×</button></span></div>`).join('')
		};
		for (const [name, markup] of Object.entries(items)) $(`[data-list="${name}"]`).innerHTML = markup || '<p class="cw-empty">등록된 내용이 없습니다.</p>';
	}
	function render() { renderCalendar(); renderLists(); }
	function saveAndRender() { save(); render(); }

	root.addEventListener('click', event => {
		const tab = event.target.closest('[data-tab]');
		if (tab) { $$('.cw-tab, .cw-view').forEach(element => element.classList.remove('active')); tab.classList.add('active'); $(`[data-view="${tab.dataset.tab}"]`).classList.add('active'); return; }
		const action = event.target.closest('[data-action]')?.dataset.action;
		if (action === 'today') { viewDate = new Date(today.getFullYear(), today.getMonth(), 1); renderCalendar(); }
		if (action === 'previous' || action === 'next') { viewDate.setMonth(viewDate.getMonth() + (action === 'next' ? 1 : -1)); renderCalendar(); }
		if (action === 'wide') { wideView = !wideView; $('[data-calendar-panel]').classList.toggle('wide-mode', wideView); $('[data-calendar-layout]').classList.toggle('wide-mode', wideView); event.target.setAttribute('aria-pressed', String(wideView)); renderCalendar(); }
		const edit = event.target.closest('[data-edit]');
		if (edit) {
			const index = Number(edit.dataset.index); const item = state[edit.dataset.edit === 'leave' ? 'leaves' : edit.dataset.edit === 'event' ? 'events' : 'holidays'][index];
			if (edit.dataset.edit === 'event') {
				const date = prompt('일정 날짜 (YYYY-MM-DD)', item.date); const title = prompt('일정 이름', item.title);
				if (date && title?.trim() && withinService(date)) Object.assign(item, { date, title: title.trim() });
			} else if (edit.dataset.edit === 'holiday') {
				const date = prompt('공휴일 날짜 (YYYY-MM-DD)', item.date); const title = prompt('공휴일 이름', item.title);
				if (date && title?.trim()) Object.assign(item, { date, title: title.trim() });
			} else {
				const oldDays = daysBetween(item.start, item.end); updateBalance(item.type, oldDays, 1);
				const start = prompt('휴가 시작일 (YYYY-MM-DD)', item.start); const end = prompt('휴가 종료일 (YYYY-MM-DD)', item.end);
				const type = prompt('휴가 유형', item.type); const content = prompt('휴가 내용', item.content || '');
				if (start && end && type && end >= start && withinService(start) && withinService(end)) {
					Object.assign(item, { start, end, type, content: content || '' }); updateBalance(type, daysBetween(start, end), -1);
				} else updateBalance(item.type, oldDays, -1);
			}
			saveAndRender();
		}
		const remove = event.target.closest('[data-delete]');
		if (remove) {
			const index = Number(remove.dataset.index);
			if (remove.dataset.delete === 'leave') { const item = state.leaves[index]; updateBalance(item.type, daysBetween(item.start, item.end), 1); state.leaves.splice(index, 1); }
			if (remove.dataset.delete === 'award') { const item = state.awardedLeaves[index]; updateBalance(item.type, Number(item.days), -1); state.awardedLeaves.splice(index, 1); }
			if (remove.dataset.delete === 'event') state.events.splice(index, 1);
			if (remove.dataset.delete === 'holiday') state.holidays.splice(index, 1);
			saveAndRender();
		}
	});
	root.addEventListener('change', event => {
		if (!event.target.matches('.cw-leave-select')) return;
		const date = event.target.closest('[data-date]').dataset.date;
		if (event.target.value === '__cancel__') {
			const canceled = state.leaves.filter(item => date >= item.start && date <= item.end);
			canceled.forEach(item => updateBalance(item.type, daysBetween(item.start, item.end), 1));
			state.leaves = state.leaves.filter(item => !canceled.includes(item));
		} else if (event.target.value) {
			state.leaves.push({ start: date, end: date, type: event.target.value, content: '' }); updateBalance(event.target.value, 1, -1);
		}
		saveAndRender();
	});
	root.addEventListener('dblclick', event => {
		const day = event.target.closest('.cw-day, .cw-mini-day');
		if (event.target.closest('select')) return;
		if (!day?.dataset.date || !withinService(day.dataset.date)) return;
		const title = prompt('일정 이름을 입력하세요', '');
		if (title?.trim()) { state.events.push({ date: day.dataset.date, title: title.trim() }); saveAndRender(); }
	});
	root.addEventListener('submit', event => {
		event.preventDefault();
		const form = event.target; const data = Object.fromEntries(new FormData(form));
		if (form.dataset.form === 'settings') {
			if (data.dischargeDate < data.enlistDate) return alert('전역일은 입대일 이후여야 합니다.');
			state.enlistDate = data.enlistDate; state.dischargeDate = data.dischargeDate;
			for (const type of ['연가', '포상휴가', '위로휴가', '청원휴가']) state.balances[type] = Number(data[type]);
		} else if (form.dataset.form === 'holiday') state.holidays.push(data);
		else if (form.dataset.form === 'event') {
			if (!withinService(data.date)) return alert('입대일부터 전역일까지의 일정만 등록할 수 있습니다.');
			state.events.push({ date: data.date, title: data.title.trim() });
		} else if (form.dataset.form === 'award') {
			const days = Number(data.days);
			if (!Number.isFinite(days) || days < 1) return alert('휴가는 1 이상이어야 합니다.');
			updateBalance(data.type, days, 1); state.awardedLeaves.push({ type: data.type, days, content: data.content.trim() }); form.reset();
		} else if (form.dataset.form === 'leave') {
			const days = daysBetween(data.start, data.end);
			if (data.end < data.start) return alert('종료일은 시작일보다 빠를 수 없습니다.');
			if (!withinService(data.start) || !withinService(data.end)) return alert('입대일부터 전역일까지의 휴가만 등록할 수 있습니다.');
			if (data.type === '외출') return alert('외출은 휴가 잔여 일수에서 제외됩니다.');
			state.leaves.push({ start: data.start, end: data.end, type: data.type, content: data.content.trim() }); updateBalance(data.type, days, -1); form.reset();
		}
		if (form.dataset.form !== 'settings') form.reset();
		saveAndRender();
	});
	for (const [date, title] of Object.entries(HOLIDAYS)) {
		if (date.startsWith(String(today.getFullYear())) || date.startsWith(String(today.getFullYear() + 1))) {
			if (!state.holidays.some(item => item.date === date && item.title === title)) state.holidays.push({ date, title });
		}
	}
	save();
	render();
	return { refresh: render, getState: () => structuredClone(state) };
}
