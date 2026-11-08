/* ============================================================
   COMPTES COMMUNS — logique d'interface
   Sommaire :
     1. État et formats
     2. Chargement et synchronisation
     3. Actions (ajouter, retirer, tout effacer)
     4. Calculs (dont regroupement par mois)
     5. Rendu de l'interface
     6. Remise à zéro
     7. Feuille de saisie
     8. Message temporaire et démarrage

   Fonctionnement mensuel :
   rien n'est écrit dans le classeur à la fin du mois. Chaque dépense
   porte déjà sa date ; le site la range dans son mois au moment de
   l'affichage. Le compteur ne montre que le mois en cours, les mois
   passés apparaissent dans la liste sous forme de bilans dépliables.
   Avantage : aucun script à déclencher, aucun risque que les deux
   téléphones écrivent chacun leur propre « ligne de clôture ».
   ============================================================ */


/* ---------- 1. État et formats ---------- */

let items = [];              // toutes les dépenses, la plus récente en premier
let payer = 'mathis';        // personne sélectionnée dans la feuille de saisie
const moisOuverts = new Set(); // bilans dépliés, conservés entre deux rafraîchissements

// Formats français créés une seule fois (leur construction est coûteuse)
const euro    = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const day     = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const moisNom = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

const $ = id => document.getElementById(id);


/* ---------- 2. Chargement et synchronisation ---------- */

/**
 * Recharge tout depuis le classeur.
 * Le classeur reste la référence : après chaque écriture on relit,
 * ce qui récupère au passage les ajouts faits par l'autre personne.
 */
async function refresh() {
  try {
    const lignes = await Classeur.lire();
    items = lignes.map(d => ({
      ligne:  d.ligne,
      who:    d.qui === 'mathis' ? 'mathis' : 'eline',
      amount: d.combien,
      label:  d.motif || 'Dépense',
      date:   d.quand
    }));
    sync('Synchronisé');
  } catch (e) {
    sync('Hors ligne');
  }
  render();
}

// Le classeur peut être modifié par l'autre personne, ou à la main dans
// Google Sheets : on se resynchronise dès que l'onglet redevient actif.
// Cela suffit aussi à basculer sur le nouveau mois le 1er au matin.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refresh();
});


/* ---------- 3. Actions ---------- */

/**
 * Ajoute une dépense.
 * On l'affiche immédiatement, avant même la réponse du classeur :
 * l'écriture prend souvent une seconde, et attendre donnerait
 * l'impression que le bouton n'a pas fonctionné.
 */
async function addExpense(who, amount, label) {
  items.unshift({ ligne: null, who, amount, label, date: new Date().toISOString(), pending: true });
  render();
  sync('Enregistrement…');

  try {
    await Classeur.ajouter(who, amount, label);
    await refresh();
  } catch (e) {
    items.shift();                       // on retire la ligne provisoire
    render();
    console.log(e);
    sync('Hors ligne');
    toast("Ajout impossible. Vérifiez la connexion.");
  }
}

/** Retire une dépense, avec le même affichage immédiat. */
async function removeExpense(item) {
  const sauvegarde = items.slice();
  items = items.filter(x => x !== item);
  render();
  sync('Enregistrement…');

  try {
    await Classeur.supprimer(item.ligne, item.amount);
    await refresh();
  } catch (e) {
    items = sauvegarde;
    render();
    sync('Hors ligne');
    toast("Suppression impossible. Le classeur a peut-être changé.");
    refresh();
  }
}

/** Efface toutes les dépenses (tous les mois). */
async function removeAll() {
  const sauvegarde = items.slice();
  items = [];
  render();
  sync('Enregistrement…');

  try {
    await Classeur.vider();
    await refresh();
    toast('Compteurs remis à zéro.');
  } catch (e) {
    items = sauvegarde;
    render();
    sync('Hors ligne');
    toast("Effacement impossible. Vérifiez la connexion.");
  }
}


/* ---------- 4. Calculs ---------- */

/** Somme dépensée par chacun, sur la liste donnée. */
function totals(liste) {
  let m = 0, e = 0;
  for (const it of liste) {
    it.who === 'mathis' ? m += it.amount : e += it.amount;
  }
  return { m, e };
}

/**
 * Qui doit combien à qui.
 * On divise l'écart par deux : pour égaliser deux comptes qui diffèrent
 * de 20 €, il suffit d'un remboursement de 10 €.
 * Renvoie null si l'écart est inférieur à un demi-centime.
 */
function dette(m, e) {
  const diff = Math.abs(m - e) / 2;
  if (diff < 0.005) return null;
  return {
    debtor:   m > e ? 'Eline'  : 'Mathis',
    creditor: m > e ? 'Mathis' : 'Eline',
    diff
  };
}

/**
 * Clé du mois au format « 2026-11 ».
 * Calculée en heure LOCALE : une dépense saisie le 1er novembre à 0 h 30
 * (heure de Paris) est stockée « 2026-10-31T23:30Z » en UTC, mais doit
 * bien compter pour novembre.
 * Renvoie null si la date n'est pas lisible.
 */
function moisCle(v) {
  const d = new Date(v);
  if (isNaN(d)) return null;
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function moisCourant() {
  return moisCle(new Date());
}

/** « 2026-10 » → « Octobre 2026 » */
function libelleMois(cle) {
  if (!cle) return 'Date non reconnue';
  const [a, m] = cle.split('-').map(Number);
  const s = moisNom.format(new Date(a, m - 1, 1));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Regroupe les dépenses par mois, du plus récent au plus ancien.
 * Les dates illisibles forment un dernier groupe à part.
 */
function parMois() {
  const groupes = new Map();
  for (const it of items) {
    const k = moisCle(it.date);
    if (!groupes.has(k)) groupes.set(k, []);
    groupes.get(k).push(it);
  }
  return [...groupes.entries()].sort((a, b) => {
    if (a[0] === null) return 1;
    if (b[0] === null) return -1;
    return b[0].localeCompare(a[0]);
  });
}

/**
 * Convertit une saisie libre en nombre.
 * Accepte « 12,50 », « 12.50 », « 12,50 € » et arrondit au centime.
 */
function parseAmount(s) {
  const n = parseFloat(String(s).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}


/* ---------- 5. Rendu de l'interface ---------- */

function render() {
  // Le compteur ne prend en compte que le mois en cours
  const cur = moisCourant();
  const duMois = items.filter(it => moisCle(it.date) === cur);

  const { m, e } = totals(duMois);
  $('sumM').textContent = euro.format(m);
  $('sumE').textContent = euro.format(e);

  // Barre de répartition : largeurs proportionnelles, 50/50 si aucune dépense
  const tot = m + e;
  $('segM').style.width = (tot ? m / tot * 100 : 50) + '%';
  $('segE').style.width = (tot ? e / tot * 100 : 50) + '%';

  renderVerdict(m, e, tot);
  renderCount(duMois.length, cur);
  renderList(duMois, cur);
  renderReset();
}

function renderVerdict(m, e, tot) {
  const v = $('verdict');
  const d = dette(m, e);

  if (!tot) {
    v.className = 'verdict balanced';
    v.textContent = 'Aucune dépense ce mois-ci.';
  } else if (!d) {
    v.className = 'verdict balanced';
    v.textContent = 'Tout est équilibré.';
  } else {
    v.className = 'verdict';
    v.innerHTML = d.debtor + ' doit <strong>' + euro.format(d.diff) +
                  '</strong> <span class="arrow">→</span> ' + d.creditor;
  }
}

/** En-tête de liste : « Novembre 2026 · 3 dépenses » */
function renderCount(n, cur) {
  $('count').textContent = libelleMois(cur) +
    (n ? ' · ' + n + (n > 1 ? ' dépenses' : ' dépense') : '');
}

function renderList(duMois, cur) {
  const list = $('list');
  list.innerHTML = '';

  // 1. Le mois en cours, ligne par ligne
  if (!duMois.length) {
    const d = document.createElement('div');
    d.className = 'empty';
    d.innerHTML = items.length
      ? '<b>Nouveau mois</b>Les compteurs repartent de zéro. Le bilan des mois précédents est juste en dessous.'
      : '<b>Rien pour le moment</b>Ajoutez votre première dépense avec le bouton +.';
    list.appendChild(d);
  }
  for (const it of duMois) list.appendChild(ligneDepense(it));

  // 2. Les mois passés, chacun résumé par un bilan dépliable
  for (const [cle, liste] of parMois()) {
    if (cle === cur) continue;
    list.appendChild(blocMois(cle, liste));
  }
}

/** Une ligne de dépense. */
function ligneDepense(it) {
  const li = document.createElement('li');
  li.className = 'row ' + (it.who === 'mathis' ? 'm' : 'e') + (it.pending ? ' pending' : '');
  const name = it.who === 'mathis' ? 'Mathis' : 'Eline';

  li.innerHTML =
    '<div class="meta">' +
      '<div class="label"></div>' +
      '<div class="sub">' + name + ' · ' + dateCourte(it.date) + '</div>' +
    '</div>' +
    '<div class="amt">' + euro.format(it.amount) + '</div>' +
    '<button class="kill" title="Retirer cette dépense" aria-label="Retirer la dépense de ' + name + '">−</button>';

  // Le motif est saisi par l'utilisateur : textContent évite qu'un
  // caractère comme « < » ne casse la page
  li.querySelector('.label').textContent = it.label;

  const kill = li.querySelector('.kill');
  // Tant que le classeur n'a pas répondu, la ligne n'a pas de numéro :
  // on ne peut pas encore la supprimer
  if (it.pending) kill.disabled = true;
  else kill.onclick = () => removeExpense(it);

  return li;
}

/**
 * Bilan d'un mois passé : total, part de chacun, qui doit quoi.
 * Un clic déplie les dépenses du mois.
 */
function blocMois(cle, liste) {
  const { m, e } = totals(liste);
  const d = dette(m, e);
  const n = liste.length;

  const li = document.createElement('li');
  li.className = 'month';

  const det = document.createElement('details');
  det.open = moisOuverts.has(cle);
  det.addEventListener('toggle', () => {
    det.open ? moisOuverts.add(cle) : moisOuverts.delete(cle);
  });

  const sum = document.createElement('summary');
  sum.innerHTML =
    '<div class="mhead">' +
      '<span class="mname">' + libelleMois(cle) + '</span>' +
      '<span class="mtotal">' + euro.format(m + e) + '</span>' +
    '</div>' +
    '<div class="msub">' +
      '<span class="m">Mathis ' + euro.format(m) + '</span> · ' +
      '<span class="e">Eline ' + euro.format(e) + '</span> · ' +
      n + (n > 1 ? ' dépenses' : ' dépense') +
    '</div>' +
    '<div class="mverdict">' +
      (d ? d.debtor + ' doit <strong>' + euro.format(d.diff) +
           '</strong> <span class="arrow">→</span> ' + d.creditor
         : 'Mois équilibré') +
    '</div>';

  const ul = document.createElement('ul');
  ul.className = 'list';
  for (const it of liste) ul.appendChild(ligneDepense(it));

  det.append(sum, ul);
  li.appendChild(det);
  return li;
}

/** Le classeur peut renvoyer une date ISO ou du texte saisi à la main. */
function dateCourte(v) {
  const d = new Date(v);
  return isNaN(d) ? String(v) : day.format(d);
}


/* ---------- 6. Remise à zéro ---------- */

/**
 * Le bouton corbeille n'existe que s'il y a quelque chose à effacer.
 * Il efface TOUS les mois : la remise à zéro mensuelle, elle, est
 * automatique et ne supprime rien.
 * @param {boolean} confirming - true pour afficher « Non / Oui, effacer »
 */
function renderReset(confirming) {
  const z = $('resetZone');
  z.innerHTML = '';
  if (!items.length) return;

  if (!confirming) {
    const b = document.createElement('button');
    b.className = 'ghost';
    b.innerHTML = '<span aria-hidden="true">🗑</span> Tout effacer';
    b.onclick = () => renderReset(true);
    z.appendChild(b);
    return;
  }

  const box = document.createElement('div');
  box.className = 'confirm';
  box.innerHTML = 'Tout l’historique&nbsp;?';

  const no = document.createElement('button');
  no.className = 'ghost';
  no.textContent = 'Non';
  no.onclick = () => renderReset(false);

  const yes = document.createElement('button');
  yes.className = 'ghost danger';
  yes.textContent = 'Oui, effacer';
  yes.onclick = removeAll;

  box.append(no, yes);
  z.appendChild(box);
}


/* ---------- 7. Feuille de saisie ---------- */

function openSheet() {
  $('veil').classList.add('open');
  $('amount').value = '';
  $('label').value = '';
  check();
  // Léger délai : le champ doit être visible avant de recevoir le focus
  setTimeout(() => $('amount').focus(), 60);
}

function closeSheet() {
  $('veil').classList.remove('open');
}

/** Le bouton « Ajouter » ne s'active qu'avec un montant strictement positif. */
function check() {
  const a = parseAmount($('amount').value);
  $('confirmAdd').disabled = !(a > 0);
}

// Choix du payeur : un seul bouton actif à la fois
document.querySelectorAll('.pick button').forEach(b => {
  b.onclick = () => {
    payer = b.dataset.p;
    document.querySelectorAll('.pick button').forEach(x =>
      x.setAttribute('aria-pressed', String(x === b)));
  };
});

// Ouverture / fermeture
$('add').onclick = openSheet;
$('cancel').onclick = closeSheet;
$('veil').onclick = ev => { if (ev.target === $('veil')) closeSheet(); };
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeSheet(); });

// Saisie au clavier : Entrée passe au champ suivant puis valide
$('amount').addEventListener('input', check);
$('amount').addEventListener('keydown', ev => { if (ev.key === 'Enter') $('label').focus(); });
$('label').addEventListener('keydown', ev => { if (ev.key === 'Enter') $('confirmAdd').click(); });

$('confirmAdd').onclick = () => {
  const amount = parseAmount($('amount').value);
  if (!(amount > 0)) return;
  const label = $('label').value.trim() || 'Dépense';
  closeSheet();
  addExpense(payer, amount, label);
};


/* ---------- 8. Message temporaire et démarrage ---------- */

let toastTimer;

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/** État de synchronisation affiché en pied de page. */
function sync(msg) {
  $('syncState').textContent = msg;
}

(async function init() {
  // Garde-fou : si config.js n'a pas été rempli, on le dit clairement
  if (SCRIPT_URL.includes('COLLEZ-VOTRE-URL-ICI')) {
    $('verdict').textContent = "Configuration incomplète : renseignez config.js.";
    sync('Non configuré');
    return;
  }
  sync('Chargement…');
  await refresh();
})();
