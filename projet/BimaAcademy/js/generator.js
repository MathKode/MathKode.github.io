const site_up = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AVANT BRAS</title>
    <link rel="stylesheet" href="../../style/header.css">
    <link rel="stylesheet" href="../../style/cours.css">
    <link rel="stylesheet" href="../../style/font.css">
    <!-- Pour le latex -->
    <script id="MathJax-script" async
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
    </script>
    <link rel="shortcut icon" type="image/x-icon" href="../../picture/favicon.ico" />
</head>
<!--
   _______       __
 /   ------.   / ._ _
|  /         ~--~    \`
| |             __    .____________________ _^-----^
| |  I=|=======/--\\=========================| o o o |
\\ |  I=|=======\\__/=========================|_o_o_o_|
 \\|                   /                       ~    ~
   \\       .---.    .
     -----'     ~~''
By Bimathax aka Mathis KREMER
-->
<body>
    <header>
        <h1 class="hubballi-regular" onclick="window.location.href = window.location.href.split('/').slice(0,-3).join('/') + '/main.html'">La Bima-Academy</h1>
        <div>
            <button class="hubballi-regular" onclick="window.location.href = 'https://www.youtube.com/@BiMathAx'">Youtube</button>
            <button class="hubballi-regular" onclick="window.location.href = window.location.href.split('/').slice(0,-3).join('/') + '/search.html'">Cours/Fiches</button>
            <button class="hubballi-regular" onclick="window.location.href = window.location.href.split('/').slice(0,-3).join('/') + '/contact.html'">Contact</button>
        </div>
    </header>
    <section class="cours">
`;

/* INUTILE au vue de ma nouvelle fonction et du dico tag global
function add_title(txt) {
    return `<h1 class="exo-2-200 title">${txt}</h1>`;
}
function add_subtitle(txt) {
    return `<h2 class="exo-2-200 subtitle">${txt}</h2>`;
}
function add_description(txt) {
    return `<p class="exo-2-200 description">${txt}</p>`;
}
function add_videoyoutube(link) {
    return `<iframe class="video" src="${link}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}
function add_othervideo(link) {
    return `<video class="video" src="${link}" controls></video>`;
}
function add_divider() {
    return `<div class="divider"></div>`;
}
function add_littlejump() {
    return `<div class="little_jump"></div>`;
}
function add_linktext(txt, link) {
    return `<a href="${link}" target="_blank" class="link">${txt}</a>`;
}
function add_pdf(link) {
    return `<embed class="pdf" src="${link}" type="application/pdf">`;
}
function add_latex(equation) {
    return `<span class="latex">\[ ${equation} \]</span>`
}
function add_article(line_ls) {
    let c = `<article class="article-content exo-2-200">`;
    line_ls.forEach(line => {
        c += `
<p>
${line}
</p>`;
    });
    c += `</article>`;
    return c;
}
function add_code(line_ls) {
    let c = `<div class="code-block">
    <button class="copy-btn hubballi-regular" onclick="copyCode(this)">Copier</button>
    <pre><code class="code">`;
    line_ls.forEach(line => {
        c += `
${line}`;
    });
    c += `</code></pre>
</div>`;
    return c;
}
*/

const site_down = `
    </section>
</body>
</html>

<script>
function copyCode(button) {
    const code = button.nextElementSibling.textContent;
    navigator.clipboard.writeText(code).then(() => {
        button.textContent = "Copié !";
        setTimeout(() => (button.textContent = "Copier"), 1500);
    });
}
</script>
`;

function generate() {
    cours = document.getElementById("cours").value;
    const balise_all = {
        "[TITLE]": '<h1 class="exo-2-200 title">',
        "[/TITLE]": "</h1>",

        "[SUBTITLE]": '<h2 class="exo-2-200 subtitle">',
        "[/SUBTITLE]": "</h2>",

        "[DESCRIPTION]": '<p class="exo-2-200 description">',
        "[/DESCRIPTION]": "</p>",

        "[YOUTUBE]": '<iframe class="video" src="',
        "[/YOUTUBE]":
            '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',

        "[VIDEO]": '<video class="video" src="',
        "[/VIDEO]": '" controls></video>',

        "[DIVIDER]": '<div class="divider"></div>',

        "[JUMP]": '<div class="little_jump"></div>',

        "[LINKTEXT]": '<a href="', // on parse txt:%:link séparément
        "[/LINKTEXT]": "</a>",

        ":%:": '">',

        //"[PDF]": '<embed class="pdf" src="',
        //"[/PDF]": '" type="application/pdf">',

        "[PDF]":
            '<iframe class="pdf" src="https://mozilla.github.io/pdf.js/web/viewer.html?file=',
        "[/PDF]": '" ></iframe>',
        //<iframe clas="pdf" src="https://mozilla.github.io/pdf.js/web/viewer.html?file=https://mathkode.github.io/projet/BimaAcademy/cours/ece%20physique/ECE_Nico.pdf" width="100%" height="600px"></iframe>

        "[LATEX]": '<span class="latex">\\[ ',
        "[/LATEX]": " \\]</span>",

        "[ARTICLE]": '<article class="article-content exo-2-200"><p>', // contenu en <p>...</p> ligne par ligne
        "[/ARTICLE]": "</p></article>",
        "[A]": "</p><p>",

        "[CODE]": `<div class="code-block">
        <button class="copy-btn hubballi-regular" onclick="copyCode(this)">Copier</button>
        <pre><code class="code">`,
        "[/CODE]": `</code></pre>
    </div>`,

        "https://www.youtube.com/watch?v=": "https://www.youtube.com/embed/",
        "https://youtu.be/": "https://www.youtube.com/embed/",
    };
    Object.keys(balise_all).forEach((balise) => {
        cours = cours.split(balise).join(balise_all[balise]);
    });
    //cas particuler, les articles
    console.log(cours);

    resultat = site_up + cours + site_down;

    document.getElementById("cours_section").innerHTML = resultat;
    MathJax.typesetPromise(); //Reload le latex

    //Copier dans le presse papier
    navigator.clipboard.writeText(resultat);
    //alert('résultat copié dans le presse papier')

    //Créer un fichier et le dowload

    // Création du Blob (fichier texte)
    const blob = new Blob([resultat], { type: "text/plain" });

    // Création de l'URL du Blob
    const url = URL.createObjectURL(blob);

    // Création du lien de téléchargement
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html"; // Nom du fichier
    document.body.appendChild(a);

    // Simule le clic sur le lien pour déclencher le téléchargement
    a.click();

    // Nettoie le DOM en supprimant le lien
    document.body.removeChild(a);

    // Libère l'URL après le téléchargement
    URL.revokeObjectURL(url);

    return resultat;
}

function json_generate() {
    i1 = prompt("Nom du dossier [PATH] :", "");
    i2 = prompt("Nom du cours [NAME] :", "");
    i3 = prompt("Description du cours [DESCRIPTION] :", "");
    i4 = prompt("Auteur [Author] :", "Mathis KREMER");
    var ladate = new Date();
    i5 = prompt(
        `Date du jour [${ladate.getDate() + "/" + (ladate.getMonth() + 1) + "/" + ladate.getFullYear()}]`,
        ladate.getDate() +
            "/" +
            (ladate.getMonth() + 1) +
            "/" +
            ladate.getFullYear(),
    );
    tag_ls = [];
    ok = true;
    while (ok) {
        i = prompt("Tag [TAG] et écrire  STOP  pour arrêter :", "STOP");
        if (i == "STOP") {
            ok = false;
        } else {
            tag_ls.push(i);
        }
    }
    //Mise en forme
    result_json = `"${i1}" : {
    "name" : "${i2}",
    "description" : "${i3}",
    "author": "${i4}",
    "date":"${i5}",
    "tags" : [`;
    tag_ls.slice(0, -1).forEach((tag) => {
        result_json = result_json + `\n                "${tag}",`;
    });
    result_json = result_json + `\n            "${tag_ls.slice(-1)[0]}"`;
    result_json =
        result_json +
        `
            ]
}`;
    alert(result_json);
    console.log(result_json);
    navigator.clipboard.writeText(result_json);

    fichier_content = `{\n${result_json}\n}`;

    //Créer un fichier et le dowload

    // Création du Blob (fichier texte)
    const blob = new Blob([fichier_content], { type: "text/plain" });

    // Création de l'URL du Blob
    const url = URL.createObjectURL(blob);

    // Création du lien de téléchargement
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.json"; // Nom du fichier
    document.body.appendChild(a);

    // Simule le clic sur le lien pour déclencher le téléchargement
    a.click();

    // Nettoie le DOM en supprimant le lien
    document.body.removeChild(a);

    // Libère l'URL après le téléchargement
    URL.revokeObjectURL(url);
}

console.log("fichier js chargé");
