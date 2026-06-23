// Google Apps Script Web App URL'nizi buraya yazın
const GAS_ANDON_URL ="https://script.google.com/macros/s/AKfycbwaq-DWawvu5PPOtHHboEMaGNuG0kU_Zjy9SsUOX86O1OlP2mEyxj8fQhM9Sr4eEVAO/exec";

function verileriCek() {
  const script = document.createElement('script');
  script.src = `${GAS_ANDON_URL}?action=getAndonData&callback=uiGuncelle&_t=${Date.now()}`;
  document.body.appendChild(script);
}

function uiGuncelle(data) {
  if (!data.ok) return;
  const d = data.andonData;
  
  // Sayısal alanları güncelle
  document.getElementById("toplamHedef").innerText = d.hedef;
  document.getElementById("toplamGerceklesen").innerText = d.gerceklesen;
  document.getElementById("toplamFire").innerText = d.fire + " Adet";
  
  // Verimlilik hesapla ve ekrana bas
  const verimlilik = d.hedef > 0 ? Math.round((d.gerceklesen / d.hedef) * 100) : 0;
  document.getElementById("verimlilikYuzde").innerText = "%" + verimlilik;
  document.getElementById("verimlilikBar").style.width = verimlilik + "%";
  document.getElementById("verimlilikBar").innerText = "%" + verimlilik;

  // Aktif duruş/arıza kontrolü
  if (d.sonArizalar && d.sonArizalar.length > 0) {
    document.getElementById("aktifDurus").innerText = "VAR!";
    document.getElementById("aktifDurus").className = "text-danger fw-bold blink-red";
    
    // Akan yazıyı (marquee) güncelle
    const arizaText = d.sonArizalar.map(a => `⚠️ ${a.makine} - ${a.neden} (${a.bildiren})`).join("  |  ");
    document.getElementById("arizaKaydirici").innerText = arizaText;
  }
}
setInterval(verileriCek, 30000); // Her 30 saniyede bir güncelle
verileriCek();
