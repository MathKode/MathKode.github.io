# Quand partir ? — Tram T1 Stan

Petit site qui me dit à quelle heure partir de chez moi pour attraper le tram :

- **Montet Octroi** → direction Vandoeuvre Brabois Hôpitaux (3 min à pied)
- **Artem** → direction Essey Mouzimpré (5 min à pied)

En dessous, **le plan de toute la ligne T1** montre chaque tram en temps réel,
dans les deux sens.

Les horaires des 25 arrêts sont redemandés toutes les 30 s (pas quand l'onglet est caché).
Heure de départ = heure de passage du tram − temps à pied (− 1 min de marge si l'heure
n'est pas annoncée directement à mon arrêt).

## Comment les trams sont trouvés

Le site Stan ne donne que **2 trams par arrêt et par direction**. Le site interroge donc
**les 25 arrêts** et suit chaque tram sur toute la ligne (`js/suivi.js`).

**Un tram n'est jamais compté deux fois.** On parcourt les arrêts dans le sens de
circulation. Les trams ne se doublent pas, donc :

```
trams attendus à un arrêt = [trams situés entre l'arrêt d'avant et lui]
                            + [trams attendus à l'arrêt d'avant]
```

Le 1er tram attendu à l'arrêt d'avant devrait arriver vers « son heure là-bas + temps de
trajet ». Un tram annoncé nettement plus tôt (plus de `margeMemeTram` = 2 min) est un
**nouveau** tram ; sinon c'est **le même**. Ex. arrêt A dans 1 min, arrêt B (juste après)
dans 3 min → un seul tram, juste avant A. En cas de doute, c'est le même tram.

**Les temps de trajet entre arrêts sont appris** en observant les trams (un même tram vu à
deux arrêts qui se suivent), et gardés dans le navigateur pour la visite suivante.

Les trams d'une carte sont classés en 3 sortes :

| Sorte | D'où ça vient | Affichage |
|---|---|---|
| Annoncé | Stan l'annonce à mon arrêt | « tram à 11:09 » |
| Vu avant | Vu ailleurs sur la ligne + temps de trajet appris | « tram vers 11:09, vu à Vélodrome » |
| Estimé | Pas encore vu nulle part : écart habituel entre trams | « ≈11:12 », bordure en pointillés |

Comme toute la ligne est suivie, les trams sont connus environ **30 minutes à l'avance**,
donc les « estimés » n'apparaissent presque plus (seulement s'il manque des données).

## Le plan de la ligne

- Brabois en haut, Essey en bas. Colonne rouge à gauche : vers Essey (les trams descendent).
  Colonne bleue à droite : vers Brabois (les trams montent).
- Les chiffres : prochain passage à chaque arrêt, et le suivant en petit.
- Cercle plein : tram en route ou à quai. Cercle pointillé : tram au terminus qui part dans
  4 min ou moins. ★ : mes arrêts.
- Entre deux mises à jour, les trams avancent selon le temps écoulé.
- Limite : le dernier tronçon avant chaque terminus est peu visible, car Stan ne donne pas
  d'horaire d'arrivée au terminus.

## Vérifier les estimations

```
node tests/test-estimations.js            # trafic normal, 60 scénarios
node tests/test-estimations.js 60 perturbe # trams irréguliers qui se collent
python3 tests/test-navigateur.py           # site complet dans Chromium (nécessite Playwright)
```

Le test charge le vrai code du site et lui donne les réponses d'un **simulateur**
(`tests/simulateur.js`) dont on connaît la vérité : où sont les trams, quand ils passent.
Résultats obtenus (60 scénarios × 90 min, 4 % d'arrêts qui ne répondent pas) :

| | Trafic normal | Trafic perturbé |
|---|---|---|
| Trams comptés en trop sur le plan | 0,002 % | 0,003 % |
| Trams oubliés (hors dernier tronçon) | 0,5 % | 0,8 % |
| Erreur moyenne, heure annoncée par Stan | 0,4 min | 0,4 min |
| Erreur moyenne, heure déduite (vu ≤ 5 arrêts avant) | 0,5 min | 0,5 min |
| Erreur moyenne, heure déduite (vu plus loin) | 0,7 min | 0,8 min |
| Tram raté en suivant le grand horaire d'une carte | 0 % | 0,07 % |

Le simulateur n'est qu'une imitation de Stan : à vérifier aussi sur place.

## Organisation

| Fichier | Rôle |
|---|---|
| `index.html` | La structure de la page |
| `css/style.css` | L'apparence (PC + téléphone, mode sombre automatique) |
| `js/config.js` | **Les réglages** : relais, 25 arrêts, trajets, temps à pied, marges |
| `js/stan.js` | Demande les passages d'un arrêt, lit la réponse, reconnaît le sens |
| `js/suivi.js` | Suit chaque tram sur la ligne, apprend les temps de trajet, prévoit les passages |
| `js/affichage.js` | Fabrique les cartes et les écrit sur la page |
| `js/plan.js` | Dessine le plan de la ligne |
| `js/app.js` | Interroge les arrêts, calcule les départs, met tout à jour |
| `tests/` | Simulateur et tests des estimations (pas utilisés par la page) |
| `relais-cloudflare/worker.js` | Le relais à coller dans un Cloudflare Worker (pas utilisé par la page) |

## Pourquoi un relais ?

Le navigateur interdit à une page de lire les réponses d'un autre site (règle CORS).
Le Worker Cloudflare interroge le site Stan à la place de la page, puis lui renvoie
la réponse avec l'autorisation de la lire.

25 arrêts toutes les 30 s ≈ 72 000 requêtes par jour si la page reste ouverte et visible
en permanence, sous la limite gratuite de Cloudflare (100 000 par jour). La page arrête
d'interroger quand l'onglet est caché. Attention si plusieurs appareils restent ouverts en
même temps : augmenter `rafraichissement` dans `js/config.js`.

## Mettre le site en ligne avec GitHub Pages

1. Pousser ce dossier dans un dépôt GitHub.
2. Dans le dépôt : **Settings → Pages → Branch : main / (root) → Save**.
3. Le site est disponible à `https://TON-NOM.github.io/NOM-DU-DEPOT/`.

Conseillé ensuite : dans le Worker, remplacer `"Access-Control-Allow-Origin": "*"`
par `"https://TON-NOM.github.io"` pour que seul ton site puisse l'utiliser.

## Modifier

- **Temps à pied, direction** → `js/config.js`, liste `trajets`.
- **Plus prudent / moins prudent sur les doublons** → `margeMemeTram`.
- **Marge quand l'heure est déduite** → `margeSecurite`.
- **Cacher le plan** → `afficherPlan: false`.
- **Couleurs** → le bloc `:root` en haut de `css/style.css`.
- **Voir les réponses brutes du site Stan** → `debug: true` dans `js/config.js`, puis F12.
- **Remettre à zéro les temps de trajet appris** → dans la console (F12) :
  `localStorage.removeItem("t1-temps-de-parcours")`, puis recharger.
