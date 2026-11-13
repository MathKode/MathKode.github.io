// =====================================================
//  RÉGLAGES — c'est ici qu'on modifie le site
// =====================================================

const CONFIG = {
  // Adresse du relais Cloudflare (voir relais-cloudflare/worker.js)
  urlRelais: "https://wispy-smoke-2670.mathiskremer-mk.workers.dev/",

  // Redemander les horaires toutes les X secondes
  rafraichissement: 20,

  // Stan ne donne que 2 trams. Si aucun des deux n'est attrapable,
  // on estime les suivants en gardant le même écart entre les trams.
  // Ces départs sont marqués "≈ estimé". Mettre false pour les cacher.
  estimerSuivants: true,

  // Écart utilisé si on ne peut pas le calculer (en minutes)
  ecartParDefaut: 5,

  // Afficher les réponses brutes du site Stan dans la console (F12)
  debug: false,

  // La ligne (copiée depuis la requête du site Stan)
  ligne: {
    ligne_id: "2484",
    ligne_omsid: "line:GST:1-97",
    numlignepublic: "T1",
    color: "#FFFFFF",
    background: "#E30613",
    libelle: "Vandoeuvre Brabois Hôpitaux - Essey Mouzimpré"
  },

  // Mes trajets : un bloc = une carte sur la page.
  //   nom        : ce qui s'affiche
  //   arret      : identifiant Stan de l'arrêt (requete_val[arret])
  //   arret_name : nom de l'arrêt pour le site Stan (requete_val[arret_name])
  //   direction  : un morceau du nom de la direction voulue
  //   tempsAPied : minutes de marche de chez moi jusqu'à l'arrêt
  trajets: [
    {
      nom: "Montet Octroi",
      arret: "stop_point:GST:SP:SP:TRMTO0",
      arret_name: "Montet Octroi",
      direction: "Brabois",
      tempsAPied: 3
    },
    {
      nom: "Artem",
      arret: "stop_point:GST:SP:SP:TRBLA0",
      arret_name: "ARTEM - Blandan - Thermal",
      direction: "Essey",
      tempsAPied: 5
    }
  ]
};
