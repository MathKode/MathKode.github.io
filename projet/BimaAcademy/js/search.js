//// SUPPRIMER LIGNE 26 UNE FOIS LE SITE FINI 

//LOADING function = Pour pouvoir set la taille de la section 2
window.addEventListener('load', () => {
    const inputSection = document.getElementById('input_section');
    const resultSection = document.getElementById('result_section');

    function adjustResultSectionHeight() {
        const rect = inputSection.getBoundingClientRect();
        const bottomY = rect.bottom + window.scrollY;

        // Appliquer une hauteur dynamique à result_section
        resultSection.style.minHeight = `calc(100vh - ${bottomY}px)`;
    }

    // Appel initial
    adjustResultSectionHeight();

    // Recalculer si la fenêtre est redimensionnée
    window.addEventListener('resize', adjustResultSectionHeight);
});

//SUPPRIME LES ACCENTS
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
/*
.normalize("NFD") : transforme les caractères accentués en lettre de base + diacritique

Exemple : "é" devient "e" + ◌́

La RegExp /[\u0300-\u036f]/g supprime ces diacritiques (les marques d'accent)
*/


//Search fonction avancé +++ par rapport à la fonction de base de l'accueil
async function getData(url) {
    try {
        const url_ = `${url}?t=${Date.now()}`; //TRES IMPORTANT -> Evite le cache le temps que le site est en développement
        rep = await fetch(url_)
        if (!rep.ok) {
            throw new Error(`Response Status (from fetch ${url_}) : ${rep.status}`)
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

function div_click(url) {
    window.location.href = url; // Redirige vers l'URL passée
}

async function find_matches(txt) {
    /**
     * Analyse le texte fourni pour trouver les cours correspondants
     * à partir d'un index JSON, en se basant sur les mots clés du texte
     * comparés aux titres, tags, auteurs et descriptions des cours.
     * Les résultats sont triés par pertinence et affichés sous forme de cartes.
     */

    //Cut the txt into word
    data = await get_index()
    console.log(data)
    cours = {} //Creation d'un dico avec "NOM COURS" : nb occurence
    txt.split(' ').forEach(word => {
        word = removeAccents(word.toLowerCase())
        console.log(word)
        
        //check PATHNAME
        Object.keys(data).forEach(title => {
            if (removeAccents(title).toLowerCase().split(word).length >= 2) {
                if (cours[title] == undefined) {
                    cours[title] = word.length
                } else {
                    cours[title] = cours[title] + word.length
                }
                //console.log(word + " -> dans la data PATH :" + title)
            }
        });
        console.log("Après PATH : ")
        console.log(cours)
        
        //check COURSENAME
        Object.keys(data).forEach(title => {
            if (removeAccents(data[title].name).toLowerCase().split(word).length >= 2) {
                if (cours[title] == undefined) {
                    cours[title] = word.length
                } else {
                    cours[title] = cours[title] + word.length
                }
                //console.log(word + " -> dans la data COURS :" + data[title].name)
            }
        });
        console.log("Après COURS : ")
        console.log(cours)

        //check TAGS
        Object.keys(data).forEach(title => {
            data[title].tags.forEach(tag => {
                if (removeAccents(tag).toLowerCase().split(word).length >= 2) {
                    if (cours[title] == undefined) {
                        cours[title] = word.length
                    } else {
                        cours[title] = cours[title] + word.length
                    }
                    //console.log(word + " -> dans la data TAG :" + tag)
                }
            })
        });
        console.log("Après TAGS : ")
        console.log(cours)

        //check DESCRIPTION
        Object.keys(data).forEach(title => {
            if (removeAccents(data[title].description).toLowerCase().split(word).length >=2) {
                if (cours[title] == undefined) {
                    cours[title] = word.length
                } else {
                    cours[title] = cours[title] + word.length
                }
                //console.log(word + " -> dans la data DESCRIPTION :" + data[title].description)
            }

        });
        console.log("Après DESCRIPTION : ")
        console.log(cours)

        //check AUTHOR
        Object.keys(data).forEach(title => {
            if (removeAccents(data[title].author).toLowerCase().split(word).length >=2) {
                if (cours[title] == undefined) {
                    cours[title] = word.length
                } else {
                    cours[title] = cours[title] + word.length
                }
                //console.log(word + " -> dans la data DESCRIPTION :" + data[title].description)
            }

        });
        console.log("Après Auteur : ")
        console.log(cours)
    });

    // Créer une liste triée des clés selon les valeurs (du plus grand au plus petit)
    const cours_sorted = Object.entries(cours)
        .sort((a, b) => b[1] - a[1]) // Trier par valeur décroissante
        .map(entry => entry[0]);     // Extraire les clés seulement
    
    console.log(cours_sorted)

    //Création des divs
    const resultSection = document.getElementById('result_section');
    resultSection.innerHTML = ''; //supprime tout

    url_ = window.location.href.split('/').slice(0,-1).join("/");

    // Génère dynamiquement une carte HTML pour chaque cours trouvé
    cours_sorted.forEach(cours => {
        /*
        const div = document.createElement('div');
        div.className = 'cours';
        div.setAttribute('onclick', `div_click('${url_}/cours/${cours}/index.html')`);

        const h1 = document.createElement('h1');
        h1.className = 'hubballi-regular';
        h1.textContent = data[cours].name;

        div.appendChild(h1);
        resultSection.appendChild(div);
        */



        const card = document.createElement('div');
        card.className = 'card';

        card.setAttribute('onclick', `div_click('${url_}/cours/${cours}/index.html')`);

        // Header
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = `<span class="icon">📖</span><h2>${data[cours].name}</h2>`;

        // Tags
        const tagContainer = document.createElement('div');
        tagContainer.className = 'tag';
        data[cours].tags.slice(0,2).forEach(tag => {
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = tag;
            tagContainer.appendChild(badge);
        });

        // Description
        const description = document.createElement('p');
        description.className = 'description';
        description.textContent = data[cours].description;

        // Meta info
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `<span>Dernière mise à jour : ${data[cours].date}</span><span>Auteur : ${data[cours].author}</span>`;

        // Actions
        const actions = document.createElement('div');
        actions.className = 'actions';

        const openBtn = document.createElement('button');
        openBtn.textContent = '📄 Ouvrir';
        actions.appendChild(openBtn);

        // Optionally add other buttons
        /*
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = '⬇️ Télécharger';
        actions.appendChild(downloadBtn);

        const favBtn = document.createElement('button');
        favBtn.textContent = '⭐ Favori';
        actions.appendChild(favBtn);
        */

        // Assemble the card
        card.appendChild(header);
        card.appendChild(tagContainer);
        card.appendChild(description);
        card.appendChild(meta);
        card.appendChild(actions);

        resultSection.appendChild(card);

        
    });
    //Si il n'y a pas de cours correspondant
    if (cours.length == 0) {
        //https://cdn-icons-png.flaticon.com/512/2917/2917114.png
        // Crée le conteneur principal
        const container = document.createElement('div');
        container.style.display = 'grid';
        container.style.placeItems = 'center';
        container.style.textAlign = 'center';
        container.style.width = '100%';

        // Crée l'image
        const img = document.createElement('img');
        img.src = 'https://cdn-icons-png.flaticon.com/512/2917/2917114.png';
        img.style.width = '50px';

        // Crée le texte
        const p = document.createElement('p');
        p.textContent = 'Pause café ?';
        p.style.fontFamily = 'sans-serif';

        // Assemble le tout
        container.appendChild(img);
        container.appendChild(p);

        // Ajoute à la div avec id=result_section
        const resultSection = document.getElementById('result_section');
        if (resultSection) {
            resultSection.appendChild(container);
        } else {
            console.warn("Aucune div avec l'ID 'result_section' trouvée.");
        }
    }

}

//INPUT
document.getElementById('inputbox').addEventListener("input", async function() {
    txt = document.getElementById('inputbox').value
    //Standardisation txt '  ok  ko ' -> 'ok ko' supprime les espaces useless
    txt = txt.split(' ').filter(item => item !== '').join(' ')
    console.log(txt)
    await find_matches(txt)
})