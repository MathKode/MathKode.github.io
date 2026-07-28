/* ============================================================
   COMPTES COMMUNS — logique d'interface
   Sommaire :
     1. État et formats
     2. Chargement et synchronisation
     3. Actions (ajouter, retirer, tout effacer)
     4. Calculs
     5. Rendu de l'interface
     6. Remise à zéro
     7. Feuille de saisie
     8. Message temporaire et démarrage
   ============================================================ */


/* ---------- 1. État et formats ---------- */

let items = [];              // dépenses affichées, la plus récente en premier
let payer = 'mathis';        // personne sélectionnée dans la feuille de saisie

// Formats français créés une seule fois (leur construction est coûteuse)
const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const day  = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

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
    console.log(e)
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

/** Efface toutes les dépenses. */
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

/** Somme dépensée par chacun. */
function totals() {
  let m = 0, e = 0;
  for (const it of items) {
    it.who === 'mathis' ? m += it.amount : e += it.amount;
  }
  return { m, e };
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
  const { m, e } = totals();
  $('sumM').textContent = euro.format(m);
  $('sumE').textContent = euro.format(e);

  // Barre de répartition : largeurs proportionnelles, 50/50 si aucune dépense
  const tot = m + e;
  $('segM').style.width = (tot ? m / tot * 100 : 50) + '%';
  $('segE').style.width = (tot ? e / tot * 100 : 50) + '%';

  renderVerdict(m, e, tot);
  renderCount();
  renderList();
  renderReset();
}

/**
 * Phrase de conclusion.
 * On divise l'écart par deux : pour égaliser deux comptes qui diffèrent
 * de 20 €, il suffit d'un remboursement de 10 €.
 */
function renderVerdict(m, e, tot) {
  const v = $('verdict');
  const diff = Math.abs(m - e) / 2;

  if (!tot) {
    v.className = 'verdict balanced';
    v.textContent = 'Aucune dépense enregistrée.';
  } else if (diff < 0.005) {              // écart inférieur à un demi-centime
    v.className = 'verdict balanced';
    v.textContent = 'Tout est équilibré.';
  } else {
    const debtor   = m > e ? 'Eline'  : 'Mathis';
    const creditor = m > e ? 'Mathis' : 'Eline';
    v.className = 'verdict';
    v.innerHTML = debtor + ' doit <strong>' + euro.format(diff) +
                  '</strong> <span class="arrow">→</span> ' + creditor;
  }
}

function renderCount() {
  $('count').textContent = items.length
    ? items.length + (items.length > 1 ? ' dépenses' : ' dépense')
    : 'Dépenses';
}

function renderList() {
  const list = $('list');
  list.innerHTML = '';

  if (!items.length) {
    const d = document.createElement('div');
    d.className = 'empty';
    d.innerHTML = '<b>Rien pour le moment</b>Ajoutez votre première dépense avec le bouton +.';
    list.appendChild(d);
    return;
  }

  for (const it of items) {
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

    list.appendChild(li);
  }
}

/** Le classeur peut renvoyer une date ISO ou du texte saisi à la main. */
function dateCourte(v) {
  const d = new Date(v);
  return isNaN(d) ? String(v) : day.format(d);
}


/* ---------- 6. Remise à zéro ---------- */

/**
 * Le bouton corbeille n'existe que s'il y a quelque chose à effacer.
 * La confirmation s'affiche sur place, à la place du bouton.
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
  box.innerHTML = 'Effacer&nbsp;?';

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
