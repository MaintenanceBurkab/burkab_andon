// ==================== ANDON.JS v5.4 (Sesli) ====================

const GAS_ANDON_URL = "https://script.google.com/macros/s/AKfycbziQIL_Zxqh4X1bv_hQhmTOUCXqc00rEIEcowfD6ST8GSoiVrgp0kTVqBn19nFCGy4C/exec";
const DUYURU_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZyesQIw-Q0fGlFWyQOx8Ce85D373Nx2YWxEMTO1wzosd-1lLOtC_strxvT94etACZmnMRb-KHkyhm/pub?gid=1868540949&single=true&output=csv";

// === SES SİSTEMİ ===
let sesAktif = false;
let sonVerimlilikSeviyesi = 0;
let oncekiDurusFormNoList = [];

// Base64 Sesler (Önceki sürümden alındı)
const ALKIS_BASE64 = "BURAYA_BASE64_ALKIS_SESI";   // ← Buraya önceki dosyadaki ALKIS_BASE64'yi yapıştır
const UYARI_BASE64 = "BURAYA_BASE64_UYARI_SESI";   // ← Buraya önceki dosyadaki UYARI_BASE64'yi yapıştır

function oynatSes(base64) {
  if (!sesAktif || !base64 || base64.includes("BURAYA")) return;
  try {
    const audio = new Audio("data:audio/mp3;base64," + base64);
    audio.volume = 0.85;
    audio.play().catch(() => {});
  } catch (e) {}
}

function oynatAlkisSesi() {
  oynatSes(ALKIS_BASE64);
}

function oynatDurusUyariSesi() {
  oynatSes(UYARI_BASE64);
}

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
    if (sesAktif) oynatSes(ALKIS_BASE64);
  };

  document.body.appendChild(btn);
}

function verimlilikSesiCal(yeniVerim) {
  if (!sesAktif) return;

  const esikler = [70, 85, 95];
  for (let esik of esikler) {
    if (yeniVerim >= esik && sonVerimlilikSeviyesi < esik) {
      oynatAlkisSesi();
      sonVerimlilikSeviyesi = yeniVerim;
      break;
    }
  }
}

// ==================== ANA FONKSİYONLAR ====================

function guncelleTakimlar(takimlar) {
  const container = document.getElementById("takimContainer");
  container.innerHTML = "";

  takimlar.forEach(t => {
    const card = document.createElement("div");
    card.className = "team-card rounded-2xl p-3.5";

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

function guncelleDuyuru(metin) {
  const el = document.getElementById("duyuruAlani");
  if (el) el.innerHTML = metin + "&nbsp;&nbsp;&nbsp;&nbsp;" + metin;
}

function uiGuncelle(data) {
  if (!data || !data.ok) return;

  const d = data.andonData;

  // KPI Güncelle
  document.getElementById("toplamHedef").innerText = (d.hedef || 0).toLocaleString("tr-TR");
  document.getElementById("toplamGerceklesen").innerText = (d.gerceklesen || 0).toLocaleString("tr-TR");
  document.getElementById("toplamFire").innerText = (d.fire || 0) + " Adet";

  const verim = d.hedef > 0 ? Math.round((d.gerceklesen / d.hedef) * 100) : 0;
  document.getElementById("verimlilikYuzde").innerText = verim + "%";

  const bar = document.getElementById("verimlilikBar");
  if (bar) {
    bar.style.width = verim + "%";
    bar.style.background = verim >= 90 ? "#4caf50" : verim >= 70 ? "#f59e0b" : "#ef4444";
  }

  verimlilikSesiCal(verim);

  // Takımlar
  if (d.takimlar && d.takimlar.length > 0) {
    guncelleTakimlar(d.takimlar);
  }

  // Duruşlar
  const arizalar = d.sonArizalar || [];
  const yeniDurus = arizalar.some(a => !oncekiDurusFormNoList.includes(a.formNo));

  if (yeniDurus) oynatDurusUyariSesi();

  oncekiDurusFormNoList = arizalar.map(a => a.formNo);

  // Duruş listesi (kısaca)
  const liste = document.getElementById("durusListesi");
  if (arizalar.length > 0) {
    document.getElementById("aktifDurus").innerHTML = `VAR! (${arizalar.length})`;
    // ... (duruş satırlarını buraya ekleyebilirsin)
  }
}

// ==================== BAŞLAT ====================

function init() {
  sesButonuOlustur();

  // Saat
  setInterval(() => {
    const now = new Date();
    document.getElementById("andonSaat").innerText = now.toLocaleTimeString("tr-TR", { hour12: false });
    document.getElementById("andonTarih").innerText = now.toLocaleDateString("tr-TR");
  }, 1000);

  // İlk veri çek
  // verileriCek();   // ← Google Sheets bağlantısı aktif olduğunda aç

  // Örnek veri (test için)
  setTimeout(() => {
    guncelleTakimlar([
      { ad: "Hat A - Kesme", takim: "Takım 01", verim: 92 },
      { ad: "Hat B - Krimpleme", takim: "Takım 02", verim: 87 },
      { ad: "Hat C - Montaj", takim: "Takım 03", verim: 71 },
      { ad: "Hat D - Test", takim: "Takım 04", verim: 58 },
      { ad: "Hat E - Paketleme", takim: "Takım 05", verim: 94 },
      { ad: "Hat F - Kalite", takim: "Takım 06", verim: 89 },
      { ad: "Hat G - Pres", takim: "Takım 07", verim: 83 },
      { ad: "Hat H - Kaynak", takim: "Takım 08", verim: 76 },
      { ad: "Hat I - Boyama", takim: "Takım 09", verim: 95 },
      { ad: "Hat J - Sevkiyat", takim: "Takım 10", verim: 81 }
    ]);
  }, 800);

  console.log("%c[Andon v5.4] Sesli panel yüklendi", "color:#854d0e");
}

window.onload = init;
