// ══════════════════════════════════════════════
// SES SİSTEMİ (Kullanıcı onayı ile)
// ══════════════════════════════════════════════
let sesAktif = false;
let sonVerimlilikSeviyesi = 0;

function sesleriEtkinlestir() {
  sesAktif = true;

  const audio = new Audio();
  audio.play().catch(() => {});

  console.log("✅ Ses sistemi etkinleştirildi");

  const btn = document.getElementById("sesButonu");
  if (btn) btn.style.display = "none";
}

function verimlilikSesiCal(verimlilik) {
  if (!sesAktif) return;

  const esikler = [
    { seviye: 70,  isim: "hafif" },
    { seviye: 85,  isim: "orta"  },
    { seviye: 95,  isim: "guclu" }
  ];

  for (let i = 0; i < esikler.length; i++) {
    const esik = esikler[i];

    if (verimlilik >= esik.seviye && sonVerimlilikSeviyesi < esik.seviye) {
      console.log(`🎉 Alkış sesi çalındı! Seviye: ${esik.isim} (%${verimlilik})`);

      // === KULLANACAĞIMIZ ALKİŞ SESİ ===
      const audio = new Audio("freesound_community-claps-44774.mp3");
      audio.volume = 0.8;
      audio.play().catch(e => console.warn("Ses çalınamadı:", e));

      sonVerimlilikSeviyesi = verimlilik;
      break;
    }
  }
}
// ══════════════════════════════════════════════
// ANA ANDON KODLARI
// ══════════════════════════════════════════════

const GAS_ANDON_URL = "https://script.google.com/macros/s/AKfycby9fGhqzqbZNDyCjQ1R7lKD5aHUw2_TFrgPMyDkoUnOATzjY-3-sRURJw9PqNDPMvQw/exec";
const DUYURU_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZyesQIw-Q0fGlFWyQOx8Ce85D373Nx2YWxEMTO1wzosd-1lLOtC_strxvT94etACZmnMRb-KHkyhm/pub?gid=1868540949&single=true&output=csv";

function el(id) { return document.getElementById(id); }
function setText(id, text) {
  const e = el(id);
  if (e) e.innerText = text;
}

function saatGuncelle() {
  const simdi = new Date();
  setText("andonSaat", simdi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  setText("andonTarih", simdi.toLocaleDateString('tr-TR'));
}

function verileriCek() {
  const script = document.createElement('script');
  script.src = `${GAS_ANDON_URL}?action=getAndonData&callback=uiGuncelle&_t=${Date.now()}`;
  script.onerror = () => {
    console.error("GAS bağlantı hatası!");
    setText("sonGuncelleme", "⚠️ Bağlantı hatası - Yeniden deneniyor...");
  };
  document.body.appendChild(script);
}

function uiGuncelle(data) {
  console.log("Gelen veri:", data);
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
  const verimlilik = d.hedef > 0 ? Math.round((d.gerceklesen / d.hedef) * 100) : 0;
  setText("verimlilikYuzde", "%" + verimlilik);

  const bar = el("verimlilikBar");
  if (bar) {
    bar.style.width = Math.min(verimlilik, 100) + "%";
    bar.style.background = verimlilik >= 90 ? "#4caf50" : verimlilik >= 70 ? "#ffc107" : "#f44336";
  }

  // === ALKİŞ SESİ ===
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
    durusListeEl.innerHTML = `<div class="durus-satir" style="color:#4caf50; border-left-color:#4caf50">✅ Bugün aktif duruş yok</div>`;
  }

  setText("sonGuncelleme", "Son güncelleme: " + new Date().toLocaleTimeString('tr-TR'));
}

async function duyurulariGetir() {
  try {
    const res = await fetch(DUYURU_CSV_URL);
    const text = await res.text();
    const rows = text.split('\n').map(r => r.split(',')[0].trim()).filter(Boolean);
    const duyuruEl = el('duyuruAlani');
    if (duyuruEl) duyuruEl.innerText = rows.join(" ✦ ");
  } catch(e) {
    console.warn("Duyuru çekilemedi", e);
  }
}

// Başlat
document.addEventListener("DOMContentLoaded", () => {
  saatGuncelle();
  setInterval(saatGuncelle, 1000);
  verileriCek();
  setInterval(verileriCek, 30000);
  duyurulariGetir();
  setInterval(duyurulariGetir, 300000);
});
