// =====================================================
//  RELAIS STAN — à coller dans un Cloudflare Worker
//
//  Il reçoit la demande de mon site, la renvoie au site Stan
//  avec les bons en-têtes, puis rend la réponse à mon site
//  en autorisant la lecture (en-têtes CORS).
// =====================================================

const URL_STAN = "https://www.reseau-stan.com/?type=476";

// En-têtes qui autorisent mon site à lire la réponse.
// "*" = n'importe quel site. Pour limiter à mon site, mettre son adresse,
// ex. "https://monsite.fr"
const ENTETES_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type"
};

// En-têtes envoyés au site Stan (comme le vrai site)
const ENTETES_STAN = {
  "accept": "*/*",
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  "origin": "https://www.reseau-stan.com",
  "referer": "https://www.reseau-stan.com/",
  "x-requested-with": "XMLHttpRequest", // sinon le site répond "Ajax only"
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36"
};

export default {
  async fetch(requete) {
    // Le navigateur demande parfois la permission avant d'envoyer : on dit oui
    if (requete.method === "OPTIONS") {
      return new Response(null, { headers: ENTETES_CORS });
    }

    // On récupère le texte envoyé par mon site (l'arrêt, la ligne...)
    const corps = await requete.text();

    // On le transmet au site Stan
    const reponseStan = await fetch(URL_STAN, {
      method: "POST",
      headers: ENTETES_STAN,
      body: corps
    });

    const html = await reponseStan.text();

    // On renvoie la réponse de Stan à mon site, avec l'autorisation CORS
    return new Response(html, {
      status: reponseStan.status,
      headers: {
        ...ENTETES_CORS,
        "content-type": "text/html; charset=utf-8"
      }
    });
  }
};
