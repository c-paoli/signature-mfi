/*
 * Tests du modèle de signature (données fictives).
 * Lancer : node --test tests/
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

test("signature complète : nom, fonction, téléphones, mail, adresse, site", () => {
  const html = SignatureMFI.construire(SignatureMFI.depuisGraph(complet), config);
  assert.match(html, /<b>EXEMPLE JEAN<\/b>/);
  assert.match(html, /DIRECTEUR GÉNÉRAL/);
  assert.match(html, /&#9679; 04 95 00 00 00/);
  assert.match(html, /&#9679; 06 00 00 00 00/);
  assert.match(html, /mailto:j\.exemple@exemple\.fr/);
  assert.match(html, /Strada Vecchja Box 1 - 20290 Borgo/);
  assert.match(html, /www\.mfi\.corsica/);
  assert.match(html, /border-right:4\.5pt solid #467886/);
  assert.match(html, /src="cid:logo-mfi\.png"/);
});

test("champs vides : pas de ligne ni de puce orpheline", () => {
  const html = SignatureMFI.construire(
    SignatureMFI.depuisGraph({ displayName: "Jean Exemple", mail: "", businessPhones: [], mobilePhone: null }),
    config
  );
  assert.match(html, /<b>JEAN EXEMPLE<\/b>/);
  assert.doesNotMatch(html, /&#9679;/);
  // jamais deux lignes vides consécutives
  const vide = '<p style="margin:0;font-family:Aptos, Calibri, Arial, sans-serif;font-size:8pt;line-height:115%;">&nbsp;</p>';
  assert.ok(!html.includes(vide + vide));
});

test("même numéro en fixe et mobile : affiché une seule fois", () => {
  const p = SignatureMFI.depuisGraph({ businessPhones: ["06 00 00 00 00"], mobilePhone: "0600000000" });
  assert.deepStrictEqual(p.telephones, ["06 00 00 00 00"]);
});

test("caractères spéciaux échappés", () => {
  const html = SignatureMFI.construire(SignatureMFI.depuisGraph({ givenName: "<script>", surname: "A&B" }), config);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /A&amp;B &lt;SCRIPT&gt;/);
});

test("variante boîte partagée : libellé, nom de l'expéditeur, adresse de la boîte", () => {
  const boite = { adresse: "sav@exemple.fr", libelle: "Service après-vente", telephone: "04 95 11 11 11", afficherNomUtilisateur: true };
  const html = SignatureMFI.construire(SignatureMFI.depuisGraph(complet), config, boite, "logo-mfi-abc.png");
  assert.match(html, /<b>SERVICE APRÈS-VENTE<\/b>/);
  assert.match(html, />Jean Exemple</);
  assert.match(html, /mailto:sav@exemple\.fr/);
  assert.match(html, /&#9679; 04 95 11 11 11/);
  assert.doesNotMatch(html, /DIRECTEUR/);
  assert.doesNotMatch(html, /j\.exemple@/);
  assert.match(html, /cid:logo-mfi-abc\.png/);
});
