const cards = document.querySelectorAll(".card");
const addCard = document.querySelector("#addCard");
const resetButton = document.querySelector(".reset-button")

var card_text_selected = ""
var card_row_selected = ""
//liste = ['Delon', 'Aitailocin', 'Touveno', 'Troadec', 'Mtalaa', 'Da Rocha', 'Mazuet', 'Gross', 'Firoltz','Schlogel', 'Fehlen', 'Rivat']

/* Pour la logique des cartes */
let cardIdCounter = 0;

const createCard = (text) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.setAttribute("draggable", "true");
    card.id = `card-${cardIdCounter++}`; // Pour ids uniques
    card.ondragstart = onDragStart;
    card.ondragend = onDragEnd;
    card.onclick= function(cardEl) {
        text_card = cardEl.target.innerText
        parent_id = cardEl.target.parentElement.parentElement.id //ID de la div contenant la carte sélectionnée
        card_text_selected = text_card
        card_row_selected = parent_id
    }
    appendText(card, text);
    console.log("Carte ajoutee : " + text);
    return card;
}

const appendText = (card, text) => {
    const textElement = document.createElement("p");
    textElement.textContent = text;
    card.appendChild(textElement);
}

const onDragStart = (event) => {
    console.log("Entrain de drag l'element");
    event.dataTransfer.setData("id", event.target.id);
    setTimeout(() => {
        event.target.style.visibility = "hidden";
    }, 50)
}

const onDragEnd = (event) => {
    event.target.style.visibility = "visible";
    console.log("Drag finit");
}

cards.forEach((card) => {
    card.ondragstart = onDragStart;
    card.ondragend = onDragEnd;
});

/* Pour ajouter des cartes */
const addCardToBank = (event,text) => {
    const card = createCard(text);
    const bank= document.querySelector("#bank");
    bank.appendChild(card);
}

const resetTierList = (event) => {
    const willResetTierList = window.confirm("Voulez-vous vraiment remettre la tier list à 0 ?");
    if (willResetTierList) {
        const cards = document.querySelectorAll(".card");
        cards.forEach(function(card) {
            card.remove();
        });

        for (const prof of liste) {
            addCardToBank(event, prof);
        }
    }
}

tour=0

for (const prof of liste) {
    console.log("Nouveau Prof Ajoute : " + prof )
  
    addCardToBank(event, prof)
    tour+=1
}
  

function fix_card() {
		div = document.getElementById('fix-card')
    if (div.style.position != "fixed") {
    	div.style.position = "fixed"
        document.getElementById('bank').style.height = "60px";
        document.querySelector('#bt-fix').innerText = "Unfix"
    } else {
        
    	div.style.position = "";
        document.getElementById('bank').style.height = "auto";
        document.querySelector('#bt-fix').innerText = "Fixer"
    }
}

function addCard_to_row(row_id) {
    if (card_text_selected != "" && row_id != card_row_selected) {
        // Supp old div
        cardElements = document.getElementsByClassName('card')
        for (const card of cardElements) {
            if (card.innerText == card_text_selected) {
                card.style.display="none"
            }
        }
        // Ajout div
        card_move = createCard(card_text_selected)
        document.getElementById(row_id).appendChild(card_move)
        card_text_selected=""
    }
}

document.getElementById('row1').addEventListener('click', function (){
    addCard_to_row('row1')
})
document.getElementById('label-row1').addEventListener('click', function (){
    addCard_to_row('row1')
})

document.getElementById('row2').addEventListener('click', function (){
    addCard_to_row('row2')
})
document.getElementById('label-row2').addEventListener('click', function (){
    addCard_to_row('row2')
})

document.getElementById('row3').addEventListener('click', function (){
    addCard_to_row('row3')
})
document.getElementById('label-row3').addEventListener('click', function (){
    addCard_to_row('row3')
})

document.getElementById('row4').addEventListener('click', function (){
    addCard_to_row('row4')
})
document.getElementById('label-row4').addEventListener('click', function (){
    addCard_to_row('row4')
})

document.getElementById('row5').addEventListener('click', function (){
    addCard_to_row('row5')
})
document.getElementById('label-row5').addEventListener('click', function (){
    addCard_to_row('row5')
})

document.getElementById('row6').addEventListener('click', function (){
    addCard_to_row('row6')
})
document.getElementById('label-row6').addEventListener('click', function (){
    addCard_to_row('row6')
})

document.getElementById('bank').addEventListener('click', function (){
    addCard_to_row('bank')
})