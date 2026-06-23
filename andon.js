// Google Apps Script Web App URL'nizi buraya yazın
const GAS_ANDON_URL = https://script.google.com/macros/s/AKfycbwaq-DWawvu5PPOtHHboEMaGNuG0kU_Zjy9SsUOX86O1OlP2mEyxj8fQhM9Sr4eEVAO/exec;

function verileriCek() {
  const script = document.createElement('script');
  script.src = `${GAS_ANDON_URL}?action=getAndonData&callback=uiGuncelle&_t=${Date.now()}`;
  document.body.appendChild(script);
}

function uiGuncelle(data) {
  if (!data.ok) return;
  const d = data.andonData;
  document.getElementById("toplamHedef").innerText = d.hedef;
  document.getElementById("toplamGerceklesen").innerText = d.gerceklesen;
  // Diğer alanları da buraya ekleyeceğiz, şimdilik test için bu yeterli
  console.log("Veri çekildi:", d);
}

setInterval(verileriCek, 30000); // Her 30 saniyede bir güncelle
verileriCek();
