// BURKAB A.Ş — ANDON PANELİ v2.2 (DÜZELTİLMİŞ)
const GAS_ANDON_URL = "https://script.google.com/macros/s/AKfycbzsjhSGS0scBxVMBgsZH1QoKVmFu39qIHwjI36cw1u0dOiQCcq0vjVyK2gJFZKFmtFX/exec";

const DUYURU_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZyesQIw-Q0fGlFWyQOx8Ce85D373Nx2YWxEMTO1wzosd-1lLOtC_strxvT94etACZmnMRb-KHkyhm/pub?gid=1868540949&single=true&output=csv";

function el(id) { return document.getElementById(id); }

function setText(id, text) {
  const e = el(id);
  if (e) e.innerText = text;
}

// Saat
function saatGuncelle() {
  const simdi = new Date();
  setText("andonSaat", simdi.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit', second:'2-digit'}));
  setText("andonTarih", simdi.toLocaleDateString('tr-TR'));
}

// Veri Çek
function verileriCek() {
  const script = document.createElement('script');
  script.src = `${GAS_ANDON_URL}?action=getAndonData&callback=uiGuncelle&_t=${Date.now()}`;
  document.body.appendChild(script);
}

// UI Güncelle
function uiGuncelle(data) {
  if (!data?.ok || !data.andonData) return;

  const d = data.andonData;

  setText("toplamHedef", (d.hedef || 0).toLocaleString('tr-TR'));
  setText("toplamGerceklesen", (d.gerceklesen || 0).toLocaleString('tr-TR'));
  setText("toplamFire", (d.fire || 0) + " Adet");

  const verimlilik = d.hedef > 0 ? Math.round((d.gerceklesen / d.hedef) * 100) : 0;
  setText("verimlilikYuzde", "%" + verimlilik);

  const bar = el("verimlilikBar");
  if (bar) bar.style.width = Math.min(verimlilik, 100) + "%";

  // Duruşlar
  const arizalar = d.sonArizalar || [];
  const durusListeEl = el("durusListesi");

  if (arizalar.length > 0) {
    setText("aktifDurus", "VAR! (" + arizalar.length + ")");
    el("aktifDurus").style.color = '#f44336';

    if (durusListeEl) {
      durusListeEl.innerHTML = arizalar.map(a => `
        <div class="durus-satir">
          <span class="durus-ikon">⚠️</span>
          <span class="durus-proje">${a.projeNo || ''}</span>
          <span class="durus-makine">${a.makine}</span>
          <span class="durus-ayrac">—</span>
          <span class="durus-neden">${a.neden}</span>
          <span class="durus-saat">${a.saat}</span>
        </div>`).join('');
    }
  } else {
    setText("aktifDurus", "YOK ✓");
    el("aktifDurus").style.color = '#4caf50';
    if (durusListeEl) durusListeEl.innerHTML = '<div class="durus-satir" style="color:#4caf50">✅ Bugün aktif duruş yok</div>';
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
    console.warn("Duyuru hatası", e);
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
