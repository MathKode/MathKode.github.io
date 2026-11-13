# Test du site complet dans un vrai navigateur (Chromium), avec un faux relais
# qui répond comme Stan à partir du simulateur. Fait des captures PC + téléphone.
#   python3 tests/test-navigateur.py
import asyncio, pathlib
from playwright.async_api import async_playwright

racine = pathlib.Path(__file__).resolve().parent.parent
simulateur = (racine / "tests" / "simulateur.js").read_text()

faux_relais = simulateur + """
(function () {
  const sim = creerSimulation(7, { tauxErreur: 0.03 });
  sim.t0 = Date.now() - 30 * 60000;           // la simulation tourne "en direct"
  const vraiFetch = window.fetch;
  window.fetch = async function (url, options) {
    if (!String(url).includes("workers.dev")) return vraiFetch(url, options);
    const corps = new URLSearchParams(options.body);
    const id = corps.get("requete_val[arret]");
    const i = Object.values(CONFIG.arrets).findIndex(function (a) { return a.arret === id; });
    if (Math.random() < sim.tauxErreur) return new Response("erreur", { status: 502 });
    return new Response(htmlSimule(sim, i, Date.now()), { status: 200 });
  };
})();
"""

async def main():
    async with async_playwright() as p:
        navigateur = await p.chromium.launch()
        for nom, largeur, hauteur in [("telephone", 390, 844), ("pc", 1280, 900)]:
            page = await navigateur.new_page(viewport={"width": largeur, "height": hauteur})
            erreurs = []
            page.on("pageerror", lambda e: erreurs.append(str(e)))
            page.on("console", lambda m: erreurs.append(m.text) if m.type == "error" else None)
            await page.add_init_script(faux_relais)
            await page.goto((racine / "index.html").as_uri())
            await page.wait_for_function("document.querySelectorAll('.plan-tram').length > 0", timeout=15000)
            await page.wait_for_timeout(1500)
            await page.screenshot(path=str(racine / "tests" / f"capture-{nom}.png"), full_page=True)
            cartes = await page.inner_text("#cartes")
            print(f"--- {nom} : erreurs = {erreurs}")
            print(cartes.replace("\\n", " | ")[:400])
            print("trams :", await page.inner_text("#plan-nbA"), "/", await page.inner_text("#plan-nbB"))
            print("état  :", await page.inner_text("#etat"))
        await navigateur.close()

asyncio.run(main())
