// Recherche d'etablissement.
// Version vitrine : la requete POST vers Django est remplacee par une
// recherche locale dans static/data/data.js (voir CTP.searchEcoles).
var input = document.getElementById("myInput");
var suggestionsContainer = document.getElementById("autocomplete-suggestions");

var schools = [];

function getData() {
    schools = [];
    for (const ecole of CTP.searchEcoles(input.value)) {
        schools.push([ecole.recherche, ecole.id]); // [ [Name, Id], [Name, Id] ]
    }

    // Clear previous suggestions
    suggestionsContainer.innerHTML = "";

    if (schools.length === 0) {
        suggestionsContainer.style.display = "none";
        return;
    }

    // Display suggestions
    for (const ecole of schools) {
        //Show the suggestion container
        suggestionsContainer.style.display = "block";

        //Add the suggestion
        var suggestion = document.createElement("div");
        suggestion.className = "autocomplete-suggestion";
        suggestion.innerHTML = ecole[0];

        // Handle suggestion click
        suggestion.onclick = function () {
            input.value = ecole[0];
            window.location = "school.html?id=" + ecole[1];
        };

        suggestionsContainer.appendChild(suggestion);
    }
}

// Add input event listener
input.addEventListener("input", getData);
input.addEventListener("focus", getData);

// Bouton "Rechercher" : ouvre le premier resultat
function exit() {
    var res = CTP.searchEcoles(input.value);
    if (res.length > 0) {
        window.location = "school.html?id=" + res[0].id;
    } else {
        getData();
    }
}

// Hide suggestions when clicking outside the input and suggestions container
document.addEventListener("click", function (e) {
    if (e.target !== suggestionsContainer && e.target !== input &&
        e.target.className !== "autocomplete-suggestion") {
        suggestionsContainer.style.display = "none";
    }
});
