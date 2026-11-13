// =====================================================
//  PLAN — la ligne T1 avec tous les trams, dans les 2 sens
//  Brabois en haut, Essey en bas.
//    colonne de gauche (rouge) : sens A, vers Essey, les trams descendent
//    colonne de droite (bleue) : sens B, vers Brabois, les trams montent
// =====================================================

function hauteurArret() {
  const valeur = getComputedStyle(document.documentElement).getPropertyValue("--hauteur-arret");
  return parseFloat(valeur) || 46;
}

function joliNom(cle) {
  return CONFIG.arrets[cle].arret_name.replace(/ - /g, " – ");
}

// Fabrique les lignes du plan (une seule fois, au démarrage)
function construirePlan() {
  // Mes arrêts (ceux de CONFIG.trajets), pour les mettre en valeur
  const mesArrets = {};
  for (const trajet of CONFIG.trajets) {
    const i = INDEX_ARRET[trajet.arret];
    if (i === undefined) continue;
    mesArrets[i] = (mesArrets[i] || []).concat(sensDuTrajet(trajet));
  }

  ORDRE_ARRETS.forEach(function (cle, i) {
    const nom = document.createElement("div");
    nom.textContent = joliNom(cle);
    if (i === 0 || i === NB_ARRETS - 1) nom.classList.add("terminus");
    if (mesArrets[i]) {
      nom.classList.add("mien");
      nom.title = "Mon arrêt";
    }
    document.getElementById("plan-noms").appendChild(nom);

    for (const sens of SENS) {
      const case_ = document.createElement("div");
      if (mesArrets[i] && mesArrets[i].includes(sens)) case_.classList.add("mien");
      document.getElementById("plan-eta" + sens).appendChild(case_);

      const point = document.createElement("div");
      point.className = "plan-point";
      point.style.top = "calc(var(--hauteur-arret) * " + (i + 0.5) + ")";
      document.getElementById("plan-rail" + sens).appendChild(point);
    }
  });
}

// Texte d'un tram pour la liste et l'infobulle
function decrirePosition(sens, pos) {
  const min = Math.round(pos.reste);
  if (pos.type === "depart") {
    return "Au terminus " + nomDansSens(sens, 0) + (min <= 0 ? ", départ imminent" : ", départ dans " + min + " min");
  }
  if (pos.type === "quai") {
    return "À l'arrêt " + nomDansSens(sens, pos.vers);
  }
  return "Entre " + nomDansSens(sens, pos.de) + " et " + nomDansSens(sens, pos.vers) +
    " · arrivée dans " + (min <= 0 ? "moins d'1 min" : min + " min");
}

// Redessine les horaires et les trams
function dessinerPlan(reponses, suivis, maintenant) {
  const h = hauteurArret();

  for (const sens of SENS) {
    // --- Les horaires à chaque arrêt ---
    const cases = document.getElementById("plan-eta" + sens).children;
    for (let i = 0; i < NB_ARRETS; i++) {
      const heures = heuresA(reponses, sens, rangDansSens(sens, i), maintenant);
      const case_ = cases[i];
      if (!heures) {
        case_.classList.remove("proche");
        case_.innerHTML = '<span class="plan-vide">—</span>';
        continue;
      }
      const minutes = heures.map(function (x) { return Math.max(0, Math.round((x - maintenant) / 60000)); });
      case_.classList.toggle("proche", minutes[0] <= 1);
      case_.innerHTML = '<span class="plan-eta1">' + minutes[0] + "′</span>" +
        (minutes.length > 1 ? '<span class="plan-eta2">puis ' + minutes[1] + "′</span>" : "");
    }

    // --- Les trams sur le rail ---
    const positions = [];
    for (const tram of suivis[sens].trams) {
      const pos = positionTram(tram, maintenant);
      if (pos) positions.push(pos);
    }

    const rail = document.getElementById("plan-rail" + sens);
    const anciens = Array.from(rail.querySelectorAll(".plan-tram"));
    positions.forEach(function (pos, k) {
      const iDe = indexDansSens(sens, pos.de);
      const iVers = indexDansSens(sens, pos.vers);
      const y = (iDe + 0.5 + (iVers - iDe) * pos.frac) * h;

      let marque = anciens[k];
      if (!marque) {
        marque = document.createElement("div");
        rail.appendChild(marque);
      }
      marque.className = "plan-tram" + (pos.type === "depart" ? " depart" : "");
      marque.textContent = sens === "A" ? "▼" : "▲";
      marque.style.top = y + "px";
      marque.title = decrirePosition(sens, pos);
    });
    anciens.slice(positions.length).forEach(function (m) { m.remove(); });

    // --- Compteur et liste ---
    document.getElementById("plan-nb" + sens).textContent =
      positions.length + " tram" + (positions.length > 1 ? "s" : "");

    const liste = document.getElementById("plan-liste" + sens);
    liste.innerHTML = "";
    if (positions.length === 0) {
      liste.innerHTML = "<li>Aucun tram détecté</li>";
    }
    for (const pos of positions) {
      const li = document.createElement("li");
      li.textContent = decrirePosition(sens, pos);
      liste.appendChild(li);
    }
  }
}
