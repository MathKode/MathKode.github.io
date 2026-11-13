// =====================================================
//  SUIVI — retrouve chaque tram sur toute la ligne, sans doublon,
//  et prévoit quand il passera à chaque arrêt
//
//  Vocabulaire :
//    sens "A" = vers Essey, sens "B" = vers Brabois
//    p        = rang d'un arrêt dans le sens de circulation
//               (p = 0 au terminus de départ, p = 24 au terminus d'arrivée)
//    heure    = heure de passage en millisecondes (comme Date.now())
// =====================================================

// Un tram annoncé à "0 min" (ou à quai) n'est considéré comme passé que
// 40 s plus tard : Stan affiche 0 tant qu'il reste moins d'une minute.
const DUREE_A_QUAI = 40000;

// Numéro de l'arrêt dans la liste CONFIG.arrets (0 = Brabois) ↔ rang dans le sens
function indexDansSens(sens, p) {
  return sens === "A" ? p : NB_ARRETS - 1 - p;
}
const rangDansSens = indexDansSens; // même calcul dans l'autre sens

function nomDansSens(sens, p) {
  return CONFIG.arrets[ORDRE_ARRETS[indexDansSens(sens, p)]].nom;
}

// Sens d'un trajet de CONFIG.trajets ("Brabois" → B, "Essey" → A)
function sensDuTrajet(trajet) {
  const mots = motsDe(trajet.direction);
  const versEssey = MOTS_DES_ARRETS[NB_ARRETS - 1].some(function (m) { return mots.includes(m); });
  const versBrabois = MOTS_DES_ARRETS[0].some(function (m) { return mots.includes(m); });
  if (versEssey !== versBrabois) return versEssey ? "A" : "B";
  return sensDepuis(INDEX_ARRET[trajet.arret], trajet.direction) || "A";
}

// =====================================================
//  1) TEMPS DE PARCOURS ENTRE ARRÊTS (appris en observant les trams)
//     parcours.A[p] = minutes pour aller de l'arrêt p-1 à l'arrêt p, sens A
//     Gardé dans le navigateur pour la prochaine visite.
// =====================================================
const CLE_STOCKAGE = "t1-temps-de-parcours";
let parcours = chargerParcours();

function chargerParcours() {
  const parDefaut = {
    A: new Array(NB_ARRETS).fill(CONFIG.tempsEntreArrets),
    B: new Array(NB_ARRETS).fill(CONFIG.tempsEntreArrets)
  };
  try {
    const sauve = JSON.parse(localStorage.getItem(CLE_STOCKAGE));
    if (sauve && sauve.A && sauve.B && sauve.A.length === NB_ARRETS && sauve.B.length === NB_ARRETS) {
      return sauve;
    }
  } catch (e) { /* pas de stockage : on garde les valeurs par défaut */ }
  return parDefaut;
}

function sauverParcours() {
  try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(parcours)); } catch (e) { /* tant pis */ }
}

// Minutes de trajet entre les rangs p1 et p2 (p1 <= p2)
function minutesEntre(sens, p1, p2) {
  let total = 0;
  for (let p = p1 + 1; p <= p2; p++) total += parcours[sens][p];
  return total;
}

// Après chaque interrogation : un même tram vu à deux arrêts qui se suivent
// donne le temps de trajet entre eux. On prend la médiane des mesures
// (une mesure aberrante ne compte pas), on ignore celles très éloignées de la
// valeur connue, et on lisse (70 % ancien, 30 % nouveau) pour éviter les à-coups.
function apprendreParcours(suivi) {
  const t = parcours[suivi.sens];
  const mesures = [];
  for (let p = 0; p < NB_ARRETS; p++) mesures.push([]);

  for (const tram of suivi.trams) {
    for (let p = 1; p < NB_ARRETS; p++) {
      if (tram.vus[p] === undefined || tram.vus[p - 1] === undefined) continue;
      const minutes = (tram.vus[p] - tram.vus[p - 1]) / 60000;
      if (minutes >= 0 && minutes <= 6 && Math.abs(minutes - t[p]) <= 2) {
        mesures[p].push(minutes);
      }
    }
  }

  for (let p = 1; p < NB_ARRETS; p++) {
    if (mesures[p].length === 0) continue;
    const triees = mesures[p].sort(function (a, b) { return a - b; });
    const mediane = triees.length % 2
      ? triees[(triees.length - 1) / 2]
      : (triees[triees.length / 2 - 1] + triees[triees.length / 2]) / 2;
    t[p] = Math.min(5, Math.max(0.5, 0.7 * t[p] + 0.3 * mediane));
  }
  sauverParcours();
}

// =====================================================
//  2) RETROUVER LES TRAMS SUR LA LIGNE
//
//  Stan donne, pour chaque arrêt, l'heure des 2 prochains trams.
//  On parcourt les arrêts dans le sens de circulation en tenant une "file" :
//  la liste de tous les trams qui ne sont pas encore arrivés à l'arrêt,
//  du plus proche au plus lointain. Les trams ne se doublent pas, donc :
//
//    trams attendus à l'arrêt p = [trams situés entre l'arrêt d'avant et p]
//                                 + [trams attendus à l'arrêt d'avant]
//
//  Le 1er tram attendu à l'arrêt d'avant devrait arriver à p vers
//  "son heure là-bas + temps de trajet". Si un tram annoncé à p arrive
//  nettement avant, c'est un NOUVEAU tram (entre l'arrêt d'avant et p) ;
//  sinon c'est le MÊME tram, qui n'est pas compté une 2e fois.
//
//  Ex. A dans 1 min, B (juste après) dans 3 min → un seul tram, juste avant A.
// =====================================================

// Heures des prochains passages au rang p (sans ceux déjà passés), ou null
function heuresA(reponses, sens, p, maintenant) {
  const reponse = reponses[ORDRE_ARRETS[indexDansSens(sens, p)]];
  if (!reponse || !reponse.parSens) return null;

  const heures = reponse.parSens[sens].filter(function (h) { return h > maintenant - DUREE_A_QUAI; });
  return heures.length > 0 ? heures : null;
}

// Combien des trams annoncés à p sont nouveaux (pas encore passés à l'arrêt d'avant) ?
function compterNouveaux(sens, dernier, p, heures) {
  // Quand le 1er tram attendu à l'arrêt d'avant devrait arriver ici
  const attendu = dernier.heures[0] + minutesEntre(sens, dernier.p, p) * 60000;
  const marge = CONFIG.margeMemeTram * 60000;

  // Un tram n'est "nouveau" que s'il arrive NETTEMENT avant l'heure attendue
  // (plus de margeMemeTram minutes). En cas de doute, on considère que c'est
  // le même tram : mieux vaut rater un tram collé à un autre que de compter
  // deux fois le même.
  if (heures[0] >= attendu - marge) return 0;

  if (heures.length >= 2) {
    // Les 2 arrivent bien avant : 2 nouveaux (possible seulement si des
    // arrêts intermédiaires n'ont pas répondu)
    if (heures[1] < attendu - marge) return 2;
    // Le 1er est nouveau seulement si c'est bien le 2e qui ressemble au tram attendu
    return Math.abs(heures[1] - attendu) < Math.abs(heures[0] - attendu) ? 1 : 0;
  }

  return 1;
}

let compteurTrams = 0;
function creerTram(sens, de, vers, terminus, inconnu) {
  return {
    id: ++compteurTrams,
    sens: sens,
    de: de,             // rang de l'arrêt d'avant connu (-1 : avant le terminus)
    vers: vers,         // rang du 1er arrêt où on le voit arriver
    terminus: terminus, // pas encore parti du terminus
    inconnu: inconnu,   // position impossible à situer (pas dessiné)
    vus: {}             // vus[p] = heure annoncée par Stan à l'arrêt de rang p
  };
}

// Tous les trams d'un sens, du plus avancé au moins avancé
function suivreLigne(reponses, sens, maintenant) {
  let file = [];
  let dernier = null; // dernier arrêt qui a répondu : { p, heures }

  for (let p = 0; p < NB_ARRETS; p++) {
    const heures = heuresA(reponses, sens, p, maintenant);
    if (!heures) continue; // arrêt sans réponse (ou terminus d'arrivée) : on l'enjambe

    const nbNouveaux = dernier ? compterNouveaux(sens, dernier, p, heures) : heures.length;

    const nouveaux = [];
    for (let j = 0; j < nbNouveaux; j++) {
      if (dernier) {
        nouveaux.push(creerTram(sens, dernier.p, p, false, false));
      } else if (p === 0) {
        nouveaux.push(creerTram(sens, -1, 0, true, false));           // au terminus
      } else {
        // Le terminus n'a pas répondu : ce tram est-il déjà parti ?
        // (heure ici − temps de trajet depuis le terminus = heure de départ)
        const departTerminus = heures[j] - minutesEntre(sens, 0, p) * 60000;
        if (departTerminus <= maintenant + 30000) {
          nouveaux.push(creerTram(sens, p - 1, p, false, false));     // en route
        } else {
          nouveaux.push(creerTram(sens, -1, 0, true, false));         // encore au terminus
        }
      }
    }
    file = nouveaux.concat(file);

    for (let j = 0; j < heures.length; j++) {
      if (j >= file.length) {
        // Plus de trams annoncés que de trams connus : il vient de plus loin
        file.push(creerTram(sens, -1, p, false, true));
      }
      file[j].vus[p] = heures[j];
    }

    dernier = { p: p, heures: heures };
  }

  // La file finale contient tous les trams, du plus avancé au moins avancé
  return { sens: sens, trams: file };
}

// =====================================================
//  3) HEURE DE PASSAGE D'UN TRAM À UN ARRÊT
//     - annoncée par Stan à cet arrêt                       → "reel"
//     - sinon : vue au dernier arrêt connu + temps de trajet → "deduit"
// =====================================================
function heureDePassage(tram, p) {
  if (tram.vus[p] !== undefined) {
    return { heure: tram.vus[p], source: "reel", vu: p };
  }

  let avant = -1, apres = -1;
  for (const cle of Object.keys(tram.vus)) {
    const q = Number(cle);
    if (q < p && q > avant) avant = q;
    if (q > p && (apres === -1 || q < apres)) apres = q;
  }

  if (avant >= 0) {
    return { heure: tram.vus[avant] + minutesEntre(tram.sens, avant, p) * 60000, source: "deduit", vu: avant };
  }
  if (apres >= 0) {
    return { heure: tram.vus[apres] - minutesEntre(tram.sens, p, apres) * 60000, source: "deduit", vu: apres };
  }
  return null;
}

// Trams qui vont passer à l'arrêt de rang pArret, du plus proche au plus lointain :
// [ { heure: Date, source: "reel" | "deduit", via: "Exelmans" } ]
function tramsVersArret(suivi, pArret, maintenant) {
  const resultat = [];
  let precedente = -Infinity;

  for (const tram of suivi.trams) {
    if (tram.de >= pArret) continue; // ce tram est déjà après mon arrêt

    const h = heureDePassage(tram, pArret);
    if (!h || h.heure <= maintenant - DUREE_A_QUAI) continue; // déjà passé

    // Les trams ne se doublent pas : une heure déduite ne peut pas être
    // avant celle du tram de devant (on garde au moins 1 min d'écart)
    let heure = h.heure;
    if (h.source !== "reel") heure = Math.max(heure, precedente + 60000);
    precedente = heure;

    resultat.push({
      heure: new Date(heure),
      source: h.source,
      via: h.source === "reel" ? "" : nomDansSens(suivi.sens, h.vu),
      terminus: tram.terminus && h.vu === 0
    });
  }

  resultat.sort(function (a, b) { return a.heure - b.heure; });
  return resultat;
}

// =====================================================
//  4) POSITION D'UN TRAM EN CE MOMENT (pour le plan)
//     → { type: "depart" | "route" | "quai", de, vers, frac, reste } ou null
//       de, vers : rangs des arrêts encadrants ; frac : 0 = à "de", 1 = à "vers"
// =====================================================
function positionTram(tram, maintenant) {
  if (tram.inconnu) return null;

  // On part du terminus pour un tram pas encore parti, sinon du 1er arrêt après
  // le dernier arrêt connu derrière lui (si des arrêts n'ont pas répondu, sa
  // position exacte dans le trou se retrouve grâce aux temps de trajet)
  const debut = tram.terminus ? 0 : tram.de + 1;
  for (let p = debut; p < NB_ARRETS; p++) {
    const h = heureDePassage(tram, p);
    if (!h) return null;
    if (h.heure <= maintenant - DUREE_A_QUAI) continue; // déjà passé à p : il est plus loin

    const reste = Math.max(0, (h.heure - maintenant) / 60000);

    if (p === 0) {
      // Pas encore parti du terminus
      if (reste > CONFIG.seuilDepartTerminus) return null;
      return { type: "depart", de: 0, vers: 0, frac: 1, reste: reste };
    }
    if (reste <= 0.25) {
      return { type: "quai", de: p - 1, vers: p, frac: 1, reste: reste };
    }
    const frac = Math.min(1, Math.max(0.1, 1 - reste / parcours[tram.sens][p]));
    return { type: "route", de: p - 1, vers: p, frac: frac, reste: reste };
  }

  return null; // arrivé au terminus
}
