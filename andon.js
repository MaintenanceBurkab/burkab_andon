// ═══════════════════════════════════════════════════════════════
// BURKAB A.Ş — ANDON PANELİ  v2.1
// Düzeltmeler:
//  ✅ GAS URL: üretim modülüyle AYNI URL (v5.3 deploy)
//  ✅ verimlilikBar → null-safe (HTML'de yoksa crash olmaz)
//  ✅ arizaKaydirici → null-safe
//  ✅ ProjeNo artık sonArizalar'da gösteriliyor
//  ✅ Duruş gösterimi: durusListesi paneline yazar
//  ✅ Hata durumunda ekran bildirim verir, crash olmaz
// ═══════════════════════════════════════════════════════════════

// ⚠️ Bu URL üretim modülündeki GS_URL ile AYNI olmalı
const GAS_ANDON_URL = "https://script.google.com/macros/s/AKfycbzsjhSGS0scBxVMBgsZH1QoKVmFu39qIHwjI36cw1u0dOiQCcq0vjVyK2gJFZKFmtFX/exec";

const DUYURU_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZyesQIw-Q0fGlFWyQOx8Ce85D373Nx2YWxEMTO1wzosd-1lLOtC_strxvT94etACZmnMRb-KHkyhm/pub?gid=1868540949&single=true&output=csv";

// Null-safe yardımcılar
function el(id) { return document.getElementById(id); }
function setText(id, text) { const e = el(id); if (e) e.innerText = text; }

// ── 1. SAAT ──────────────────────────────────────────────────
function saatGuncelle() {
  const simdi = new Date();
  setText("andonSaat", simdi.toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }));
  setText("andonTarih", simdi.toLocaleDateString('tr-TR'));
}

// ── 2. VERİ ÇEKME ────────────────────────────────────────────
function verileriCek() {
  document.querySelectorAll('script[data-andon]').forEach(s => s.remove());
  const script = document.createElement('script');
  script.setAttribute('data-andon', '1');
  script.src = `${GAS_ANDON_URL}?action=getAndonData&callback=uiGuncelle&_t=${Date.now()}`;
  script.onerror = () => {
    console.warn('Andon: GAS bağlantısı başarısız');
    setText('baglantiDurum', '⚠️ GAS bağlantısı kurulamadı — ' + new Date().toLocaleTimeString('tr-TR'));
    const bd = el('baglantiDurum');
    if (bd) bd.style.display = 'block';
  };
  window._andonTimer = setTimeout(() => {
    const bd = el('baglantiDurum');
    if (bd) { bd.style.display = 'block'; bd.innerText = '⏳ GAS yanıt bekleniyor...'; }
  }, 8000);
  document.body.appendChild(script);
}

// ── 3. EKRAN GÜNCELLEME ──────────────────────────────────────
function uiGuncelle(data) {
  clearTimeout(window._andonTimer);
  const bd = el('baglantiDurum');
  if (bd) bd.style.display = 'none';

  if (!data || !data.ok || !data.andonData) {
    console.warn('Andon: Geçersiz veri', data);
    return;
  }

  const d = data.andonData;

  // Üretim sayıları
  setText("toplamHedef",       (d.hedef       || 0).toLocaleString('tr-TR'));
  setText("toplamGerceklesen", (d.gerceklesen  || 0).toLocaleString('tr-TR'));
  setText("toplamFire",        (d.fire         || 0) + " Adet");

  // Verimlilik
  const verimlilik = d.hedef > 0 ? Math.round((d.gerceklesen / d.hedef) * 100) : 0;
  setText("verimlilikYuzde", "%" + verimlilik);

  const verimEl = el("verimlilikYuzde");
  if (verimEl) {
    verimEl.style.color = verimlilik >= 90 ? '#4caf50' : verimlilik >= 70 ? '#ff9800' : '#f44336';
  }

  // Progress bar (null-safe)
  const bar = el("verimlilikBar");
  if (bar) {
    bar.style.width = Math.min(verimlilik, 100) + "%";
    bar.className = "progress-bar " +
      (verimlilik >= 90 ? "bg-success" : verimlilik >= 70 ? "bg-warning" : "bg-danger");
  }

  // Son güncelleme
  setText("sonGuncelleme", "Son güncelleme: " + new Date().toLocaleTimeString('tr-TR'));

  // ── Duruşlar ─────────────────────────────────────────────
  const arizalar = d.sonArizalar || [];

  if (arizalar.length > 0) {
    setText("aktifDurus", "VAR! (" + arizalar.length + ")");
    const aktifEl = el("aktifDurus");
    if (aktifEl) {
      aktifEl.style.color = '#f44336';
      aktifEl.style.animation = 'yanipSonme 0.8s infinite';
    }

    // Duruş listesi paneli
    const durusListeEl = el("durusListesi");
    if (durusListeEl) {
      durusListeEl.innerHTML = arizalar.map(a => `
        <div class="durus-satir">
          <span class="durus-ikon">⚠️</span>
          <span class="durus-proje">${a.projeNo || ''}</span>
          <span class="durus-makine">${a.makine  || '-'}</span>
          <span class="durus-ayrac">—</span>
          <span class="durus-neden">${a.neden   || '-'}</span>
          <span class="durus-sure">${a.sure ? a.sure + ' dk' : ''}</span>
          <span class="durus-saat">${a.saat    || ''}</span>
        </div>`).join('');
    }

    // Duruş paneli kırmızı kenarlık
    const panel = el('durusPaneli');
    if (panel) {
      panel.style.borderColor = '#f44336';
      panel.style.boxShadow = '0 0 20px rgba(244,67,54,0.4)';
    }

    // Kayan yazı (null-safe)
    const kaydirici = el("arizaKaydirici");
    if (kaydirici) {
      kaydirici.innerText = arizalar.map(a =>
        `⚠️ ${a.projeNo ? '[' + a.projeNo + '] ' : ''}${a.makine} — ${a.neden}`
      ).join("  ✦  ");
    }

    // duyuruAlani'na duruş bilgisi ekle
    const duyuruEl = el("duyuruAlani");
    if (duyuruEl) {
      const arizaMesaj = "🚨 AKTİF DURUŞ: " +
        arizalar.map(a => `${a.projeNo ? '[' + a.projeNo + '] ' : ''}${a.makine} — ${a.neden}${a.sure ? ' (' + a.sure + ' dk)' : ''}`).join(" | ");
      duyuruEl.innerText = arizaMesaj + (duyuruEl._sabitDuyuru ? "  ✦  " + duyuruEl._sabitDuyuru : "");
    }

  } else {
    setText("aktifDurus", "YOK ✓");
    const aktifEl = el("aktifDurus");
    if (aktifEl) {
      aktifEl.style.color = '#4caf50';
      aktifEl.style.animation = '';
    }

    const durusListeEl = el("durusListesi");
    if (durusListeEl) {
      durusListeEl.innerHTML =
        '<div class="durus-satir" style="color:#4caf50;border-left-color:#4caf50">✅ Bugün aktif duruş bulunmuyor</div>';
    }

    const panel = el('durusPaneli');
    if (panel) {
      panel.style.borderColor = '#2a2a35';
      panel.style.boxShadow = 'none';
    }

    // Duyuruya geri dön
    const duyuruEl = el("duyuruAlani");
    if (duyuruEl && duyuruEl._sabitDuyuru) {
      duyuruEl.innerText = duyuruEl._sabitDuyuru;
    }
  }

  console.log('✅ Andon güncellendi:', { hedef: d.hedef, gerceklesen: d.gerceklesen, fire: d.fire, verimlilik, durusSayisi: arizalar.length });
}

// ── 4. DUYURULAR ─────────────────────────────────────────────
async function duyurulariGetir() {
  try {
    const response = await fetch(DUYURU_CSV_URL);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.text();
    const rows = data.split('\n');
    const duyurular = rows
      .map(row => row.split(',')[0].trim())
      .filter(text => text && text.toLowerCase() !== 'duyuru' && text.length > 2)
      .join("  ✦  ");

    const duyuruEl = el('duyuruAlani');
    if (duyuruEl && duyurular) {
      duyuruEl._sabitDuyuru = duyurular;
      duyuruEl.innerText = duyurular;
    }
  } catch (err) {
    console.warn("Duyurular yüklenemedi:", err.message);
    const duyuruEl = el('duyuruAlani');
    if (duyuruEl) {
      duyuruEl._sabitDuyuru = "BURKAB A.Ş. — Üretim Takip Sistemi v5.3";
      duyuruEl.innerText = duyuruEl._sabitDuyuru;
    }
  }
}

// ── BAŞLATMA ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  saatGuncelle();
  setInterval(saatGuncelle,  1000);    // Saat: her saniye
  verileriCek();
  setInterval(verileriCek,   30000);   // Veri: her 30 saniye
  duyurulariGetir();
  setInterval(duyurulariGetir, 300000); // Duyuru: her 5 dakika
});
