// =====================================================
//  STAN — demande les passages au relais et lit la réponse
// =====================================================

// Les arrêts dans l'ordre de la ligne (Brabois = 0 ... Essey = 24)
const ORDRE_ARRETS = Object.keys(CONFIG.arrets);
const NB_ARRETS = ORDRE_ARRETS.length;
const INDEX_ARRET = {};
ORDRE_ARRETS.forEach(function (cle, i) { INDEX_ARRET[cle] = i; });

// Les deux sens de circulation
//   "A" = vers Essey Mouzimpré (dans l'ordre de la liste)
//   "B" = vers Vandoeuvre Brabois Hôpitaux (dans l'ordre inverse)
const SENS = ["A", "B"];

// Fabrique le texte envoyé au site Stan pour un arrêt
// (même format que le site officiel)
function construireRequete(arret) {
  const parametres = new URLSearchParams();
  parametres.append("requete", "tempsreel_submit");
  parametres.append("requete_val[arret]", arret.arret);
  parametres.append("requete_val[arret_name]", arret.arret_name);

  for (const cle in CONFIG.ligne) {
    parametres.append("requete_val[" + cle + "]", CONFIG.ligne[cle]);
  }

  return parametres.toString();
}

// Envoie la requête au relais et renvoie le HTML reçu
// (abandon au bout de 12 s pour ne pas bloquer toute la mise à jour)
async function demanderPassages(arret) {
  const controle = new AbortController();
  const minuteur = setTimeout(function () { controle.abort(); }, 12000);

  try {
    const reponse = await fetch(CONFIG.urlRelais, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: construireRequete(arret),
      signal: controle.signal
    });

    const html = await reponse.text();

    if (CONFIG.debug) {
      console.log("Réponse Stan pour " + arret.nom + " :", html);
    }

    if (!reponse.ok || !html.includes("<li")) {
      throw new Error("réponse inattendue du site Stan");
    }

    return html;
  } finally {
    clearTimeout(minuteur);
  }
}

// Transforme le HTML en liste de directions :
// [ { direction: "Essey Mouzimpré", minutes: [0, 5] }, ... ]
function lirePassages(html) {
  const page = new DOMParser().parseFromString(html, "text/html");
  const resultat = [];

  // Chaque <li> = une direction
  for (const ligne of page.querySelectorAll("li")) {
    const blocDirection = ligne.querySelector(".tpsreel-destination span");
    if (!blocDirection) {
      continue; // un <li> qui n'est pas une direction
    }
    const direction = blocDirection.textContent.replace(/direction/i, "").trim();

    // Chaque case = un passage
    const minutes = [];
    for (const temps of ligne.querySelectorAll(".tpsreel-temps-item")) {
      const texte = temps.textContent.trim();
      const enHeure = texte.match(/(\d{1,2})\s*h\s*(\d{2})/); // ex. "14h32"

      if (temps.querySelector(".icon-car1")) {
        // Icône de tram sans texte = tram à l'arrêt
        minutes.push(0);
      } else if (enHeure) {
        // Parfois Stan donne une heure au lieu des minutes
        minutes.push(minutesJusqua(Number(enHeure[1]), Number(enHeure[2])));
      } else {
        const nombre = parseInt(texte); // "5 min" → 5
        if (!isNaN(nombre)) {
          minutes.push(nombre);
        }
      }
    }

    resultat.push({ direction: direction, minutes: minutes });
  }

  return resultat;
}

// Nombre de minutes entre maintenant et une heure donnée (ex. 14h32)
function minutesJusqua(heures, minutes) {
  const cible = new Date();
  cible.setHours(heures, minutes, 0, 0);

  // Heure passée de plus d'une minute → c'est pour demain (tram après minuit)
  if (cible < new Date() - 60000) {
    cible.setDate(cible.getDate() + 1);
  }

  return Math.max(0, Math.round((cible - new Date()) / 60000));
}

// ----- À quel sens appartient une direction ? -----
// On retrouve l'arrêt de destination dans la liste : s'il est après l'arrêt
// interrogé (vers Essey) c'est le sens A, sinon le sens B.
// Ça marche aussi pour un éventuel service partiel ("Direction Point Central").

const MOTS_IGNORES = ["des", "les", "saint", "dame"];

// "Vandœuvre Brabois-Hôpitaux" → ["vandoeuvre", "brabois", "hopitaux"]
function motsDe(texte) {
  return texte.toLowerCase()
    .replace(/œ/g, "oe").replace(/æ/g, "ae")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(function (m) { return m.length >= 3 && !MOTS_IGNORES.includes(m); });
}

const MOTS_DES_ARRETS = ORDRE_ARRETS.map(function (cle) {
  // sans doublons
  return Array.from(new Set(motsDe(CONFIG.arrets[cle].arret_name + " " + CONFIG.arrets[cle].nom)));
});

// Numéro (0 à 24) de l'arrêt qui ressemble le plus au nom donné, ou -1
function indexDeDestination(nom) {
  const mots = motsDe(nom);
  let meilleur = -1, meilleurScore = 0, meilleurRatio = 0;

  MOTS_DES_ARRETS.forEach(function (motsArret, i) {
    const score = mots.filter(function (m) { return motsArret.includes(m); }).length;
    const ratio = score / motsArret.length;
    if (score > meilleurScore || (score > 0 && score === meilleurScore && ratio > meilleurRatio)) {
      meilleur = i; meilleurScore = score; meilleurRatio = ratio;
    }
  });

  if (meilleurScore > 0) return meilleur;
  if (mots.includes("essey")) return NB_ARRETS - 1;
  if (mots.includes("vandoeuvre") || mots.includes("brabois") || mots.includes("chu")) return 0;
  return -1;
}

// Sens ("A" ou "B") d'une direction vue depuis un arrêt, ou "" si inconnu
function sensDepuis(indexArret, nomDirection) {
  const dest = indexDeDestination(nomDirection);
  if (dest < 0 || dest === indexArret) return "";
  return dest > indexArret ? "A" : "B";
}

// Range les passages d'un arrêt par sens, en heures absolues (ms) :
// { A: [heure, heure], B: [heure, heure] } du plus proche au plus lointain
function rangerParSens(cleArret, directions, recuA) {
  const resultat = { A: [], B: [] };
  const i = INDEX_ARRET[cleArret];

  for (const d of directions) {
    const sens = sensDepuis(i, d.direction);
    if (!sens) {
      console.warn("Direction non reconnue à " + CONFIG.arrets[cleArret].nom + " : " + d.direction);
      continue;
    }
    for (const m of d.minutes) {
      resultat[sens].push(recuA + m * 60000);
    }
  }

  resultat.A.sort(function (a, b) { return a - b; });
  resultat.B.sort(function (a, b) { return a - b; });
  return resultat;
}
