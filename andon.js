const GAS_ANDON_URL ="https://script.google.com/macros/s/AKfycbwaq-DWawvu5PPOtHHboEMaGNuG0kU_Zjy9SsUOX86O1OlP2mEyxj8fQhM9Sr4eEVAO/exec";

// 1. SAAT MOTORU (Bağımsız çalışır)
function saatGuncelle() {
  const simdi = new Date();
  document.getElementById("andonSaat").innerText = simdi.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });
  document.getElementById("andonTarih").innerText = simdi.toLocaleDateString('tr-TR');
}

// 2. VERİ ÇEKME MOTORU
function verileriCek() {
  const script = document.createElement('script');
  script.src = `${GAS_ANDON_URL}?action=getAndonData&callback=uiGuncelle&_t=${Date.now()}`;
  document.body.appendChild(script);
}
async function duyurulariGetir() {
    // Kendi Google Sheets CSV yayınlama linkini buraya yapıştır
    const sheetUrl =https://docs.google.com/spreadsheets/d/e/2PACX-1vRZyesQIw-Q0fGlFWyQOx8Ce85D373Nx2YWxEMTO1wzosd-1lLOtC_strxvT94etACZmnMRb-KHkyhm/pub?gid=1868540949&single=true&output=csv;
    
    try {
        const response = await fetch(sheetUrl);
        const data = await response.text();
        
        // CSV verisini satırlara böl
        const rows = data.split('\n');
        // Duyuruları birleştir
        const duyurular = rows.map(row => row.split(',')[0]).filter(text => text.trim() !== "").join(" • ");
        
        document.getElementById('duyuruAlani').innerText = duyurular;
    } catch (error) {
        console.error("Duyurular yüklenemedi:", error);
        document.getElementById('duyuruAlani').innerText = "BURKAB A.Ş. - Güncel duyurular için sistem yöneticisine başvurun.";
    }
}

// Sayfa yüklendiğinde çalıştır
duyurulariGetir();

// Her 5 dakikada bir duyuruları yenile (isteğe bağlı)
setInterval(duyurulariGetir, 300000);
// 3. EKRAN GÜNCELLEME (Google'dan gelen veri)
function uiGuncelle(data) {
  if (!data.ok) return;
  const d = data.andonData;
  
  document.getElementById("toplamHedef").innerText = d.hedef;
  document.getElementById("toplamGerceklesen").innerText = d.gerceklesen;
  document.getElementById("toplamFire").innerText = d.fire + " Adet";
  
  const verimlilik = d.hedef > 0 ? Math.round((d.gerceklesen / d.hedef) * 100) : 0;
  document.getElementById("verimlilikYuzde").innerText = "%" + verimlilik;
  document.getElementById("verimlilikBar").style.width = verimlilik + "%";

  if (d.sonArizalar && d.sonArizalar.length > 0) {
    document.getElementById("aktifDurus").innerText = "VAR!";
    document.getElementById("aktifDurus").className = "text-danger fw-bold blink-red";
    document.getElementById("arizaKaydirici").innerText = d.sonArizalar.map(a => `⚠️ ${a.makine} - ${a.neden}`).join(" | ");
  }
}

// BAŞLATMA
document.addEventListener("DOMContentLoaded", () => {
  setInterval(saatGuncelle, 1000); // Saat her saniye
  setInterval(verileriCek, 30000); // Veri her 30 saniye
  saatGuncelle();
  verileriCek();
});
