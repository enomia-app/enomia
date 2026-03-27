#!/bin/bash

# Backup
cp simulateur-rentabilite-airbnb/index.html simulateur-rentabilite-airbnb/index.html.bak2

# Remplacer la section des popups + scripts d'auth
sed -i '' '/\/\/ Save popup/,/saveSimulation = function(){/c\
// ===== AUTH & SIMULATIONS =====\
let currentUser = null;\
let currentSimulationData = {};\
\
function getAllSliderValues() {\
  return {\
    prix: parseFloat(document.getElementById("s-prix").value),\
    surface: parseFloat(document.getElementById("s-surface").value),\
    travaux: parseFloat(document.getElementById("s-travaux").value),\
    ameu: parseFloat(document.getElementById("s-ameu").value),\
    apport: parseFloat(document.getElementById("s-apport").value),\
    duree: parseFloat(document.getElementById("s-duree").value),\
    taux: parseFloat(document.getElementById("s-taux").value),\
    nuit: parseFloat(document.getElementById("s-nuit").value),\
    occu: parseFloat(document.getElementById("s-occu").value),\
    commission: parseFloat(document.getElementById("s-commission").value),\
    menage: parseFloat(document.getElementById("s-menage").value),\
    blanc: parseFloat(document.getElementById("s-blanc").value),\
    eau: parseFloat(document.getElementById("s-eau").value),\
    elec: parseFloat(document.getElementById("s-elec").value),\
    internet: parseFloat(document.getElementById("s-internet").value),\
    consommables: parseFloat(document.getElementById("s-consommables").value),\
    logiciel: parseFloat(document.getElementById("s-logiciel").value),\
    comptable: parseFloat(document.getElementById("s-comptable").value),\
    fonciere: parseFloat(document.getElementById("s-fonciere").value),\
    copro: parseFloat(document.getElementById("s-copro").value)\
  };\
}\
\
function restoreSliderValues(data) {\
  Object.keys(data).forEach(key => {\
    const input = document.getElementById("s-" + key);\
    if (input) {\
      input.value = data[key];\
      sv(key, data[key]);\
    }\
  });\
}\
\
async function doSaveAccount() {\
  const prenom = document.getElementById("save-prenom").value.trim();\
  const email = document.getElementById("save-email").value.trim();\
  const pwd = document.getElementById("save-pwd").value;\
  const biens = document.getElementById("save-biens").value;\
\
  if (!prenom || !email || !email.includes("@") || pwd.length < 6 || !biens) {\
    alert("Remplissez tous les champs");\
    return;\
  }\
\
  const response = await fetch("/api/auth", {\
    method: "POST",\
    headers: { "Content-Type": "application/json" },\
    body: JSON.stringify({\
      action: "signup",\
      email,\
      password: pwd,\
      firstName: prenom,\
      nombreBiens: biens\
    })\
  });\
\
  if (response.ok) {\
    const { userId, email: userEmail } = await response.json();\
    currentUser = { userId, email: userEmail, firstName: prenom };\
    localStorage.setItem("enomia_user", JSON.stringify(currentUser));\
    closeSavePopup();\
    saveSimulation();\
  } else {\
    alert("Erreur : " + (await response.json()).error);\
  }\
}\
\
async function saveSimulation() {\
  if (!currentUser) {\
    showSavePopup();\
    return;\
  }\
\
  const simName = prompt("Nom de ta simulation :");\
  if (!simName) return;\
\
  const response = await fetch("/api/simulations", {\
    method: "POST",\
    headers: { "Content-Type": "application/json" },\
    body: JSON.stringify({\
      action: "save",\
      userId: currentUser.userId,\
      simulationName: simName,\
      simulationData: getAllSliderValues()\
    })\
  });\
\
  if (response.ok) {\
    alert("Simulation sauvegardée !");\
    showSharePopup();\
  } else {\
    alert("Erreur : " + (await response.json()).error);\
  }\
}\
\
async function doShare() {\
  const email = document.getElementById("share-email").value.trim();\
  if (!email || !email.includes("@")) {\
    alert("Email invalide");\
    return;\
  }\
\
  if (!currentUser) {\
    alert("Vous devez être connecté pour partager");\
    return;\
  }\
\
  const response = await fetch("/api/simulations", {\
    method: "POST",\
    headers: { "Content-Type": "application/json" },\
    body: JSON.stringify({\
      action: "save",\
      userId: currentUser.userId,\
      simulationName: "Partagée",\
      simulationData: getAllSliderValues()\
    })\
  });\
\
  if (response.ok) {\
    const { simulationId } = await response.json();\
    const shareLink = window.location.origin + "/simulateur-rentabilite-airbnb?sim=" + simulationId;\
    const mailtoLink = "mailto:" + email + "?subject=Regarde ma simulation LCD&body=" + encodeURIComponent(shareLink);\
    window.location.href = mailtoLink;\
    document.getElementById("share-success").style.display = "block";\
  } else {\
    alert("Erreur : " + (await response.json()).error);\
  }\
}\
\
function copyShareLink() {\
  const link = window.location.origin + "/simulateur-rentabilite-airbnb";\
  navigator.clipboard.writeText(link);\
  const btn = document.getElementById("copy-link-btn");\
  btn.textContent = "✓ Copié";\
  setTimeout(() => { btn.textContent = "Copier"; }, 2000);\
}\
\
window.addEventListener("load", () => {\
  const saved = localStorage.getItem("enomia_user");\
  if (saved) {\
    currentUser = JSON.parse(saved);\
  }\
\
  const params = new URLSearchParams(window.location.search);\
  if (params.get("sim")) {\
    fetch("/api/simulations", {\
      method: "POST",\
      headers: { "Content-Type": "application/json" },\
      body: JSON.stringify({ action: "get", simulationId: params.get("sim") })\
    })\
    .then(r => r.json())\
    .then(d => { if (d.simulation) restoreSliderValues(d.simulation.data); });\
  }\
});\
\
function showSavePopup() { document.getElementById("save-popup").style.display = "flex"; }\
function closeSavePopup() { document.getElementById("save-popup").style.display = "none"; }\
function showSharePopup() { document.getElementById("share-popup").style.display = "flex"; }\
function closeSharePopup() { document.getElementById("share-popup").style.display = "none"; document.getElementById("share-success").style.display = "none"; }\
\
var _origSave = saveSimulation;
' simulateur-rentabilite-airbnb/index.html

echo "✅ Simulateur mis à jour !"
