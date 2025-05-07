//alert('hello')

async function getData(url) {
    try {
        rep = await fetch(url)
        if (!rep.ok) {
            throw new Error(`Response Status (from fetch ${url}) : ${rep.status}`)
        }
        const data = await rep.json(); // attend et récupère l'objet JSON
        return data;
    } catch (error) {
        console.error(error.message)
    }
}

async function get_index() {
    currentUrl = window.location.href.split('/').slice(0,-1).join("/");
    if (currentUrl.split('/')[0] == 'file:') {
        //Je suis en local
        currentUrl = "http://localhost:8000"
    }
    database = currentUrl + "/cours/index.json"
    data = await getData(database)
    return data
}

function get_similarity_tag(index, txt) {
    // Recherche des similarité avec des tag pour proposer les cours correspondant
    cours_ok = []
    Object.keys(index).forEach(key => {
        tag_ls = index[key].tags
        already_push = false
        tag_ls.forEach(tag => {
            //Coupe le tag avec le txt si len >= 2 alors txt est présent
            if (tag.toLowerCase().split(txt.toLowerCase()).length >= 2 && !already_push) {
                cours_ok.push(key);
                already_push=true;
            }
        })
    })
    return cours_ok
}
function get_similarity_name(index, txt) {
    // Recherche des similarité avec des tag pour proposer les cours correspondant
    cours_ok = []
    Object.keys(index).forEach(key => {
        nom = index[key].name
        if (nom.toLowerCase().split(txt.toLowerCase()).length >= 2) {
            cours_ok.push(key)
        }
    })
    return cours_ok
}


