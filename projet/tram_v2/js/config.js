// =====================================================
//  RÉGLAGES — c'est ici qu'on modifie le site
// =====================================================

const CONFIG = {
  // Adresse du relais Cloudflare (voir relais-cloudflare/worker.js)
  urlRelais: "https://wispy-smoke-2670.mathiskremer-mk.workers.dev/",

  // Redemander les horaires des 25 arrêts toutes les X secondes.
  // 25 arrêts toutes les 30 s ≈ 72 000 requêtes par jour si la page reste
  // ouverte en permanence (limite gratuite Cloudflare : 100 000).
  // La page s'arrête d'interroger quand l'onglet est caché.
  rafraichissement: 25,

  // Nombre de demandes envoyées en même temps au relais
  requetesSimultanees: 6,

  // Temps entre deux arrêts (minutes) utilisé au tout début, avant que le
  // site ait appris les vrais temps de parcours en observant les trams.
  tempsEntreArrets: 1.7,

  // Pour ne jamais compter 2 fois le même tram : un tram annoncé à un arrêt
  // n'est "nouveau" (pas encore vu à l'arrêt d'avant) que s'il arrive plus de
  // X minutes avant le tram attendu de l'arrêt d'avant. En cas de doute, c'est
  // le même tram. Plus grand = plus prudent, mais deux trams collés à moins
  // de X minutes risquent d'être comptés comme un seul.
  margeMemeTram: 2,

  // Un tram au terminus est dessiné sur le plan s'il part dans X minutes ou moins
  seuilDepartTerminus: 4,

  // Afficher sous chaque carte la liste des trams pris en compte
  afficherDetails: true,

  // S'il manque encore des trams, on estime les suivants en gardant
  // l'écart habituel entre les trams. Mettre false pour les cacher.
  estimerSuivants: true,

  // Écart utilisé si on ne peut pas le calculer (en minutes)
  ecartParDefaut: 5,

  // Minutes de marge en plus quand l'heure du tram n'est pas annoncée à mon
  // arrêt (déduite d'un autre arrêt ou estimée) : on part un peu plus tôt.
  margeSecurite: 1,

  // Afficher le plan de la ligne sous les cartes
  afficherPlan: true,

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

  // Les 25 arrêts du T1, DANS L'ORDRE de Brabois vers Essey (l'ordre compte !)
  //   nom        : nom court affiché
  //   arret      : identifiant Stan (requete_val[arret])
  //   arret_name : nom pour le site Stan (requete_val[arret_name])
  arrets: {
    brabois:       { nom: "Brabois Hôpitaux",   arret: "stop_point:GST:SP:SP:TRCHU0", arret_name: "Vandoeuvre Brabois Hôpitaux" },
    technopole:    { nom: "Technopôle",         arret: "stop_point:GST:SP:SP:TRTEC0", arret_name: "Technopôle" },
    parcBrabois:   { nom: "Parc de Brabois",    arret: "stop_point:GST:SP:SP:TRPBR0", arret_name: "Parc de Brabois" },
    ndp:           { nom: "Notre-Dame-des-Pauvres", arret: "stop_point:GST:SP:SP:TRNDP1", arret_name: "Notre-Dame-des-Pauvres" },
    botanique:     { nom: "Jardin Botanique",   arret: "stop_point:GST:SP:SP:TRBOT0", arret_name: "Saint-André - Jardin Botanique" },
    reclus:        { nom: "Le Reclus",          arret: "stop_point:GST:SP:SP:TRREC0", arret_name: "Le Reclus" },
    velodrome:     { nom: "Vélodrome",          arret: "stop_point:GST:SP:SP:TRCAL0", arret_name: "Vélodrome - Callot" },
    montet:        { nom: "Montet Octroi",      arret: "stop_point:GST:SP:SP:TRMTO0", arret_name: "Montet Octroi" },
    artem:         { nom: "Artem",              arret: "stop_point:GST:SP:SP:TRBLA0", arret_name: "ARTEM - Blandan - Thermal" },
    exelmans:      { nom: "Exelmans",           arret: "stop_point:GST:SP:SP:TREXE0", arret_name: "Exelmans" },
    jaures:        { nom: "Jean Jaurès",        arret: "stop_point:GST:SP:SP:TRJAU0", arret_name: "Jean Jaurès" },
    garenne:       { nom: "Garenne",            arret: "stop_point:GST:SP:SP:TRGAN0", arret_name: "Garenne - Rose Wild" },
    monDesert:     { nom: "Mon Désert",         arret: "stop_point:GST:SP:SP:TRMDE0", arret_name: "Mon Désert - Thermal" },
    saintLeon:     { nom: "Gare Saint-Léon",    arret: "stop_point:GST:SP:SP:TRLEO0", arret_name: "Gare - Saint-Léon" },
    gare:          { nom: "Gare Pierre Sémard", arret: "stop_point:GST:SP:SP:TRGAR0", arret_name: "Gare - Pierre Sémard" },
    pointCentral:  { nom: "Point Central",      arret: "stop_point:GST:SP:SP:TRPCL0", arret_name: "Point Central" },
    stanislas:     { nom: "Place Stanislas",    arret: "stop_point:GST:SP:SP:TRCAT0", arret_name: "Place Stanislas - Cathédrale" },
    divisionFer:   { nom: "Division de Fer",    arret: "stop_point:GST:SP:SP:TRDFE0", arret_name: "Division de Fer" },
    deuxRives:     { nom: "Deux Rives",         arret: "stop_point:GST:SP:SP:TRRIV0", arret_name: "Deux Rives - Olympe de Gouges" },
    cristalleries: { nom: "Cristalleries",      arret: "stop_point:GST:SP:SP:TRCRI0", arret_name: "Cristalleries - Stade Marcel Picot" },
    saintMax:      { nom: "Mairie de Saint-Max", arret: "stop_point:GST:SP:SP:TRMAX0", arret_name: "Mairie de Saint-Max" },
    washington:    { nom: "Washington Foch",    arret: "stop_point:GST:SP:SP:TRFOC0", arret_name: "Washington Foch" },
    pasteur:       { nom: "Clinique Pasteur",   arret: "stop_point:GST:SP:SP:TRPAS0", arret_name: "Clinique Pasteur" },
    esseyCentre:   { nom: "Essey Centre",       arret: "stop_point:GST:SP:SP:TRESS0", arret_name: "Essey Centre" },
    mouzimpre:     { nom: "Essey Mouzimpré",    arret: "stop_point:GST:SP:SP:TRMZM0", arret_name: "Essey Mouzimpré" }
  },

  // Mes trajets : un bloc = une carte sur la page.
  //   arret      : clé d'un arrêt de la liste "arrets" ci-dessus
  //   direction  : un morceau du nom de la direction voulue ("Brabois" ou "Essey")
  //   tempsAPied : minutes de marche de chez moi jusqu'à l'arrêt
  // Plus besoin de lister les arrêts précédents : toute la ligne est suivie.
  trajets: [
    { arret: "montet", direction: "Brabois", tempsAPied: 3 },
    { arret: "artem",  direction: "Essey",   tempsAPied: 5 }
  ]
};
