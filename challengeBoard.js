const STORAGE_KEY = 'stackQuestBoardV2';
const COLORS = { cyan: '#5debd1', lime: '#d3f36b', coral: '#ff7b72', amber: '#ffc96b' };
const $ = selector => document.querySelector(selector);
const board = document.querySelector('#questBoard');
const boardNodes = document.querySelector('#boardNodes');
const boardLinks = document.querySelector('#boardLinks');
const databaseList = document.querySelector('#databaseList');
const databasePanel = document.querySelector('.database-list-panel');
const databaseDialog = document.querySelector('#databaseDialog');
let challenges = loadChallenges();
let selectedId = null;
let dragState = null;
let draggedChallengeId = null;

function loadChallenges() {
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
		if (Array.isArray(stored)) return stored.map(challenge => ({
			...challenge,
			parentId: challenge.parentId || null,
			missions: Array.isArray(challenge.missions) ? challenge.missions : [],
			x: Number.isFinite(challenge.x) ? challenge.x : 5,
			y: Number.isFinite(challenge.y) ? challenge.y : 5
		}));
	} catch { /* Start with an empty board when saved data is malformed. */ }
	return [];
}

function saveChallenges() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
}

function escapeHtml(value = '') {
	return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function isComplete(challenge) {
	return challenge.missions.length > 0 && challenge.missions.every(mission => mission.done);
}

function getStates() {
	const byId = new Map(challenges.map(challenge => [challenge.id, challenge]));
	const states = new Map();
	function resolve(challenge, path = new Set()) {
		if (states.has(challenge.id)) return states.get(challenge.id);
		if (path.has(challenge.id)) return 'locked';
		const nextPath = new Set(path).add(challenge.id);
		const parent = challenge.parentId ? byId.get(challenge.parentId) : null;
		const parentOpen = !challenge.parentId || Boolean(parent && resolve(parent, nextPath) === 'done');
		const state = !parentOpen ? 'locked' : isComplete(challenge) ? 'done' : 'active';
		states.set(challenge.id, state);
		return state;
	}
	return new Map(challenges.map(challenge => [challenge.id, resolve(challenge)]));
}

function missionStats() {
	const total = challenges.reduce((sum, challenge) => sum + challenge.missions.length, 0);
	const done = challenges.reduce((sum, challenge) => sum + challenge.missions.filter(mission => mission.done).length, 0);
	return { total, done };
}

function renderStats(states) {
	const { total, done } = missionStats();
	const complete = [...states.values()].filter(state => state === 'done').length;
	const active = [...states.values()].filter(state => state === 'active').length;
	const xp = done * 50;
	$('#completedStat').innerHTML = `${String(complete).padStart(2, '0')} <small>/ ${String(challenges.length).padStart(2, '0')}</small>`;
	$('#missionStat').innerHTML = `${String(done).padStart(2, '0')} <small>/ ${String(total).padStart(2, '0')}</small>`;
	$('#currentStat').textContent = `${String(active).padStart(2, '0')} QUESTS`;
	$('#questStatus').textContent = challenges.length ? active ? 'QUESTS IN PROGRESS' : 'ALL QUESTS CLEAR' : 'READY TO BUILD';
	$('#playerLevel').textContent = `LV. ${String(Math.floor(xp / 250) + 1).padStart(2, '0')}`;
	$('#levelCount').textContent = `${xp} XP`;
	$('#levelCaption').textContent = total ? `${done} / ${total} 미션 완료` : '보드에 첫 도전과제를 추가하세요';
	$('#levelProgress').style.width = `${total ? Math.round((xp % 250) / 250 * 100) : 0}%`;
	$('#boardCount').textContent = `${String(challenges.length).padStart(2, '0')} CHALLENGES`;
}

function cardMarkup(challenge, state) {
	const complete = challenge.missions.filter(mission => mission.done).length;
	const progress = challenge.missions.length ? Math.round(complete / challenge.missions.length * 100) : 0;
	const status = state === 'done' ? 'CLEARED' : state === 'active' ? 'IN PROGRESS' : 'LOCKED';
	const missions = challenge.missions.map(mission => `<li class="mission-item"><input type="checkbox" id="mission-${escapeHtml(mission.id)}" data-mission="${escapeHtml(mission.id)}" ${mission.done ? 'checked' : ''} ${state === 'locked' && !mission.done ? 'disabled' : ''}><label for="mission-${escapeHtml(mission.id)}" class="${mission.done ? 'mission-done' : ''}">${escapeHtml(mission.text)}</label></li>`).join('');
	const lockMessage = state === 'locked' ? '<p class="locked-message"><span aria-hidden="true">⌑</span> 선행 도전과제를 완료해야 새 미션을 진행할 수 있습니다</p>' : '';
	return `<article class="challenge-card" data-challenge-id="${escapeHtml(challenge.id)}" data-category="${escapeHtml(challenge.category)}" data-state="${state}" data-x="${challenge.x}" data-y="${challenge.y}" style="--node-color:${COLORS[challenge.color] || COLORS.cyan}"><div class="challenge-card-head"><span class="drag-grip" aria-label="드래그하여 이동" title="드래그하여 이동">⠿</span><span class="challenge-icon">${escapeHtml(challenge.icon || '✦')}</span><span class="challenge-status">${status}</span></div><p class="challenge-category">${escapeHtml(challenge.category)}</p><h3>${escapeHtml(challenge.name)}</h3><p class="challenge-description">${escapeHtml(challenge.description || '')}</p><div class="challenge-progress-head"><span>MISSION</span><strong>${complete}/${challenge.missions.length}</strong></div><div class="challenge-progress"><span style="width:${progress}%"></span></div>${lockMessage}<ul class="mission-list">${missions}</ul>${challenge.note ? `<details class="challenge-note"><summary>메모 보기</summary><p>${escapeHtml(challenge.note)}</p></details>` : ''}</article>`;
}

function positionCards() {
	const maxX = Math.max(0, board.clientWidth - 250);
	const maxY = Math.max(0, board.clientHeight - 250);
	boardNodes.querySelectorAll('.challenge-card').forEach(card => {
		card.style.left = `${Math.min(maxX, Math.max(0, Number(card.dataset.x) / 100 * maxX))}px`;
		card.style.top = `${Math.min(maxY, Math.max(0, Number(card.dataset.y) / 100 * maxY))}px`;
	});
	requestAnimationFrame(renderConnections);
}

function renderConnections() {
	const width = board.clientWidth;
	const height = board.clientHeight;
	boardLinks.setAttribute('viewBox', `0 0 ${width} ${height}`);
	boardLinks.setAttribute('width', width);
	boardLinks.setAttribute('height', height);
	const filter = $('#stackFilter').value;
	const cards = new Map([...boardNodes.querySelectorAll('.challenge-card')].map(card => [card.dataset.challengeId, card]));
	const paths = challenges.filter(challenge => challenge.parentId && cards.has(challenge.parentId) && cards.has(challenge.id)).map(challenge => {
		const parent = cards.get(challenge.parentId);
		const child = cards.get(challenge.id);
		const hidden = filter !== 'all' && (parent.dataset.category !== filter || child.dataset.category !== filter);
		if (hidden) return '';
		const parentX = parent.offsetLeft + parent.offsetWidth / 2;
		const childX = child.offsetLeft + child.offsetWidth / 2;
		const forward = childX >= parentX;
		const x1 = forward ? parent.offsetLeft + parent.offsetWidth : parent.offsetLeft;
		const x2 = forward ? child.offsetLeft : child.offsetLeft + child.offsetWidth;
		const y1 = parent.offsetTop + parent.offsetHeight / 2;
		const y2 = child.offsetTop + child.offsetHeight / 2;
		const bend = Math.max(42, Math.abs(x2 - x1) * .42);
		const direction = forward ? 1 : -1;
		return `<path class="dependency-link" d="M ${x1} ${y1} C ${x1 + bend * direction} ${y1}, ${x2 - bend * direction} ${y2}, ${x2} ${y2}" marker-end="url(#linkArrow)" data-parent="${escapeHtml(challenge.parentId)}" data-child="${escapeHtml(challenge.id)}"></path>`;
	}).join('');
	boardLinks.querySelectorAll('.dependency-link').forEach(path => path.remove());
	boardLinks.insertAdjacentHTML('beforeend', paths);
}

function updateStackFilter() {
	const select = $('#stackFilter');
	const previous = select.value;
	const categories = [...new Set(challenges.map(challenge => challenge.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
	select.innerHTML = '<option value="all">전체 스택</option>' + categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
	select.value = categories.includes(previous) ? previous : 'all';
}

function renderBoard() {
	updateStackFilter();
	const states = getStates();
	const filter = $('#stackFilter').value;
	const visible = challenges.filter(challenge => filter === 'all' || challenge.category === filter);
	boardNodes.innerHTML = visible.map(challenge => {
		const card = document.createElement('template');
		card.innerHTML = cardMarkup(challenge, states.get(challenge.id) || 'locked');
		return card.innerHTML;
	}).join('');
	$('#boardEmpty').hidden = challenges.length > 0 && visible.length > 0;
	$('#boardEmpty').classList.toggle('filter-empty', challenges.length > 0 && visible.length === 0);
	if (challenges.length > 0 && visible.length === 0) {
		$('#boardEmpty').querySelector('strong').textContent = '선택한 스택의 도전과제가 없습니다.';
		$('#boardEmpty').querySelector('span:not(.empty-rune)').textContent = '다른 스택을 선택하거나 데이터베이스에서 새 과제를 추가하세요.';
		$('#boardEmpty').querySelector('button').hidden = true;
	} else {
		$('#boardEmpty').querySelector('strong').textContent = '아직 등록된 도전과제가 없습니다.';
		$('#boardEmpty').querySelector('span:not(.empty-rune)').textContent = '첫 도전과제를 추가해 나만의 트리를 시작하세요.';
		$('#boardEmpty').querySelector('button').hidden = false;
	}
	boardNodes.querySelectorAll('.challenge-card').forEach(card => card.addEventListener('pointerdown', startDrag));
	positionCards();
	renderStats(states);
}

function descendantsOf(id) {
	const result = new Set();
	const visit = parentId => challenges.filter(challenge => challenge.parentId === parentId).forEach(challenge => {
		if (result.has(challenge.id)) return;
		result.add(challenge.id);
		visit(challenge.id);
	});
	visit(id);
	return result;
}

function canReparent(challengeId, parentId) {
	if (parentId === null) return challenges.some(challenge => challenge.id === challengeId);
	if (challengeId === parentId || descendantsOf(challengeId).has(parentId)) return false;
	return challenges.some(challenge => challenge.id === challengeId) && challenges.some(challenge => challenge.id === parentId);
}

function renderDatabaseList() {
	const childrenOf = parentId => challenges.filter(challenge => challenge.parentId === parentId);
	function renderBranch(challenge, path = new Set()) {
		if (path.has(challenge.id)) return '';
		const nextPath = new Set(path).add(challenge.id);
		const children = childrenOf(challenge.id).map(child => renderBranch(child, nextPath)).join('');
		return `<li><button class="database-item${selectedId === challenge.id ? ' selected' : ''}" type="button" draggable="true" aria-grabbed="false" data-select-challenge="${escapeHtml(challenge.id)}"><span class="database-item-icon">⠿</span><span class="database-item-text"><strong>${escapeHtml(challenge.name)}</strong><small>${escapeHtml(challenge.category)}</small></span><span class="database-item-arrow">↗</span></button>${children ? `<ul class="database-children">${children}</ul>` : ''}</li>`;
	}
	const roots = challenges.filter(challenge => !challenge.parentId || !challenges.some(item => item.id === challenge.parentId));
	databaseList.innerHTML = roots.length ? `<ul class="database-tree">${roots.map(root => renderBranch(root)).join('')}</ul>` : '<p class="list-footnote">아직 등록된 도전과제가 없습니다.</p>';
}

function updateParentOptions(currentId = '') {
	const select = $('#challengeParent');
	const current = challenges.find(challenge => challenge.id === currentId);
	const excluded = currentId ? descendantsOf(currentId).add(currentId) : new Set();
	const options = challenges.filter(challenge => !excluded.has(challenge.id)).map(challenge => `<option value="${escapeHtml(challenge.id)}">${escapeHtml(challenge.name)}</option>`).join('');
	select.innerHTML = `<option value="">없음 · 처음부터 도전 가능</option>${options}`;
	select.value = current?.parentId || '';
}

function render() {
	renderBoard();
	renderDatabaseList();
}

function resetForm() {
	selectedId = null;
	$('#challengeForm').reset();
	$('#challengeId').value = '';
	$('#challengeIcon').value = '✦';
	$('#formHeading').textContent = '새 도전과제 등록';
	$('#editIndicator').textContent = 'NEW QUEST';
	$('#saveButtonLabel').textContent = '보드에 추가';
	$('#deleteChallengeButton').hidden = true;
	$('#formMessage').textContent = '';
	updateParentOptions();
	renderDatabaseList();
}

function editChallenge(id) {
	const challenge = challenges.find(item => item.id === id);
	if (!challenge) return;
	selectedId = id;
	$('#challengeId').value = id;
	$('#challengeName').value = challenge.name;
	$('#challengeCategory').value = challenge.category;
	$('#challengeIcon').value = challenge.icon || '✦';
	$('#challengeColor').value = challenge.color || 'cyan';
	$('#challengeDescription').value = challenge.description || '';
	$('#challengeMissions').value = challenge.missions.map(mission => mission.text).join('\n');
	$('#challengeNote').value = challenge.note || '';
	$('#formHeading').textContent = '도전과제 수정';
	$('#editIndicator').textContent = 'EDIT QUEST';
	$('#saveButtonLabel').textContent = '변경사항 저장';
	$('#deleteChallengeButton').hidden = false;
	$('#formMessage').textContent = '';
	updateParentOptions(id);
	renderDatabaseList();
}

function openDatabase() {
	resetForm();
	databaseDialog.showModal();
}

function startDrag(event) {
	if (event.button !== 0 || event.target.closest('input, button, label, textarea, select, summary')) return;
	const card = event.currentTarget;
	dragState = { card, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: card.offsetLeft, top: card.offsetTop };
	card.classList.add('dragging');
	card.setPointerCapture(event.pointerId);
	event.preventDefault();
}

boardNodes.addEventListener('pointermove', event => {
	if (!dragState || dragState.pointerId !== event.pointerId) return;
	const { card, startX, startY, left, top } = dragState;
	const maxX = Math.max(0, board.clientWidth - card.offsetWidth);
	const maxY = Math.max(0, board.clientHeight - card.offsetHeight);
	card.style.left = `${Math.min(maxX, Math.max(0, left + event.clientX - startX))}px`;
	card.style.top = `${Math.min(maxY, Math.max(0, top + event.clientY - startY))}px`;
	renderConnections();
});

function finishDrag(event) {
	if (!dragState || dragState.pointerId !== event.pointerId) return;
	const { card } = dragState;
	const maxX = Math.max(1, board.clientWidth - card.offsetWidth);
	const maxY = Math.max(1, board.clientHeight - card.offsetHeight);
	const challenge = challenges.find(item => item.id === card.dataset.challengeId);
	if (challenge) {
		challenge.x = Math.round(card.offsetLeft / maxX * 1000) / 10;
		challenge.y = Math.round(card.offsetTop / maxY * 1000) / 10;
		saveChallenges();
	}
	card.classList.remove('dragging');
	dragState = null;
	renderConnections();
}

boardNodes.addEventListener('pointerup', finishDrag);
boardNodes.addEventListener('pointercancel', finishDrag);

boardNodes.addEventListener('change', event => {
	const missionId = event.target.dataset.mission;
	if (!missionId) return;
	const challenge = challenges.find(item => item.missions.some(mission => mission.id === missionId));
	if (!challenge) return;
	const mission = challenge.missions.find(item => item.id === missionId);
	const state = getStates().get(challenge.id);
	if (state !== 'active' && (event.target.checked || !mission.done)) {
		render();
		return;
	}
	mission.done = event.target.checked;
	saveChallenges();
	render();
});

databaseList.addEventListener('click', event => {
	const item = event.target.closest('[data-select-challenge]');
	if (item) editChallenge(item.dataset.selectChallenge);
});

databasePanel.addEventListener('dragstart', event => {
	const item = event.target.closest('[data-select-challenge]');
	if (!item) return;
	draggedChallengeId = item.dataset.selectChallenge;
	item.setAttribute('aria-grabbed', 'true');
	item.classList.add('is-dragging');
	event.dataTransfer.effectAllowed = 'move';
	event.dataTransfer.setData('text/plain', draggedChallengeId);
});

databasePanel.addEventListener('dragend', event => {
	const item = event.target.closest('[data-select-challenge]');
	item?.classList.remove('is-dragging');
	item?.setAttribute('aria-grabbed', 'false');
	databasePanel.querySelectorAll('.drop-target, .drop-invalid, .is-root-target').forEach(element => element.classList.remove('drop-target', 'drop-invalid', 'is-root-target'));
	draggedChallengeId = null;
});

databasePanel.addEventListener('dragover', event => {
	const rootTarget = event.target.closest('#databaseRootDrop');
	const item = event.target.closest('[data-select-challenge]');
	if (!rootTarget && !item) return;
	event.preventDefault();
	databasePanel.querySelectorAll('.drop-target, .drop-invalid, .is-root-target').forEach(element => element.classList.remove('drop-target', 'drop-invalid', 'is-root-target'));
	if (rootTarget) {
		rootTarget.classList.add('is-root-target');
		event.dataTransfer.dropEffect = 'move';
		return;
	}
	const valid = canReparent(draggedChallengeId, item.dataset.selectChallenge);
	item.classList.add(valid ? 'drop-target' : 'drop-invalid');
	event.dataTransfer.dropEffect = valid ? 'move' : 'none';
});

databasePanel.addEventListener('drop', event => {
	const rootTarget = event.target.closest('#databaseRootDrop');
	const item = event.target.closest('[data-select-challenge]');
	if (!rootTarget && !item) return;
	event.preventDefault();
	const parentId = rootTarget ? null : item.dataset.selectChallenge;
	if (!draggedChallengeId || !canReparent(draggedChallengeId, parentId)) return;
	const moved = challenges.find(challenge => challenge.id === draggedChallengeId);
	moved.parentId = parentId;
	saveChallenges();
	render();
	if (selectedId) {
		updateParentOptions(selectedId);
		if ($('#challengeId').value === selectedId) $('#challengeParent').value = challenges.find(challenge => challenge.id === selectedId)?.parentId || '';
	}
	$('#hierarchyMessage').textContent = parentId ? '도전과제를 하위 항목으로 이동했습니다.' : '도전과제를 최상위로 이동했습니다.';
});

$('#openDatabaseButton').addEventListener('click', openDatabase);
$('#addChallengeButton').addEventListener('click', openDatabase);
$('#emptyAddButton').addEventListener('click', openDatabase);
$('#newChallengeButton').addEventListener('click', resetForm);
$('#resetChallengeButton').addEventListener('click', resetForm);
$('#closeDatabaseButton').addEventListener('click', () => databaseDialog.close());
$('#stackFilter').addEventListener('change', renderBoard);
databaseDialog.addEventListener('click', event => {
	if (event.target === databaseDialog) databaseDialog.close();
});

$('#challengeForm').addEventListener('submit', event => {
	event.preventDefault();
	const name = $('#challengeName').value.trim();
	const category = $('#challengeCategory').value.trim();
	const missionTexts = $('#challengeMissions').value.split('\n').map(text => text.trim()).filter(Boolean);
	if (!name || !category || missionTexts.length === 0) {
		$('#formMessage').textContent = '이름, 기술 스택, 완료 미션을 입력해 주세요.';
		return;
	}
	const existing = challenges.find(challenge => challenge.id === $('#challengeId').value);
	const previousMissions = new Map((existing?.missions || []).map(mission => [mission.text, mission]));
	const id = existing?.id || `quest-${Date.now().toString(36)}`;
	const parentId = $('#challengeParent').value || null;
	const parent = challenges.find(challenge => challenge.id === parentId);
	const index = challenges.length;
	const challenge = {
		id,
		name,
		category,
		icon: $('#challengeIcon').value.trim() || '✦',
		color: $('#challengeColor').value,
		description: $('#challengeDescription').value.trim(),
		note: $('#challengeNote').value.trim(),
		parentId,
		x: existing?.x ?? Math.min(78, parent ? parent.x + 5 : 5 + index % 3 * 28),
		y: existing?.y ?? Math.min(78, parent ? parent.y + 25 : 6 + Math.floor(index / 3) * 33),
		missions: missionTexts.map((text, missionIndex) => {
			const previous = previousMissions.get(text);
			return { id: previous?.id || `${id}-m${Date.now().toString(36)}-${missionIndex}`, text, done: previous?.done || false };
		})
	};
	if (existing) challenges[challenges.indexOf(existing)] = challenge;
	else challenges.push(challenge);
	saveChallenges();
	render();
	if (existing) editChallenge(id);
	else resetForm();
	$('#formMessage').textContent = existing ? '변경사항을 저장했습니다.' : '보드에 도전과제를 추가했습니다.';
});

$('#deleteChallengeButton').addEventListener('click', () => {
	const id = $('#challengeId').value;
	const challenge = challenges.find(item => item.id === id);
	if (!challenge || !window.confirm(`'${challenge.name}' 도전과제를 삭제할까요? 하위 도전과제는 시작 노드로 이동합니다.`)) return;
	challenges.filter(item => item.parentId === id).forEach(child => { child.parentId = challenge.parentId || null; });
	challenges = challenges.filter(item => item.id !== id);
	saveChallenges();
	render();
	resetForm();
});

window.addEventListener('resize', positionCards);
render();
