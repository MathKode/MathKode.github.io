//liste = [['AAA'],['Ata'],['tab'],['mange'], [-1]]
//liste_visible = [['AAA'],['BBB'],['RRR'],['ZZZ']]
function search_input() {
	value = document.getElementById('search_input').value;
    document.getElementById('new_prof_name').value = value; //Met la valeur rechercher dans l'input de créer un prof
    console.log("value",value)
    match_ls = []
    for (const prof of liste) {
        if (prof[0] == -1) {
    	    match_ls.push(prof)
        } else {
            //console.log("prof",prof)
            //console.log(prof[0].toLowerCase().split(value.toLowerCase()))
            if (prof[0].toLowerCase().split(value.toLowerCase()).length > 1) {
                match_ls.push(prof)
            }
        }
    }
    console.log(liste_visible)
    liste_visible=match_ls.slice()
    index=0
    set_info(liste_visible, 0)
    
}