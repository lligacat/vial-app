# Autoescola Bages · app d'alumnes i professors

Aquesta carpeta és l'aplicació d'una autoescola amb la seva marca (nom i color a `index.html`, línia `window.BRAND`).

## Publicar-la en un subdomini propi
1. Puja el contingut a un repositori de GitHub i activa GitHub Pages (branca `main`, carpeta arrel).
2. A Settings → Pages → Custom domain escriu el subdomini (per exemple `alumnes.autoescolabages.cat`).
3. Al DNS de l'autoescola crea un registre CNAME de `alumnes` cap a `lligacat.github.io`.
4. Activa «Enforce HTTPS». Amb això l'app queda en el seu subdomini i es pot instal·lar al mòbil.

## Personalitzar-la per a cada client
- Nom i color: `window.BRAND` a `index.html` (o amb `node build-app.js "Nom" "#color" clau`).
- Mòduls actius, tarifes, packs, normes i punts de trobada: apartat Configuració del panell de direcció.
- Les dades d'aquesta versió són de mostra i es desen al dispositiu (localStorage).
