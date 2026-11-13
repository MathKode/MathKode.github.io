// =====================================================
//  APP — le chef d'orchestre
// =====================================================

// Dernière réponse de chaque arrêt, rangée par clé :
// reponses.artem = { directions: [...], parSens: { A: [heures], B: [heures] }, recuA, erreur }
let reponses = {};
let enCours = false;
let derniereMaj = 0;

// ----- 1) Récupérer les horaires des 25 arrêts -----

// Interroge un arrêt et range sa réponse
async function chargerArret(cle) {
  const arret = CONFIG.arrets[cle];
  try {
    const html = await demanderPassages(arret);
    const recuA = Date.now();
    const directions = lirePassages(html);
    return { directions: directions, parSens: rangerParSens(cle, directions, recuA), recuA: recuA, erreur: "" };
  } catch (erreur) {
    console.error(arret.nom, erreur);
    // On garde l'ancienne réponse si elle a moins de 2 minutes
    // (les heures sont absolues, elles restent valables)
    const ancienne = reponses[cle];
    if (ancienne && !ancienne.erreur && Date.now() - ancienne.recuA < 120000) {
      return ancienne;
    }
    return { directions: [], parSens: null, recuA: Date.now(), erreur: erreur.message || "erreur" };
  }
}

// Interroge tous les arrêts (plusieurs à la fois) puis met l'écran à jour
async function chargerHoraires() {
  if (enCours) return;
  enCours = true;

  const nouvelles = {};
  let suivant = 0;

  async function ouvrier() {
    while (suivant < NB_ARRETS) {
      const cle = ORDRE_ARRETS[suivant++];
      nouvelles[cle] = await chargerArret(cle);
    }
  }

  try {
    await Promise.all(Array.from({ length: CONFIG.requetesSimultanees }, ouvrier));
    reponses = nouvelles;
    derniereMaj = Date.now();

    // Le site apprend les temps de trajet entre arrêts à chaque mise à jour
    for (const sens of SENS) {
      apprendreParcours(suivreLigne(reponses, sens, Date.now()));
    }

    rafraichirAffichage();

    const sansReponse = ORDRE_ARRETS.filter(function (cle) { return reponses[cle].erreur; }).length;
    afficherEtat("Mis à jour à " + formaterHeure(new Date()) +
      " · actualisation toutes les " + CONFIG.rafraichissement + " s" +
      (sansReponse ? " · " + sansReponse + " arrêt(s) sans réponse" : ""));
  } finally {
    enCours = false;
  }
}

// ----- 2) Trouver les trams qui vont passer à mon arrêt -----

// Liste des trams attendus à mon arrêt, du plus proche au plus lointain.
// Chaque tram : { heure: Date, source: "reel" | "deduit", via: "Exelmans" }
// Toute la ligne est suivie (js/suivi.js) : un tram vu n'importe où avant
// mon arrêt est pris en compte, une seule fois.
function listerTrams(trajet, suivis, maintenant) {
  const sens = sensDuTrajet(trajet);
  const pArret = rangDansSens(sens, INDEX_ARRET[trajet.arret]);
  return tramsVersArret(suivis[sens], pArret, maintenant);
}

// ----- 3) Calculer quand partir de chez moi -----

// Ajoute un départ à la liste si on peut encore attraper ce tram
function ajouterSiAttrapable(departs, trajet, tram, maintenant) {
  // Heure de départ = heure du tram - temps à pied
  // (- une marge de sécurité si l'heure n'est pas annoncée à mon arrêt)
  const marge = tram.source === "reel" ? 0 : CONFIG.margeSecurite;
  const depart = new Date(tram.heure.getTime() - (trajet.tempsAPied + marge) * 60000);

  // 30 s de marge
  if (depart.getTime() >= maintenant - 30000) {
    departs.push({ depart: depart, tram: tram.heure, source: tram.source, via: tram.via, terminus: tram.terminus });
  }
}

// Écart habituel entre deux trams : la médiane des écarts entre les trams
// connus (plus fiable que le seul dernier écart). Sinon l'écart par défaut.
function calculerEcart(trams) {
  const ecarts = [];
  for (let i = 1; i < trams.length; i++) {
    const ecart = trams[i].heure - trams[i - 1].heure;
    if (ecart >= 2 * 60000) ecarts.push(ecart); // 2 trams collés : pas fiable
  }

  if (ecarts.length === 0) {
    return CONFIG.ecartParDefaut * 60000;
  }

  ecarts.sort(function (a, b) { return a - b; });
  return ecarts[Math.floor(ecarts.length / 2)];
}

// Calcule les 2 prochains départs de chez moi
function calculerDeparts(trajet, trams, maintenant) {
  const departs = [];

  // a) Les trams connus (annoncés ou vus ailleurs sur la ligne)
  for (const tram of trams) {
    ajouterSiAttrapable(departs, trajet, tram, maintenant);
  }

  // b) S'il en manque encore, on estime les suivants avec l'écart habituel
  if (CONFIG.estimerSuivants && trams.length > 0) {
    const ecart = calculerEcart(trams);
    let heure = trams[trams.length - 1].heure;

    while (departs.length < 2) {
      heure = new Date(heure.getTime() + ecart);
      ajouterSiAttrapable(departs, trajet, { heure: heure, source: "estime", via: "" }, maintenant);
    }
  }

  return departs;
}

// ----- 4) Afficher -----

// Redessine les cartes et le plan avec les données qu'on a déjà
function rafraichirAffichage() {
  afficherHorloge();

  // Pas encore de réponse : on laisse "Chargement…"
  if (Object.keys(reponses).length === 0) {
    return;
  }

  const maintenant = Date.now();
  const suivis = {};
  for (const sens of SENS) {
    suivis[sens] = suivreLigne(reponses, sens, maintenant);
  }

  let html = "";

  for (const trajet of CONFIG.trajets) {
    const trams = listerTrams(trajet, suivis, maintenant);
    const departs = calculerDeparts(trajet, trams, maintenant);

    // Erreur seulement si on n'a rien trouvé du tout
    let erreur = "";
    if (trams.length === 0) {
      erreur = reponses[trajet.arret].erreur;
    }

    html += creerCarte(CONFIG.arrets[trajet.arret].nom, trajet, departs, trams, erreur);
  }

  afficherCartes(html);

  if (CONFIG.afficherPlan) {
    dessinerPlan(reponses, suivis, maintenant);
  }
}

// ----- Démarrage -----
if (CONFIG.afficherPlan) {
  construirePlan();
} else {
  document.getElementById("ligne").hidden = true;
}

chargerHoraires();

// Nouvelle demande au site Stan toutes les X s (pas quand l'onglet est caché)
setInterval(function () {
  if (!document.hidden) chargerHoraires();
}, CONFIG.rafraichissement * 1000);

// En revenant sur l'onglet : mise à jour tout de suite si les données sont vieilles
document.addEventListener("visibilitychange", function () {
  if (!document.hidden && Date.now() - derniereMaj > CONFIG.rafraichissement * 1000) {
    chargerHoraires();
  }
});

// Le compte à rebours, l'horloge et les trams bougent toutes les 5 s, sans rappeler le site
setInterval(function () {
  if (!document.hidden) rafraichirAffichage();
}, 5000);

window.addEventListener("resize", rafraichirAffichage);
