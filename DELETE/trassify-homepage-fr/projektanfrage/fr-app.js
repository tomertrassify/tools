(function () {
  if (window.__TRASSIFY_FR_APP__) return;
  window.__TRASSIFY_FR_APP__ = true;

  function revealDocument() {
    document.documentElement.classList.remove('trassify-fr-pending');
  }

  const TEXT_REPLACEMENTS = Object.fromEntries([
    ['Trassify Preisanfrage', 'Trassify – Demande de projet'],
    ['Danke – Projektanfrage', 'Merci – Demande de projet'],
    ['Bitte leer lassen:', 'Veuillez laisser ce champ vide :'],
    ['Hinweis', 'Information'],
    ['JavaScript ist deaktiviert. Die Karten-/Zeichenfunktionen sind nicht verfügbar – Sie können aber unten alle Formularfelder ausfüllen und Dateien anhängen.', 'JavaScript est désactivé. Les fonctions de carte et de dessin ne sont pas disponibles, mais vous pouvez remplir tous les champs du formulaire ci-dessous et joindre des fichiers.'],
    ['Schritt', 'Etape'],
    ['Projektgebiet', 'Zone du projet'],
    ['Wie möchten Sie Ihr Projektgebiet festlegen?', 'Comment souhaitez-vous définir la zone de votre projet ?'],
    ['Zeigen Sie uns, für welches Gebiet Sie die Fremdleitungen wissen möchten', 'Indiquez-nous pour quelle zone vous souhaitez connaître les réseaux tiers.'],
    ['KML/KMZ hochladen', 'Televerser un fichier KML/KMZ'],
    ['bereits vorliegendes Gebiet im kml/kmz-Format hochladen', 'Televersez une zone existante au format KML/KMZ'],
    ['Projektgebiet einzeichnen', 'Tracer la zone du projet'],
    ['Mit dem Zeichen-Tool einfach erfassen', "Definissez-la simplement avec l'outil de dessin"],
    ['Mit Worten beschreiben', 'Decrire avec des mots'],
    ['Das Gebiet beschreiben oder andere Planformate hochladen', "Decrivez la zone ou televersez d'autres formats de plan"],
    ['Projektgebiet beschreiben', 'Decrire la zone du projet'],
    ['Adresse/ nahegelegene Adresse zum Projektgebiet', 'Adresse / adresse proche de la zone du projet'],
    ['Datei hochladen', 'Televerser un fichier'],
    ['PDF, PNG, JPG oder JPEG (max. 1 MB)', 'PDF, PNG, JPG ou JPEG (max. 1 Mo)'],
    ['Projektgebiet-Datei (KML/KMZ)', 'Fichier de zone du projet (KML/KMZ)'],
    ['Nur nötig, wenn JavaScript deaktiviert ist.', 'Necessaire uniquement si JavaScript est desactive.'],
    ['Weiter', 'Continuer'],
    ['Leistungspaket', 'Pack de services'],
    ['Welches Leistungspaket passt?', 'Quel pack de services convient ?'],
    ['Wählen Sie das Paket, das Sie für dieses Projekt benötigen.', 'Choisissez le pack dont vous avez besoin pour ce projet.'],
    ['Leitungsauskunft & Digitalisierung', 'Renseignement sur les reseaux et numerisation'],
    ['Sie erhalten eine komplette Karte mit den Leitungen in Ihrem Wunschformat und vielen Zusatzinformationen', 'Vous recevez une carte complete des reseaux dans le format souhaite, avec de nombreuses informations supplementaires.'],
    ['Leitungsauskunft', 'Renseignement sur les reseaux'],
    ['Wir besorgen Ihnen die Leitungsauskünfte in dem originalen Format der einzelnen Betreiber', "Nous obtenons pour vous les renseignements sur les reseaux dans le format d'origine de chaque exploitant."],
    ['Digitalisierung', 'Numerisation'],
    ['Wir digitalisieren die Pläne, die Sie bereits besorgt haben, in Ihre Wunschformat', 'Nous numerisons les plans que vous avez deja obtenus dans le format souhaite.'],
    ['Zurück', 'Retour'],
    ['Ausgewähltes Paket', 'Pack selectionne'],
    ['Bitte wählen', 'Veuillez choisir'],
    ['Sobald Sie ein Paket auswählen, erscheint hier die passende Erklärung.', "Des qu'un pack est selectionne, l'explication correspondante apparait ici."],
    ['Details', 'Details'],
    ['Projektangaben erfassen', 'Saisir les informations du projet'],
    ['Bitte füllen Sie die Angaben passend zu Ihrem Leistungspaket aus.', 'Veuillez completer les informations en fonction du pack choisi.'],
    ['Angaben zur Leitungsauskunft', 'Informations pour le renseignement sur les reseaux'],
    ['Projektname', 'Nom du projet'],
    ['Baubeginn', 'Debut des travaux'],
    ['Bauende', 'Fin des travaux'],
    ['Art der Tätigkeit', "Type d'activite"],
    ['Planung', 'Planification'],
    ['Ausführung', 'Execution'],
    ['Art des Tiefbaus', 'Type de travaux de terrassement'],
    ['Offene Bauweise', 'Methode ouverte'],
    ['Geschlossene Bauweise', 'Methode fermee'],
    ['Offene und geschlossene Bauweise', 'Methode ouverte et fermee'],
    ['Projektbeschreibung', 'Description du projet'],
    ['Anfragendes Unternehmen', 'Entreprise demandeuse'],
    ['Auftraggeber des Bauvorhabens', "Maitre d'ouvrage"],
    ['Bauleitung', 'Direction de chantier'],
    ['Kontakt Bauleitung', 'Contact de la direction de chantier'],
    ['Angaben zur Digitalisierung', 'Informations pour la numerisation'],
    ['Bevorzugtes Koordinatenbezugssystem', 'Systeme de coordonnees prefere'],
    ['Sonderanforderungen', 'Exigences particulieres'],
    ['Ja', 'Oui'],
    ['Nein', 'Non'],
    ['Angaben ausfüllen', 'Completer les informations'],
    ['Die Felder passen sich Ihrem gewählten Paket an. Kombi zeigt beide Bereiche.', 'Les champs s’adaptent au pack choisi. La formule combinee affiche les deux sections.'],
    ['Zusammenfassung', 'Recapitulatif'],
    ['Alles auf einen Blick', "Tout en un coup d'oeil"],
    ['Bitte prüfen Sie Ihre Angaben, bevor Sie abschließen.', 'Veuillez verifier vos informations avant de finaliser.'],
    ['Projektangaben', 'Informations du projet'],
    ['PDF herunterladen', 'Telecharger le PDF'],
    ['Fertig', 'Terminer'],
    ['Vorschau', 'Apercu'],
    ['Preview aus der Zeichnung oder dem Upload.', "Apercu issu du dessin ou du televersement."],
    ['Keine Geometrie verfügbar.', 'Aucune geometrie disponible.'],
    ['Layer', 'Couches'],
    ['Puffer', 'Tampon'],
    ['Abstand (m):', 'Distance (m) :'],
    ['Puffer anwenden', 'Appliquer le tampon'],
    ['Mit Rechtsklick beenden', 'Terminer avec un clic droit'],
    ['kml drawer · made by Trassify · Basemap: OpenStreetMap', 'kml drawer · par Trassify · Fond de carte : OpenStreetMap'],
    ['kml drawer · made by Trassify · Basemap: Esri Imagery', 'kml drawer · par Trassify · Fond de carte : Imagerie Esri'],
    ['kml drawer · made by Trassify · Basemap: None', 'kml drawer · par Trassify · Fond de carte : Aucun'],
    ['Polygon', 'Polygone'],
    ['Linie', 'Ligne'],
    ['Punkt', 'Point'],
    ['Anfügen', 'Ajouter'],
    ['Impressum', 'Mentions legales'],
    ['Datenschutz', 'Politique de confidentialite'],
    ['AGB', 'CGV'],
    ['Projektgebiet Auswahl', 'Choix de la zone du projet'],
    ['Zurück zur Auswahl', 'Retour a la selection'],
    ['Leistungspaket Auswahl', 'Choix du pack de services'],
    ['Werkzeuge', 'Outils'],
    ['Navigation', 'Navigation'],
    ['Footer', 'Pied de page'],
    ['Rechtliches', 'Mentions legales'],
    ['OpenStreetMap', 'OpenStreetMap'],
    ['Satellit', 'Satellite'],
    ['Suche', 'Recherche'],
    ['Danke', 'Merci'],
    ['Ihre Anfrage ist eingegangen', 'Votre demande a bien ete recue'],
    ['Wir melden uns so schnell wie möglich bei Ihnen zurück.', 'Nous reviendrons vers vous dans les plus brefs delais.'],
    ['Neue Anfrage', 'Nouvelle demande'],
    ['Standort', 'Position'],
    ['Keine Daten', 'Aucune donnee'],
    ['KML/KMZ Upload', 'Televersement KML/KMZ'],
    ['Einzeichnen', 'Dessin'],
    ['Beschreibung', 'Description'],
    ['Datei', 'Fichier'],
    ['Geometrien', 'Geometries'],
    ['Geodaten', 'Geodonnees'],
    ['zone-projet.kml (automatisch)', 'zone-projet.kml (automatique)'],
    ['projektgebiet.kml (automatisch)', 'zone-projet.kml (automatique)'],
    ['Leistungspaket', 'Pack de services'],
    ['ETRS89 / UTM zone 32N - EPSG:25832 (Standard)', 'ETRS89 / UTM zone 32N - EPSG:25832 (par defaut)'],
    ['Kartenvorschau ist im PDF nicht verfügbar.', "L'apercu cartographique n'est pas disponible dans le PDF."],
    ['PDF wird erstellt...', 'Creation du PDF...'],
    ['Sende…', 'Envoi...'],
    ['Wir übernehmen die Leitungsauskunft und koordinieren die notwendigen Abfragen für Ihr Projektgebiet.', 'Nous prenons en charge les demandes de renseignements sur les reseaux et coordonnons les requetes necessaires pour votre zone de projet.'],
    ['Wir digitalisieren bestehende Unterlagen und liefern Ihnen eine saubere digitale Grundlage für die Planung.', 'Nous numerisons les documents existants et vous fournissons une base numerique propre pour la planification.'],
    ['Kombiniere beide Leistungen: Abfragen der Leitungen plus digitale Aufbereitung aus einer Hand.', 'Combinez les deux prestations : demandes de renseignements sur les reseaux et preparation numerique aupres d’un seul interlocuteur.'],
    ['Bearbeiten', 'Modifier'],
    ["Zum Objekt springen", "Aller a l'objet"],
    ['Löschen', 'Supprimer'],
    ['Optionen', 'Options'],
    ['Layer ausblenden', 'Masquer la couche'],
    ['Layer einblenden', 'Afficher la couche'],
    ['Puffer (Ergebnis)', 'Tampon (resultat)'],
    ['Puffer ausblenden', 'Masquer le tampon'],
    ['Puffer einblenden', 'Afficher le tampon'],
    ['Zeichnung', 'Dessin'],
    ['Le fichier', 'Le fichier'],
  ]);

  const ATTR_REPLACEMENTS = {
    placeholder: Object.fromEntries([
      ['z. B. Ecke Musterstraße, entlang des Parks bis zur Brücke', 'p. ex. angle de la rue Exemple, le long du parc jusqu’au pont'],
      ['Adresse eingeben', 'Saisir une adresse'],
      ['Projektname', 'Nom du projet'],
      ['Kurzbeschreibung', 'Description courte'],
      ['Unternehmen', 'Entreprise'],
      ['Auftraggeber', "Maitre d'ouvrage"],
      ['Name', 'Nom'],
      ['Telefon oder E-Mail', 'Telephone ou e-mail'],
      ['Standard: ETRS89 / UTM zone 32N - EPSG:25832', 'Par defaut : ETRS89 / UTM zone 32N - EPSG:25832'],
      ['Ort oder Adresse', 'Lieu ou adresse']
    ]),
    title: Object.fromEntries([
      ['Standort', 'Position'],
      ['Keine Hintergrundkarte', 'Sans fond de carte'],
      ['OpenStreetMap', 'OpenStreetMap'],
      ['Satellit', 'Satellite'],
      ['Suche', 'Recherche'],
      ['Suchen', 'Rechercher']
    ]),
    'aria-label': Object.fromEntries([
      ['Projektgebiet Auswahl', 'Choix de la zone du projet'],
      ['Zurück zur Auswahl', 'Retour a la selection'],
      ['Leistungspaket Auswahl', 'Choix du pack de services'],
      ['Layerliste öffnen', 'Ouvrir la liste des couches'],
      ['Layerliste schließen', 'Fermer la liste des couches'],
      ['Werkzeuge', 'Outils'],
      ['Auswahl/Objekt wählen', 'Selectionner / choisir un objet'],
      ['Neu/Zeichnen', 'Nouveau / dessiner'],
      ['Zeichenmodus wählen', 'Choisir le mode de dessin'],
      ['Puffer', 'Tampon'],
      ['Strecke messen', 'Mesurer une distance'],
      ['KML laden', 'Charger un fichier KML'],
      ['Menü öffnen', 'Ouvrir le menu'],
      ['Hintergrundkarte wählen', 'Choisir le fond de carte'],
      ['Suche öffnen', 'Ouvrir la recherche'],
      ['Adresse suchen', 'Rechercher une adresse'],
      ['Suchen', 'Rechercher'],
      ['Navigation', 'Navigation'],
      ['Zur Trassify Website', 'Vers le site Trassify'],
      ['Footer', 'Pied de page'],
      ['Trassify Website öffnen', 'Ouvrir le site Trassify'],
      ['Rechtliches', 'Mentions legales'],
      ['Optionen', 'Options'],
      ['Layer ausblenden', 'Masquer la couche'],
      ['Layer einblenden', 'Afficher la couche'],
      ['Puffer ausblenden', 'Masquer le tampon'],
      ['Puffer einblenden', 'Afficher le tampon'],
      ['Standort', 'Position']
    ])
  };

  const ALERT_EXACT = new Map([
    ['Standort ist in diesem Browser nicht verfügbar.', "La geolocalisation n'est pas disponible dans ce navigateur."],
    ['Standort konnte nicht ermittelt werden.', "La position n'a pas pu etre determinee."],
    ['Keine Karteneinstellungen erforderlich. OpenStreetMap wird genutzt.', "Aucun reglage cartographique n'est necessaire. OpenStreetMap est utilise."],
    ['PDF Download ist aktuell nicht verfügbar.', "Le telechargement PDF n'est actuellement pas disponible."],
    ['Fehler beim Puffern. Bitte anderen Wert versuchen.', 'Erreur lors de la creation du tampon. Veuillez essayer une autre valeur.'],
    ['Wiederherstellen ist noch nicht implementiert.', "La fonction de restauration n'est pas encore implementee."],
    ['KML konnte nicht geparst werden.', "Le fichier KML n'a pas pu etre analyse."],
    ['Unterstützte Geometrie nicht gefunden (Punkt/Linie/Polygon).', 'Aucune geometrie prise en charge n’a ete trouvee (point/ligne/polygone).'],
    ['Zu wenige Punkte in der Geometrie.', 'Trop peu de points dans la geometrie.'],
    ['Fehler beim KML Import.', "Erreur lors de l'import KML."],
    ['Bitte zuerst eine KML- oder KMZ-Datei auswählen.', 'Veuillez d’abord selectionner un fichier KML ou KMZ.'],
    ['Keine Datei ausgewählt.', 'Aucun fichier selectionne.'],
    ['KMZ-Unterstützung nicht verfügbar.', 'La prise en charge des fichiers KMZ n’est pas disponible.'],
    ['Keine KML-Datei im KMZ gefunden.', 'Aucun fichier KML n’a ete trouve dans le KMZ.'],
    ['Dateityp wird nicht unterstützt.', 'Le type de fichier n’est pas pris en charge.'],
    ['Kein Treffer gefunden.', 'Aucun resultat trouve.'],
  ]);

  function normalizeText(value) {
    return String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\u00ad/g, '')
      .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function translateStandaloneText(value) {
    const normalized = normalizeText(value);
    if (!normalized) return value;
    const translated = TEXT_REPLACEMENTS[normalized];
    if (!translated) return value;
    const leading = value.match(/^\s*/u)?.[0] || '';
    const trailing = value.match(/\s*$/u)?.[0] || '';
    return `${leading}${translated}${trailing}`;
  }

  function translateElementAttributes(element, attrNameFilter) {
    Object.entries(ATTR_REPLACEMENTS).forEach(([attrName, mapping]) => {
      if (attrNameFilter && attrName !== attrNameFilter) return;
      if (!element.hasAttribute(attrName)) return;
      const rawValue = element.getAttribute(attrName);
      if (!rawValue) return;
      const normalized = normalizeText(rawValue);
      const translated = mapping[normalized];
      if (translated) {
        element.setAttribute(attrName, translated);
      }
    });
  }

  function translateAttributes(root, attrNameFilter) {
    if (!root) return;

    if (root.nodeType === Node.DOCUMENT_NODE) {
      if (root.documentElement) {
        translateAttributes(root.documentElement, attrNameFilter);
      }
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE) return;

    translateElementAttributes(root, attrNameFilter);

    const attrNames = attrNameFilter ? [attrNameFilter] : Object.keys(ATTR_REPLACEMENTS);
    const selector = attrNames.map((attrName) => `[${attrName}]`).join(',');
    if (!selector) return;

    root.querySelectorAll(selector).forEach((element) => {
      translateElementAttributes(element, attrNameFilter);
    });
  }

  function translateTextNodes(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
      if (node.parentElement && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentElement.tagName)) {
        const translated = translateStandaloneText(node.textContent);
        if (translated !== node.textContent) {
          node.textContent = translated;
        }
      }
      node = walker.nextNode();
    }
  }

  function translateNode(node) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      if (node.parentElement && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentElement.tagName)) {
        const translated = translateStandaloneText(node.textContent);
        if (translated !== node.textContent) {
          node.textContent = translated;
        }
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    translateAttributes(node);
    translateTextNodes(node);
  }

  function translateAlertMessage(message) {
    if (typeof message !== 'string') return message;

    let translated = ALERT_EXACT.get(message) || message;

    translated = translated.replace(/^Standort fehlgeschlagen: (.+)$/u, (_, inner) => {
      return `Echec de la geolocalisation : ${translateAlertMessage(inner)}`;
    });

    translated = translated.replace(/^(Die Datei|Le fichier) ist zu groß \((.+)\)\. Maximal erlaubt: (.+)\.$/u, (_, __, size, max) => {
      return `Le fichier est trop volumineux (${size}). Taille maximale autorisee : ${max}.`;
    });

    translated = translated.replace(/^Senden fehlgeschlagen: (.+)$/u, (_, inner) => {
      return `Echec de l’envoi : ${translateAlertMessage(inner)}`;
    });

    return translated;
  }

  function installTranslatedAlert() {
    if (typeof window.alert !== 'function' || window.__TRASSIFY_FR_APP_ALERT__) return;
    window.__TRASSIFY_FR_APP_ALERT__ = true;
    const originalAlert = window.alert.bind(window);

    window.alert = (message) => {
      return originalAlert(translateAlertMessage(message));
    };
  }

  function startObserver() {
    if (typeof MutationObserver !== 'function' || window.__TRASSIFY_FR_APP_OBSERVER__) return;
    window.__TRASSIFY_FR_APP_OBSERVER__ = true;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => translateNode(node));
        }

        if (mutation.type === 'attributes' && mutation.target?.nodeType === Node.ELEMENT_NODE) {
          translateAttributes(mutation.target, mutation.attributeName);
        }

        if (mutation.type === 'characterData' && mutation.target?.nodeType === Node.TEXT_NODE) {
          translateNode(mutation.target);
        }
      });
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: Object.keys(ATTR_REPLACEMENTS)
    });
  }

  function translateDocument() {
    document.documentElement.lang = 'fr';
    installTranslatedAlert();
    translateAttributes(document);
    const title = document.querySelector('title');
    if (title) {
      title.textContent = translateStandaloneText(title.textContent);
    }
    translateTextNodes(document.body);
    startObserver();
    revealDocument();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', translateDocument);
  } else {
    translateDocument();
  }
})();
