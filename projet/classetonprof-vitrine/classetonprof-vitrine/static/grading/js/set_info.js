/*
liste=[["Prof1",-1,-1,-1,2],
       ["Prof2",-1,-1,-1,3],
       ["Prof3",-1,-1,-1,6],
       ["Prof4",-1,-1,-1,7],
       [-1,-1,-1,-1,1]]
*/
index=0
function remove_start(div) {
    //Objectif : supprimer les classes yellow start pour permettre de redéfinir de nouvelles classe
    // div = "et1" ou "et2_old" ...
    mid_div = document.getElementById(div)
    for (const child of mid_div.children){
        child.classList.remove('etoile_yellow_end');
        child.classList.remove('etoile_yellow');
    }
}
function remove_prof_div(div) {
    //Set the prof id to disparition2 and show the other
    for (const child of document.getElementById(div).children) {
        child.classList.remove('disparition2')
        if (child.getAttribute("name") == "prof_creation") {
            child.classList.add('disparition2')
        }
    }
} 

function set_prof_by_cookie(ls) {
    //Sert a metre a jour la liste des profs avec les notes deja donnees
    //VERSION VITRINE : les notes ne sont plus lues dans le cookie "old"
    //mais dans le stockage local (voir static/js/ctp.js).
    mes_notes = CTP.getNotes(ECOLE_ID)
    for (const current_prof of ls) {
        notes = mes_notes[String(current_prof[5])]
        if (notes) {
            console.log("Prof deja note par le visiteur : " + current_prof[0])
            current_prof[1] = Number(notes[0])
            current_prof[2] = Number(notes[1])
            current_prof[3] = Number(notes[2])
        }
    }
    console.log("New LS : ",ls)
    return ls
}

function set_info(liste_prof, index) {
    //Remplit tous les champs avec les infos de la liste_prof
    //OLD OLD DIV
    old_old_index = Number(index)-2
    if (old_old_index < 0){
        console.log("Pas assez de personne pour la div old old")
        document.getElementById("old_old_div").classList.add('disparition');
    } else {
        document.getElementById("old_old_div").classList.remove('disparition');
        document.getElementById("name_old_old").innerText = liste_prof[old_old_index][0]
        remove_start("et1_old_old")
        remove_start("et2_old_old")
        remove_start("et3_old_old")
        if (liste_prof[old_old_index][1] != -1) {
            etoile('et1_old_old', liste_prof[old_old_index][1])
        }
        if (liste_prof[old_old_index][2] != -1) {
            etoile('et2_old_old', liste_prof[old_old_index][2])
        }
        if (liste_prof[old_old_index][3] != -1) {
            etoile('et3_old_old', liste_prof[old_old_index][3])
        }
        set_matiere("icon_old_old",liste_prof[old_old_index][4])
    }
    //OLD DIV
    old_index = Number(index)-1
    if (old_index < 0){
        console.log("Pas de old div")
        document.getElementById("old_div").classList.add('disparition');
    } else {
        document.getElementById("old_div").classList.remove('disparition');
        document.getElementById("name_old").innerText = liste_prof[old_index][0]
        remove_start("et1_old")
        remove_start("et2_old")
        remove_start("et3_old")
        if (liste_prof[old_index][1] != -1) {
            etoile('et1_old', liste_prof[old_index][1])
        }
        if (liste_prof[old_index][2] != -1) {
            etoile('et2_old', liste_prof[old_index][2])
        }
        if (liste_prof[old_index][3] != -1) {
            etoile('et3_old', liste_prof[old_index][3])
        }
        set_matiere("icon_old",liste_prof[old_index][4])
    }
    //MIDDLE DIV
    index = Number(index)
    if (index >= liste_prof.length){
        console.log("Liste trop petite ") 
        //
        // AFFICHER LE MODULE CREATION PROF
        //
    } else {
        if (liste_prof[index][0] == -1) { //Verif si c'est la div création de prof
            console.log("DIV Création de PROF index middle-div")
            creation_prof_div("middle_div")
        } else {
            remove_prof_div("middle_div")
            document.getElementById("name").innerText = liste_prof[index][0]
            //remove only to DIVMIDDLE.classList.remove('etoile_yellow_end')
            remove_start("et1")
            remove_start("et2")
            remove_start("et3")
            if (liste_prof[index][1] != -1) {
                etoile('et1', liste_prof[index][1])
            }
            if (liste_prof[index][2] != -1) {
                etoile('et2', liste_prof[index][2])
            }
            if (liste_prof[index][3] != -1) {
                etoile('et3', liste_prof[index][3])
            }
            set_matiere("icon",liste_prof[index][4])
        }
    }

    //NEXT DIV
    next_index = Number(index)+1
    //Verif si y a assez de monde
    if (next_index >= liste_prof.length){
        console.log("ERR Next div can't find a teach")
        document.getElementById("next_div").classList.add('disparition');
    } else {
        document.getElementById("next_div").classList.remove('disparition');
        if (liste_prof[next_index][0] == -1) { //Verif si c'est la div création de prof
            console.log("DIV Création de PROF index next-div")
            creation_prof_div("next_div")
        } else {
            remove_prof_div("next_div")
            document.getElementById("name_next").innerText = liste_prof[next_index][0]
            remove_start("et1_next")
            remove_start("et2_next")
            remove_start("et3_next")
            if (liste_prof[next_index][1] != -1) {
                etoile('et1_next', liste_prof[next_index][1])
            }
            if (liste_prof[next_index][2] != -1) {
                etoile('et2_next', liste_prof[next_index][2])
            }
            if (liste_prof[next_index][3] != -1) {
                etoile('et3_next', liste_prof[next_index][3])
            }
            set_matiere("icon_next",liste_prof[next_index][4])
        }
    }

    //NEXT NEXT DIV
    next_next_index = Number(index)+2
    if (next_next_index >= liste_prof.length){ //Verif si on est a la fin de la liste
        console.log("Pas assez de prof pour next next div")
        document.getElementById("next_next_div").classList.add('disparition');
    } else {
        document.getElementById("next_next_div").classList.remove('disparition');
        if (liste_prof[next_next_index][0] == -1) { //Verif si c'est la div création de prof
            console.log("DIV Création de PROF index next-next-div")
            creation_prof_div("next_next_div")
        } else { //Sinon c'est un prof, soit autocomplete avec ses infos
            remove_prof_div("next_next_div")
            document.getElementById("name_next_next").innerText = liste_prof[next_next_index][0]
            remove_start("et1_next_next")
            remove_start("et2_next_next")
            remove_start("et3_next_next")
            if (liste_prof[next_next_index][1] != -1) {
                etoile('et1_next_next', liste_prof[next_next_index][1])
            }
            if (liste_prof[next_next_index][2] != -1) {
                etoile('et2_next_next', liste_prof[next_next_index][2])
            }
            if (liste_prof[next_next_index][3] != -1) {
                etoile('et3_next_next', liste_prof[next_next_index][3])
            }
            set_matiere("icon_next_next",liste_prof[next_next_index][4])
        }
    }
}
//liste = sort_liste_by_alphabetic(liste)
//set_info(liste,0)