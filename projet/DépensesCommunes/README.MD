# Comptes communs — installation

Site statique sur GitHub Pages, dépenses stockées dans un Google Sheet.
Gratuit, sans compte à créer, sans mot de passe.

```
index.html    structure de la page
style.css     mise en forme
config.js     l'URL de votre script (à remplir)
sheet.js      dialogue avec le classeur
app.js        interface et calculs
Code.gs       à coller dans le classeur, pas sur le site
```

---

## 1. Préparer le classeur

Créez un Google Sheet, renommez la première feuille **Dépenses**, et mettez
cette ligne d'en-tête en ligne 1 :

| A | B | C | D |
|---|---|---|---|
| quand | qui | combien | motif |

Laissez la suite vide, le site s'en occupe.

## 2. Publier le script

1. Dans le classeur : **Extensions → Apps Script**.
2. Effacez le code présent, collez tout `Code.gs`, enregistrez.
3. **Déployer → Nouveau déploiement**, type **Application web**, avec :
   - *Exécuter en tant que* : **moi**
   - *Qui a accès* : **tout le monde**
4. Google demande une autorisation. L'écran « Cette application n'est pas
   vérifiée » est normal, c'est votre propre script : **Paramètres avancés →
   Accéder à…**
5. Copiez l'URL fournie, qui se termine par `/exec`.

Le choix *exécuter en tant que moi* est ce qui rend l'ensemble possible sans
mot de passe : c'est votre compte Google qui écrit dans le classeur, le site
ne fait que le lui demander.

## 3. Brancher le site

Collez l'URL dans `config.js`, poussez les cinq fichiers du site à la racine
du dépôt, puis **Settings → Pages → Deploy from a branch → main / (root)**.

Ne mettez pas `Code.gs` en ligne : il vit uniquement dans le classeur.

---

## Bon à savoir

**Modifier le classeur à la main fonctionne.** Ajoutez ou corrigez une ligne
directement dans Google Sheets, le site la reprendra. Il se resynchronise à
chaque fois que l'onglet redevient actif : basculez sur une autre application
puis revenez, et l'affichage est à jour.

**La colonne `qui` accepte `Mathis` ou `Eline`**, majuscules indifférentes.
Une autre valeur fait basculer la ligne du côté d'Eline.

**Après chaque modification de `Code.gs`**, il faut redéployer
(*Déployer → Gérer les déploiements → crayon → Version : nouvelle*),
sinon Google continue de servir l'ancienne version.

**L'URL du script est publique.** Toute personne qui la trouve peut lire et
modifier les dépenses, mais pas accéder au reste de votre compte Google : le
script ne touche qu'à ce seul classeur. C'est le compromis choisi pour se
passer de mot de passe.

**Sauvegarde.** Google conserve l'historique complet du classeur
(*Fichier → Historique des versions*), y compris après un « tout effacer ».
