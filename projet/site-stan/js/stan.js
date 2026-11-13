// =====================================================
//  STAN — demande les passages au relais et lit la réponse
// =====================================================

// Fabrique le texte envoyé au site Stan pour un trajet
// (même format que le site officiel)
function construireRequete(trajet) {
  const parametres = new URLSearchParams();
  parametres.append("requete", "tempsreel_submit");
  parametres.append("requete_val[arret]", trajet.arret);
  parametres.append("requete_val[arret_name]", trajet.arret_name);

  for (const cle in CONFIG.ligne) {
    parametres.append("requete_val[" + cle + "]", CONFIG.ligne[cle]);
  }

  return parametres.toString();
}

// Envoie la requête au relais et renvoie le HTML reçu
async function demanderPassages(trajet) {
  const reponse = await fetch(CONFIG.urlRelais, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body: construireRequete(trajet)
  });

  const html = await reponse.text();

  if (CONFIG.debug) {
    console.log("Réponse Stan pour " + trajet.nom + " :", html);
  }

  if (!reponse.ok || !html.includes("<li")) {
    throw new Error("réponse inattendue du site Stan");
  }

  return html;
}

// Transforme le HTML en liste de directions :
// [ { direction: "Essey Mouzimpré", minutes: [0, 5] }, ... ]
function lirePassages(html) {
  const page = new DOMParser().parseFromString(html, "text/html");
  const resultat = [];

  // Chaque <li> = une direction
  for (const ligne of page.querySelectorAll("li")) {
    const blocDirection = ligne.querySelector(".tpsreel-destination span");
    const direction = blocDirection.textContent.replace("Direction", "").trim();

    // Chaque case = un passage
    const minutes = [];
    for (const temps of ligne.querySelectorAll(".tpsreel-temps-item")) {
      const texte = temps.textContent.trim();
      const enHeure = texte.match(/(\d{1,2})h(\d{2})/); // ex. "14h32"

      if (temps.querySelector(".icon-car1")) {
        // Icône de tram sans texte = tram à l'arrêt
        minutes.push(0);
      } else if (enHeure) {
        // Parfois Stan donne une heure au lieu des minutes
        minutes.push(minutesJusqua(Number(enHeure[1]), Number(enHeure[2])));
      } else {
        const nombre = parseInt(texte); // "5 min" → 5
        if (!isNaN(nombre)) {
          minutes.push(nombre);
        }
      }
    }

    resultat.push({ direction: direction, minutes: minutes });
  }

  return resultat;
}

// Nombre de minutes entre maintenant et une heure donnée (ex. 14h32)
function minutesJusqua(heures, minutes) {
  const cible = new Date();
  cible.setHours(heures, minutes, 0, 0);

  // Heure déjà passée → c'est pour demain (tram après minuit)
  if (cible < new Date()) {
    cible.setDate(cible.getDate() + 1);
  }

  return Math.round((cible - new Date()) / 60000);
}

// Garde les minutes de la direction voulue (ex. "Brabois")
function minutesPourDirection(directions, morceauDuNom) {
  for (const d of directions) {
    if (d.direction.toLowerCase().includes(morceauDuNom.toLowerCase())) {
      return d.minutes;
    }
  }
  return [];
}
