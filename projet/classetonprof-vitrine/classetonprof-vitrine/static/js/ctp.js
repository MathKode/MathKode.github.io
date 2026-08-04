/*
 * ClasseTonProf - couche "backend" de la version vitrine
 * ---------------------------------------------------------------------------
 * Ce fichier remplace TOUT ce que faisait Django/MySQL cote serveur :
 *   views.py            -> CTP.getEcole / CTP.getProfs / CTP.searchEcoles
 *   new_db_request.py   -> lecture de window.CTP_DATA (static/data/data.js)
 *   cookie "old" + IP   -> localStorage (avec repli en memoire)
 *
 * Les formules de recalcul de moyenne sont exactement celles de la vue
 * grading_page() de views.py :
 *   - 1ere note   : (moyenne * nb_votants + note) / (nb_votants + 1)
 *   - correction  : ((moyenne * nb_votants - ancienne) + note) / nb_votants
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  /* --- Stockage sur (localStorage si dispo, sinon memoire) ---------------- */
  var memoire = {};
  var dispo = (function () {
    try {
      window.localStorage.setItem("__ctp__", "1");
      window.localStorage.removeItem("__ctp__");
      return true;
    } catch (e) {
      return false; // navigation privee, file:// verrouille, iframe sandbox...
    }
  })();

  function lire(cle, defaut) {
    try {
      var brut = dispo ? window.localStorage.getItem(cle) : memoire[cle];
      return brut ? JSON.parse(brut) : defaut;
    } catch (e) {
      return defaut;
    }
  }

  function ecrire(cle, valeur) {
    var brut = JSON.stringify(valeur);
    try {
      if (dispo) window.localStorage.setItem(cle, brut);
      else memoire[cle] = brut;
    } catch (e) {
      memoire[cle] = brut;
    }
  }

  var CLE_NOTES = "ctp_notes";      // notes donnees par le visiteur
  var CLE_PROFS = "ctp_profs";      // profs ajoutes par le visiteur
  var CLE_FLAGS = "ctp_flags";      // signalements du visiteur

  /* --- Utilitaires -------------------------------------------------------- */
  function sansAccent(txt) {
    return String(txt)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function parametre(nom) {
    var m = new URLSearchParams(window.location.search);
    return m.get(nom);
  }

  /* --- Etablissements ----------------------------------------------------- */
  function getEcole(id) {
    id = Number(id);
    var ls = window.CTP_DATA.ecoles;
    for (var i = 0; i < ls.length; i++) {
      if (ls[i].id === id) return ls[i];
    }
    return null;
  }

  // Equivalent de search_lycee() : tous les mots doivent apparaitre, 9 max.
  function searchEcoles(saisie) {
    var mots = String(saisie).split(" ").filter(function (m) { return m !== ""; });
    var res = [];
    var ls = window.CTP_DATA.ecoles;
    for (var i = 0; i < ls.length && res.length < 9; i++) {
      var cible = sansAccent(ls[i].recherche);
      var ok = true;
      for (var j = 0; j < mots.length; j++) {
        if (cible.indexOf(sansAccent(mots[j])) === -1) { ok = false; break; }
      }
      if (ok) res.push(ls[i]);
    }
    return res;
  }

  /* --- Professeurs -------------------------------------------------------- */
  function profsBruts(ecoleId) {
    ecoleId = Number(ecoleId);
    var ls = window.CTP_DATA.profs.filter(function (p) {
      return p.lycee_id === ecoleId;
    });
    var ajoutes = lire(CLE_PROFS, []).filter(function (p) {
      return p.lycee_id === ecoleId;
    });
    return ls.concat(ajoutes).map(function (p) {
      var c = {};
      for (var k in p) c[k] = p[k];
      return c;
    });
  }

  function getNotes(ecoleId) {
    var tout = lire(CLE_NOTES, {});
    return tout[String(ecoleId)] || {};
  }

  function setNote(ecoleId, profId, notes) {
    var tout = lire(CLE_NOTES, {});
    var ecole = tout[String(ecoleId)] || {};
    ecole[String(profId)] = notes;
    tout[String(ecoleId)] = ecole;
    ecrire(CLE_NOTES, tout);
  }

  /*
   * Liste des profs avec la moyenne "publique" recalculee en tenant compte
   * du vote du visiteur (comme le faisait la base de donnees).
   */
  function getProfs(ecoleId) {
    var mesNotes = getNotes(ecoleId);
    return profsBruts(ecoleId).map(function (p) {
      var mien = mesNotes[String(p.id)];
      if (!mien) return p;
      var notes = [p.note1, p.note2, p.note3];
      var nb = [p.n1, p.n2, p.n3];
      for (var i = 0; i < 3; i++) {
        if (mien[i] === undefined || mien[i] === -1) continue;
        notes[i] = (notes[i] * nb[i] + mien[i]) / (nb[i] + 1);
        nb[i] = nb[i] + 1;
      }
      p.note1 = notes[0]; p.note2 = notes[1]; p.note3 = notes[2];
      p.n1 = nb[0]; p.n2 = nb[1]; p.n3 = nb[2];
      return p;
    });
  }

  // Equivalent de create_prof() : refuse les doublons dans le meme lycee.
  function createProf(ecoleId, nom, matiere) {
    ecoleId = Number(ecoleId);
    var existants = profsBruts(ecoleId);
    for (var i = 0; i < existants.length; i++) {
      if (String(existants[i].nom).toLowerCase() === String(nom).toLowerCase()) {
        return "EXIST";
      }
    }
    var ajoutes = lire(CLE_PROFS, []);
    var maxId = 1000;
    window.CTP_DATA.profs.concat(ajoutes).forEach(function (p) {
      if (p.id > maxId) maxId = p.id;
    });
    var prof = {
      id: maxId + 1,
      lycee_id: ecoleId,
      nom: nom,
      matiere: Number(matiere),
      note1: -1, note2: -1, note3: -1,
      n1: 0, n2: 0, n3: 0,
      red_flag: 0
    };
    ajoutes.push(prof);
    ecrire(CLE_PROFS, ajoutes);
    return String(prof.id);
  }

  /* --- Signalements (red flag) ------------------------------------------- */
  function signaler(profId) {
    var ls = lire(CLE_FLAGS, []);
    if (ls.indexOf(Number(profId)) !== -1) {
      return "Vous avez deja signale ce prof";
    }
    ls.push(Number(profId));
    ecrire(CLE_FLAGS, ls);
    return "Signalement realise avec succes : nous analyserons votre demande !"
         + "\n\n(Demo : aucune donnee n'est envoyee, tout reste dans ce navigateur.)";
  }

  /* --- Remise a zero de la demo ------------------------------------------ */
  function reset() {
    [CLE_NOTES, CLE_PROFS, CLE_FLAGS].forEach(function (cle) {
      try { if (dispo) window.localStorage.removeItem(cle); } catch (e) {}
      delete memoire[cle];
    });
  }

  window.CTP = {
    stockagePersistant: dispo,
    parametre: parametre,
    sansAccent: sansAccent,
    getEcole: getEcole,
    searchEcoles: searchEcoles,
    getProfs: getProfs,
    getNotes: getNotes,
    setNote: setNote,
    createProf: createProf,
    signaler: signaler,
    reset: reset
  };
})();
