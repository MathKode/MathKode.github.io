// =====================================================
//  AFFICHAGE — tout ce qui écrit sur la page
// =====================================================

// Écrit une heure au format "14:32"
function formaterHeure(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return h + ":" + m;
}

// Nombre de minutes entre maintenant et une date
function minutesAvant(date) {
  return Math.round((date - new Date()) / 60000);
}

// Décrit le tram d'un départ selon d'où vient l'information
//   "reel"   → annoncé à mon arrêt
//   "deduit" → vu ailleurs sur la ligne (ou au terminus) + temps de trajet
//   "estime" → pas encore vu, estimé avec l'écart entre les trams
function decrireTram(d) {
  if (d.source === "reel") {
    return "tram à " + formaterHeure(d.tram);
  }
  if (d.source === "deduit" && d.terminus) {
    return "tram vers " + formaterHeure(d.tram) + ", au départ de " + d.via;
  }
  if (d.source === "deduit") {
    return "tram vers " + formaterHeure(d.tram) + ", vu à " + d.via;
  }
  return "tram estimé vers " + formaterHeure(d.tram);
}

// Heure de départ, avec "≈" si c'est une estimation
function heureDeDepart(d) {
  if (d.source === "estime") {
    return "≈" + formaterHeure(d.depart);
  }
  return formaterHeure(d.depart);
}

// Met une majuscule au début d'un texte
function majuscule(texte) {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

// Fabrique le HTML d'une carte pour un trajet
//   nomArret : nom affiché de l'arrêt
//   trajet   : un bloc de CONFIG.trajets
//   departs  : liste de { depart, tram, source, via } (déjà triée)
//   trams    : tous les trams connus (pour la ligne de détails)
//   erreur   : texte d'erreur, ou "" si tout va bien
function creerCarte(nomArret, trajet, departs, trams, erreur) {
  let html = '<article class="carte">';

  // En-tête de la carte : T1 + arrêt + direction
  html += '<header class="carte-entete">';
  html += '<span class="badge" style="background:' + CONFIG.ligne.background + ";color:" + CONFIG.ligne.color + '">';
  html += CONFIG.ligne.numlignepublic + "</span>";
  html += "<div>";
  html += "<h2>" + nomArret + "</h2>";
  html += '<p class="sous-titre">→ ' + trajet.direction + " · " + trajet.tempsAPied + " min à pied</p>";
  html += "</div>";
  html += "</header>";

  if (erreur) {
    html += '<p class="message erreur">Horaires indisponibles (' + erreur + ")</p>";
  } else if (departs.length === 0) {
    html += '<p class="message">Pas de tram attrapable pour l\'instant.</p>';
  } else {
    // Le prochain départ, en grand
    const premier = departs[0];
    const reste = minutesAvant(premier.depart);

    let classes = "prochain " + premier.source;
    if (reste < 2) classes += " urgent";

    html += '<div class="' + classes + '">';
    html += '<p class="label">' + (premier.source === "estime" ? "Pars vers (estimé)" : "Pars à") + "</p>";
    html += '<p class="heure">' + heureDeDepart(premier) + "</p>";
    html += '<p class="compte">' + (reste <= 0 ? "Maintenant !" : "dans " + reste + " min") + "</p>";
    html += '<p class="detail">' + majuscule(decrireTram(premier)) + "</p>";
    html += "</div>";

    // Le départ suivant, en petit
    if (departs.length > 1) {
      const second = departs[1];
      html += '<p class="suivant">Sinon : pars à <strong>' + heureDeDepart(second) + "</strong>";
      html += " (" + decrireTram(second) + ")</p>";
    }
  }

  if (CONFIG.afficherDetails && trams.length > 0) {
    html += creerDetails(trams);
  }

  html += "</article>";
  return html;
}

// Petite ligne qui liste tous les trams pris en compte, pour vérifier
// ex. "Trams pris en compte : 12:21 · 12:24 · 12:26 (Montet Octroi)"
function creerDetails(trams) {
  const morceaux = [];

  for (const tram of trams) {
    let texte = formaterHeure(tram.heure);
    if (tram.source === "deduit") {
      texte += " (" + tram.via + ")";
    }
    morceaux.push(texte);
  }

  return '<p class="details">Trams pris en compte : ' + morceaux.join(" · ") + "</p>";
}

// Remplace toutes les cartes de la page
function afficherCartes(htmlDesCartes) {
  document.getElementById("cartes").innerHTML = htmlDesCartes;
}

// Met à jour l'horloge en haut
function afficherHorloge() {
  document.getElementById("horloge").textContent = formaterHeure(new Date());
}

// Met à jour le texte en bas de page
function afficherEtat(texte) {
  document.getElementById("etat").textContent = texte;
}
