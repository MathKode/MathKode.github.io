// =====================================================
//  SIMULATEUR — une ligne T1 imaginaire dont on connaît la vérité
//
//  Sert à vérifier les estimations : on sait exactement où sont les trams
//  et quand ils passent, puis on compare avec ce que calcule le site.
//  Fonctionne dans Node (tests/test-estimations.js) et dans le navigateur.
// =====================================================

// Petit générateur de nombres aléatoires reproductible
function hasardReproductible(graine) {
  let a = graine >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Crée une simulation. Les heures sont en minutes depuis "t0".
//   options.intervalle : minutes entre deux trams (sinon tiré entre 4 et 12)
//   options.tauxErreur : part des arrêts qui ne répondent pas (défaut 4 %)
//   options.perturbe   : intervalles très irréguliers, trams qui se collent
//                        jusqu'à 1 min l'un de l'autre (sinon au moins 2 min)
function creerSimulation(graine, options) {
  options = options || {};
  const hasard = hasardReproductible(graine);
  const N = 25;
  const sim = {
    N: N,
    t0: 1763000000000,
    hasard: hasard,
    arrondi: hasard() < 0.5 ? Math.floor : Math.round, // Stan arrondit d'une façon ou d'une autre
    tauxErreur: options.tauxErreur === undefined ? 0.04 : options.tauxErreur,
    sens: {}
  };

  for (const sens of ["A", "B"]) {
    // Vrai temps de trajet de chaque tronçon : entre 0,7 et 2,5 min
    const troncons = [0];
    for (let p = 1; p < N; p++) troncons.push(0.7 + hasard() * 1.8);

    const intervalle = options.intervalle || 4 + hasard() * 8;
    const trams = [];
    let depart = -90;
    while (depart < 260) {
      const arrivees = [depart];
      for (let p = 1; p < N; p++) {
        // chaque tram roule un peu plus ou moins vite (±15 %)
        arrivees.push(arrivees[p - 1] + troncons[p] * (0.85 + hasard() * 0.3));
      }
      // pas de dépassement : toujours un peu derrière le tram de devant
      const ecartMini = options.perturbe ? 1 : 2;
      const devant = trams[trams.length - 1];
      if (devant) {
        for (let p = 0; p < N; p++) arrivees[p] = Math.max(arrivees[p], devant.arrivees[p] + ecartMini);
      }
      trams.push({ numero: trams.length, arrivees: arrivees });
      // intervalles irréguliers
      depart += intervalle * (options.perturbe ? 0.6 + hasard() * 0.8 : 0.75 + hasard() * 0.5);
    }
    sim.sens[sens] = { troncons: troncons, trams: trams, intervalle: intervalle };
  }
  return sim;
}

function enMs(sim, minutes) { return sim.t0 + minutes * 60000; }
function rangSim(sim, sens, i) { return sens === "A" ? i : sim.N - 1 - i; }

// Ce que Stan répondrait à l'arrêt i (0 = Brabois) à l'instant t (ms)
// → [ { direction, minutes: [..] } ] comme lirePassages()
function reponseSimulee(sim, i, t) {
  const directions = [];
  for (const sens of ["A", "B"]) {
    const p = rangSim(sim, sens, i);
    if (p === sim.N - 1) continue; // terminus d'arrivée : pas d'horaire dans ce sens
    const prochains = sim.sens[sens].trams
      .map(function (tram) { return enMs(sim, tram.arrivees[p]); })
      .filter(function (h) { return h >= t - 20000; })
      .sort(function (a, b) { return a - b; })
      .slice(0, 2)
      .map(function (h) { return Math.max(0, sim.arrondi((h - t) / 60000)); });
    if (prochains.length) {
      directions.push({
        direction: sens === "A" ? "Essey Mouzimpré" : "Vandoeuvre Brabois Hôpitaux",
        minutes: prochains
      });
    }
  }
  return directions;
}

// La même chose sous forme de HTML, comme le vrai site Stan
function htmlSimule(sim, i, t) {
  let html = '<ul class="tpsreel-liste">';
  for (const d of reponseSimulee(sim, i, t)) {
    html += '<li><div class="tpsreel-destination"><span>Direction ' + d.direction + "</span></div>";
    for (const m of d.minutes) {
      html += '<a class="tpsreel-temps-item">' + (m === 0 ? '<i class="icon-car1"></i>' : m + " min") + "</a>";
    }
    html += "</li>";
  }
  return html + "</ul>";
}

// VÉRITÉ : trams sur la ligne à l'instant t → [ { numero, position (rang décimal) } ]
//   un tram qui attend au terminus et part dans moins de "attenteMax" minutes
//   est compté à la position 0 ; un tram arrivé au terminus n'est plus compté
function tramsEnLigne(sim, sens, t, attenteMax) {
  const resultat = [];
  for (const tram of sim.sens[sens].trams) {
    const a = tram.arrivees.map(function (m) { return enMs(sim, m); });
    if (a[0] > t) {
      if (a[0] - t <= (attenteMax || 0) * 60000) resultat.push({ numero: tram.numero, vers: 0, position: 0 });
      continue;
    }
    let p = 1;
    while (p < sim.N && a[p] <= t) p++;
    if (p >= sim.N) continue; // arrivé
    const frac = Math.min(1, Math.max(0, (t - a[p - 1]) / (a[p] - a[p - 1])));
    resultat.push({ numero: tram.numero, vers: p, position: p - 1 + frac });
  }
  return resultat;
}

// VÉRITÉ : heures (ms) des prochains passages au rang p, à partir de t
function passagesReels(sim, sens, p, t) {
  return sim.sens[sens].trams
    .map(function (tram) { return enMs(sim, tram.arrivees[p]); })
    .filter(function (h) { return h > t - 20000; })
    .sort(function (a, b) { return a - b; });
}

if (typeof module !== "undefined") {
  module.exports = { creerSimulation, reponseSimulee, htmlSimule, tramsEnLigne, passagesReels, enMs, hasardReproductible };
}
