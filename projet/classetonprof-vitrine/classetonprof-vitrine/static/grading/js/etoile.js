function etoile(div_id, number) {
    //Colorie en Jaune
    div = document.getElementById(div_id);
    index_=0;
    for (const child of div.children){
        if (index_ <= number) {
            child.classList.add('etoile_yellow');
        } else {
            child.classList.remove('etoile_yellow');
        }
        index_+=1;
    }
}
function re_etoile(div_id, number) {
    //Enlève la Couleur Jaune
    div = document.getElementById(div_id);
    for (const child of div.children){
        child.classList.remove('etoile_yellow');
    }
}
function set_etoile(div_id, number) {
    //Choix définitif
    div = document.getElementById(div_id);
    index_=0;
    for (const child of div.children){
        if (index_ <= number) {
            child.classList.add('etoile_yellow_end');
        } else {
            child.classList.remove('etoile_yellow_end');
        }
        index_+=1
    }
    //Sauvegarde
    dic_div = { "et1":1,
                "et2":2,
                "et3":3 }
    
    id_prof = liste_visible[index][5]
    
    tour=0
    for (const prof of liste) {
        if (prof[5]==id_prof) {
            //   <index prof> <Note 1, 2 ou 3 à modif ?>
            liste[tour][dic_div[div_id]] = number 
        }
        tour += 1
    }
    console.log("SAVE -- DATA")
    send_prof()
    console.log("Data is sended")
}
/*
dic_div = { "et1":0,
                "et2":0,
                "et3":0,
                "et1_next":1,
                "et2_next":1,
                "et3_next":1,
                "et1_next_next":2,
                "et2_next_next":2,
                "et3_next_next":2,
                "et1_old":-1,
                "et2_old":-1,
                "et3_old":-1,
                "et1_old_old":-2,
                "et2_old_old":-2,
                "et3_old_old":-2
            }
*/
