/* ---------------------------------------------------------------------------
   school/js/script.js
   ATTENTION : ce fichier ne faisait pas partie des sources fournies
   (deux fichiers "script.js" existaient, seul celui de la page contact a
   survecu). Il a ete reconstruit a partir de son utilisation dans school.html :
   moyenne_calcul(), sort_liste(), set_info(), new_table(), set_box_size(),
   note_page(), add_prof_page() et tier_list().
   ---------------------------------------------------------------------------
   Format de liste_prof en entree  : [ [NOM, Note1, Note2, Note3, Nb_votant] ]
   Format apres moyenne_calcul()   : [ [NOM, MOYENNE, Note1, Note2, Note3, Nb] ]
   ...ce qui correspond aux 6 colonnes du tableau.
--------------------------------------------------------------------------- */

// Au chargement, school.html affiche la liste par ordre alphabetique et la
// petite fleche est deja dans la 1ere colonne : on part donc de cet etat.
var colonne_triee = 0;
var ordre_tri = 1;       // 1 : croissant / -1 : decroissant

function arrondi(n) {
    return Math.round(Number(n) * 100) / 100;
}

// Ajoute la moyenne des 3 notes en position 1
function moyenne_calcul(liste_prof) {
    var resultat = [];
    for (const prof of liste_prof) {
        var moyenne = (Number(prof[1]) + Number(prof[2]) + Number(prof[3])) / 3;
        resultat.push([prof[0], arrondi(moyenne),
                       arrondi(prof[1]), arrondi(prof[2]), arrondi(prof[3]),
                       Number(prof[4])]);
    }
    return resultat;
}

// Trie la liste selon la colonne <colonne> ; ordre = 1 (croissant) ou -1
function sort_liste(liste_prof, colonne, ordre) {
    return liste_prof.slice().sort(function (a, b) {
        var va = a[colonne];
        var vb = b[colonne];
        if (typeof va === "string" || typeof vb === "string") {
            va = String(va).toLowerCase();
            vb = String(vb).toLowerCase();
        }
        if (va < vb) { return -1 * ordre; }
        if (va > vb) { return 1 * ordre; }
        return 0;
    });
}

// Remplit le corps du tableau
function set_info(liste_prof) {
    var corps = document.getElementById("tableau_body");
    corps.innerHTML = "";
    for (const prof of liste_prof) {
        var ligne = document.createElement("tr");

        var nom = document.createElement("td");
        nom.className = "text-gauche";
        nom.innerText = prof[0];
        ligne.appendChild(nom);

        for (var i = 1; i <= 5; i++) {
            var cell = document.createElement("td");
            cell.className = "text-center";
            if (i < 5 && Number(prof[5]) === 0) {
                cell.innerText = "-";           // prof pas encore note
            } else {
                cell.innerText = prof[i];
            }
            ligne.appendChild(cell);
        }
        corps.appendChild(ligne);
    }
    liste_prof_affichee = liste_prof;
}

// Clic sur un en-tete de colonne
function new_table(colonne) {
    if (colonne === colonne_triee) {
        ordre_tri = ordre_tri * -1;             // on inverse le sens
    } else {
        colonne_triee = colonne;
        ordre_tri = (colonne === 0) ? 1 : -1;   // A->Z pour les noms, sinon 5->1
    }

    // Deplace la petite fleche sur la colonne triee
    var entetes = document.querySelectorAll("#tableau .titre-colonne");
    for (var i = 0; i < entetes.length; i++) {
        var fleche = entetes[i].querySelector(".fleche");
        if (fleche) { fleche.remove(); }
        if (i === colonne) {
            var span = document.createElement("span");
            span.className = "fleche";
            if (ordre_tri === 1) { span.style.display = "inline-block"; span.style.transform = "rotate(180deg)"; }
            entetes[i].appendChild(document.createTextNode(" "));
            entetes[i].appendChild(span);
        }
    }

    set_info(sort_liste(liste_prof_affichee, colonne, ordre_tri));
}

// Appelee par <body onresize="set_box_size();">
function set_box_size() {
    var podium = document.querySelector(".rank-leaderboard");
    if (!podium) { return; }
    if (window.innerWidth <= 600) {
        podium.style.width = "98vw";
    } else {
        podium.style.width = "auto";
    }
}

/* --- Navigation (remplace les URL Django /grading/<id>/ ...) ------------- */
function note_page(ecole_id) {
    window.location = "grading.html?id=" + ecole_id;
}

function add_prof_page(ecole_id) {
    window.location = "grading.html?id=" + ecole_id + "&create_prof=1";
}

function tier_list(ecole_id) {
    window.location = "tierlist.html?id=" + ecole_id;
}

document.getElementById("logo").addEventListener("click", function () {
    window.location = "index.html";
});

set_box_size();
