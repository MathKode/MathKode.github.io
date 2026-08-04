# ClasseTonProf — version vitrine (100 % statique)

Version statique du projet Django **ClasseTonProf**, utilisable sans serveur,
sans Python et sans base de données. Le CSS et l'affichage d'origine sont
conservés à l'identique.

---

## Lancer le site

**Le plus simple :** double-clique sur `index.html`.

Pour un rendu strictement identique à la production (certains navigateurs
restreignent le stockage local en `file://`), sers le dossier :

```bash
cd classetonprof-vitrine
python3 -m http.server 8000
# puis http://localhost:8000
```

**Mise en ligne :** dépose le dossier tel quel sur GitHub Pages, Netlify,
Vercel, ou n'importe quel hébergement mutualisé. Aucune configuration.

---

## Ce qui a remplacé Django

| Avant | Après |
|---|---|
| `/` | `index.html` |
| `/school/<id>/` | `school.html?id=1` |
| `/grading/<id>/` | `grading.html?id=1` |
| `/tierlist/<id>/` | `tierlist.html?id=1` |
| `/about/` `/contact/` `/404/` | `about.html` `contact.html` `404.html` |
| tables MySQL `lycee` + `prof2all` | `static/data/data.js` |
| `views.py` + `new_db_request.py` | `static/js/ctp.js` |
| cookie `old` + table `ip` | stockage local du navigateur |

Les formules de recalcul de moyenne sont **exactement** celles de
`grading_page()` dans `views.py` :

- première note : `(moyenne × votants + note) / (votants + 1)`
- correction : `((moyenne × votants − ancienne) + note) / votants`

Les notes sont stockées de 0 à 4 comme en base, et affichées +1 (sur 5),
comme le faisait `school_page()`.

---

## Les données

`static/data/data.js` contient :

- **9 établissements réels**, extraits de ton `lycee.csv` :
  Henri Poincaré (Nancy), Frédéric Chopin (Nancy), Jacques Callot
  (Vandœuvre), Louis Majorelle (Toul), Henri-IV (Paris), du Parc (Lyon),
  Thiers (Marseille), Fustel de Coulanges (Strasbourg) et Poudlard
  (déjà présent en dur dans ton `create_lycee_database.py`).
- **96 professeurs entièrement fictifs** : noms inventés, notes et nombres
  de votants tirés au sort. Aucune personne réelle n'est concernée.

### Ajouter un établissement

```js
// dans ecoles
{ "id": 10, "nom": "Lycée Machin", "type": "Public",
  "addr": "1 rue X - 54000 Nancy", "ville": "Nancy",
  "recherche": "Lycee Machin (Nancy)" }   // sans accents : sert à la recherche
```

### Ajouter un professeur

```js
// dans profs — matiere : 1 Maths, 2 SVT, 3 Physique, 4 Anglais, 5 Espagnol,
// 6 Allemand, 7 Philo, 8 Histoire, 9 EMC, 10 Musique, 11 Art, 12 EPS
{ "id": 500, "lycee_id": 10, "nom": "Dupont", "matiere": 1,
  "note1": 3.2, "note2": 2.8, "note3": 3.5,   // de 0 à 4
  "n1": 42, "n2": 40, "n3": 38, "red_flag": 0 }
```

---

## Ce que fait le visiteur

Noter un prof, en ajouter un, faire une tier list et la télécharger en PNG :
tout fonctionne. Les modifications sont enregistrées **dans le navigateur du
visiteur uniquement** — rien n'est envoyé nulle part, et les données de départ
ne bougent jamais. Chaque visiteur retrouve donc une démo propre.

Pour repartir de zéro, dans la console du navigateur :

```js
CTP.reset(); location.reload();
```

---

## ⚠️ Fichiers CSS/JS reconstruits

Quatre fichiers **manquaient dans les sources** que tu m'as transmises :
plusieurs pages utilisaient un `style.css` ou un `script.js` différent portant
le même nom, et un seul exemplaire de chaque a survécu à la mise à plat du
dossier.

Fichiers reconstruits (à partir des classes réellement utilisées dans les
templates et de la charte du projet) :

- `static/index/css/style.css`
- `static/school/css/style.css`
- `static/school/css/media_phone.css`
- `static/school/js/script.js`
- `static/tierlist/css/style.css`

Chacun porte un en-tête qui le signale. **Les chemins sont identiques à ceux
de la version Django** : si tu retrouves tes originaux, tu les colles
par-dessus et tout redevient exactement comme avant.

Tous les autres fichiers CSS et images sont tes originaux, copiés à l'octet
près.

---

## Arborescence

```
classetonprof-vitrine/
├── index.html          accueil + recherche d'établissement
├── school.html         classement + tableau des profs
├── grading.html        notation par étoiles (le cœur du site)
├── tierlist.html       tier list glisser-déposer + export PNG
├── about.html          conditions d'utilisation
├── contact.html        formulaire de contact (mailto)
├── 404.html
└── static/
    ├── data/data.js    les établissements et les profs
    ├── js/ctp.js       le « backend »
    ├── index/          css + js de l'accueil
    ├── school/         css + js de la page lycée
    ├── grading/        css, js et icônes de la page de notation
    ├── tierlist/       css + js de la tier list
    └── contact/        css + js du contact
```

---

## Dépendances externes

Le site fonctionne hors-ligne, à deux détails près hérités du projet
d'origine : les icônes **Font Awesome** (kit CDN) et **html2canvas** pour
l'export PNG de la tier list. Sans connexion, les icônes ne s'affichent pas et
le bouton « Sauvegarder les données » reste inactif — le reste marche.
