/* ---------------------------------------------------------------------------
   red_flag.js - version vitrine
   La requete POST vers /red_flag/ est remplacee par un enregistrement local.
--------------------------------------------------------------------------- */

function red_flag() {
    //Ajoute 1 Red flag
    prof_index = liste_visible[index][5];
    console.log("RED Flag id :", prof_index);

    if (prof_index === undefined || liste_visible[index][0] === -1) { return; }

    alert(CTP.signaler(prof_index));
}
