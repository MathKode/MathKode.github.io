function creation_prof_div(div_id) {
    // Transforme la div d'id <DIV-ID> en div création de prof
    div = document.getElementById(div_id)
    for (const child of div.children) {
        //Supprime l'affichage standard
        child.classList.add('disparition2')
        if (child.getAttribute("name") == "prof_creation") {
            child.classList.remove('disparition2')
        }
    }
}

function upperCaseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function sort_liste_by_alphabetic(liste_) {
    liste_ = liste_.sort(function (a, b) {
        if (a[0] < b[0]) {
          return -1;
        }
        if ( a[0] > b[0]) {
            return 1;
        }
        return 0;
    });

    return liste_;
}

function bad_word_test(word) {
    //https://raw.githubusercontent.com/darwiin/french-badwords-list/master/lib/array.js
    bad_word_ls = ['macron','lepen','pen','poutou','hitler','adlof','oppeinheimer','zemmour','zemour','melenchon','melanchon','abruti', 'andouille', 'avorton', 'batard', 'beauf', 'biatch', 'bicot', 'bite', 'bitembois', 'bordel', 'bouffon', 'bougnoul', 'bougnoule', 'Bougnoulie', 'bougnoulisation', 'bougnouliser', 'bougre', 'boukak', 'bounioul', 'bourdille', 'bouseux', 'branler', 'branleur', 'branque', 'cacou', 'cafre', 'caldoche', 'chachar', 'chagasse', 'chauffard', 'chiennasse', 'chier', 'chieur', 'chieurs', 'chinetoc', 'chinetoque', 'chintok', 'chleuh', 'chnoque', 'coche', 'con', 'conard', 'conasse', 'conchier', 'connard', 'connarde', 'connasse', 'conne', 'cons', 'couille', 'couilles', 'couillon', 'couillonner', 'counifle', 'courtaud', 'cretin', 'crevard', 'crevure', 'cricri', 'crotte', 'crouillat', 'crouille', 'cul', 'debile', 'deguelasse', 'demerder', 'drouille', 'ducon', 'duconnot', 'dugenoux', 'dugland', 'duschnock', 'emmanche', 'emmerder', 'emmerdeur', 'emmerdeuse', 'empafe', 'empapaoute', 'encule', 'enculer', 'enculeur', 'enflure', 'enfoire', 'envaselineur', 'epais', 'espingoin', 'etron', 'fdp', 'feignasse', 'fiotte', 'fouteur', 'foutre', 'fritz', 'fumier', 'garce', 'gaupe', 'gdm', 'gland', 'glandeur', 'glandeuse', 'glandouillou', 'glandu', 'gnoul', 'gnoule', 'godon', 'gogol', 'gouilland', 'gouine', 'gourde', 'gourgandine', 'grognasse', 'gueniche', 'guindoule', 'imbecile', 'kikoo', 'kikou', 'kraut', 'lacheux', 'lavette', 'lopette', 'magot', 'makoume', 'manche', 'marchandot', 'margouilliste', 'mauviette', 'merdaille', 'merdaillon', 'merde', 'merdeux', 'merdouillard', 'michto', 'minable', 'minus', 'miserable', 'moinaille', 'monacaille', 'moricaud', 'nase', 'naze', 'negro', 'niac', 'niaiseux', 'niakoue', 'nique', 'niquer', 'ntm', 'pakos', 'panoufle', 'patarin', 'pd', 'pecque', 'pedale', 'pede', 'pedoque', 'pequenaud', 'pet', 'petasse', 'peteux', 'pignouf', 'pisseux', 'pissou', 'pleutre', 'plouc', 'porcas', 'porcasse', 'poucav', 'pouf', 'pouffiasse', 'poufiasse', 'pounde', 'pourriture', 'punaise', 'putain', 'pute', 'putin', 'queutard', 'raclure', 'raton', 'ripopee', 'robespierrot', 'rosbif', 'roulure', 'sagouin', 'salaud', 'sale', 'salop', 'salopard', 'salope', 'saloperie', 'satrouille', 'schbeb', 'schleu', 'schnoc', 'schnock', 'schnoque', 'sottiseux', 'stearique', 'tafiole', 'tantouserie', 'tantouze', 'tapette', 'tarlouze', 'tebe', 'teteux', 'teube', 'tocard', 'trainee', 'trouduc', 'truiasse', 'vaurien', 'viedase', 'vier', 'xeropineur', 'yeule', 'youd', 'youpin', 'youpine', 'youpinisation', 'youtre', 'zguegue']
    for (const bad_word of bad_word_ls) {
        if (word.toLowerCase().indexOf(bad_word) > -1)
        {
            alert("bad word found inside your_string");
            return false;
        }
    }
    return true;
}

function name_is_it_ok(name) {
    if (/^[a-zA-Z]+$/.test(name) && bad_word_test(name) && name.length<15) {
        //Verifie qu'il n'est pas dans la liste
        alone=true
        for (const prof of liste) {
            if (prof[0].toString().toLowerCase() == name.toLowerCase()) {
                alert("Ce prof existe déjà !")
                alone=false
            }
        }
        return alone;
    }
    return false;
}
function does_he_agree_the_rules() {
    agree = false
    for (const cookie of document.cookie.split(";")) {
        nom = cookie.split("=")[0].split(" ").join('')
        valeur = cookie.split("=")[1]
        if (nom==="knowrules" && valeur==="IDO") {
            agree = true
        }
    }
    return agree
}
function create_prof() {
    name_prof = upperCaseFirstLetter(document.getElementById("new_prof_name").value)
    matiere_prof = Number(document.getElementById("new_prof_matiere").value)

    agree = does_he_agree_the_rules()
    if (agree == false) {
        if (confirm("Attention :\nConfirmez-vous que le nom n'est ni vulgaire, ni haineux ni raciste ?\nEn cas de non respect de cette règle vous serrez ban.")) {
            document.cookie = "knowrules=IDO; expires=Fri, 31 Dec 9999 23:59:59 GMT; Path=/";
            if (name_is_it_ok(name_prof)) {
                middle_div = document.getElementById("middle_div")
                middle_div.style.animation = 'none';
                middle_div.offsetHeight;
                middle_div.style.animation = null;
                middle_div.style.animation =  "0.8s green"
                send_new_prof([[name_prof,matiere_prof]]) //Envoie le nouveau prof
                //SUITE DANS Send_info.js
            }
        } else {
            alert("Tu ne peux pas ajouter de prof si tu n'acceptes pas ces règles (il est interdit de dénigrer un prof dans son nom /sinon ban/... Si tu le trouves mauvais alors met lui une mauvaise note)")
        }
    } else {
        if (name_is_it_ok(name_prof)) {
            middle_div = document.getElementById("middle_div")
            middle_div.style.animation = 'none';
            middle_div.offsetHeight;
            middle_div.style.animation = null;
            middle_div.style.animation =  "0.8s green"
            send_new_prof([[name_prof,matiere_prof]]) //Envoie le nouveau prof
            //SUITE DANS Send_info.js
        }
    }
}