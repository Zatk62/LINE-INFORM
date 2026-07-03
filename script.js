// Standalone QA/QC Mobile Pro Engine v3.0 (Vanilla JS)
let logs = JSON.parse(localStorage.getItem('qc_standalone_v3_logs') || '[]');
let currentFormat = 'standard';

// Initial Sample Data
if (logs.length === 0) {
    logs = [
        {
            id: 1,
            dateStr: new Date().toLocaleDateString('th-TH'),
            timeStr: '10:30',
            partName: 'Front Bumper Bracket Assy',
            partNumber: '865103V000',
            vendor: 'Apex Automotive Co., Ltd.',
            model: 'Model X-2026 / Line #4 (Press Shop)',
            totalQty: 2500, okQty: 2465, ngQty: 35, defectRate: 1.40,
            problemDesc: 'Mounting hole pitch shifted by +0.35mm beyond tolerance limit.',
            severity: 'Major', disposition: 'Hold Lot', inspector: 'Alex M. (QA Specialist)'
        },
        {
            id: 2,
            dateStr: new Date(Date.now() - 86400000).toLocaleDateString('th-TH'),
            timeStr: '22:15',
            partName: 'Engine Wire Harness Main',
            partNumber: '91850D2010',
            vendor: 'ElectroTech Systems TH',
            model: 'Model X-2026 / Line #1 (Engine)',
            totalQty: 850, okQty: 820, ngQty: 30, defectRate: 3.53,
            problemDesc: 'Pin #12 loose connection inside ECU connector clip.',
            severity: 'Critical', disposition: 'Sort 100%', inspector: 'Parijat S. (Night QC Lead)'
        }
    ];
    localStorage.setItem('qc_standalone_v3_logs', JSON.stringify(logs));
}

document.addEventListener('DOMContentLoaded', () => {
    updateRate();
    renderPresets();
    renderLogbook();
    updateBadge();
    
    document.getElementById('partNumber').addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^0-9a-zA-Z]/g, '');
        const badge = document.getElementById('partNoBadge');
        if (clean.length === 10) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    });
});

function switchPage(pageId) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('page-' + pageId).classList.add('active');
    document.getElementById('tab-' + pageId).classList.add('active');
    
    const subtitle = document.getElementById('pageSubtitle');
    if (pageId === 'form') subtitle.innerText = '📝 บันทึกผลตรวจสอบ 5 หัวข้อมาตรฐาน';
    if (pageId === 'output') {
        subtitle.innerText = '✨ รายงานจัดรูปแบบพร้อมส่งทันที';
        generateReport();
    }
    if (pageId === 'logbook') {
        subtitle.innerText = '📚 ประวัติบันทึกในเครื่อง (' + logs.length + ' รายการ)';
        renderLogbook();
    }
    if (pageId === 'analytics') {
        subtitle.innerText = '📊 สถิติวิเคราะห์และอัตรา Defect';
        renderAnalytics();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleQty(field) {
    const total = parseInt(document.getElementById('totalQty').value) || 0;
    const ok = parseInt(document.getElementById('okQty').value) || 0;
    const ng = parseInt(document.getElementById('ngQty').value) || 0;
    
    if (field === 'totalQty') document.getElementById('okQty').value = Math.max(0, total - ng);
    else if (field === 'okQty') document.getElementById('ngQty').value = Math.max(0, total - ok);
    else if (field === 'ngQty') document.getElementById('okQty').value = Math.max(0, total - ng);
    updateRate();
}

function stepQty(field, step) {
    const el = document.getElementById(field);
    const val = Math.max(0, (parseInt(el.value) || 0) + step);
    el.value = val;
    handleQty(field);
}

function updateRate() {
    const total = parseInt(document.getElementById('totalQty').value) || 0;
    const ng = parseInt(document.getElementById('ngQty').value) || 0;
    const rate = total > 0 ? ((ng / total) * 100).toFixed(2) : '0.00';
    
    const tag = document.getElementById('rateTag');
    tag.innerText = 'Defect Rate: ' + rate + '%';
    tag.style.background = rate == 0 ? '#10b981' : rate < 2.0 ? '#facc15' : '#f43f5e';
    tag.style.color = rate < 2.0 ? '#020617' : '#ffffff';
}

function togglePresets() {
    const drawer = document.getElementById('presetDrawer');
    drawer.classList.toggle('hidden');
}

function renderPresets() {
    const presets = [
        { label: '⚡ ครีบเกิน / Burr (>0.2mm)', part: 'Front Bumper Bracket', no: '865103V000', desc: 'Burr / Flash defect detected on mating edge exceeding 0.2mm limit.', sev: 'Major' },
        { label: '📐 ระยะรูเจาะเพี้ยน / Hole Offset', part: 'Suspension Subframe', no: '54410A4000', desc: 'Mounting hole center pitch shifted out of tolerance by +0.40mm.', sev: 'Critical' },
        { label: '✨ รอยขีดข่วน / Hairline Scratch', part: 'Dashboard Bezel', no: '84710B1000', desc: 'Surface scratch defect found on Piano Black glossy finishing zone A.', sev: 'Minor' },
        { label: '🔌 ขั้วต่อหลวม / Pin Loose', part: 'Engine Wire Harness', no: '91850D2010', desc: 'Terminal pin unlock inside main 24-pin housing. Fails pull test.', sev: 'Critical' }
    ];
    const drawer = document.getElementById('presetDrawer');
    drawer.innerHTML = presets.map((p) => `
        <div class="preset-card" onclick="applyPreset('${p.part}', '${p.no}', '${p.desc}', '${p.sev}')">
            <strong>${p.label}</strong>
            <span>${p.part} (${p.no})</span>
        </div>
    `).join('');
}

function applyPreset(part, no, desc, sev) {
    document.getElementById('partName').value = part;
    document.getElementById('partNumber').value = no;
    document.getElementById('problemDesc').value = desc;
    document.getElementById('severity').value = sev;
    togglePresets();
}

function format10Digits(val) {
    const clean = val.replace(/[^0-9a-zA-Z]/g, '');
    return clean.length === 10 ? clean.slice(0, 5) + '-' + clean.slice(5) : val;
}

function generateReport() {
    const pName = document.getElementById('partName').value || '-';
    const pNo = format10Digits(document.getElementById('partNumber').value || '-');
    const vendor = document.getElementById('vendor').value || '-';
    const model = document.getElementById('model').value || '-';
    const total = parseInt(document.getElementById('totalQty').value) || 0;
    const ok = parseInt(document.getElementById('okQty').value) || 0;
    const ng = parseInt(document.getElementById('ngQty').value) || 0;
    const desc = document.getElementById('problemDesc').value || '-';
    const sev = document.getElementById('severity').value;
    const disp = document.getElementById('disposition').value;
    const insp = document.getElementById('inspector').value;
    const rate = total > 0 ? ((ng / total) * 100).toFixed(2) : '0.00';

    document.getElementById('outTotal').innerText = total.toLocaleString() + ' pcs';
    document.getElementById('outOk').innerText = ok.toLocaleString() + ' pcs';
    document.getElementById('outNg').innerText = ng.toLocaleString() + ' pcs';
    document.getElementById('outRate').innerText = rate + '%';
    document.getElementById('fmtBadge').innerText = currentFormat.toUpperCase() + ' MODE';

    let txt = '';
    if (currentFormat === 'chat') {
        txt = `🚨 [QA/QC DEFECT ALERT - ${sev.toUpperCase()}]
================================
📦 1. ชื่อชิ้นงาน: ${pName}
🔢 2. รหัสชิ้นงาน: ${pNo}
🏢 3. Supplier: ${vendor}
🏭 4. ไลน์ผลิต/รุ่น: ${model}
================================
📊 5. สรุปผลตรวจสอบ:
   • ตรวจสอบทั้งหมด: ${total.toLocaleString()} ชิ้น
   • ผ่าน (OK): ${ok.toLocaleString()} ชิ้น | ไม่ผ่าน (NG): ${ng.toLocaleString()} ชิ้น (${rate}%)
================================
⚠️ รายละเอียดปัญหา: ${desc}
🔴 ระดับ: ${sev} | ⚡ มาตรการแก้ไข: ${disp}
👤 ผู้ตรวจสอบ: ${insp}`;
    } else if (currentFormat === 'table') {
        txt = `+-----------------------------------------------------------+
| QA/QC INSPECTION TABULAR SUMMARY                          |
+----------------------+------------------------------------+
| 1. Part Name         | ${pName.slice(0, 34).padEnd(34)} |
| 2. Part Number       | ${pNo.padEnd(34)} |
| 3. Vendor            | ${vendor.slice(0, 34).padEnd(34)} |
| 4. Model / Line      | ${model.slice(0, 34).padEnd(34)} |
+----------------------+------------------------------------+
| Total Inspected      | ${total.toLocaleString().padEnd(34)} |
| OK Quantity (Pass)   | ${ok.toLocaleString().padEnd(34)} |
| NG Quantity (Defect) | ${ng.toLocaleString().padEnd(34)} |
| Defect Rate (%)      | ${(rate + '%').padEnd(34)} |
+----------------------+------------------------------------+
| Defect Description   | ${desc.slice(0, 34).padEnd(34)} |
| Action Taken         | ${disp.padEnd(34)} |
+-----------------------------------------------------------+`;
    } else if (currentFormat === 'bilingual') {
        txt = `📋 รายงานการตรวจสอบคุณภาพชิ้นงาน / PRODUCTION QA/QC REPORT
============================================================
1. ชื่อชิ้นงาน (Part Name): ${pName}
2. รหัสชิ้นงาน 10 หลัก (Part No.): ${pNo}
3. ผู้ผลิต (Vendor): ${vendor}
4. ไลน์ผลิต/รุ่น (Model/Line): ${model}
5. สรุปยอดตรวจสอบ (Inspection Quantities):
   • รวมทั้งหมด: ${total.toLocaleString()} ชิ้น | ผ่าน: ${ok.toLocaleString()} | ไม่ผ่าน: ${ng.toLocaleString()} [${rate}%]
============================================================
🔍 รายละเอียดข้อบกพร่อง: ${desc}
📌 ระดับความรุนแรง: ${sev} | การดำเนินการ: ${disp}`;
    } else {
        txt = `Production Line Quality Inspection Report
Date/Time: ${new Date().toLocaleString('th-TH')}

1. Part Name    : ${pName}
2. Part Number  : ${pNo}
3. Vendor       : ${vendor}
4. Model / Line : ${model}
5. Quantities   :
   - Total Inspected : ${total.toLocaleString()} pcs
   - OK Quantity     : ${ok.toLocaleString()} pcs
   - NG Quantity     : ${ng.toLocaleString()} pcs (${rate}% Defect Rate)

PROBLEM / DEFECT DETAILS:
${desc}

Severity Level: ${sev}
Disposition   : ${disp}
QA Inspector  : ${insp}`;
    }
    document.getElementById('reportText').innerText = txt;
}

function setFormat(fmt, btn) {
    currentFormat = fmt;
    document.querySelectorAll('.fmt-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    generateReport();
}

function copyReport() {
    const txt = document.getElementById('reportText').innerText;
    navigator.clipboard.writeText(txt).then(() => {
        const btn = document.getElementById('btnCopyBig');
        btn.innerText = '✓ คัดลอกรายงานเรียบร้อยแล้ว!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.innerText = '📋 คัดลอกรายงานเพื่อส่ง LINE หรือ Email';
            btn.style.background = 'linear-gradient(90deg, #059669, #10b981)';
        }, 2000);
    });
}

function downloadTXT() {
    const txt = document.getElementById('reportText').innerText;
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'QC_Report_' + new Date().toISOString().slice(0, 10) + '.txt';
    a.click();
}

function shareLine() {
    const txt = document.getElementById('reportText').innerText;
    window.open('https://line.me/R/msg/text/?' + encodeURIComponent(txt), '_blank');
}

function saveToLogbook() {
    const total = parseInt(document.getElementById('totalQty').value) || 0;
    const ng = parseInt(document.getElementById('ngQty').value) || 0;
    const item = {
        id: Date.now(),
        dateStr: new Date().toLocaleDateString('th-TH'),
        timeStr: new Date().toLocaleTimeString('th-TH').slice(0, 5),
        partName: document.getElementById('partName').value || 'Unknown',
        partNumber: document.getElementById('partNumber').value || '-',
        vendor: document.getElementById('vendor').value || '-',
        model: document.getElementById('model').value || '-',
        totalQty: total,
        okQty: parseInt(document.getElementById('okQty').value) || 0,
        ngQty: ng,
        defectRate: total > 0 ? Number(((ng / total) * 100).toFixed(2)) : 0,
        problemDesc: document.getElementById('problemDesc').value || '-',
        severity: document.getElementById('severity').value,
        disposition: document.getElementById('disposition').value
    };
    logs.unshift(item);
    localStorage.setItem('qc_standalone_v3_logs', JSON.stringify(logs));
    updateBadge();
    alert('✓ บันทึกผลการตรวจสอบลง Logbook เรียบร้อยแล้ว!');
}

function updateBadge() {
    document.getElementById('logCount').innerText = logs.length;
}

function renderLogbook() {
    const search = (document.getElementById('searchLog').value || '').toLowerCase();
    const sev = document.getElementById('filterSeverity').value;
    const list = document.getElementById('logbookList');
    
    const filtered = logs.filter(l => {
        const matchSearch = (l.partName||'').toLowerCase().includes(search) || (l.partNumber||'').toLowerCase().includes(search) || (l.vendor||'').toLowerCase().includes(search);
        const matchSev = sev === 'ALL' || l.severity === sev;
        return matchSearch && matchSev;
    });

    if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:2rem; color:#64748b;">ไม่พบประวัติการบันทึกที่ตรงเงื่อนไข</div>';
        return;
    }

    list.innerHTML = filtered.map(item => `
        <div class="log-card">
            <div class="log-top">
                <span class="log-date">🕒 ${item.dateStr} (${item.timeStr})</span>
                <span class="sev-tag sev-${item.severity.toLowerCase()}">${item.severity}</span>
            </div>
            <div class="log-title">${item.partName}</div>
            <div class="log-partno">${format10Digits(item.partNumber)} | ${item.vendor}</div>
            <div class="log-desc">⚠️ ${item.problemDesc}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; margin-bottom:0.6rem;">
                <span>ยอดตรวจ: ${item.totalQty.toLocaleString()} ชิ้น</span>
                <strong style="color:#fb7185;">NG: ${item.ngQty} (${item.defectRate}%)</strong>
            </div>
            <div class="log-actions">
                <button class="btn-load" onclick="loadLog(${item.id})">📋 โหลดเข้าฟอร์ม / แก้ไข</button>
                <button class="btn-del" onclick="deleteLog(${item.id})">🗑️ ลบ</button>
            </div>
        </div>
    `).join('');
}

function loadLog(id) {
    const item = logs.find(l => l.id === id);
    if (!item) return;
    document.getElementById('partName').value = item.partName || '';
    document.getElementById('partNumber').value = item.partNumber || '';
    document.getElementById('vendor').value = item.vendor || '';
    document.getElementById('model').value = item.model || '';
    document.getElementById('totalQty').value = item.totalQty || 0;
    document.getElementById('okQty').value = item.okQty || 0;
    document.getElementById('ngQty').value = item.ngQty || 0;
    document.getElementById('problemDesc').value = item.problemDesc || '';
    if (item.severity) document.getElementById('severity').value = item.severity;
    if (item.disposition) document.getElementById('disposition').value = item.disposition;
    updateRate();
    switchPage('form');
}

function deleteLog(id) {
    if (confirm('ยืนยันลบรายการนี้ออกจาก Logbook?')) {
        logs = logs.filter(l => l.id !== id);
        localStorage.setItem('qc_standalone_v3_logs', JSON.stringify(logs));
        updateBadge();
        renderLogbook();
    }
}

function clearAllLogs() {
    if (confirm('⚠️ คำเตือน: ต้องการลบประวัติทั้งหมดในเครื่อง?')) {
        logs = [];
        localStorage.setItem('qc_standalone_v3_logs', JSON.stringify(logs));
        updateBadge();
        renderLogbook();
    }
}

function clearForm() {
    if (confirm('ล้างข้อมูลฟอร์มปัจจุบัน?')) {
        document.getElementById('partName').value = '';
        document.getElementById('partNumber').value = '';
        document.getElementById('vendor').value = '';
        document.getElementById('model').value = '';
        document.getElementById('totalQty').value = '0';
        document.getElementById('okQty').value = '0';
        document.getElementById('ngQty').value = '0';
        document.getElementById('problemDesc').value = '';
        updateRate();
    }
}

function exportCSV() {
    if (logs.length === 0) { alert('ไม่มีข้อมูลสำหรับส่งออก'); return; }
    let csv = "Date,Time,PartName,PartNumber,Vendor,Model,TotalQty,OKQty,NGQty,DefectRate,Severity,Disposition,Description\n";
    logs.forEach(l => {
        csv += `"${l.dateStr}","${l.timeStr}","${l.partName}","${l.partNumber}","${l.vendor}","${l.model}",${l.totalQty},${l.okQty},${l.ngQty},"${l.defectRate}%","${l.severity}","${l.disposition}","${(l.problemDesc||'').replace(/"/g,'""')}"\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'QA_QC_Logbook_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
}

function renderAnalytics() {
    const container = document.getElementById('analyticsContent');
    if (logs.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:3rem; color:#64748b;">ยังไม่มีข้อมูลสำหรับการวิเคราะห์</div>';
        return;
    }

    // 1. คำนวณ Severity Distribution
    const critCount = logs.filter(l => l.severity === 'Critical').length;
    const majorCount = logs.filter(l => l.severity === 'Major').length;
    const minorCount = logs.filter(l => l.severity === 'Minor').length;
    const totalCount = logs.length;

    const pCrit = ((critCount / totalCount) * 100).toFixed(0);
    const pMajor = ((majorCount / totalCount) * 100).toFixed(0);
    const pMinor = 100 - pCrit - pMajor; // ปัดเศษให้ครบ 100

    // 2. คำนวณ Top Defective Vendors
    // จัดกลุ่มข้อมูลตาม Vendor
    const vendorMap = {};
    logs.forEach(l => {
        if (!vendorMap[l.vendor]) {
            vendorMap[l.vendor] = { name: l.vendor, totalNG: 0, totalInspected: 0 };
        }
        vendorMap[l.vendor].totalNG += l.ngQty;
        vendorMap[l.vendor].totalInspected += l.totalQty;
    });

    // แปลงเป็น Array และหา Defect Rate
    const vendorList = Object.values(vendorMap).map(v => ({
        ...v,
        rate: ((v.totalNG / v.totalInspected) * 100).toFixed(2)
    })).sort((a, b) => b.totalNG - a.totalNG); // เรียงจากเสียมากไปน้อย

    const maxNG = vendorList[0].totalNG; // ค่ามากสุดใช้เทียบความยาว Bar

    // 3. สร้าง HTML
    let html = `
        <!-- Card 1: Severity Distribution -->
        <div class="analytics-card">
            <div class="analytics-card-title">🛡️ สัดส่วนระดับความรุนแรงของข้อบกพร่อง (SEVERITY DISTRIBUTION)</div>
            <div class="severity-stack">
                <div class="sev-bar sev-bar-critical" style="width: ${pCrit}%">${pCrit > 5 ? pCrit+'%' : ''}</div>
                <div class="sev-bar sev-bar-major" style="width: ${pMajor}%">${pMajor > 5 ? pMajor+'%' : ''}</div>
                <div class="sev-bar sev-bar-minor" style="width: ${pMinor}%">${pMinor > 5 ? pMinor+'%' : ''}</div>
            </div>
            <div class="severity-grid">
                <div class="sev-box active-critical">
                    <span class="sev-label" style="color:#fb7185;"><span class="sev-dot" style="background:#f43f5e;"></span>Critical</span>
                    <strong style="font-size:1rem;">${critCount} รายการ</strong>
                </div>
                <div class="sev-box active-major">
                    <span class="sev-label" style="color:#fbbf24;"><span class="sev-dot" style="background:#f59e0b;"></span>Major</span>
                    <strong style="font-size:1rem;">${majorCount} รายการ</strong>
                </div>
                <div class="sev-box active-minor">
                    <span class="sev-label" style="color:#34d399;"><span class="sev-dot" style="background:#10b981;"></span>Minor</span>
                    <strong style="font-size:1rem;">${minorCount} รายการ</strong>
                </div>
            </div>
        </div>

        <!-- Card 2: Top Defective Vendors -->
        <div class="analytics-card">
            <div class="analytics-card-title">🏢 จัดอันดับ SUPPLIER ที่พบงานเสีย (TOP DEFECTIVE VENDORS)</div>
            <div class="vendor-container">
                ${vendorList.map((v, i) => {
                    const barWidth = (v.totalNG / maxNG) * 100;
                    const barClass = i === 0 ? 'bar-top1' : i === 1 ? 'bar-top2' : 'bar-normal';
                    return `
                    <div class="vendor-item">
                        <div class="vendor-info">
                            <div>
                                <span class="vendor-rank">#${i + 1}</span>
                                <span class="vendor-name">${v.name}</span>
                            </div>
                            <div class="vendor-stats">
                                <span class="vendor-ng">${v.totalNG.toLocaleString()} ชิ้นเสีย</span>
                                <span class="vendor-rate">(${v.rate}%)</span>
                            </div>
                        </div>
                        <div class="vendor-progress-bg">
                            <div class="vendor-progress-bar ${barClass}" style="width: ${barWidth}%"></div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function openAiModal() { document.getElementById('aiModal').classList.remove('hidden'); }
function closeAiModal() { document.getElementById('aiModal').classList.add('hidden'); }

function runAiSimulation(mode) {
    const raw = document.getElementById('problemDesc').value || 'ขนาดชิ้นงานคลาดเคลื่อนเกินเกณฑ์';
    const part = document.getElementById('partName').value || 'ชิ้นงาน';
    const box = document.getElementById('aiResultBox');
    box.classList.remove('hidden');
    
    if (mode === 'TH_EN') {
        box.innerHTML = `[TH] ตรวจพบข้อบกพร่องบริเวณ ${part}: ${raw} เกินค่าพิกัดความเผื่อที่กำหนด ต้องดำเนินการตรวจสอบและคัดแยกทันที\n\n[EN] Defect detected on ${part}: ${raw}. Immediate sorting and engineering review required according to IATF 16949 standards.`;
    } else if (mode === 'ROOT_CAUSE') {
        box.innerHTML = `🔬 4M Root Cause Hypothesis for ${part}:\n1. [Machine] Clamping pressure on fixture jig shifted out of calibration.\n2. [Method] Sorting 100% current lot inventory and tag NG items immediately.\n3. [Material] Verify raw material hardness CoC from vendor.`;
    } else {
        box.innerHTML = `🇯🇵 [LINE JP ALERT] Quality Problem Notification\nPart: ${part}\nDefect: ${raw}\nAction: Hold lot & notify supplier immediately.`;
    }
}

// --- ระบบสลับโหมด Dark/Light ---

function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('themeToggle');
    
    // สลับ Class
    body.classList.toggle('light-mode');
    
    // ตรวจสอบสถานะปัจจุบัน
    const isLight = body.classList.contains('light-mode');
    
    // บันทึกค่าลง LocalStorage
    localStorage.setItem('qc_theme', isLight ? 'light' : 'dark');
    
    // อัปเดตไอคอนที่ปุ่ม
    btn.innerText = isLight ? '☀️' : '🌙';
}

// ตรวจสอบค่าที่เคยบันทึกไว้เมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('qc_theme');
    const btn = document.getElementById('themeToggle');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if(btn) btn.innerText = '☀️';
    }
});