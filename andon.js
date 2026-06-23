const GAS_ANDON_URL = "https://script.google.com/macros/s/AKfycbxGMzLo4NFvVi9gqN7L30VhGSBVrk6-sP-wkelMU5Q/dev";

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
  document.getElementById("verimlilikBar").innerText = "%" + verimlilik;

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
