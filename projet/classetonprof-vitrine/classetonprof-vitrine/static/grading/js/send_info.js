/* ---------------------------------------------------------------------------
   send_info.js - version vitrine
   Les deux requetes XMLHttpRequest vers Django sont remplacees par des
   ecritures locales (localStorage). Le reste de la logique est inchange.
--------------------------------------------------------------------------- */

function send_prof() {
    // Sauvegarde les notes du visiteur (remplace le cookie "old" cote serveur)
    for (const prof of liste) {
        if (prof[0] === -1) { continue; }               // div "ajouter un prof"
        var notes = [prof[1], prof[2], prof[3]];
        if (notes[0] === -1 && notes[1] === -1 && notes[2] === -1) { continue; }
        CTP.setNote(ECOLE_ID, prof[5], notes);
    }
    console.log("Notes sauvegardees localement");
}

function send_new_prof(new_prof) {
    var reponse = CTP.createProf(ECOLE_ID, new_prof[0][0], new_prof[0][1]);

    if (reponse === "EXIST") {
        alert("Ce prof existe deja !");
        return;
    }

    document.getElementById("new_prof_name").value = "";

    new_prof = [[name_prof, -1, -1, -1, matiere_prof, Number(reponse)]]; //Crée le nouveau prof

    //Ajoute le nouveau prof à la liste "liste"
    l1 = liste.slice(0, liste.length - 1);
    l2 = liste.slice(liste.length - 1);
    l1 = l1.concat(new_prof);
    liste = l1.concat(l2);

    console.log("Prof Crée !");
    document.getElementById("new_prof_name").value = "";
    document.getElementById("new_prof_matiere").value = '1';

    liste = sort_liste_by_alphabetic(liste);
    liste_visible = liste;

    //Cherche l'index du nouveau prof
    i = index + 1;
    tour = 0;
    for (const prof of liste_visible) {
        if (prof[0] == name_prof) {
            i = tour;
        }
        tour += 1;
    }
    index = i;
    set_info(liste_visible, index);
}
