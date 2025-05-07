//DOCUMENT RENDU PLUS LISIBLE GRACE A TCHAT GPT (code original by BIMATHAX)

//// SUPPRIMER LIGNE 42 UNE FOIS LE SITE FINI 

// Lorsque la page est complètement chargée, ajuste dynamiquement la hauteur
// de la section de résultats pour qu'elle occupe l'espace restant.
window.addEventListener('load', () => {
    const inputSection = document.getElementById('input_section');
    const resultSection = document.getElementById('result_section');

    function adjustResultSectionHeight() {
        const rect = inputSection.getBoundingClientRect();
        const bottomY = rect.bottom + window.scrollY;

        // Définir la hauteur minimale de result_section pour remplir le reste de la page
        resultSection.style.minHeight = `calc(100vh - ${bottomY}px)`;
    }

    // Calcul initial de la hauteur
    adjustResultSectionHeight();

    // Recalcule la hauteur si la taille de la fenêtre change
    window.addEventListener('resize', adjustResultSectionHeight);
});

// Fonction utilitaire pour supprimer les accents d'un texte
function removeAccents(str) {
    /*
    .normalize("NFD") : transforme les caractères accentués en lettre de base + diacritique

    Exemple : "é" devient "e" + ◌́

    La RegExp /[\u0300-\u036f]/g supprime ces diacritiques (les marques d'accent)
    */
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


// Fonction pour récupérer les données depuis une URL (avec désactivation du cache)
async function getData(url) {
    try {
        const url_ = `${url}?t=${Date.now()}`; // Ajouter un timestamp pour éviter le cache pendant le dev
        rep = await fetch(url_)
        if (!rep.ok) {
            throw new Error(`Response Status (from fetch ${url_}) : ${rep.status}`)
        }
        const data = await rep.json(); // Parse le JSON et le retourne
        return data;
    } catch (error) {
        console.error(error.message)
    }
}

// Récupère le JSON index des cours depuis le fichier `index.json`
async function get_index() {
    currentUrl = window.location.href.split('/').slice(0,-1).join("/");
    if (currentUrl.split('/')[0] == 'file:') {
        // Si le site est ouvert en local, définir l'URL par défaut
        currentUrl = "http://localhost:8000"
    }
    database = currentUrl + "/cours/index.json"
    data = await getData(database)
    return data
}

// Fonction appelée quand on clique sur une carte de cours
function div_click(url) {
    window.location.href = url; // Redirige vers la page du cours
}

// Fonction principale : recherche les cours correspondant aux mots saisis
async function find_matches(txt) {
    /**
     * Analyse le texte fourni pour trouver les cours correspondants
     * à partir d'un index JSON, en se basant sur les mots clés du texte
     * comparés aux titres, tags, auteurs et descriptions des cours.
     * Les résultats sont triés par pertinence et affichés sous forme de cartes.
     */

    data = await get_index(); // Récupère l'index des cours
    cours = {}; // Dictionnaire avec le nom du cours comme clé et une "note de pertinence" en valeur

    txt.split(' ').forEach(word => {
        word = removeAccents(word.toLowerCase()); // Nettoyage du mot-clé

        // Recherche dans les titres de fichiers (PATHNAME)
        Object.keys(data).forEach(title => {
            if (removeAccents(title).toLowerCase().split(word).length >= 2) {
                cours[title] = (cours[title] || 0) + word.length;
            }
        });
        console.log('PATH')
        console.log(cours)

        // Recherche dans les noms des cours
        Object.keys(data).forEach(title => {
            if (removeAccents(data[title].name).toLowerCase().split(word).length >= 2) {
                cours[title] = (cours[title] || 0) + word.length;
            }
        });
        console.log('NAME')
        console.log(cours)

        // Recherche dans les tags associés
        Object.keys(data).forEach(title => {
            data[title].tags.forEach(tag => {
                if (removeAccents(tag).toLowerCase().split(word).length >= 2) {
                    cours[title] = (cours[title] || 0) + word.length;
                }
            })
        });
        console.log('TAG')
        console.log(cours)

        // Recherche dans les descriptions
        Object.keys(data).forEach(title => {
            if (removeAccents(data[title].description).toLowerCase().split(word).length >= 2) {
                cours[title] = (cours[title] || 0) + word.length;
            }
        });
        console.log('DESCRIPTION')
        console.log(cours)

        // Recherche dans les noms d'auteurs
        Object.keys(data).forEach(title => {
            if (removeAccents(data[title].author).toLowerCase().split(word).length >= 2) {
                cours[title] = (cours[title] || 0) + word.length;
            }
        });
        console.log('AUTHOR')
        console.log(cours)
    });

    // Tri des résultats par pertinence décroissante (valeur la plus élevée en premier)
    const cours_sorted = Object.entries(cours)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]); // Récupère uniquement les titres triés

    // Préparation de l'affichage des résultats
    const resultSection = document.getElementById('result_section');
    resultSection.innerHTML = ''; // Vide la section précédente

    url_ = window.location.href.split('/').slice(0, -1).join("/");

    // Génération dynamique d'une "carte" HTML pour chaque cours trouvé
    cours_sorted.forEach(cours => {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('onclick', `div_click('${url_}/cours/${cours}/index.html')`);

        // En-tête avec icône et nom du cours
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = `<span class="icon">📖</span><h2>${data[cours].name}</h2>`;

        // Affichage des tags (max 2)
        const tagContainer = document.createElement('div');
        tagContainer.className = 'tag';
        n=0
        data[cours].tags.forEach(tag => {
            const badge = document.createElement('div');
            if (n<2) {
                badge.className = 'badge';
            } else {
                badge.className = 'badge hidden';
            }
            
            badge.textContent = tag;
            tagContainer.appendChild(badge);
            n=n+1
        });

        // Description du cours
        const description = document.createElement('p');
        description.className = 'description';
        description.textContent = data[cours].description;

        // Informations complémentaires : date de mise à jour et auteur
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `<span>Dernière mise à jour : ${data[cours].date}</span><span>Auteur : ${data[cours].author}</span>`;

        // Boutons d'action (actuellement : juste "ouvrir")
        const actions = document.createElement('div');
        actions.className = 'actions';

        const openBtn = document.createElement('button');
        openBtn.textContent = '📄 Ouvrir';
        actions.appendChild(openBtn);

        // Ajout des éléments à la carte
        card.appendChild(header);
        card.appendChild(tagContainer);
        card.appendChild(description);
        card.appendChild(meta);
        card.appendChild(actions);

        // Ajout de la carte à la page
        resultSection.appendChild(card);
    });

    //Ajoute l'animation des TAG (badge)
    document.querySelectorAll('.card').forEach(card => {
        const badges = card.querySelectorAll('.badge');
        Array.from(badges).slice(1).forEach((badge, index) => {
            badge.style.transitionDelay = `${index * 100}ms`;
        });
    });

    //Si il n'y a pas de cours correspondant
    if (Object.keys(cours).length == 0) {
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
        img.style.width = '100px';

        // Crée le texte
        const p = document.createElement('p');
        p.textContent = "Hummmmm ne serait-il pas l'heure de la pause café ?";
        p.className = 'hubballi-regular';
        p.style.fontSize = "20px"

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

// Gère l'événement d'entrée de l'utilisateur dans la barre de recherche
document.getElementById('inputbox').addEventListener("input", async function () {
    txt = document.getElementById('inputbox').value;
    // Nettoyage du texte d'entrée : suppression des espaces inutiles
    txt = txt.split(' ').filter(item => item !== '').join(' ');
    console.log(txt);
    await find_matches(txt); // Appelle la fonction de recherche avec le texte nettoyé
});
