// ==================== ANDON.JS v5.4 ====================

const GAS_ANDON_URL = "https://script.google.com/macros/s/AKfycby4eZt-0FFLSYMNNwZO4pVVx5YV-DY3DhsFddk2ZAzFQHod9i50QOR6Z8k436K5IBgi/exec";

// === SES SİSTEMİ ===
let sesAktif = false;

// Ses Butonu
function sesButonuOlustur() {
  if (document.getElementById("sesButonu")) return;

  const btn = document.createElement("button");
  btn.id = "sesButonu";
  btn.innerHTML = `<i class="fa-solid fa-volume-up"></i> Sesleri Aç`;
  btn.style.cssText = `position:fixed; bottom:18px; right:18px; z-index:99999; background:#f5c400; color:#000; border:none; padding:12px 20px; border-radius:9999px; font-weight:700; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.3);`;

  btn.onclick = () => {
    sesAktif = !sesAktif;
    btn.innerHTML = sesAktif 
      ? `<i class="fa-solid fa-volume-up"></i> Sesleri Kapat` 
      : `<i class="fa-solid fa-volume-mute"></i> Sesleri Aç`;
  };

  document.body.appendChild(btn);
}

// ==================== VERİ ÇEKME ====================

function verileriCek() {
  const url = `${GAS_ANDON_URL}?action=getAndonData&callback=uiGuncelle&_t=${Date.now()}`;
  
  const script = document.createElement('script');
  script.src = url;
  script.onerror = () => {
    console.error("Andon verisi çekilemedi");
  };
  document.body.appendChild(script);
}

// ==================== TAKIM GÜNCELLEME ====================

function guncelleTakimlar(takimlar) {
  const container = document.getElementById("takimContainer");
  if (!container) return;

  container.innerHTML = "";

  takimlar.forEach(t => {
    const card = document.createElement("div");
    card.className = `team-card rounded-2xl p-3.5`;

    let renk = t.verim >= 85 ? "emerald" : t.verim >= 70 ? "amber" : "red";

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <div class="text-sm font-bold">${t.ad}</div>
          <div class="text-xs text-[#666]">${t.takim}</div>
        </div>
        <div class="text-right">
          <span class="text-2xl font-black text-${renk}-400">${t.verim}</span>
          <span class="text-${renk}-400 text-sm">%</span>
        </div>
      </div>
      <div class="h-1.5 bg-[#222230] rounded mt-2.5">
        <div class="h-1.5 bg-${renk}-400 rounded" style="width:${t.verim}%"></div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ==================== VERİ GÜNCELLEME ====================

function uiGuncelle(data) {
  if (!data || !data.ok || !data.andonData) {
    console.warn("Gelen veri hatalı:", data);
    return;
  }

  const d = data.andonData;

  // KPI Güncelle
  const hedefEl = document.getElementById("toplamHedef");
  const gerceklesenEl = document.getElementById("toplamGerceklesen");
  const fireEl = document.getElementById("toplamFire");
  const verimEl = document.getElementById("verimlilikYuzde");
  const barEl = document.getElementById("verimlilikBar");

  if (hedefEl) hedefEl.innerText = (d.hedef || 0).toLocaleString("tr-TR");
  if (gerceklesenEl) gerceklesenEl.innerText = (d.gerceklesen || 0).toLocaleString("tr-TR");
  if (fireEl) fireEl.innerText = (d.fire || 0) + " Adet";

  const verim = d.verimlilik || (d.hedef > 0 ? Math.round((d.gerceklesen / d.hedef) * 100) : 0);
  
  if (verimEl) verimEl.innerText = verim + "%";
  if (barEl) {
    barEl.style.width = verim + "%";
    barEl.style.background = verim >= 90 ? "#4caf50" : verim >= 70 ? "#f59e0b" : "#ef4444";
  }

  // Takımları güncelle
  if (d.takimlar && d.takimlar.length > 0) {
    guncelleTakimlar(d.takimlar);
  }

  console.log("%c[Andon] Veri güncellendi", "color:#854d0e");
}

// ==================== BAŞLAT ====================

function init() {
  sesButonuOlustur();

  // Saat
  setInterval(() => {
    const now = new Date();
    const saatEl = document.getElementById("andonSaat");
    const tarihEl = document.getElementById("andonTarih");
    if (saatEl) saatEl.innerText = now.toLocaleTimeString("tr-TR", { hour12: false });
    if (tarihEl) tarihEl.innerText = now.toLocaleDateString("tr-TR");
  }, 1000);

  // İlk veri çek
  verileriCek();

  // 30 saniyede bir otomatik yenile
  setInterval(verileriCek, 30000);

  console.log("%c[Andon v5.4] Panel başlatıldı", "color:#854d0e");
}

window.onload = init;
