// ══════════════════════════════════════════════
// VERİMLİLİK ALKİŞ SESİ SİSTEMİ (3 Seviye)
// ══════════════════════════════════════════════
let sonVerimlilikSeviyesi = 0;

function verimlilikSesiCal(verimlilik) {
  // Eşik tanımları
  const esikler = [
    { seviye: 70,  isim: "hafif",  dosya: "https://cdn.pixabay.com/audio/2022/03/15/audio_5b0e0e0e2e.mp3" },
    { seviye: 85,  isim: "orta",   dosya: "https://cdn.pixabay.com/audio/2022/03/15/audio_5b0e0e0e2e.mp3" },
    { seviye: 95,  isim: "guclu",  dosya: "https://cdn.pixabay.com/audio/2024/02/20/audio_8f7e5c2e1a.mp3" }
  ];

  for (let i = 0; i < esikler.length; i++) {
    const esik = esikler[i];

    // Eğer bu eşiği geçtiyse ve daha önce geçmediyse ses çal
    if (verimlilik >= esik.seviye && sonVerimlilikSeviyesi < esik.seviye) {
      console.log(`🎉 Alkış sesi çalındı! Seviye: ${esik.isim} (%${verimlilik})`);
      
      const audio = new Audio(esik.dosya);
      audio.volume = 0.6;           // Ses seviyesini ayarla (0.0 - 1.0)
      audio.play().catch(e => console.warn("Ses çalınamadı:", e));
      
      sonVerimlilikSeviyesi = verimlilik;
      break; // Sadece bir ses çalsın
    }
  }
}
// BURKAB A.Ş — ANDON PANELİ v2.3 (Geliştirilmiş)
const GAS_ANDON_URL = "https://script.google.com/macros/s/AKfycby9fGhqzqbZNDyCjQ1R7lKD5aHUw2_TFrgPMyDkoUnOATzjY-3-sRURJw9PqNDPMvQw/exec"; 
// ↑↑↑ YUKARIDAKİ URL'Yİ YENİ DEPLOY URL'Sİ İLE DEĞİŞTİR ↑↑↑

const DUYURU_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZyesQIw-Q0fGlFWyQOx8Ce85D373Nx2YWxEMTO1wzosd-1lLOtC_strxvT94etACZmnMRb-KHkyhm/pub?gid=1868540949&single=true&output=csv";

function el(id) { return document.getElementById(id); }
function setText(id, text) {
  const e = el(id);
  if (e) e.innerText = text;
}

// Saat
function saatGuncelle() {
  const simdi = new Date();
  setText("andonSaat", simdi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  setText("andonTarih", simdi.toLocaleDateString('tr-TR'));
}

// Ana veri çekme
function verileriCek() {
  const script = document.createElement('script');
  script.src = `${GAS_ANDON_URL}?action=getAndonData&callback=uiGuncelle&_t=${Date.now()}`;
  
  script.onerror = () => {
    console.error("GAS bağlantı hatası!");
    setText("sonGuncelleme", "⚠️ Bağlantı hatası - Yeniden deneniyor...");
  };
  
  document.body.appendChild(script);
}

// UI Güncelleme
function uiGuncelle(data) {
  console.log("Gelen veri:", data); // Debug için

  if (!data || !data.ok || !data.andonData) {
    console.warn("Veri alınamadı veya hatalı:", data);
    setText("sonGuncelleme", "⚠️ Veri alınamadı");
    return;
  }

  const d = data.andonData;

  // Metrikler
  setText("toplamHedef", (d.hedef || 0).toLocaleString('tr-TR'));
  setText("toplamGerceklesen", (d.gerceklesen || 0).toLocaleString('tr-TR'));
  setText("toplamFire", (d.fire || 0) + " Adet");

  // Verimlilik
  // === VERİMLİLİK HESAPLA ===
const verimlilik = d.hedef > 0 ? Math.round((d.gerceklesen / d.hedef) * 100) : 0;
setText("verimlilikYuzde", "%" + verimlilik);

const bar = el("verimlilikBar");
if (bar) {
  bar.style.width = Math.min(verimlilik, 100) + "%";
  bar.style.background = verimlilik >= 90 ? "#4caf50" : verimlilik >= 70 ? "#ffc107" : "#f44336";
}

// === ALKİŞ SESİ (Verimlilik eşiği geçtiyse çal) ===
verimlilikSesiCal(verimlilik);
  // Duruşlar
  const arizalar = d.sonArizalar || [];
  const durusListeEl = el("durusListesi");

  if (arizalar.length > 0) {
    setText("aktifDurus", `VAR! (${arizalar.length})`);
    el("aktifDurus").style.color = '#f44336';

   durusListeEl.innerHTML = arizalar.map(a => {
  const projeMakine = a.projeNo && a.projeNo !== '-' 
    ? `${a.projeNo} - ${a.makine}` 
    : a.makine;

  return `
    <div class="durus-satir">
      <span class="durus-ikon">⚠️</span>
      <span class="durus-proje-makine">${projeMakine}</span>
      <span class="durus-ayrac">—</span>
      <span class="durus-neden">${a.neden}</span>
      <span class="durus-saat">${a.saat}</span>
    </div>
  `;
}).join('');
  } else {
    setText("aktifDurus", "YOK ✓");
    el("aktifDurus").style.color = '#4caf50';
    if (durusListeEl) {
      durusListeEl.innerHTML = `<div class="durus-satir" style="color:#4caf50; border-left-color:#4caf50">✅ Bugün aktif duruş yok</div>`;
    }
  }

  setText("sonGuncelleme", "Son güncelleme: " + new Date().toLocaleTimeString('tr-TR'));
}

// Duyurular
async function duyurulariGetir() {
  try {
    const res = await fetch(DUYURU_CSV_URL);
    const text = await res.text();
    const rows = text.split('\n').map(r => r.split(',')[0].trim()).filter(Boolean);
    const duyuruEl = el('duyuruAlani');
    if (duyuruEl) duyuruEl.innerText = rows.join("  ✦  ");
  } catch(e) {
    console.warn("Duyuru çekilemedi", e);
  }
}

// Başlat
document.addEventListener("DOMContentLoaded", () => {
  saatGuncelle();
  setInterval(saatGuncelle, 1000);

  verileriCek();
  setInterval(verileriCek, 30000); // 30 saniyede bir yenile

  duyurulariGetir();
  setInterval(duyurulariGetir, 300000);
});
