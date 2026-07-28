/* ============================================================
   COMPTES COMMUNS — accès au classeur Google Sheets

   Ce fichier ne connaît rien de l'interface : il sait seulement
   parler au script publié. Toute la logique d'affichage est dans
   app.js. Pour changer un jour de solution de stockage, il suffit
   de réécrire ce fichier en gardant les quatre mêmes fonctions.
   ============================================================ */

const Classeur = (function () {

  /**
   * Envoie une commande d'écriture.
   * Le type « text/plain » est volontaire : il évite la requête de
   * contrôle CORS qu'Apps Script ne sait pas traiter. Le contenu
   * envoyé reste bien du JSON.
   */
  async function ecrire(charge) {
    const r = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(charge),
      redirect: 'follow'
    });
    const res = await r.json();
    if (!res.ok) throw new Error(res.erreur || 'Écriture refusée.');
    return res;
  }

  return {

    /** Lit toutes les dépenses. Renvoie un tableau, la plus récente en tête. */
    async lire() {
      // L'horodatage empêche le navigateur de servir une réponse en cache
      const r = await fetch(SCRIPT_URL + '?t=' + Date.now(), { redirect: 'follow' });
      const res = await r.json();
      if (!res.ok) throw new Error(res.erreur || 'Lecture impossible.');
      return res.depenses;
    },

    /** Ajoute une dépense. */
    ajouter(qui, combien, motif) {
      return ecrire({ action: 'ajouter', qui, combien, motif });
    },

    /**
     * Supprime une dépense.
     * Le montant est transmis en plus du numéro de ligne pour que le
     * script vérifie qu'il efface bien la bonne, même si l'autre
     * personne a modifié le classeur entre-temps.
     */
    supprimer(ligne, combien) {
      return ecrire({ action: 'supprimer', ligne, combien });
    },

    /** Efface toutes les dépenses. */
    vider() {
      return ecrire({ action: 'vider' });
    }
  };

})();
