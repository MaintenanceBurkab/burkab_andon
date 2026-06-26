// ═══════════════════════════════════════════════════════════
// BURKAB A.Ş — ANDON PANELİ  v2.0
// Düzeltmeler:
//  • verimlilikBar → null-safe (HTML'de yoksa hata vermez)
//  • arizaKaydirici → null-safe (artık duyuruAlani'na yazar)
//  • Duruş listesi ayrı bir panelde gösteriliyor
//  • GAS URL: üretim modülüyle AYNI URL kullanılıyor
//  • Hata durumunda ekran "Bağlantı bekleniyor..." gösteriyor
// ═══════════════════════════════════════════════════════════

// ⚠️ ÖNEMLİ: Bu URL üretim modülündeki GS_URL ile AYNI olmalı.
// Sheets → Uzantılar → Apps Script → Dağıt → Dağıtımları Yönet
// → Mevcut deploy URL'sini kopyala ve buraya yapıştır.
const GAS_ANDON_URL = "https://script.google.com/macros/s/AKfycbwEVMFwH7IqIjFUMw5E9tiBwU_KXOv5nWP874v2_1woFQHBqz1TcfbymAOuITNzlzuT/exec";

// Duyuru CSV linki (Google Sheets → Dosya → Paylaş → Web'de Yayımla → CSV)
const DUYURU_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZyesQIw-Q0fGlFWyQOx8Ce85D373Nx2YWxEMTO1wzosd-1lLOtC_strxvT94etACZmnMRb-KHkyhm/pub?gid=1868540949&single=true&output=csv";

// ── Yardımcı: null-safe getElementById ──────────────────────
function el(id) {
  return document.getElementById(id);
}
function setText(id, text) {
  const e = el(id);
  if (e) e.innerText = text;
}
function setHtml(id, html) {
  const e = el(id);
  if (e) e.innerHTML = html;
}

// ════════════════════════════════════════════════════════════
// 1. SAAT MOTORU — Her saniye güncellenir
// ════════════════════════════════════════════════════════════
function saatGuncelle() {
  const simdi = new Date();
  setText("andonSaat", simdi.toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }));
  setText("andonTarih", simdi.toLocaleDateString('tr-TR'));
}

// ════════════════════════════════════════════════════════════
// 2. VERİ ÇEKME — Her 30 saniyede Google Sheets'ten veri çeker
// ════════════════════════════════════════════════════════════
function verileriCek() {
  // Eski script tag'larını temizle (bellek birikimine karşı)
  document.querySelectorAll('script[data-andon]').forEach(s => s.remove());

  const script = document.createElement('script');
  script.setAttribute('data-andon', '1');
  script.src = `${GAS_ANDON_URL}?action=getAndonData&callback=uiGuncelle&_t=${Date.now()}`;

  script.onerror = () => {
    console.warn('Andon: GAS bağlantısı başarısız');
    baglantiHatasi();
  };

  // 20 saniye içinde yanıt gelmezse hata göster
  const timeout = setTimeout(() => {
    baglantiHatasi();
    script.remove();
  }, 20000);

  // Orijinal callback'i wrap et (timeout'u temizlemek için)
  const orijinalCallback = window.uiGuncelle;
  window._andonTimeout = timeout;

  document.body.appendChild(script);
}

function baglantiHatasi() {
  clearTimeout(window._andonTimeout);
  const durum = el('baglantiDurum');
  if (durum) {
    durum.style.display = 'block';
    durum.innerText = '⚠️ GAS bağlantısı bekleniyor... Son güncelleme: ' +
      new Date().toLocaleTimeString('tr-TR');
  }
}

// ════════════════════════════════════════════════════════════
// 3. EKRAN GÜNCELLEME — GAS'tan gelen verilerle ekranı doldurur
// ════════════════════════════════════════════════════════════
function uiGuncelle(data) {
  clearTimeout(window._andonTimeout);

  // Bağlantı durum mesajını gizle
  const durum = el('baglantiDurum');
  if (durum) durum.style.display = 'none';

  if (!data || !data.ok) {
    console.warn('Andon: GAS ok:false veya boş veri', data);
    baglantiHatasi();
    return;
  }

  const d = data.andonData;
  if (!d) { console.warn('Andon: andonData alanı yok'); return; }

  // ── Üretim metrikleri ─────────────────────────────────
  setText("toplamHedef",      (d.hedef      || 0).toLocaleString('tr-TR'));
  setText("toplamGerceklesen",(d.gerceklesen || 0).toLocaleString('tr-TR'));
  setText("toplamFire",       (d.fire        || 0) + " Adet");

  // ── Verimlilik ────────────────────────────────────────
  const verimlilik = d.hedef > 0
    ? Math.round((d.gerceklesen / d.hedef) * 100)
    : 0;

  setText("verimlilikYuzde", "%" + verimlilik);

  // Renk: kırmızı < 70, sarı 70-89, yeşil 90+
  const verimEl = el("verimlilikYuzde");
  if (verimEl) {
    verimEl.className = "huge-number " +
      (verimlilik >= 90 ? "text-success" :
       verimlilik >= 70 ? "text-warning" : "text-danger");
  }

  // Progress bar (null-safe)
  const bar = el("verimlilikBar");
  if (bar) {
    bar.style.width = Math.min(verimlilik, 100) + "%";
    bar.className = "progress-bar " +
      (verimlilik >= 90 ? "bg-success" :
       verimlilik >= 70 ? "bg-warning" : "bg-danger");
  }

  // ── Duruşlar ──────────────────────────────────────────
  const arizalar = d.sonArizalar || [];

  if (arizalar.length > 0) {
    // Aktif duruş var
    setText("aktifDurus", "VAR!");
    const aktifEl = el("aktifDurus");
    if (aktifEl) {
      aktifEl.className = "text-danger fw-bold";
      aktifEl.style.animation = "yanipSonme 0.8s infinite";
    }

    // Duruş listesini güncelle
    const durusListeEl = el("durusListesi");
    if (durusListeEl) {
      durusListeEl.innerHTML = arizalar.map(a =>
        `<div class="durus-satir">
          <span class="durus-ikon">⚠️</span>
          <span class="durus-makine">${a.makine || '-'}</span>
          <span class="durus-ayrac">—</span>
          <span class="durus-neden">${a.neden || '-'}</span>
          <span class="durus-ayrac">—</span>
          <span class="durus-projeno">${a.projeno || '-'}</span>
          <span class="durus-saat">${a.saat || ''}</span>
        </div>`
      ).join('');
      durusListeEl.style.display = 'block';
      el('durusPaneli')?.classList.add('aktif-durus');
    }

    // Alt kayan yazıya da yaz (duyuruAlani varsa)
    const duyuruEl = el("duyuruAlani");
    if (duyuruEl && arizalar.length > 0) {
      const arizaMesaj = "🚨 AKTİF DURUŞ: " +
        arizalar.map(a => `${a.makine} — ${a.neden}`).join(" | ");
      // Duruş mesajını başa ekle
      const mevcutDuyuru = duyuruEl._mevcutDuyuru || "";
      duyuruEl.innerText = arizaMesaj + (mevcutDuyuru ? " ✦ " + mevcutDuyuru : "");
    }

    // Eski arizaKaydirici (geriye dönük uyumluluk, null-safe)
    const kaydirici = el("arizaKaydirici");
    if (kaydirici) {
      kaydirici.innerText = arizalar.map(a => `⚠️ ${a.makine} - ${a.neden}`).join(" | ");
    }

  } else {
    // Aktif duruş yok
    setText("aktifDurus", "YOK");
    const aktifEl = el("aktifDurus");
    if (aktifEl) {
      aktifEl.className = "text-success fw-bold";
      aktifEl.style.animation = "";
    }

    const durusListeEl = el("durusListesi");
    if (durusListeEl) {
      durusListeEl.innerHTML =
        '<div class="durus-satir text-success">✅ Aktif duruş bulunmuyor</div>';
    }
    el('durusPaneli')?.classList.remove('aktif-durus');
  }

  // Son güncelleme zamanı
  setText("sonGuncelleme",
    "Son güncelleme: " + new Date().toLocaleTimeString('tr-TR'));

  console.log('✅ Andon güncellendi:', {
    hedef: d.hedef,
    gerceklesen: d.gerceklesen,
    fire: d.fire,
    verimlilik,
    durusSayisi: arizalar.length
  });
}

// ════════════════════════════════════════════════════════════
// 4. DUYURULAR — CSV'den çeker, kayan yazıya yazar
// ════════════════════════════════════════════════════════════
async function duyurulariGetir() {
  try {
    const response = await fetch(DUYURU_CSV_URL);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.text();
    const rows = data.split('\n');
    const duyurular = rows
      .map(row => row.split(',')[0].trim())
      .filter(text => text && text !== 'Duyuru' && text !== 'DUYURU')
      .join(" ✦ ");

    const duyuruEl = el('duyuruAlani');
    if (duyuruEl) {
      duyuruEl._mevcutDuyuru = duyurular;
      if (duyurular) duyuruEl.innerText = duyurular;
    }
  } catch (error) {
    console.warn("Duyurular yüklenemedi:", error.message);
    const duyuruEl = el('duyuruAlani');
    if (duyuruEl && !duyuruEl.innerText.includes('BURKAB')) {
      duyuruEl.innerText = "BURKAB A.Ş. — Üretim Takip Sistemi";
    }
  }
}

// ════════════════════════════════════════════════════════════
// BAŞLATMA
// ════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  saatGuncelle();
  setInterval(saatGuncelle, 1000);       // Saat: her saniye
  verileriCek();
  setInterval(verileriCek, 30000);       // Veri: her 30 saniye
  duyurulariGetir();
  setInterval(duyurulariGetir, 300000);  // Duyuru: her 5 dakika
});
