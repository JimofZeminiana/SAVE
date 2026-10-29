# Snapshot delle card

Ogni card che rimanda a un'altra parte del sito mostra una breve registrazione della pagina mentre la si usa: una striscia verticale di fotogrammi (`snap/<chiave>-light.jpg` e `-dark.jpg`) che `index.html` fa scorrere con un'animazione CSS.

Per rifarle dopo aver cambiato una pagina:

1. Avvia il sito su `http://localhost:8765` (dalla cartella del sito: `python3 -m http.server 8765`).
2. Da questa cartella: `node record.mjs .. [chiave...]` (senza chiavi le rifà tutte; serve Google Chrome).
3. Copia il contenuto di `../manifest-part.json` nell'oggetto `snaps` di `index.html` (solo le chiavi rifatte).

Le scene (cosa fa il puntatore in ogni pagina) sono in `scenes.mjs`.
