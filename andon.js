<script>
// ═══════════════════════════════════════════════════════════
// BURKAB A.Ş — ANDON PANELİ v2.1 (DÜZELTİLMİŞ)
const GAS_ANDON_URL = "https://script.google.com/macros/s/AKfycbwEVMFwH7IqIjFUMw5E9tiBwU_KXOv5nWP874v2_1woFQHBqz1TcfbymAOuITNzlzuT/exec"; 
// ← Yukarıdaki URL'yi kendi deploy URL'nizle değiştirin!

const DUYURU_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZyesQIw-Q0fGlFWyQOx8Ce85D373Nx2YWxEMTO1wzosd-1lLOtC_strxvT94etACZmnMRb-KHkyhm/pub?gid=1868540949&single=true&output=csv";

function el(id) { return document.getElementById(id); }
function setText(id, text) {
  const e = el(id); if (e) e.innerText = text;
}

function saatGuncelle() {
  const simdi = new Date();
  setText("andonSaat", simdi.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit', second:'2-digit'}));
  setText("andonTarih", simdi.toLocaleDateString('tr-TR'));
}

function verileriCek() {
  document.querySelectorAll('script[data-andon]').forEach(s => s.remove());
  const script = document.createElement('script');
  script.setAttribute('data-andon', '1');
  script.src = `${GAS_ANDON_URL}?action=getAndonData&callback=uiGuncelle&_t=${Date.now()}`;
  script.onerror = baglantiHatasi;
  const timeout = setTimeout(baglantiHatasi, 20000);
  window._andonTimeout = timeout;
  document.body.appendChild(script);
}

function baglantiHatasi() {
  clearTimeout(window._andonTimeout);
  const durum = el('baglantiDurum');
  if (durum) {
    durum.style.display = 'block';
    durum.innerText = '⚠️ GAS bağlantısı bekleniyor... Son güncelleme: ' + new Date().toLocaleTimeString('tr-TR');
  }
}

function uiGuncelle(data) {
  clearTimeout(window._andonTimeout);
  const durum = el('baglantiDurum');
  if (durum) durum.style.display = 'none';

  if (!data?.ok || !data.andonData) {
    baglantiHatasi();
    return;
  }

  const d = data.andonData;
  const arizalar = d.sonArizalar || [];

  setText("toplamHedef", (d.hedef || 0).toLocaleString('tr-TR'));
  setText("toplamGerceklesen", (d.gerceklesen || 0).toLocaleString('tr-TR'));
  setText("toplamFire", (d.fire || 0) + " Adet");

  const verimlilik = d.hedef > 0 ? Math.round((d.gerceklesen / d.hedef) * 100) : 0;
  setText("verimlilikYuzde", "%" + verimlilik);

  const verimEl = el("verimlilikYuzde");
  if (verimEl) {
    verimEl.className = "metrik-deger " + 
      (verimlilik >= 90 ? "text-success" : verimlilik >= 70 ? "text-warning" : "text-danger");
  }

  const bar = el("verimlilikBar");
  if (bar) {
    bar.style.width = Math.min(verimlilik, 100) + "%";
    bar.className = "progress-bar " + 
      (verimlilik >= 90 ? "bg-success" : verimlilik >= 70 ? "bg-warning" : "bg-danger");
  }

  const durusListeEl = el("durusListesi");
  if (arizalar.length > 0) {
    setText("aktifDurus", "VAR!");
    const aktifEl = el("aktifDurus");
    aktifEl.className = "text-danger fw-bold";
    aktifEl.style.animation = "yanipSonme 0.8s infinite";

    if (durusListeEl) {
      durusListeEl.innerHTML = arizalar.map(a => `
        <div class="durus-satir">
          <span class="durus-ikon">⚠️</span>
          <span class="durus-makine">${a.makine}</span>
          <span class="durus-ayrac">—</span>
          <span class="durus-neden">${a.neden}</span>
          <span class="durus-projeNo">${a.projeNo}</span>
          <span class="durus-saat">${a.saat}</span>
        </div>
      `).join('');
    }
    el('durusPaneli').classList.add('aktif-durus');
  } else {
    setText("aktifDurus", "YOK");
    const aktifEl = el("aktifDurus");
    aktifEl.className = "text-success fw-bold";
    aktifEl.style.animation = "";
    if (durusListeEl) {
      durusListeEl.innerHTML = '<div class="durus-satir text-success">✅ Aktif duruş bulunmuyor</div>';
    }
    el('durusPaneli').classList.remove('aktif-durus');
  }

  setText("sonGuncelleme", "Son güncelleme: " + new Date().toLocaleTimeString('tr-TR'));
}

async function duyurulariGetir() {
  try {
    const response = await fetch(DUYURU_CSV_URL);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.text();
    const rows = data.split('\n');
    const duyurular = rows.map(row => row.split(',')[0].trim())
      .filter(text => text && text !== 'Duyuru' && text !== 'DUYURU')
      .join(" ✦ ");

    const duyuruEl = el('duyuruAlani');
    if (duyuruEl) duyuruEl.innerText = duyurular || "BURKAB A.Ş. — Üretim Yönetim Sistemi";
  } catch (e) {
    console.warn("Duyuru hatası:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  saatGuncelle();
  setInterval(saatGuncelle, 1000);
  verileriCek();
  setInterval(verileriCek, 30000);
  duyurulariGetir();
  setInterval(duyurulariGetir, 300000);
});
</script>
