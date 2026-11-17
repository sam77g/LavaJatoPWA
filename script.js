// ── CONSTANTS ──
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TIPOS = [
    { k: 'carro', l: 'Carros', e: '🚗' },
    { k: 'moto', l: 'Motos', e: '🏍️' },
    { k: 'cami', l: 'Caminhon.', e: '🛻' },
    { k: 'van', l: 'Vans', e: '🚐' },
];

// ── DATE BADGE ──
const now = new Date();
document.getElementById('date-badge').textContent =
    now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
document.getElementById('inp-date').value = now.toISOString().slice(0, 10);

// ── STORAGE ──
async function loadData() {
    try { const r = await window.storage.get('lava_jato_records'); return r ? JSON.parse(r.value) : []; }
    catch { return []; }
}
async function saveData(d) { await window.storage.set('lava_jato_records', JSON.stringify(d)); }

// ── FMT ──
function fmt(n) { return 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtShort(n) {
    if (n >= 1000) return 'R$ ' + (n / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'k';
    return fmt(n);
}

// ── TOAST ──
function toast(msg, isErr) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.borderColor = isErr ? 'var(--red)' : 'var(--green-dim)';
    t.style.color = isErr ? 'var(--red)' : 'var(--green)';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// ── PREVIEW ──
function calcPreview() {
    let total = 0;
    TIPOS.forEach(t => {
        const q = +document.getElementById('v-' + t.k + '-qtd').value || 0;
        const p = +document.getElementById('v-' + t.k + '-preco').value || 0;
        total += q * p;
    });
    document.getElementById('preview-total').textContent = fmt(total);
}
TIPOS.forEach(t => {
    document.getElementById('v-' + t.k + '-qtd').addEventListener('input', calcPreview);
    document.getElementById('v-' + t.k + '-preco').addEventListener('input', calcPreview);
});

// ── SAVE ──
async function salvarDia() {
    const data = document.getElementById('inp-date').value;
    if (!data) { toast('Selecione uma data', true); return; }
    const veiculos = {};
    let total = 0;
    TIPOS.forEach(t => {
        const q = +document.getElementById('v-' + t.k + '-qtd').value || 0;
        const p = +document.getElementById('v-' + t.k + '-preco').value || 0;
        veiculos[t.k] = { qtd: q, preco: p };
        total += q * p;
    });
    const records = await loadData();
    const idx = records.findIndex(r => r.data === data);
    const entry = { data, veiculos, total };
    if (idx >= 0) records[idx] = entry; else records.push(entry);
    records.sort((a, b) => a.data.localeCompare(b.data));
    await saveData(records);
    toast('✓ Dia salvo com sucesso!');
    TIPOS.forEach(t => document.getElementById('v-' + t.k + '-qtd').value = 0);
    calcPreview();
}

// ── RANGES ──
function getWeekRange() {
    const now = new Date();
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return [mon.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)];
}
function getMonthRange() {
    const now = new Date();
    const f = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const l = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    return [f, l];
}

// ── CHART HTML ──
function renderChart(items, max, labelKey, valueKey, dim) {
    if (!items.length) return `<div class="empty"><div class="empty-icon">📉</div>Nenhum registro</div>`;
    const maxVal = Math.max(...items.map(i => i[valueKey]), 1);
    return items.map(i => {
        const pct = Math.round((i[valueKey] / maxVal) * 100);
        return `<div class="bar-row">
      <span class="bar-label">${i[labelKey]}</span>
      <div class="bar-track"><div class="bar-fill${dim ? ' dim' : ''}" style="width:${pct}%"></div></div>
      <span class="bar-val">${fmtShort(i[valueKey])}</span>
    </div>`;
    }).join('');
}

// ── SEMANA ──
async function renderSemana() {
    const [s, e] = getWeekRange();
    const records = await loadData();
    const week = records.filter(r => r.data >= s && r.data <= e);
    const totalRec = week.reduce((a, r) => a + r.total, 0);
    const totalVeic = week.reduce((a, r) => a + TIPOS.reduce((b, t) => b + (r.veiculos[t.k]?.qtd || 0), 0), 0);
    const melhor = week.length ? week.reduce((a, b) => a.total > b.total ? a : b) : null;

    document.getElementById('sem-hero').innerHTML = `
    <div class="hero-metric">
      <div class="hero-label">💰 Receita da semana</div>
      <div class="hero-value">${fmt(totalRec)}</div>
      <div class="hero-sub">${week.length} dia${week.length !== 1 ? 's' : ''} registrado${week.length !== 1 ? 's' : ''}</div>
    </div>`;

    document.getElementById('sem-metrics').innerHTML = `
    <div class="metric">
      <div class="metric-label">Veículos lavados</div>
      <div class="metric-value">${totalVeic}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Melhor dia</div>
      <div class="metric-value amber">${melhor ? fmtShort(melhor.total) : '—'}</div>
    </div>`;

    const chartData = week.map(r => {
        const d = new Date(r.data + 'T12:00');
        return { label: DIAS[d.getDay()] + ' ' + d.getDate(), value: r.total };
    });
    document.getElementById('sem-chart').innerHTML = renderChart(chartData, null, 'label', 'value', false);

    if (!week.length) {
        document.getElementById('sem-records').innerHTML = `<div class="empty"><div class="empty-icon">📋</div>Nenhum registro esta semana</div>`;
        return;
    }
    document.getElementById('sem-records').innerHTML = [...week].reverse().map(r => {
        const d = new Date(r.data + 'T12:00');
        const detail = TIPOS.filter(t => r.veiculos[t.k]?.qtd > 0)
            .map(t => `${r.veiculos[t.k].qtd} ${t.e}`).join('  ');
        return `<div class="record-item">
      <div class="record-date">
        <div class="day">${d.getDate()}</div>
        <div class="wday">${DIAS[d.getDay()]}</div>
      </div>
      <div class="record-info">
        <div class="record-total">${fmt(r.total)}</div>
        <div class="record-detail">${detail || 'Sem veículos'}</div>
      </div>
      <div class="record-del">
        <button class="btn-ghost" onclick="deletar('${r.data}')">✕</button>
      </div>
    </div>`;
    }).join('');
}

// ── MÊS ──
async function renderMes() {
    const [s, e] = getMonthRange();
    const records = await loadData();
    const mes = records.filter(r => r.data >= s && r.data <= e);
    const totalRec = mes.reduce((a, r) => a + r.total, 0);
    const totalVeic = mes.reduce((a, r) => a + TIPOS.reduce((b, t) => b + (r.veiculos[t.k]?.qtd || 0), 0), 0);
    const ticketMedio = mes.length ? totalRec / mes.length : 0;

    const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    document.getElementById('mes-hero').innerHTML = `
    <div class="hero-metric">
        <div class="hero-label">📅 ${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}</div>
        <div class="hero-value">${fmt(totalRec)}</div>
        <div class="hero-sub">${mes.length} dia${mes.length !== 1 ? 's' : ''} registrado${mes.length !== 1 ? 's' : ''}</div>
    </div>`;

    document.getElementById('mes-metrics').innerHTML = `
    <div class="metric">
        <div class="metric-label">Veículos no mês</div>
        <div class="metric-value">${totalVeic}</div>
    </div>
    <div class="metric">
        <div class="metric-label">Ticket médio/dia</div>
        <div class="metric-value amber">${fmtShort(ticketMedio)}</div>
    </div>`;

    const semanas = [[], [], [], [], []];
    mes.forEach(r => { const d = new Date(r.data + 'T12:00'); const w = Math.floor((d.getDate() - 1) / 7); semanas[w].push(r); });
    const semTotais = semanas.map((s, i) => ({ label: 'Sem ' + (i + 1), value: s.reduce((a, r) => a + r.total, 0) })).filter(s => s.value > 0);
    document.getElementById('mes-chart').innerHTML = renderChart(semTotais, null, 'label', 'value', true);

    const tipoData = TIPOS.map(t => ({
        t,
        qtd: mes.reduce((a, r) => a + (r.veiculos[t.k]?.qtd || 0), 0),
        rec: mes.reduce((a, r) => a + (r.veiculos[t.k]?.qtd || 0) * (r.veiculos[t.k]?.preco || 0), 0)
    }));
    document.getElementById('mes-tipos').innerHTML = tipoData.map(({ t, qtd, rec }) => `
    <div class="tipo-item">
        <div class="tipo-name">${t.e} ${t.l}</div>
        <div class="tipo-qtd">${qtd}</div>
        <div class="tipo-rec">${fmtShort(rec)}</div>
    </div>`).join('');
}

// ── DELETE ──
async function deletar(data) {
    if (!confirm('Remover registro de ' + new Date(data + 'T12:00').toLocaleDateString('pt-BR') + '?')) return;
    const records = await loadData();
    await saveData(records.filter(r => r.data !== data));
    renderSemana();
    toast('Registro removido');
}

// ── TABS ──
function showTab(name, btn) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    if (btn) btn.classList.add('active');
    if (name === 'semana') renderSemana();
    if (name === 'mes') renderMes();
}

// ── SW ──
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');