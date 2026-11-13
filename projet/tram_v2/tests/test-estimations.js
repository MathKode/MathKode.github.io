// =====================================================
//  TEST DES ESTIMATIONS — à lancer avec :  node tests/test-estimations.js
//
//  Charge le vrai code du site (js/*.js), lui donne les réponses d'un
//  simulateur dont on connaît la vérité, et compare :
//    1) les trams du plan : aucun en double, aucun oublié, bien placés
//    2) les heures prévues à chaque arrêt (annoncées / déduites)
//    3) les heures de départ des cartes « Quand partir ? »
// =====================================================

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const sim_ = require("./simulateur.js");

const racine = path.join(__dirname, "..");
const NB_SCENARIOS = Number(process.argv[2] || 60);
const PERTURBE = process.argv[3] === "perturbe"; // trams qui se collent (situation dégradée)

// ----- Charge le code du site dans un "faux navigateur" minimal -----
function chargerSite() {
  const rien = function () {};
  const element = { hidden: false, textContent: "", innerHTML: "", appendChild: rien };
  const contexte = vm.createContext({
    console: { log: rien, warn: rien, error: rien },
    URLSearchParams, AbortController, Date, Math, JSON, Object, Array, Number, Promise, Set,
    setTimeout: function () { return 0; }, clearTimeout: rien,
    setInterval: function () { return 0; },
    fetch: function () { return new Promise(rien); }, // jamais de réponse : on injecte nous-mêmes
    document: { getElementById: function () { return element; }, addEventListener: rien, hidden: false },
    window: { addEventListener: rien }
  });
  for (const fichier of ["config.js", "stan.js", "suivi.js", "affichage.js"]) {
    vm.runInContext(fs.readFileSync(path.join(racine, "js", fichier), "utf8"), contexte, { filename: fichier });
  }
  vm.runInContext("CONFIG.afficherPlan = false;", contexte);
  vm.runInContext(fs.readFileSync(path.join(racine, "js", "app.js"), "utf8"), contexte, { filename: "app.js" });
  return contexte;
}

const site = chargerSite();
const appel = function (code) { return vm.runInContext(code, site); };
const ORDRE = appel("ORDRE_ARRETS");
const N = ORDRE.length;

// ----- Statistiques -----
const stats = {
  instants: 0,
  plan: { detectes: 0, vrais: 0, enTrop: 0, oublies: 0, oubliesDernierTroncon: 0, ecartPosition: [] },
  plantDemarrage: { enTrop: 0, oublies: 0, vrais: 0 },
  prevision: { reel: [], deduitProche: [], deduitLoin: [], terminus: [], decalages: 0, total: 0, horizon: [] },
  departs: { reel: [], deduit: [], estime: [], rates: { reel: 0, deduit: 0, estime: 0 }, nb: { reel: 0, deduit: 0, estime: 0 } }
};

function quantile(liste, q) {
  if (!liste.length) return NaN;
  const t = liste.slice().sort(function (a, b) { return a - b; });
  return t[Math.min(t.length - 1, Math.floor(q * t.length))];
}
function moyenneAbs(liste) {
  return liste.length ? liste.reduce(function (s, x) { return s + Math.abs(x); }, 0) / liste.length : NaN;
}

// Associe trams détectés et vrais trams. Les trams ne se doublent pas, donc on
// les associe dans l'ordre de la ligne (alignement optimal, au plus 1,5 arrêt
// d'écart). Un détecté sans partenaire = en trop ; un vrai sans partenaire = oublié.
function comparerPlan(detectes, vrais) {
  const D = detectes.slice().sort(function (a, b) { return b.position - a.position; });
  const V = vrais.slice().sort(function (a, b) { return b.position - a.position; });
  const n = D.length, m = V.length;
  // cout[i][j] = meilleur coût pour aligner D[i..] et V[j..]
  const cout = [], choix = [];
  for (let i = 0; i <= n; i++) { cout.push(new Array(m + 1).fill(0)); choix.push(new Array(m + 1).fill("")); }
  for (let i = n; i >= 0; i--) {
    for (let j = m; j >= 0; j--) {
      if (i === n && j === m) continue;
      let meilleur = Infinity, c = "";
      if (i < n && cout[i + 1][j] + 2 < meilleur) { meilleur = cout[i + 1][j] + 2; c = "trop"; }
      if (j < m && cout[i][j + 1] + (V[j].facultatif ? 0 : 2) < meilleur) { meilleur = cout[i][j + 1] + (V[j].facultatif ? 0 : 2); c = "oubli"; }
      if (i < n && j < m) {
        const e = Math.abs(D[i].position - V[j].position);
        if (e <= 1.5 && cout[i + 1][j + 1] + e < meilleur) { meilleur = cout[i + 1][j + 1] + e; c = "paire"; }
      }
      cout[i][j] = meilleur; choix[i][j] = c;
    }
  }
  let i = 0, j = 0, enTrop = 0;
  const oublies = [], ecarts = [];
  while (i < n || j < m) {
    const c = choix[i][j];
    if (c === "trop") { enTrop++; i++; }
    else if (c === "oubli") { if (!V[j].facultatif) oublies.push(V[j]); j++; }
    else { ecarts.push(Math.abs(D[i].position - V[j].position)); i++; j++; }
  }
  return { enTrop: enTrop, oublies: oublies, ecarts: ecarts };
}

for (let graine = 1; graine <= NB_SCENARIOS; graine++) {
  const sim = sim_.creerSimulation(graine, { perturbe: PERTURBE });
  const hasard = sim_.hasardReproductible(graine * 7919);

  // On repart de zéro : temps de parcours par défaut, aucune réponse
  appel("parcours = { A: new Array(NB_ARRETS).fill(CONFIG.tempsEntreArrets), B: new Array(NB_ARRETS).fill(CONFIG.tempsEntreArrets) }; reponses = {};");

  for (let etape = 0; etape < 180; etape++) { // 90 minutes, une mise à jour toutes les 30 s
    const t = sim_.enMs(sim, 30) + etape * 30000;

    // Les 25 réponses, reçues à des instants un peu différents
    const reponses = {};
    ORDRE.forEach(function (cle, i) {
      if (hasard() < sim.tauxErreur) {
        reponses[cle] = { directions: [], parSens: null, recuA: t, erreur: "simulée" };
        return;
      }
      const recuA = t + Math.round(hasard() * 4000);
      const directions = sim_.reponseSimulee(sim, i, recuA);
      site.__directions = directions;
      const parSens = appel("rangerParSens(" + JSON.stringify(cle) + ", __directions, " + recuA + ")");
      reponses[cle] = { directions: directions, parSens: parSens, recuA: recuA, erreur: "" };
    });
    site.__reponses = reponses;
    appel("reponses = __reponses; for (const s of SENS) apprendreParcours(suivreLigne(reponses, s, " + (t + 4000) + "));");

    // On vérifie juste après la mise à jour, et 20 s plus tard (les trams ont bougé)
    for (const maintenant of [t + 5000, t + 25000]) {
      stats.instants++;
      appel("__m = " + maintenant + "; __suivis = { A: suivreLigne(reponses, 'A', __m), B: suivreLigne(reponses, 'B', __m) };");
      const demarrage = etape < 10; // les 5 premières minutes : temps de parcours pas encore appris

      for (const sens of ["A", "B"]) {
        // --- 1) Le plan ---
        const detectes = appel("__suivis." + sens + ".trams.map(function (t) { return positionTram(t, __m); }).filter(function (p) { return p; })")
          .map(function (p) { return { position: p.de + p.frac * (p.vers - p.de) }; });
        // Trams au terminus : obligatoires s'ils partent dans ≤ seuil − 1 min,
        // facultatifs jusqu'à seuil + 1 min (Stan arrondit les minutes)
        const seuil = appel('CONFIG.seuilDepartTerminus');
        const obligatoires = sim_.tramsEnLigne(sim, sens, maintenant, seuil - 1);
        const vrais = sim_.tramsEnLigne(sim, sens, maintenant, seuil + 1).map(function (v) {
          v.facultatif = !obligatoires.some(function (o) { return o.numero === v.numero; });
          return v;
        });
        const c = comparerPlan(detectes, vrais);
        if (demarrage) {
          stats.plantDemarrage.enTrop += c.enTrop;
          stats.plantDemarrage.oublies += c.oublies.filter(function (v) { return v.vers < N - 1; }).length;
          stats.plantDemarrage.vrais += obligatoires.length;
        } else {
          stats.plan.detectes += detectes.length;
          stats.plan.vrais += obligatoires.length;
          stats.plan.enTrop += c.enTrop;
          for (const o of c.oublies) {
            if (o.vers === N - 1) stats.plan.oubliesDernierTroncon++;
            else stats.plan.oublies++;
          }
          stats.plan.ecartPosition.push.apply(stats.plan.ecartPosition, c.ecarts);
        }
        if (demarrage) continue;

        // --- 2) Les heures prévues à chaque arrêt ---
        for (let p = 1; p < N - 1; p++) {
          const prevus = appel("tramsVersArret(__suivis." + sens + ", " + p + ", __m).map(function (x) { return [x.heure.getTime(), x.source, x.via, x.terminus]; })");
          const vraies = sim_.passagesReels(sim, sens, p, maintenant);
          if (prevus.length) stats.prevision.horizon.push((prevus[prevus.length - 1][0] - maintenant) / 60000);
          // Le 1er prévu peut être un tram "à quai" que la vérité considère déjà
          // passé (ou l'inverse) : on recale le départ sur le vrai tram le plus proche,
          // puis le k-ième prévu doit être le k-ième vrai (sinon : doublon ou oubli).
          let decalage = 0;
          if (prevus.length && vraies.length > 1 && Math.abs(prevus[0][0] - vraies[1]) < Math.abs(prevus[0][0] - vraies[0])) decalage = 1;
          if (prevus.length && vraies.length && prevus.length > 1 && Math.abs(prevus[1][0] - vraies[0]) < Math.abs(prevus[0][0] - vraies[0])) decalage = -1;
          prevus.forEach(function (x, k) {
            if (k + decalage < 0 || k + decalage >= vraies.length) return;
            const erreur = (x[0] - vraies[k + decalage]) / 60000; // le k-ième prévu doit être le k-ième vrai
            stats.prevision.total++;
            if (Math.abs(erreur) > 2.5) stats.prevision.decalages++;
            if (x[1] === "reel") stats.prevision.reel.push(erreur);
            else if (x[3]) stats.prevision.terminus.push(erreur);
            else {
              const rangVu = appel("(function(){ for (let q = 0; q < NB_ARRETS; q++) if (nomDansSens('" + sens + "', q) === " + JSON.stringify(x[2]) + ") return q; return -1; })()");
              (p - rangVu <= 5 ? stats.prevision.deduitProche : stats.prevision.deduitLoin).push(erreur);
            }
          });
        }
      }

      // --- 3) Les cartes « Quand partir ? » ---
      const cartes = appel("CONFIG.trajets.map(function (tr) { const s = sensDuTrajet(tr); return { sens: s, p: rangDansSens(s, INDEX_ARRET[tr.arret]), departs: calculerDeparts(tr, listerTrams(tr, __suivis, __m), __m).map(function (d) { return [d.tram.getTime(), d.source, d.depart.getTime() + tr.tempsAPied * 60000]; }) }; })");
      for (const carte of cartes) {
        const vraies = sim_.passagesReels(sim, carte.sens, carte.p, maintenant);
        const d = carte.departs[0];
        if (!d) continue;
        // Le tram visé = le vrai tram le plus proche de l'heure annoncée
        let vise = vraies[0];
        for (const v of vraies) if (Math.abs(v - d[0]) < Math.abs(vise - d[0])) vise = v;
        const erreur = (d[0] - vise) / 60000; // > 0 : le site annonce le tram trop tard
        stats.departs[d[1]].push(erreur);
        stats.departs.nb[d[1]]++;
        // En partant à l'heure conseillée, j'arrive à l'arrêt à d[2] : raté si le tram est déjà passé
        if (d[2] - vise > 30000) stats.departs.rates[d[1]]++;
      }
    }
  }
}

// ----- Résultats -----
const pc = function (a, b) { return b ? (100 * a / b).toFixed(2) + " %" : "–"; };
const mn = function (x) { return isNaN(x) ? "–" : x.toFixed(2) + " min"; };
const P = stats.prevision, D = stats.departs, L = stats.plan;

console.log("\n=== " + (PERTURBE ? "Trafic PERTURBÉ, " : "Trafic normal, ") + NB_SCENARIOS + " scénarios × 90 min, " + stats.instants + " instants vérifiés ===\n");

console.log("1) PLAN (après les 5 premières minutes)");
console.log("   vrais trams en ligne        : " + L.vrais);
console.log("   trams en trop (doublons)    : " + L.enTrop + " (" + pc(L.enTrop, L.vrais) + ")");
console.log("   trams oubliés               : " + L.oublies + " (" + pc(L.oublies, L.vrais) + ")");
console.log("   oubliés au dernier tronçon  : " + L.oubliesDernierTroncon + " (" + pc(L.oubliesDernierTroncon, L.vrais) + ", normal : pas d'horaire au terminus)");
console.log("   écart de position médian    : " + quantile(L.ecartPosition, 0.5).toFixed(2) + " arrêt, 95 % < " + quantile(L.ecartPosition, 0.95).toFixed(2) + " arrêt");
console.log("   démarrage (5 premières min) : " + stats.plantDemarrage.enTrop + " en trop, " + stats.plantDemarrage.oublies + " oubliés sur " + stats.plantDemarrage.vrais);

console.log("\n2) HEURES PRÉVUES aux arrêts (erreur = prévu − vrai)");
console.log("   décalages (> 2,5 min, = mauvais tram) : " + P.decalages + " / " + P.total + " (" + pc(P.decalages, P.total) + ")");
const ligne = function (nom, l) {
  console.log("   " + nom.padEnd(30) + " n=" + String(l.length).padStart(7) + "  moyenne |err| " + mn(moyenneAbs(l)) +
    "  95 % < " + mn(quantile(l.map(Math.abs), 0.95)) + "  biais " + mn(l.reduce(function (s, x) { return s + x; }, 0) / (l.length || 1)));
};
ligne("annoncées par Stan", P.reel);
ligne("déduites (vu ≤ 5 arrêts avant)", P.deduitProche);
ligne("déduites (vu > 5 arrêts avant)", P.deduitLoin);
ligne("déduites (départ du terminus)", P.terminus);
console.log("   horizon moyen (dernier tram connu) : " + mn(P.horizon.reduce(function (s, x) { return s + x; }, 0) / P.horizon.length));

console.log("\n3) CARTES « Quand partir ? » — le grand horaire (erreur = heure du tram annoncée − vraie)");
for (const s of ["reel", "deduit", "estime"]) {
  console.log("   " + s.padEnd(7) + " n=" + String(D.nb[s]).padStart(6) + "  moyenne |err| " + mn(moyenneAbs(D[s])) +
    "  tram raté en suivant le conseil : " + pc(D.rates[s], D.nb[s]));
}
console.log("");

// Réussi si presque aucun tram en trop (< 0,01 %) et peu d'heures décalées
// (< 1 % en trafic normal, < 1,5 % en trafic perturbé)
const ok = L.enTrop / L.vrais < 0.0001 && P.decalages / P.total < (PERTURBE ? 0.015 : 0.01);
console.log(ok ? "✅ Test réussi" : "❌ Test échoué");
process.exit(ok ? 0 : 1);
