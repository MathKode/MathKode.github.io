// =====================================================
//  AFFICHAGE — tout ce qui écrit sur la page
// =====================================================

// Écrit une heure au format "14:32"
function formaterHeure(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return h + ":" + m;
}

// Nombre de minutes entières entre maintenant et une date
function minutesAvant(date) {
  return Math.round((date - new Date()) / 60000);
}

// Fabrique le HTML d'une carte pour un trajet
//   trajet  : un bloc de CONFIG.trajets
//   departs : liste de { depart: Date, tram: Date } (déjà triée)
//   erreur  : texte d'erreur, ou "" si tout va bien
function creerCarte(trajet, departs, erreur) {
  let html = '<article class="carte">';

  // En-tête de la carte : T1 + arrêt + direction
  html += '<header class="carte-entete">';
  html += '<span class="badge" style="background:' + CONFIG.ligne.background + ";color:" + CONFIG.ligne.color + '">';
  html += CONFIG.ligne.numlignepublic + "</span>";
  html += "<div>";
  html += "<h2>" + trajet.nom + "</h2>";
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
    const urgent = reste < 2;

    let classes = "prochain";
    if (urgent) classes += " urgent";
    if (premier.estime) classes += " estime";

    html += '<div class="' + classes + '">';
    html += '<p class="label">' + (premier.estime ? "Pars vers (estimé)" : "Pars à") + "</p>";
    html += '<p class="heure">' + (premier.estime ? "≈" : "") + formaterHeure(premier.depart) + "</p>";
    html += '<p class="compte">' + (reste <= 0 ? "Maintenant !" : "dans " + reste + " min") + "</p>";
    if (premier.estime) {
      html += '<p class="detail">Tram estimé vers ' + formaterHeure(premier.tram) + " (pas encore annoncé par Stan)</p>";
    } else {
      html += '<p class="detail">Tram à ' + formaterHeure(premier.tram) + "</p>";
    }
    html += "</div>";

    // Le départ suivant, en petit
    if (departs.length > 1) {
      const second = departs[1];
      if (second.estime) {
        html += '<p class="suivant">Sinon : pars vers <strong>≈' + formaterHeure(second.depart) + "</strong>";
        html += " (tram estimé vers " + formaterHeure(second.tram) + ")</p>";
      } else {
        html += '<p class="suivant">Sinon : pars à <strong>' + formaterHeure(second.depart) + "</strong>";
        html += " (tram à " + formaterHeure(second.tram) + ")</p>";
      }
    }
  }

  html += "</article>";
  return html;
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
