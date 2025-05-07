site_up = `
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
            <button class="hubballi-regular">Contact</button>
        </div>
    </header>
    <section class="cours">
`

function add_title(txt) {
    return `<h1 class="exo-2-200 title">${txt}</h1>`
}
function add_subtitle(txt) {
    return `<h2 class="exo-2-200 subtitle">${txt}</h2>`
}
function add_description(txt) {
    return `<p class="exo-2-200 description">${txt}</p>`
}
function add_videoyoutube(link) {
    return `<iframe class="video" src="${link}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
}
function add_othervideo(link) {
    return `<video class="video" src="${link}" controls></video>`
}
function add_divider() {
    return `<div class="divider"></div>`
}
function add_littlejump() {
    return `<div class="little_jump"></div>`
}
function add_linktext(txt, link) {
    return `<a href="${link}" target="_blank" class="link">${txt}</a>`
}
function add_pdf(link) {
    return `<embed class="pdf" src="${link}" type="application/pdf">`
}
function add_article(line_ls) {
    c = `<article class="article-content exo-2-200">`
    line_ls.forEach(line => {
        c = c + `
<p>
${line}
</p>`
    });
    c = c + `</article>`
    return c
}
function add_code(line_ls) {
    c = `<div class="code-block">
                <button class="copy-btn hubballi-regular" onclick="copyCode(this)">Copier</button>
                <pre>
<code class="code">`
    line_ls.forEach(line => {
        c = c + `
${line}`
    });
    c = c + `</code></pre>
              </div>`
    return c
}


site_down = `

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
`