 

document.getElementById('input1').addEventListener("input", async function() {
    global_index = await get_index()
    txt = document.getElementById('input1').value
    console.log(txt)
    cours = get_similarity_tag(global_index,txt)
    get_similarity_name(global_index, txt).forEach(element => {
        if (!cours.includes(element)) {
            cours.push(element)
        }
    });
    console.log(cours)
    reponse_preload(global_index,cours)
})

function div_click(url) {
    window.location.href = url; // Redirige vers l'URL passée
}

function reponse_preload(index, cours) {
    const container = document.getElementById('input_result');
    
    container.innerHTML = ''; //supprime tout

    url_ = window.location.href.split('/').slice(0,-1).join("/");
    if (cours.length >= 15) {
        cours = cours.slice(0,14)
    }
    cours.forEach(texte => {
        // Créer le bloc .response
        const responseDiv = document.createElement('div');
        responseDiv.className = 'response';
    
        // Créer le h2
        const h2 = document.createElement('h2');
        h2.className = 'response_txt exo-2-400';
        h2.textContent = index[texte].name;

        responseDiv.setAttribute('onclick', `div_click('${url_}/cours/${texte}/index.html')`);
        /*// Ajouter un gestionnaire d'événement 'click' sur la div .response
        responseDiv.addEventListener('click', () => {
            // Créer l'URL avec le texte
            const lien = `html://${texte}`;
            // Rediriger vers le lien
            window.location.href = lien;
        });*/
    
        // Assembler et insérer dans le container
        responseDiv.appendChild(h2);
        container.appendChild(responseDiv);
    });
    if (cours.length == 0) {
        //Ajout du message de recherche + poussée
        const container = document.getElementById('input_result');

        // Vérifie que l'élément existe
        if (!container) {
            console.error("Élément avec l'id 'input_result' introuvable.");
            return;
        }

        // Crée le bloc HTML
        const bloc = document.createElement('div');
        bloc.innerHTML = `
            <div style="display:grid; justify-content:center; text-align:center;" onclick="window.location.href = window.location.href.split('/').slice(0,-1).join('/') + '/search.html' + '?value=' + document.getElementById('input1').value">
              
                <div>
                    <img src="https://cdn-icons-png.flaticon.com/512/2703/2703414.png" width="50px">
                </div>
                <h1 class="hubballi-regular" style="font-size:20px;">
                    Aucun cours dans les parages.
                </h1>   
                <h1 class="hubballi-regular" style="font-size:16px;">
                    Clique sur la loupe pour une recherche approfondie !
                </h1>
            </div>
        `;

        // Ajoute au container
        container.appendChild(bloc);
    }
}


//FADE OUT effect Search
const fadeBtn = document.getElementById('searchbt');
const fadeOverlay = document.getElementById('white-fade');

fadeBtn.addEventListener('click', () => {
    fadeOverlay.classList.add('active');

    
    setTimeout(() => {
        
        window.location.href = window.location.href.split('/').slice(0,-1).join('/') + '/search.html'
    }, 500); // correspond à 0.5s = durée du transition
    setTimeout(() => {
        // Optionnel : retirer la classe après animation si besoin (onlaisse 2seconde pour changer de page, sinon on retire l'écran blanc)
        fadeOverlay.classList.remove('active'); 
    }, 2000);
});




const fadeBtn2 = document.getElementById('search-button');
const fadeOverlay2 = document.getElementById('white-fade');

fadeBtn2.addEventListener('click', () => {
    fadeOverlay2.classList.add('active');

    setTimeout(() => {
        
        window.location.href = window.location.href.split('/').slice(0,-1).join('/') + '/search.html'
    }, 500); // correspond à 0.5s = durée du transition
    setTimeout(() => {
        // Optionnel : retirer la classe après animation si besoin (onlaisse 2seconde pour changer de page, sinon on retire l'écran blanc)
        fadeOverlay.classList.remove('active'); 
    }, 2000);
});