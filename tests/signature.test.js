/*
 * Tests du modèle de signature (données fictives).
 * Lancer : node --test tests/signature.test.js
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SignatureMFI = require("../src/signature.js");

// config.js déclare une variable globale : on l'évalue dans un contexte isolé.
const contexte = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/config.js"), "utf8") + ";this.c=SIGNATURE_MFI_CONFIG;", contexte);
const config = contexte.c;

const complet = {
  givenName: "Jean",
  surname: "Exemple",
  displayName: "Jean Exemple",
  jobTitle: "Directeur général",
  businessPhones: ["04 95 00 00 00"],
  mobilePhone: "06 00 00 00 00",
  mail: "j.exemple@exemple.fr"
};

/** Contenu texte d'une ligne <p> repérée par son texte, avec son style. */
function ligne(html, texte) {
  const m = html.match(new RegExp('<p style="([^"]*)">((?:(?!</p>).)*' + texte + "(?:(?!</p>).)*)</p>"));
  assert.ok(m, "ligne introuvable : " + texte);
  return { style: m[1], contenu: m[2] };
}

test("signature complète : ordre, styles et contenu", () => {
  const html = SignatureMFI.construire(SignatureMFI.depuisGraph(complet), config);

  assert.ok(html.startsWith('<p style="margin:0;">Cordialement</p>'));
  // le trait est la bordure gauche de la cellule qui contient le texte, sans marge haute ni basse
  assert.match(html, /<td valign="top" style="padding:0 5\.4pt 0 24pt;vertical-align:top;border-left:4\.5pt solid #467886;"><p /);
  assert.match(html, /src="cid:logo-mfi\.png"/);
  assert.match(html, /<td align="center" valign="middle"[^>]*vertical-align:middle/); // logo centré

  const nom = ligne(html, "JEAN EXEMPLE");
  assert.match(nom.style, /font-size:10\.5pt;font-weight:bold;color:#222222/);

  const fonction = ligne(html, "DIRECTEUR GÉNÉRAL");
  assert.match(fonction.style, /font-size:7\.5pt;font-weight:bold/);
  assert.match(fonction.style, /color:#467886/);

  const tel = ligne(html, "04 95 00 00 00");
  assert.match(tel.contenu, /<span style="color:#467886;[^"]*">&#9679;<\/span>/); // puce couleur MFI
  ligne(html, "06 00 00 00 00");
  assert.match(ligne(html, "mailto:j\\.exemple@exemple\\.fr").contenu, /&#9679;/);

  assert.match(ligne(html, "ROUTE DE STRADA VECCHJA – BOX 1&amp;2").style, /font-size:7pt;color:#666666/);
  ligne(html, "20290 BORGO");
  assert.match(ligne(html, "www\\.mfi\\.corsica").style, /font-weight:bold;color:#467886/);

  // ordre des lignes
  const ordre = ["JEAN EXEMPLE", "DIRECTEUR", "04 95", "06 00", "mailto:", "ROUTE DE", "20290 BORGO", "www.mfi.corsica"];
  const positions = ordre.map((t) => html.indexOf(t));
  assert.deepStrictEqual([...positions].sort((a, b) => a - b), positions);
});

test("champs vides : pas de ligne ni de puce orpheline", () => {
  const html = SignatureMFI.construire(
    SignatureMFI.depuisGraph({ displayName: "Jean Exemple", mail: "", businessPhones: [], mobilePhone: null }),
    config
  );
  ligne(html, "JEAN EXEMPLE");
  assert.doesNotMatch(html, /&#9679;/);
  assert.doesNotMatch(html, /<p[^>]*>(&nbsp;|\s)*<\/p>/); // aucune ligne vide dans le bloc
});

test("même numéro en fixe et mobile : affiché une seule fois", () => {
  const p = SignatureMFI.depuisGraph({ businessPhones: ["06 00 00 00 00"], mobilePhone: "0600000000" });
  assert.deepStrictEqual(p.telephones, ["06 00 00 00 00"]);
});

test("sans formule de politesse : la signature commence par le tableau", () => {
  const html = SignatureMFI.construire(SignatureMFI.depuisGraph(complet), Object.assign({}, config, { formulePolitesse: "" }));
  assert.ok(html.startsWith("<table"));
});

test("caractères spéciaux échappés", () => {
  const html = SignatureMFI.construire(SignatureMFI.depuisGraph({ givenName: "<script>", surname: "A&B" }), config);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;SCRIPT&gt; A&amp;B/);
});

test("variante boîte partagée : libellé, nom de l'expéditeur, adresse de la boîte", () => {
  const boite = { adresse: "sav@exemple.fr", libelle: "Service après-vente", telephone: "04 95 11 11 11", afficherNomUtilisateur: true };
  const html = SignatureMFI.construire(SignatureMFI.depuisGraph(complet), config, boite, "logo-mfi-abc.png");
  assert.match(ligne(html, "SERVICE APRÈS-VENTE").style, /font-size:10\.5pt/);
  assert.match(ligne(html, "JEAN EXEMPLE").style, /color:#467886/);
  assert.match(html, /mailto:sav@exemple\.fr/);
  ligne(html, "04 95 11 11 11");
  assert.doesNotMatch(html, /DIRECTEUR/);
  assert.doesNotMatch(html, /j\.exemple@/);
  assert.match(html, /cid:logo-mfi-abc\.png/);
});

test("la boîte SAV est configurée", () => {
  assert.ok(config.boitesPartagees["sav@mfi.corsica"]);
});
