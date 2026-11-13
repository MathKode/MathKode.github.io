// =====================================================
//  APP — le chef d'orchestre
// =====================================================

// Pour chaque trajet, on garde les heures de tram reçues et l'erreur éventuelle.
// resultats[0] = Montet Octroi, resultats[1] = Artem (même ordre que CONFIG.trajets)
let resultats = [];

// Ajoute un départ à la liste si on peut encore attraper ce tram
//   estime = true si le tram n'est pas annoncé par Stan mais estimé
function ajouterSiAttrapable(departs, trajet, tram, estime) {
  // Heure de départ = heure du tram - temps à pied
  const depart = new Date(tram.getTime() - trajet.tempsAPied * 60000);

  // 30 s de marge
  if (depart.getTime() >= Date.now() - 30000) {
    departs.push({ depart: depart, tram: tram, estime: estime });
  }
}

// Écart entre les 2 derniers trams annoncés (sinon l'écart par défaut)
function calculerEcart(heuresTram) {
  const ecartParDefaut = CONFIG.ecartParDefaut * 60000;

  if (heuresTram.length < 2) {
    return ecartParDefaut;
  }

  const dernier = heuresTram[heuresTram.length - 1];
  const avantDernier = heuresTram[heuresTram.length - 2];
  const ecart = dernier - avantDernier;

  // Un écart trop petit n'est pas fiable (ex. 2 trams collés)
  if (ecart < 2 * 60000) {
    return ecartParDefaut;
  }
  return ecart;
}

// Calcule les 2 prochains départs de chez moi
function calculerDeparts(trajet, heuresTram) {
  const departs = [];

  // 1) Les trams annoncés par Stan
  for (const tram of heuresTram) {
    ajouterSiAttrapable(departs, trajet, tram, false);
  }

  // 2) S'il en manque, on estime les suivants avec le même écart
  if (CONFIG.estimerSuivants && heuresTram.length > 0) {
    const ecart = calculerEcart(heuresTram);
    let tram = heuresTram[heuresTram.length - 1];

    while (departs.length < 2) {
      tram = new Date(tram.getTime() + ecart);
      ajouterSiAttrapable(departs, trajet, tram, true);
    }
  }

  return departs;
}

// Redessine toutes les cartes avec les données qu'on a déjà
function rafraichirAffichage() {
  let html = "";

  for (let i = 0; i < CONFIG.trajets.length; i++) {
    const trajet = CONFIG.trajets[i];
    const resultat = resultats[i] || { heuresTram: [], erreur: "chargement…" };
    const departs = calculerDeparts(trajet, resultat.heuresTram);
    html += creerCarte(trajet, departs, resultat.erreur);
  }

  afficherCartes(html);
  afficherHorloge();
}

// Va chercher les horaires d'un trajet
async function chargerTrajet(trajet) {
  try {
    const html = await demanderPassages(trajet);
    const minutes = minutesPourDirection(lirePassages(html), trajet.direction);

    // "5 min" → heure réelle du tram
    const maintenant = Date.now();
    const heuresTram = [];
    for (const m of minutes) {
      heuresTram.push(new Date(maintenant + m * 60000));
    }

    return { heuresTram: heuresTram, erreur: "" };
  } catch (erreur) {
    console.error(trajet.nom, erreur);
    return { heuresTram: [], erreur: erreur.message };
  }
}

// Va chercher les horaires de tous les trajets puis met l'écran à jour
async function chargerHoraires() {
  const nouveaux = [];

  for (const trajet of CONFIG.trajets) {
    nouveaux.push(await chargerTrajet(trajet));
  }

  resultats = nouveaux;
  rafraichirAffichage();
  afficherEtat("Mis à jour à " + formaterHeure(new Date()) + " · actualisation toutes les " + CONFIG.rafraichissement + " s");
}

// ----- Démarrage -----
chargerHoraires();

// Nouvelle demande au site Stan toutes les 20 s
setInterval(chargerHoraires, CONFIG.rafraichissement * 1000);

// Le compte à rebours et l'horloge bougent toutes les 5 s, sans rappeler le site
setInterval(rafraichirAffichage, 5000);
