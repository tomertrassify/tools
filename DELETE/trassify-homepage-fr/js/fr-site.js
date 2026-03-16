(function () {
  if (window.__TRASSIFY_FR_SITE__) return;
  window.__TRASSIFY_FR_SITE__ = true;

  function revealDocument() {
    document.documentElement.classList.remove("trassify-fr-pending");
  }

  const TEXT_REPLACEMENTS = Object.fromEntries([
    [`Home`, `Accueil`],
    [`Über uns`, `À propos`],
    [`Kontakt`, `Contact`],
    [`Preisanfrage`, `Demande de prix`],
    [`Kostenloses Erstgespräch`, `Premier entretien gratuit`],
    [`Get in touch`, `Nous contacter`],
    [`Seiten`, `Pages`],
    [`Rechtliches`, `Mentions légales`],
    [`Karriere`, `Carrières`],
    [`Impressum`, `Mentions légales`],
    [`Datenschutz`, `Politique de confidentialité`],
    [`AGB`, `CGV`],
    [`AGB's`, `CGV`],
    [`About`, `À propos`],
    [`Services`, `Services`],
    [`Service Single`, `Service individuel`],
    [`Blog Post`, `Article de blog`],
    [`Portfolio`, `Références`],
    [`Portfolio Single`, `Référence individuelle`],
    [`Shop`, `Boutique`],
    [`Single Product`, `Produit individuel`],
    [`Contact`, `Contact`],
    [`Utility Pages`, `Pages utilitaires`],
    [`Style Guide`, `Guide de styles`],
    [`Start Here`, `Commencez ici`],
    [`404 Not Found`, `404 Introuvable`],
    [`Password Protected`, `Protégé par mot de passe`],
    [`Licenses`, `Licences`],
    [`Changelog`, `Journal des modifications`],
    [`Browse More Templates`, `Voir plus de modèles`],
    [`Latest posts`, `Derniers articles`],
    [`We haven't added any articles.`, `Nous n'avons pas encore ajouté d'articles.`],
    [`No items found.`, `Aucun élément trouvé.`],
    [`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`, `Texte d’exemple pour un article de blog.`],
    [`Website by`, `Site web par`],
    [`Realisierung & Umsetzung`, `Conception et réalisation`],
    [`Adresse`, `Adresse`],
    [`Telefonnummer`, `Numéro de téléphone`],
    [`Telefon:`, `Téléphone :`],
    [`E-Mail:`, `E-mail :`],
    [`Website:`, `Site web :`],
    [`Geschäftsführer`, `Directeur général`],
    [`Projektleiter`, `Chef de projet`],
    [`Weiter zum nächsten Schritt`, `Passer à l’étape suivante`],
    [`Absenden`, `Envoyer`],
    [`Unverbindliche Preisanfrage`, `Demande de prix sans engagement`],
    [`Mehr erfahren`, `En savoir plus`],
    [`Mehr Case-Studies`, `Plus d’études de cas`],
    [`Projekt ansehen`, `Voir le projet`],
    [`Offene Stellen`, `Postes ouverts`],
    [`Alle Offene Stellen`, `Tous les postes ouverts`],
    [`Betrieb`, `Exploitation`],
    [`IT & Innovationsforschung`, `Informatique et recherche en innovation`],
    [`Personal & Organisation`, `Ressources humaines et organisation`],
    [`Vertrieb & Marketing`, `Ventes et marketing`],
    [`Jetzt bewerben`, `Postuler maintenant`],
    [`Momentan keine offenen Stellen in dieser Abteilung`, `Aucun poste ouvert pour le moment dans ce département`],
    [`Wenn Sie eine Initiativbewerbung einreichen möchten, klicken Sie bitte auf den untenstehenden Link.`, `Si vous souhaitez envoyer une candidature spontanée, veuillez cliquer sur le lien ci-dessous.`],
    [`Initiativbewerbung`, `Candidature spontanée`],
    [`Job Title`, `Intitulé du poste`],
    [`Department`, `Département`],
    [`Apply Now`, `Postuler maintenant`],
    [`Location`, `Lieu`],
    [`Contract Type`, `Type de contrat`],
    [`Referenzen`, `Références`],
    [`Trassify Erfahrungen`, `Références Trassify`],
    [`Deshalb vertrauen unsere Kunden auf uns`, `Pourquoi nos clients nous font confiance`],
    [`Ingenieure`, `Ingénieurs`],
    [`Passend für Sie`, `Adapté à vos besoins`],
    [`Our services`, `Nos services`],
    [`Our store`, `Notre offre`],
    [`View service`, `Voir le service`],
    [`Latest posts`, `Derniers articles`],
    [`Subscribe to our newsletter`, `Abonnez-vous à notre newsletter`],
    [`Thanks for joining our newsletter.`, `Merci pour votre inscription à notre newsletter.`],
    [`Oops! Something went wrong.`, `Oups ! Une erreur s’est produite.`],
    [`Not Found`, `Introuvable`],
    [`Not Found!`, `Introuvable !`],
    [`Error`, `Erreur`],
    [`Diese Seite wurde nicht gefunden`, `Cette page est introuvable`],
    [`Diese Seite ist nicht (mehr) verfügbar. Bitte kehren Sie zu unserer Startseite zurück.`, `Cette page n’est plus disponible. Veuillez revenir à notre page d’accueil.`],
    [`Homepage`, `Page d’accueil`],
    [`Protected page`, `Page protégée`],
    [`Projekt A661`, `Projet A661`],
    [`Test Geoserver`, `Test Geoserver`],
    [`Untitled`, `Sans titre`],
    [`Heading`, `Titre`],
    [`Heading 1`, `Titre 1`],
    [`Heading 2`, `Titre 2`],
    [`Heading 3`, `Titre 3`],
    [`Heading 4`, `Titre 4`],
    [`Heading 5`, `Titre 5`],
    [`Heading 6`, `Titre 6`],
    [`Block quote`, `Citation`],
    [`Ordered list`, `Liste ordonnée`],
    [`Unordered list`, `Liste non ordonnée`],
    [`Item 1`, `Élément 1`],
    [`Item 2`, `Élément 2`],
    [`Item 3`, `Élément 3`],
    [`Item A`, `Élément A`],
    [`Item B`, `Élément B`],
    [`Item C`, `Élément C`],
    [`Text link`, `Lien texte`],
    [`Bold text`, `Texte en gras`],
    [`Emphasis`, `Mise en évidence`],
    [`Superscript`, `Exposant`],
    [`Subscript`, `Indice`],
    [`Colors`, `Couleurs`],
    [`Typography`, `Typographie`],
    [`Icons`, `Icônes`],
    [`Buttons`, `Boutons`],
    [`Cards`, `Cartes`],
    [`Structure`, `Structure`],
    [`Padding`, `Espacement interne`],
    [`Margin`, `Marge`],
    [`Spacer`, `Espacement`],
    [`Utility Systems`, `Systèmes utilitaires`],
    [`Links`, `Liens`],
    [`Direction Classes`, `Classes de direction`],
    [`Size Classes`, `Classes de taille`],
    [`Card Default`, `Carte par défaut`],
    [`Button Text`, `Texte du bouton`],
    [`Link - Lorem ipsum dolor sit amet`, `Lien - Lorem ipsum dolor sit amet`],
    [`min read`, `min de lecture`],
    [`Read more`, `Lire la suite`],
    [`This is some text inside of a div block.`, `Ceci est un exemple de texte à l’intérieur d’un bloc div.`],
    [`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.`, `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.`],
    [`Lorem ipsum dolor sit amet, consectetur adipiscing elit.`, `Lorem ipsum dolor sit amet, consectetur adipiscing elit.`],
    [`Lorem ipsum dolor sit amet, consectetur.`, `Lorem ipsum dolor sit amet, consectetur.`],
    [`Lorem ipsum dolor sit amet, consectetur adipiscing.`, `Lorem ipsum dolor sit amet, consectetur adipiscing.`],
    [`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.`, `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.`],
    [`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`, `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`],
    [`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Netus praesent eu orci, volutpat vel proin`, `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Netus praesent eu orci, volutpat vel proin`],
    [`mattis id.`, `mattis id.`],
    [`Trassify – Digitale Trassenpläne & Gesamtleitungspläne`, `Trassify – Plans de tracé numériques et plans globaux des réseaux`],
    [`Trassify – Ihr Experte für digitale Trassenpläne`, `Trassify – Votre expert en plans de tracé numériques`],
    [`Trassify – Transparente Preisanfrage für digitale Trassenpläne`, `Trassify – Demande de prix transparente pour les plans de tracé numériques`],
    [`Trassify – Kontakt aufnehmen für digitale Trassenpläne`, `Trassify – Contact pour les plans de tracé numériques`],
    [`Ein Gesamtplan`, `Un plan global`],
    [`mit`, `avec`],
    [`allen Leitungen`, `tous les réseaux`],
    [`für ihr Projekt`, `pour votre projet`],
    [`mit allen`, `avec tous les`],
    [`Leitungen`, `réseaux`],
    [`Schluss mit unzähligen Anfragen, Plänen und Formaten - Sie erhalten`, `Fini les innombrables demandes, plans et formats : vous recevez`],
    [`Leitungsauskünfte digital in einem Plan`, `les informations sur les réseaux au format numérique dans un seul plan`],
    [`Leitungsauskunft einfach, wie sie sein sollte`, `Les informations sur les réseaux, comme elles devraient enfin être`],
    [`Export in ihr Wunschformat`, `Export dans le format de votre choix`],
    [`Wir sorgen für eine klare und einheitliche Darstellung Ihrer Planungsunterlagen. Ob DWG, DXF oder ein anderes Format – Sie bestimmen das Ausgabeformat, und wir liefern es.`, `Nous assurons une présentation claire et uniforme de vos documents de planification. Qu’il s’agisse de DWG, de DXF ou d’un autre format, vous choisissez le format de sortie et nous vous le livrons.`],
    [`Rasche Umsetzung bei höchstem Qualitätsanspruch`, `Mise en œuvre rapide avec les plus hautes exigences de qualité`],
    [`Zeit ist kostbar. Deshalb garantieren wir Ihnen eine zügige Bearbeitung Ihrer Aufträge, ohne dabei Kompromisse bei der Qualität einzugehen.`, `Le temps est précieux. C’est pourquoi nous garantissons un traitement rapide de vos demandes, sans compromis sur la qualité.`],
    [`Individuelle Anpassung an Ihre Anforderungen`, `Adaptation individuelle à vos exigences`],
    [`Wir passen unsere Leistungen exakt an Ihre Bedürfnisse an und stehen Ihnen für individuelle Wünsche telefonisch, per E-Mail oder im Meeting zur Seite.`, `Nous adaptons nos prestations exactement à vos besoins et restons à votre disposition pour toute demande individuelle par téléphone, e-mail ou en réunion.`],
    [`Optimale Planungssicherheit für Ihr Projekt`, `Une sécurité de planification optimale pour votre projet`],
    [`Mit vielen Plänen in unterschiedlichen Formaten können Fehler entstehen. Ein klarer, präziser Gesamttrassenplan sorgt für optimale Planungssicherheit, minimiert Risiken und vermeidet Überraschungen auf der Baustelle.`, `Lorsque de nombreux plans existent dans des formats différents, des erreurs peuvent survenir. Un plan global clair et précis garantit une sécurité de planification optimale, réduit les risques et évite les surprises sur le chantier.`],
    [`Es wird Zeit, dass Leitungsauskunft keine Kopfschmerzen mehr bereitet`, `Il est temps que les informations sur les réseaux ne provoquent plus de maux de tête`],
    [`Mit einem einzigen, übersichtlichen Trassenplan von Trassify reduzieren Sie Planungsfehler und gewinnen Zeit für andere Aufgaben.`, `Avec un seul plan de tracé clair de Trassify, vous réduisez les erreurs de planification et gagnez du temps pour d’autres tâches.`],
    [`Alle Pläne an einem Ort`, `Tous les plans en un seul endroit`],
    [`Statt unzählige Pläne in verschiedenen Formaten, Darstellungen, Maßstäben und Informationstiefen mühsam zu sichten, zu filtern und übereinanderzulegen, erhalten Sie von uns alle Leitungsdaten in einem einheitlichen Planformat nach Ihrer Wahl. Das spart Ihnen wertvolle Zeit und schont Ihre Nerven. Zeit, die Sie für wichtigere Aufgaben nutzen können und Nerven, die Ihnen im späteren Projektverlauf zugutekommen.`, `Au lieu d’examiner, filtrer et superposer laborieusement d’innombrables plans aux formats, représentations, échelles et niveaux d’information différents, vous recevez de notre part toutes les données de réseaux dans un format de plan unifié, selon votre choix. Cela vous fait gagner un temps précieux et vous épargne des efforts. Du temps pour des tâches plus importantes et de la sérénité pour la suite du projet.`],
    [`Planen ohne Kopfschmerzen.`, `Planifier sans maux de tête.`],
    [`Gesamttrassenpläne von Trassify`, `Plans globaux de réseaux par Trassify`],
    [`Statt unzählige Pläne, die in verschieden Formaten, Darstellungen, Maßstäben und Informationstiefen vorliegen, zu sichten, filtern und übereinander zulegen, erhalten Sie von uns sämtliche Leitungsdaten in einem einheitlichen Planformat nach Wahl. Das spart Ihnen Zeit und Nerven. Zeit, die Sie für andere Aufgaben aufwenden können und Nerven, die Sie vermutlich im späteren Projektverlauf brauchen können`, `Au lieu d’examiner, de filtrer et de superposer d’innombrables plans disponibles dans des formats, des représentations, des échelles et des niveaux d’information différents, vous recevez de notre part l’ensemble des données de réseaux dans un format unifié, au choix. Cela vous fait gagner du temps et de l’énergie. Du temps pour d’autres tâches et une sérénité dont vous aurez probablement besoin plus tard dans le projet.`],
    [`Spannend?`, `Intéressant ?`],
    [`Dann fangen wir an!`, `Alors commençons !`],
    [`Trassify macht Ihre Planung einfach und effizient. Fordern Sie jetzt ein individuelles Angebot an – schnell, unverbindlich und exakt auf Ihr Projekt zugeschnitten!`, `Trassify rend votre planification simple et efficace. Demandez dès maintenant une offre personnalisée, rapide, sans engagement et parfaitement adaptée à votre projet !`],
    [`Unser gemeinsamer Weg zum erfolgreichen Bauprojekt`, `Notre parcours commun vers un projet de construction réussi`],
    [`Datenbeschaffung`, `Collecte des données`],
    [`Sie haben die Wahl: Beschaffen Sie die Fremdleitungspläne selbst oder lassen Sie uns das schnell und zuverlässig für Sie übernehmen.`, `Vous avez le choix : obtenez vous-même les plans des réseaux tiers ou laissez-nous nous en charger rapidement et de manière fiable pour vous.`],
    [`Datenanalyse`, `Analyse des données`],
    [`Wir strukturieren, analysieren, bewerten und filtern Ihre Unterlagen - unabhängig davon, ob 10 MB oder 10.000 MB`, `Nous structurons, analysons, évaluons et filtrons vos documents, qu’il s’agisse de 10 Mo ou de 10 000 Mo.`],
    [`Digitalisierung`, `Numérisation`],
    [`Wir georeferenzieren und vektorisieren die wesentlichen Informationen aus Ihren Unterlagen und erzeugen Ihnen einen strukturierten und einheitlichen Gesamtplan in Ihrem Wunschformat.`, `Nous géoréférençons et vectorisons les informations essentielles de vos documents et produisons pour vous un plan global structuré et uniforme dans le format souhaité.`],
    [`All-in-One-Leitungsplan`, `Plan de réseaux tout-en-un`],
    [`Alle Leitungen und Daten stehen Ihnen auf Ihrem Smartphone, Tablet oder in Ihrem Bagger digital zur Verfügung. Damit sind Sie bestens vorbereitet für Ihr Vorhaben.`, `Tous les réseaux et toutes les données sont à votre disposition au format numérique sur votre smartphone, votre tablette ou même dans votre engin. Vous êtes ainsi parfaitement préparé pour votre projet.`],
    [`Sie haben Fragen?`, `Vous avez des questions ?`],
    [`Warum wurde Trassify gegründet?`, `Pourquoi Trassify a-t-elle été fondée ?`],
    [`Die Digitalisierung nimmt mittlerweile auch in konservativeren Branchen wie dem Bauwesen Fahrt auf.`, `La numérisation gagne désormais du terrain même dans des secteurs plus conservateurs comme la construction.`],
    [`Die Gründer von Trassify beobachten zunehmende Technologie-Offenheit und Investitionen in allen Phasen eines Bauwerks: In der Planung, in der Bauphase, im Bauwerksbetrieb. Dabei gewinnen die entsprechenden digitalen Werkzeuge in Form von Hard- und Software an Popularität. Zum Engpass werden auf der einen Seite die Fachkräfte und Experten, die die Werkzeuge anwenden, und auf der anderen Seite Daten, mit denen die Systeme gefüttert werden: Planungssoftware wie CAD oder GIS, Ausführungssysteme wie Maschinensteuerungen oder Vermessungsinstrumente oder IST-Modelle - alle Systeme benötigen Daten als Input.`, `Les fondateurs de Trassify constatent une ouverture croissante aux technologies et aux investissements à toutes les phases d’un ouvrage : en planification, pendant la construction et dans l’exploitation. Les outils numériques correspondants, matériels comme logiciels, gagnent en popularité. Les goulets d’étranglement sont, d’une part, les spécialistes qui utilisent ces outils et, d’autre part, les données qui alimentent les systèmes : logiciels de planification comme la CAO ou les SIG, systèmes d’exécution comme le guidage d’engins ou les instruments de topographie, ou encore modèles d’état existant. Tous ces systèmes ont besoin de données en entrée.`],
    [`Die Gründer von Trassify beobachten zunehmende Technologie-Offenheit und Investitionen in allen Phasen eines Bauwerks: In der Planung, in der Bauphase, im Bauwerksbetrieb. Dabei gewinnen die entsprechenden digitalen Werkzeuge in Form von Hard- und Software an Popularität. Zum Engpass werden auf der einen Seite die Fachkräfte und Experten, die die Werkzeuge anwenden, und auf der anderen Seite Daten, mit denen die Systeme gefüttert werden: Planungssoftware wie CADs oder GIS, Ausführungssysteme wie Maschinensteuerungen oder Vermessungsinstrumente, oder IST-Modelle - alle Systeme benötigen Daten als Input.`, `Les fondateurs de Trassify constatent une ouverture croissante aux technologies et aux investissements à toutes les phases d’un ouvrage : en planification, pendant la construction et dans l’exploitation. Les outils numériques correspondants, matériels comme logiciels, gagnent en popularité. Les goulets d’étranglement sont, d’une part, les spécialistes qui utilisent ces outils et, d’autre part, les données qui alimentent les systèmes : logiciels de planification comme les CAD ou les SIG, systèmes d’exécution comme le guidage d’engins ou les instruments de topographie, ou encore modèles d’état existant. Tous ces systèmes ont besoin de données en entrée.`],
    [`Trassify versteht sich als Vermittler und Erzeuger von Daten in für seine Kunden optimal nutzbaren Formaten.`, `Trassify se positionne comme intermédiaire et producteur de données dans des formats optimaux pour ses clients.`],
    [`Trassify sieht sich als Vermittler und Erzeuger von Daten in für seine Kunden optimal nutzbare Formate.`, `Trassify se considère comme un intermédiaire et un producteur de données dans des formats parfaitement exploitables pour ses clients.`],
    [`Ist ein Gesamttrassenplan vollständig?`, `Un plan global des réseaux est-il complet ?`],
    [`Im Zweifel: Nein.`, `En cas de doute : non.`],
    [`Natürlich nimmt Trassify jeden Hinweis auf Leitungen auf und arbeitet ihn in die Ergebnisse mit ein.`, `Bien entendu, Trassify prend en compte tout indice concernant la présence de réseaux et l’intègre dans les résultats.`],
    [`Allerdings existiert in Deutschland kein rechtsgültiges Leitungskataster. Dazu kann es erfahrungsgemäß immer, überall und selbst den professionellsten Leitungseigentümern vorkommen, dass Einmessungen fehlerhaft, gar nicht stattfinden oder Informationen verloren gehen. Deswegen ist jeder Verdacht und Hinweis auf Vorhandensein von Leitungen ernst zu nehmen: Hinweis- und Warnschilder, Gaspfähle, Marken und Straßenkappen, Schacht- und Schieberdeckel oder Schachteinbauten. Schlussendlich ist es in der Verantwortung des jeweiligen Grundstückseigentümers, zu wissen, welche bzw. wessen Leitungen in seinem Grundstück verlegt sind.`, `Cependant, il n’existe pas en Allemagne de cadastre des réseaux juridiquement opposable. L’expérience montre qu’il peut toujours arriver, partout, même aux gestionnaires les plus professionnels, que des levés soient erronés, n’aient pas été réalisés ou que des informations soient perdues. C’est pourquoi tout indice ou tout avertissement relatif à la présence de réseaux doit être pris au sérieux : panneaux d’avertissement, balises de gaz, repères, tampons de voirie, regards, couvercles ou équipements de chambre. En définitive, il appartient au propriétaire concerné de savoir quels réseaux et à qui ils appartiennent sur sa parcelle.`],
    [`Allerdings existiert in Deutschland kein rechtsgültiges Leitungskataster. Dazu kann es erfahrungsgemäß immer, überall und selbst den professionellsten Leitungseigentümern vorkommen, dass Einmessungen fehlerhaft, gar nicht stattfinden oder Informationen verloren gehen. Deswegen ist jeder Verdacht und Hinweis auf Vorhandensein von Leitungen ernst zu nehmen: Hinweis- und Warnschilder, Gaspfähle, Marken und Straßenkappen, Schacht- und Schieberdeckel oder Schachteinbauten. Schlussendlich muss der jeweilige Grundstückseigentümer wissen, welche bzw. wessen Leitungen in seinem Grundstück verlegt sind.`, `Cependant, il n’existe pas en Allemagne de cadastre des réseaux juridiquement opposable. L’expérience montre qu’il peut toujours arriver, partout, même aux gestionnaires les plus professionnels, que des levés soient erronés, n’aient pas été réalisés ou que des informations soient perdues. C’est pourquoi tout indice ou tout avertissement relatif à la présence de réseaux doit être pris au sérieux : panneaux d’avertissement, balises de gaz, repères, tampons de voirie, regards, couvercles ou équipements de chambre. En définitive, le propriétaire concerné doit savoir quels réseaux et ceux de qui sont posés sur sa parcelle.`],
    [`Wie lange dauert die Leistungserbringung?`, `Combien de temps dure la prestation ?`],
    [`Das hängt grundsätzlich von der Größe Ihres Projektes und der damit einhergehenden Datenmenge ab. Sofern nicht anders in Angebot oder Auftrag kommuniziert, kann von einer Lieferdauer von 2 Wochen ausgegangen werden.`, `Cela dépend essentiellement de la taille de votre projet et du volume de données associé. Sauf indication contraire dans l’offre ou la commande, un délai de livraison d’environ 2 semaines est à prévoir.`],
    [`In welchen Formaten erhalte ich die Ergebnisse / Leitungsdaten?`, `Dans quels formats vais-je recevoir les résultats / données de réseaux ?`],
    [`Trassify bevorzugt und empfiehlt den Umgang mit GIS-Formaten wie .shp oder .gpkq.`, `Trassify privilégie et recommande l’utilisation de formats SIG tels que .shp ou .gpkq.`],
    [`Trassify bevorzugt und empfiehlt den Umgang mit QGIS-Formaten wie .shp oder .gpkq.`, `Trassify privilégie et recommande l’utilisation de formats QGIS tels que .shp ou .gpkq.`],
    [`Nach Kundenwunsch können aber auch Google Earth Dateien (kml/kmz), CAD-Daten (dxf/dwg), klassische PDF-Pläne oder XML-Dateien erzeugt werden.`, `Selon les besoins du client, nous pouvons également produire des fichiers Google Earth (kml/kmz), des données CAO (dxf/dwg), des plans PDF classiques ou des fichiers XML.`],
    [`Trassify passt sich dabei auf die Bedürfnisse seiner Kunden an.`, `Trassify s’adapte aux besoins de ses clients.`],
    [`Welche Erfahrung hat Trassify?`, `Quelle est l’expérience de Trassify ?`],
    [`Mehr als 10 Jahre Facherfahrung im Tief- und Straßenbau, Vermessung, der Anwendung von GIS- und CAD Software sowie Geodatenbanken, unterstützt von theoretischem Wissen aus Bachelor- und Masterabschlüssen im Studiengang Geoinformation & Kommunaltechnik der Frankfurt University of Applied Sciences.`, `Plus de 10 ans d’expérience professionnelle dans les travaux publics et routiers, la topographie, l’utilisation de logiciels SIG et CAO ainsi que de bases de données géographiques, complétés par des connaissances théoriques issues de diplômes de licence et de master en géoinformation et technique communale à la Frankfurt University of Applied Sciences.`],
    [`Die Facherfahrung wird beflügelt durch akademische und praktische Erfahrung aus den Bereichen Betriebswirtschaft, IT-Implementierung und Projektmanagement.`, `Cette expertise est renforcée par une expérience académique et pratique dans les domaines de la gestion, de l’implémentation informatique et de la gestion de projet.`],
    [`Die Facherfahrung wird beflügelt durch akademische und praktische Erfahrung in den Bereichen Betriebswirtschaft, IT-Implementierung und Projektmanagement.`, `Cette expertise est renforcée par une expérience académique et pratique dans les domaines de la gestion, de l’implémentation informatique et de la gestion de projet.`],
    [`Wie arbeitet Trassify?`, `Comment travaille Trassify ?`],
    [`Seinen grundlegenden Werten folgend: Kundenorientiert, Zuverlässig, effizient und digital.`, `Fidèle à ses valeurs fondamentales : orientation client, fiabilité, efficacité et numérique.`],
    [`Wie genau sind die Leitungsdaten?`, `Quelle est la précision des données de réseaux ?`],
    [`Sie sollten von 0,2 bis 1,0 m Lagegenauigkeit ausgehen. Die Lage kann nicht genauer erfasst werden, als die Ursprungsquelle es hergibt. Bei Indizien auf ungenauere Lage informiert Trassify spätestens per projektabschließendem Protokoll. Erfahrungsgemäß kann es aus verschiedenen Gründen auch zu größeren Abweichungen kommen, weswegen stets mit größter Sorgfalt gearbeitet werden , und im Zweifel immer der direkt Kontakt zum Leitungseigentümer aufgesucht werden muss.`, `Vous devez tabler sur une précision planimétrique comprise entre 0,2 et 1,0 m. La position ne peut pas être déterminée plus précisément que ne le permet la source d’origine. En cas d’indices laissant supposer une précision moindre, Trassify en informe au plus tard dans le protocole de fin de projet. L’expérience montre que des écarts plus importants peuvent également survenir pour diverses raisons ; il convient donc de travailler avec le plus grand soin et, en cas de doute, de contacter directement le propriétaire du réseau.`],
    [`Gründe für Ungenauigkeiten, die nicht im Einflussbereich von Trassify liegen, sind:`, `Les causes d’imprécision qui ne relèvent pas de l’influence de Trassify sont notamment :`],
    [`- Alte Pläne -> Veränderung der Bodenverhältnisse`, `- Anciens plans -> évolution des conditions du sol`],
    [`- Nicht-dokumentierte Veränderungen an einer Leitung durch berührende / benachbarte Maßnahmen`, `- Modifications non documentées d’un réseau à la suite de travaux connexes ou voisins`],
    [`- Ungenaue Pläne durch falsche Einmessungen`, `- Plans imprécis en raison de relevés erronés`],
    [`- Nicht vorhandene Pläne`, `- Absence de plans`],
    [`- Falsche Lage durch falsche Koordinaten-Bezugssysteme`, `- Position erronée due à des systèmes de coordonnées incorrects`],
    [`Liefert Trassify 3D- oder BIM-konforme Daten?`, `Trassify fournit-elle des données conformes à la 3D ou au BIM ?`],
    [`Vorerst nicht direkt. Trassify kann den Leitungsobjekten Tiefeninformationen unterschiedlicher Qualität als Attribute beifügen, aus denen wiederum 3D-Informationen abgeleitet werden könnten.`, `Pas directement pour le moment. Trassify peut associer aux objets de réseau des informations de profondeur de qualité variable sous forme d’attributs, à partir desquelles des informations 3D peuvent ensuite être dérivées.`],
    [`Vorerst nicht direkt. Trassify kann den Leitungsobjekten Tiefeninformationen unterschiedlicher Qualität als Attribute beifügen, aus denen wiederum 3D-Informationen abgeleitet werden können.`, `Pas directement pour le moment. Trassify peut associer aux objets de réseau des informations de profondeur de qualité variable sous forme d’attributs, à partir desquelles des informations 3D peuvent ensuite être dérivées.`],
    [`Zur Erzeugung von BIM-Modellen empfiehlt und vermittelt Trassify gerne Partner.`, `Pour la création de modèles BIM, Trassify recommande et met volontiers en relation avec des partenaires.`],
    [`Zur Erzeugung von BIM-Modellen empfiehlt und vermittelt Trassify gerne auf Partner.`, `Pour la création de modèles BIM, Trassify recommande et met volontiers en relation avec des partenaires.`],
    [`Eine Lösung für alle Ihre Pläne`, `Une solution pour tous vos plans`],
    [`Unterschiedliche Formate? Viele Pläne? Wir bringen alles in einen einzigen Gesamttrassenplan – sauber, strukturiert und im Wunschformat. Fordern Sie jetzt Ihr kostenloses Erstgespräch an!`, `Formats différents ? De nombreux plans ? Nous réunissons tout dans un seul plan global des réseaux, propre, structuré et dans le format de votre choix. Demandez dès maintenant votre premier entretien gratuit !`],
    [`Digitale Leitungsdaten. Ein Gesamtplan.`, `Données de réseaux numériques. Un plan global.`],
    [`Kontaktieren Sie uns`, `Contactez-nous`],
    [`Wir bemühen uns, Ihnen innerhalb von 24 Stunden bestmöglich zu antworten.`, `Nous nous efforçons de vous répondre au mieux dans les 24 heures.`],
    [`Kontaktdaten`, `Coordonnées`],
    [`Wenn Sie Fragen haben, Anfragen stellen möchten oder generell mit uns in Kontakt treten wollen, können Sie sich gerne bei uns melden`, `Si vous avez des questions, souhaitez faire une demande ou simplement entrer en contact avec nous, n’hésitez pas à nous écrire.`],
    [`Your message has been submitted. We will get back to you within 24-48 hours.`, `Votre message a bien été envoyé. Nous vous répondrons sous 24 à 48 heures.`],
    [`Lernen Sie uns persönlich kennen`, `Faites connaissance avec nous en personne`],
    [`Mit einem einzigen, übersichtlichen Trassenplan von Trassify reduzieren Sie Planungsfehler und gewinnen Zeit für andere Aufgaben. Holen Sie sich jetzt Ihre individuelle Beratung – kostenlos und unverbindlich!`, `Avec un seul plan de tracé clair de Trassify, vous réduisez les erreurs de planification et gagnez du temps pour d’autres tâches. Obtenez dès maintenant votre conseil personnalisé, gratuit et sans engagement !`],
    [`Meet our team`, `Rencontrez notre équipe`],
    [`Lernen Sie unsere Experten kennen – spezialisiert auf digitale Trassenpläne für den Tiefbau, präzise, effizient und zukunftsorientiert!`, `Découvrez nos experts, spécialisés dans les plans de tracé numériques pour les travaux publics : précision, efficacité et vision d’avenir !`],
    [`How we started`, `Comment tout a commencé`],
    [`Die Idee zu Trassify entstand, wie so oft, aus einer echten Herausforderung. Bei einem Bauprojekt stießen wir auf ein großes Problem: Leitungspläne. Was wir bekamen, war handgezeichnete Kunstwerke aus den 80ern, unleserliche Scans oder ein modernes PDF, das aber komplett widersprüchliche Informationen enthielt. Das brachte uns zum Nachdenken: Wie konnte es sein, dass in einer zunehmend digitalen Welt unterirdische Leitungspläne so schlecht organisiert sind? Unsere Recherche zeigte, dass wir nicht allein sind – Bauunternehmen, Ingenieurbüros und Träger öffentlicher Belange kämpfen mit denselben Problemen. Es war klar: Hier musste sich etwas ändern. So entstand Trassify.`, `Comme souvent, l’idée de Trassify est née d’un véritable défi. Sur un projet de construction, nous avons été confrontés à un problème majeur : les plans des réseaux. Ce que nous recevions relevait de l’œuvre d’art manuscrite des années 80, de scans illisibles ou de PDF modernes contenant pourtant des informations totalement contradictoires. Cela nous a amenés à nous poser une question : comment se fait-il que, dans un monde de plus en plus numérique, les plans des réseaux souterrains soient encore si mal organisés ? Nos recherches ont montré que nous n’étions pas seuls : entreprises de construction, bureaux d’ingénierie et gestionnaires de réseaux font face aux mêmes difficultés. Il était évident que les choses devaient changer. C’est ainsi qu’est née Trassify.`],
    [`Unsere Mission`, `Notre mission`],
    [`Unsere Mission war von Anfang an klar – veraltete und unstrukturierte Leitungspläne zu digitalisieren und in ein verlässliches Gesamtbild zu integrieren. Dabei verbinden wir technologische Präzision mit einem tiefen Verständnis für die praktischen Anforderungen unserer Kunden. Denn wir glauben, dass präzise und digitale Pläne nicht nur Bauvorhaben erleichtern, sondern die Grundlage für die Infrastruktur von morgen schaffen. Trassify steht für Innovation, Zusammenarbeit und die Vision, das Unsichtbare sichtbar zu machen.`, `Dès le départ, notre mission était claire : numériser des plans de réseaux obsolètes et non structurés pour les intégrer dans une vue d’ensemble fiable. Nous allions associer précision technologique et compréhension approfondie des exigences pratiques de nos clients. Nous sommes convaincus que des plans précis et numériques ne facilitent pas seulement les projets de construction, mais constituent aussi la base des infrastructures de demain. Trassify incarne l’innovation, la collaboration et la volonté de rendre visible l’invisible.`],
    [`Unsere Werte`, `Nos valeurs`],
    [`Expertise`, `Expertise`],
    [`Unsere Datenlösungen sind das Ergebnis jahrelanger Erfahrung und tiefgehender Fachkenntnis. Wir bringen die nötige Expertise mit, um maßgeschneiderte, präzise Ergebnisse zu liefern, die genau Ihren Anforderungen entsprechen.`, `Nos solutions de données sont le résultat de nombreuses années d’expérience et d’une solide expertise métier. Nous disposons du savoir-faire nécessaire pour fournir des résultats précis et sur mesure, parfaitement adaptés à vos besoins.`],
    [`Zusammenarbeit`, `Collaboration`],
    [`Die Ziele unserer Kunden stehen im Mittelpunkt. Wir hören zu, verstehen Ihre Bedürfnisse und wachsen gemeinsam an den großen Herausforderungen, die moderne Bauprojekte und eine immer komplexer werdende Welt mit sich bringen.`, `Les objectifs de nos clients sont au centre de notre travail. Nous écoutons, comprenons vos besoins et grandissons ensemble face aux grands défis posés par les projets de construction modernes et un monde toujours plus complexe.`],
    [`Verlässlichkeit`, `Fiabilité`],
    [`Vertrauen ist die Grundlage unserer Arbeit. Unsere Kunden können sich darauf verlassen, dass ihre Daten in höchster Qualität und pünktlich geliefert werden, ganz gleich, wie komplex oder zeitkritisch das Projekt ist. Unsere Arbeit ist wie eine Uhr: präzise, zuverlässig und immer im richtigen Moment.`, `La confiance est la base de notre travail. Nos clients peuvent compter sur une livraison de leurs données avec la meilleure qualité et dans les délais, quelle que soit la complexité ou l’urgence du projet. Notre travail est comme une horloge : précis, fiable et toujours au bon moment.`],
    [`Innovation`, `Innovation`],
    [`Wir setzen auf modernste Technologien und kreative Lösungen, um für unsere Kunden immer einen Schritt voraus zu sein. Mit jeder Lieferung verbessern wir unser Handwerk, um Ihnen die bestmöglichen Ergebnisse zu bieten. Es gibt immer etwas Neues zu entdecken – seien Sie gespannt!`, `Nous misons sur les technologies les plus modernes et sur des solutions créatives pour toujours garder une longueur d’avance pour nos clients. À chaque livraison, nous améliorons encore notre savoir-faire afin de vous offrir les meilleurs résultats possibles. Il y a toujours quelque chose de nouveau à découvrir : restez curieux !`],
    [`Leichtigkeit`, `Simplicité`],
    [`Wir vereinfachen Ihre Arbeit, indem wir komplizierte Datenmassen auf die für Sie wesentlichen Informationen zusammenfassen. Sie erhalten smarten Überblick über die Ihr Vorhaben betreffenden Leitungen.`, `Nous simplifions votre travail en condensant des masses de données complexes vers les informations réellement essentielles pour vous. Vous obtenez une vue d’ensemble claire et intelligente des réseaux concernés par votre projet.`],
    [`Für welche Dienstleistung Interessieren Sie sich`, `Quel service vous intéresse ?`],
    [`Wählen Sie aus der Liste aus über welche Leistungen Sie gerne die Preise erfahren möchten`, `Choisissez dans la liste les prestations pour lesquelles vous souhaitez connaître les tarifs.`],
    [`Dienstleistung auswählen`, `Choisir un service`],
    [`Gesamttrassenplan für Ihr Vorhaben`, `Plan global des réseaux pour votre projet`],
    [`Georeferenzierung Ihrer Pläne`, `Géoréférencement de vos plans`],
    [`Projektinformationen`, `Informations sur le projet`],
    [`Damit wir unseren Aufwand schätzen können, benötigen wir noch ein paar Informationen zu Ihrem Vorhaben`, `Afin d’estimer notre charge de travail, nous avons besoin de quelques informations supplémentaires sur votre projet.`],
    [`(optional) Bitte geben Sie den Namen Ihres Projektes an`, `(optionnel) Veuillez indiquer le nom de votre projet`],
    [`Bitte geben Sie die Ausmaße Ihres Projektes in gängigen Größen an (Länge, Fläche, Anzahl Objekte)`, `Veuillez indiquer les dimensions de votre projet avec des mesures courantes (longueur, surface, nombre d’objets).`],
    [`Bitte beschreiben Sie die Lage Ihres Projektes oder laden Sie Karten/Pläne im nächsten Schritt hoch`, `Veuillez décrire l’emplacement de votre projet ou téléverser des cartes / plans à l’étape suivante.`],
    [`Bitte beschreiben Sie kurz ihr Projekt`, `Veuillez décrire brièvement votre projet.`],
    [`Leitungspläne`, `Plans de réseaux`],
    [`Falls Sie bereits ihre Pläne haben (egal ob über einen Dienstleister oder selbst eingeholt) schätzen Sie bitte ab, um wie viele Pläne es sich handelt`, `Si vous disposez déjà de vos plans (obtenus via un prestataire ou par vos propres moyens), veuillez estimer combien de plans cela représente.`],
    [`Wie viele Pläne hat Ihr Projekt`, `Combien de plans compte votre projet ?`],
    [`Noch unklar`, `Encore indéterminé`],
    [`(optional) Schicken Sie uns gerne Ihre Daten zu, um ein konkreteres Angebot zu erhalten`, `(optionnel) Vous pouvez nous transmettre vos données pour obtenir une offre plus précise.`],
    [`Was ist ein Upload-Link und wie erstelle ich einen?`, `Qu’est-ce qu’un lien de dépôt et comment en créer un ?`],
    [`Bevorzugtes Ausgabeformat`, `Format de sortie souhaité`],
    [`In welchem Format möchten Sie die Leitungsdaten erhalten, sodass Sie zielführend damit weiterarbeiten können?`, `Dans quel format souhaitez-vous recevoir les données de réseaux afin de pouvoir les exploiter efficacement ?`],
    [`Zeitrahmen`, `Calendrier`],
    [`Bis wann benötigen Sie die Daten? Wie lautet der Zeitplan Ihres Projektes?`, `Pour quand avez-vous besoin des données ? Quel est le calendrier de votre projet ?`],
    [`Gewünschtes Fertigstellungsdatum`, `Date de livraison souhaitée`],
    [`Haben wir etwas vergessen?`, `Avons-nous oublié quelque chose ?`],
    [`Wenn Sie noch weitere wichtige Information haben, die Sie uns mitteilen wollen, können Sie das gerne hier in dieses Feld eintragen`, `Si vous avez encore des informations importantes à nous transmettre, vous pouvez les indiquer ici.`],
    [`Zusätzlicher Hinweis`, `Remarque complémentaire`],
    [`Ein letzter Schritt`, `Une dernière étape`],
    [`Damit wir uns bei Ihnen melden können, sagen Sie uns bitte, wer Sie sind.`, `Afin que nous puissions vous recontacter, merci de nous dire qui vous êtes.`],
    [`Vorname`, `Prénom`],
    [`Nachname`, `Nom`],
    [`Firmenname`, `Nom de l’entreprise`],
    [`Name`, `Nom`],
    [`Firma`, `Entreprise`],
    [`Email`, `E-mail`],
    [`Nachricht`, `Message`],
    [`Preisrechner-Demo`, `Démo du calculateur de prix`],
    [`Dashboard`, `Tableau de bord`],
    [`Projekt`, `Projet`],
    [`Arbeitsdatein`, `Fichiers de travail`],
    [`Leitungsauskunft`, `Informations sur les réseaux`],
    [`Trassify Map`, `Carte Trassify`],
    [`Zurück zur Startseite`, `Retour à la page d’accueil`],
    [`Willkommen zurück, !`, `Bienvenue à nouveau !`],
    [`Impressum nach § 5 DDG`, `Mentions légales selon l’article 5 DDG`],
    [`Umsatzsteuer-ID`, `Numéro de TVA`],
    [`Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:`, `Numéro d’identification à la TVA conformément au § 27 a de la loi allemande sur la TVA :`],
    [`Redaktionell verantwortlich`, `Responsable éditorial`],
    [`EU-Streitschlichtung`, `Règlement des litiges de l’UE`],
    [`Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:`, `La Commission européenne met à disposition une plateforme de règlement en ligne des litiges (RLL) :`],
    [`Unsere E-Mail-Adresse finden Sie oben im Impressum.`, `Vous trouverez notre adresse e-mail ci-dessus dans les mentions légales.`],
    [`Verbraucherstreitbeilegung/Universalschlichtungsstelle`, `Règlement des litiges de consommation / organisme universel de médiation`],
    [`Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`, `Nous ne sommes ni disposés ni tenus de participer à une procédure de règlement des litiges devant un organisme de médiation pour les consommateurs.`],
    [`Quelle:`, `Source :`],
    [`* Einige Angaben im Impressum, wie die Umsatzsteuer-Identifikationsnummer oder die Handelsregisternummer, werden nach Abschluss der entsprechenden Verfahren ergänzt.`, `* Certaines informations des mentions légales, comme le numéro d’identification TVA ou le numéro d’immatriculation au registre du commerce, seront complétées après finalisation des procédures correspondantes.`],
    [`Datenschutzerklärung`, `Déclaration de confidentialité`],
    [`1. Datenschutz auf einen Blick`, `1. La protection des données en un coup d’œil`],
    [`Allgemeine Hinweise`, `Informations générales`],
    [`Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.`, `Les informations suivantes donnent un aperçu simple de ce qu’il advient de vos données personnelles lorsque vous visitez ce site web. Les données personnelles sont toutes les données permettant de vous identifier personnellement. Vous trouverez des informations détaillées sur la protection des données dans notre déclaration de confidentialité reproduite ci-dessous.`],
    [`Datenerfassung auf dieser Website`, `Collecte de données sur ce site web`],
    [`Wer ist verantwortlich für die Datenerfassung auf dieser Website?`, `Qui est responsable de la collecte des données sur ce site web ?`],
    [`Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle“ in dieser Datenschutzerklärung entnehmen.`, `Le traitement des données sur ce site est effectué par l’exploitant du site. Vous trouverez ses coordonnées dans la section « Informations sur le responsable du traitement » de la présente déclaration de confidentialité.`],
    [`Wie erfassen wir Ihre Daten?`, `Comment collectons-nous vos données ?`],
    [`Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.`, `Vos données sont, d’une part, collectées lorsque vous nous les communiquez. Il peut s’agir par exemple de données que vous saisissez dans un formulaire de contact.`],
    [`Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.`, `D’autres données sont collectées automatiquement ou après votre consentement lors de votre visite sur le site par nos systèmes informatiques. Il s’agit principalement de données techniques (par ex. navigateur internet, système d’exploitation ou heure de consultation de la page). Ces données sont collectées automatiquement dès que vous entrez sur ce site.`],
    [`Wofür nutzen wir Ihre Daten?`, `À quelles fins utilisons-nous vos données ?`],
    [`Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden. Sofern über die Website Verträge geschlossen oder angebahnt werden können, werden die übermittelten Daten auch für Vertragsangebote, Bestellungen oder sonstige Auftragsanfragen verarbeitet.`, `Une partie des données est collectée afin d’assurer une mise à disposition correcte du site. D’autres données peuvent être utilisées pour analyser votre comportement d’utilisation. Si des contrats peuvent être conclus ou préparés via le site, les données transmises sont également traitées pour des offres contractuelles, des commandes ou d’autres demandes.`],
    [`Welche Rechte haben Sie bezüglich Ihrer Daten?`, `Quels sont vos droits concernant vos données ?`],
    [`Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.`, `Vous avez à tout moment le droit d’obtenir gratuitement des informations sur l’origine, les destinataires et la finalité de vos données personnelles enregistrées. Vous avez également le droit d’exiger la rectification ou la suppression de ces données. Si vous avez donné votre consentement au traitement des données, vous pouvez le révoquer à tout moment pour l’avenir. Vous avez en outre le droit, dans certaines circonstances, de demander la limitation du traitement de vos données personnelles. Vous disposez également d’un droit de recours auprès de l’autorité de contrôle compétente.`],
    [`Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden.`, `Pour cela ainsi que pour toute autre question relative à la protection des données, vous pouvez nous contacter à tout moment.`],
    [`Analyse-Tools und Tools von Drittanbietern`, `Outils d’analyse et outils de fournisseurs tiers`],
    [`Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. Das geschieht vor allem mit sogenannten Analyseprogrammen.`, `Lors de la visite de ce site web, votre comportement de navigation peut être analysé statistiquement. Cela se fait principalement à l’aide de programmes d’analyse.`],
    [`Detaillierte Informationen zu diesen Analyseprogrammen finden Sie in der folgenden Datenschutzerklärung.`, `Vous trouverez des informations détaillées sur ces programmes d’analyse dans la déclaration de confidentialité suivante.`],
    [`2. Hosting`, `2. Hébergement`],
    [`Wir hosten die Inhalte unserer Website bei folgenden Anbietern:`, `Nous hébergeons le contenu de notre site web chez les fournisseurs suivants :`],
    [`Weitere Informationen entnehmen Sie der Datenschutzerklärung von Strato:`, `Vous trouverez de plus amples informations dans la politique de confidentialité de Strato :`],
    [`Die Verwendung von Strato erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer möglichst zuverlässigen Darstellung unserer Website. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im Endgerät des Nutzers (z. B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.`, `L’utilisation de Strato repose sur l’art. 6, al. 1, let. f du RGPD. Nous avons un intérêt légitime à une présentation aussi fiable que possible de notre site web. Si un consentement correspondant a été demandé, le traitement est effectué exclusivement sur la base de l’art. 6, al. 1, let. a du RGPD et du § 25, al. 1 du TDDDG, dans la mesure où le consentement couvre le stockage de cookies ou l’accès à des informations sur l’équipement terminal de l’utilisateur (par ex. device fingerprinting) au sens du TDDDG. Le consentement peut être révoqué à tout moment.`],
    [`Auftragsverarbeitung`, `Traitement des données pour le compte d’un tiers`],
    [`Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes geschlossen. Hierbei handelt es sich um einen datenschutzrechtlich vorgeschriebenen Vertrag, der gewährleistet, dass dieser die personenbezogenen Daten unserer Websitebesucher nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet.`, `Nous avons conclu un contrat de traitement des données (AVV) pour l’utilisation du service mentionné ci-dessus. Il s’agit d’un contrat exigé par la législation sur la protection des données, qui garantit que ce prestataire ne traite les données personnelles de nos visiteurs que selon nos instructions et dans le respect du RGPD.`],
    [`3. Allgemeine Hinweise und Pflichtinformationen`, `3. Informations générales et obligations légales`],
    [`Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.`, `Les exploitants de ces pages prennent très au sérieux la protection de vos données personnelles. Nous traitons vos données personnelles de manière confidentielle et conformément aux dispositions légales relatives à la protection des données ainsi qu’à la présente déclaration de confidentialité.`],
    [`Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.`, `Lorsque vous utilisez ce site web, différentes données personnelles sont collectées. Les données personnelles sont des données permettant de vous identifier personnellement. La présente déclaration de confidentialité explique quelles données nous collectons et à quelles fins nous les utilisons. Elle explique également comment et pourquoi cela a lieu.`],
    [`Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.`, `Nous attirons votre attention sur le fait que la transmission de données sur Internet (par ex. lors de communications par e-mail) peut présenter des failles de sécurité. Une protection sans faille des données contre l’accès de tiers n’est pas possible.`],
    [`Hinweis zur verantwortlichen Stelle`, `Informations sur le responsable du traitement`],
    [`Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.`, `Le responsable du traitement est la personne physique ou morale qui décide, seule ou conjointement avec d’autres, des finalités et des moyens du traitement des données personnelles (par ex. noms, adresses e-mail, etc.).`],
    [`Speicherdauer`, `Durée de conservation`],
    [`Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.`, `De nombreuses opérations de traitement de données ne sont possibles qu’avec votre consentement explicite. Vous pouvez révoquer à tout moment un consentement déjà accordé. La légalité du traitement effectué jusqu’à la révocation n’est pas affectée par celle-ci.`],
    [`Beschwerderecht bei der zuständigen Aufsichtsbehörde`, `Droit de recours auprès de l’autorité de contrôle compétente`],
    [`Widerspruch gegen Werbe-E-Mails`, `Opposition aux e-mails publicitaires`],
    [`4. Datenerfassung auf dieser Website`, `4. Collecte de données sur ce site web`],
    [`Cookies`, `Cookies`],
    [`Kontaktformular`, `Formulaire de contact`],
    [`Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.`, `Si vous nous envoyez des demandes via le formulaire de contact, vos informations issues du formulaire, y compris les coordonnées que vous y avez indiquées, sont enregistrées chez nous afin de traiter votre demande et pour le cas où des questions complémentaires surviendraient. Nous ne transmettons pas ces données sans votre consentement.`],
    [`Anfrage per E-Mail, Telefon oder Telefax`, `Demande par e-mail, téléphone ou fax`],
    [`Impressum nach § 5 DDG`, `Mentions légales selon le § 5 DDG`],
    [`Allgemeine Geschäftsbedingungen`, `Conditions générales de vente`],
    [`AGBs der Trassify GmbH`, `Conditions générales de la société Trassify GmbH`],
    [`1. Geltungsbereich`, `1. Champ d’application`],
    [`2. Leistungen von Trassify`, `2. Prestations de Trassify`],
    [`3. Vertragsschluss`, `3. Conclusion du contrat`],
    [`4. Pflichten des Kunden`, `4. Obligations du client`],
    [`5. Haftung und Gewährleistung`, `5. Responsabilité et garantie`],
    [`6. Urheberrechte und Nutzungsrechte`, `6. Droits d’auteur et droits d’utilisation`],
    [`7. Datenschutz`, `7. Protection des données`],
    [`8. Schlussbestimmungen`, `8. Dispositions finales`],
    [`(1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge und Dienstleistungen der Trassify GmbH (nachfolgend „Trassify“).`, `(1) Les présentes conditions générales de vente (CGV) s’appliquent à tous les contrats et services de Trassify GmbH (ci-après « Trassify »).`],
    [`(2) Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen des Kunden werden nur dann Vertragsbestandteil, wenn Trassify ihrer Geltung ausdrücklich zugestimmt hat.`, `(2) Des conditions générales du client divergentes, contraires ou complémentaires ne deviennent partie intégrante du contrat que si Trassify a expressément accepté leur application.`],
    [`(5) Trassify bietet Dienstleistungen zur Digitalisierung und Zusammenführung von Leitungsplänen an. Der übergeordnete Zweck dieser Dienstleistung entspringt aus dem Vorhaben/Projekt des Kunden.`, `(5) Trassify propose des services de numérisation et de regroupement de plans de réseaux. L’objectif général de cette prestation découle du projet du client.`],
    [`(6) Die zu digitalisierenden Leitungspläne werden vom Kunden zur Verfügung gestellt.`, `(6) Les plans de réseaux à numériser sont fournis par le client.`],
    [`(7) Aufgrund unterschiedlicher Formate und veralteter Daten kann es bei der Digitalisierung und Zusammenführung der Leitungspläne zu Ungenauigkeiten kommen. Diese möglichen Abweichungen sind vom Kunden bei der Nutzung der Ergebnisse zu berücksichtigen.`, `(7) En raison de formats différents et de données obsolètes, des imprécisions peuvent apparaître lors de la numérisation et du regroupement des plans de réseaux. Le client doit tenir compte de ces éventuels écarts lors de l’utilisation des résultats.`],
    [`(8) Die Dienstleistungen von Trassify sind rein vorbereitend und ersetzen keine technische Prüfung oder Verifizierung der Örtlichkeit durch den Kunden oder Dritte.`, `(8) Les prestations de Trassify sont exclusivement préparatoires et ne remplacent pas une vérification technique ou une validation sur site par le client ou par des tiers.`],
    [`Stand: Februar 2025`, `Version : février 2025`]
    ,[`Bitte nicht ausfuellen:`, `Veuillez ne pas remplir ce champ :`]
    ,[`Your message has been submitted.`, `Votre message a bien été envoyé.`]
    ,[`We will get back to you within 24-48 hours.`, `Nous vous répondrons sous 24 à 48 heures.`]
    ,[`Oops! Something went wrong while submitting the form.`, `Oups ! Une erreur s’est produite lors de l’envoi du formulaire.`]
    ,[`Wie geht es weiter?`, `Et ensuite ?`]
    ,[`Wir vereinbaren ein unverbindliches persönliches Erstgespräch, um Ihre spezifischen Anforderungen und die Größe des Projekts zu ermitteln. Hier klären wir, welche Art von Unterstützung Sie benötigen.`, `Nous convenons d’un premier entretien personnel sans engagement afin de déterminer vos besoins spécifiques et l’ampleur du projet. C’est à ce moment que nous clarifions le type d’accompagnement dont vous avez besoin.`]
    ,[`Wir sammeln alle relevanten Daten und erstellen daraus einen digitalen Gesamttrassenplan in Ihrem Wunschformat. Dieser wird Ihnen vollständig und strukturiert zur Verfügung gestellt.`, `Nous rassemblons toutes les données pertinentes et élaborons à partir de celles-ci un plan global numérique des réseaux dans le format de votre choix. Il vous est fourni de manière complète et structurée.`]
    ,[`Wir passen unsere Leistungen exakt an Ihre spezifischen Bedürfnisse und Projektanforderungen an. So erhalten Sie maßgeschneiderte Lösungen, die perfekt auf Ihr Vorhaben abgestimmt sind.`, `Nous adaptons nos prestations exactement à vos besoins spécifiques et aux exigences de votre projet. Vous obtenez ainsi des solutions sur mesure, parfaitement adaptées à votre opération.`]
    ,[`Wir freuen uns auf die weitere Zusammenarbeit!`, `Nous nous réjouissons de poursuivre notre collaboration !`]
    ,[`Wir bieten Ihnen die Möglichkeit, Ihre Pläne individuell zu attribuieren. So können wichtige Informationen präzise und übersichtlich dargestellt werden.`, `Nous vous offrons la possibilité d’attribuer vos plans de manière personnalisée. Les informations importantes peuvent ainsi être présentées avec précision et clarté.`]
    ,[`Wer am Anfang eines neuen, großen Projektes steht, weiß, wie aufwendig die Informationszusammenfassung ist. Durch Wohlstand und Fortschritt werden Ver- und Entsorgungsleitungen in Deutschland seit über 100 Jahren unterirdisch verlegt. Da aber jeder Leitungseigentümer die Dokumentation seiner Leitungen auf eigene Art und Weise hält, liegen Unmengen an Informationen, in verschiedensten Formaten an unüberschaubar vielen Stellen vor`, `Quiconque se trouve au début d’un nouveau grand projet sait à quel point la synthèse des informations peut être fastidieuse. En Allemagne, les réseaux d’alimentation et d’évacuation sont posés en souterrain depuis plus de 100 ans. Mais comme chaque propriétaire de réseau gère la documentation de ses installations à sa manière, d’énormes quantités d’informations sont dispersées dans une multitude d’endroits et sous des formats très variés.`]
    ,[`Statt eigenständig dutzende Trassenpläne bei 20-50 Betreibern einzuholen, nur um dann Informationen in unterschiedlichen Formaten zu erhalten, erhalten Sie bei uns einen einzigen Plan. Das spart Ihnen Zeit und Nerven. Zeit, die Sie für andere Aufgaben aufwenden können und Nerven, die Sie vermutlich im späteren Projektverlauf brauchen.`, `Au lieu de demander vous-même des dizaines de plans auprès de 20 à 50 exploitants pour recevoir ensuite des informations dans des formats différents, vous obtenez chez nous un seul plan. Cela vous fait gagner du temps et vous évite bien des efforts. Du temps pour d’autres tâches et de la sérénité dont vous aurez probablement besoin plus tard dans le projet.`]
    ,[`Sparen Sie sich die Recherche und Digitalisierung von unstrukturierten Leitungsplänen und konzentrieren Sie sich auf Ihre Hauptleistung`, `Épargnez-vous la recherche et la numérisation de plans de réseaux non structurés et concentrez-vous sur votre cœur de métier.`]
    ,[`So machen wir bei der Digitalisierung von Leitungsplänen den Unterschied.`, `C’est ainsi que nous faisons la différence dans la numérisation des plans de réseaux.`]
    ,[`Sie stehen oft vor einer Vielzahl an Informationen, Plänen und Daten, die besonders bei großen Projekten unübersichtlich sein können`, `Vous êtes souvent confronté à une multitude d’informations, de plans et de données qui peuvent devenir difficiles à maîtriser, surtout sur les grands projets.`]
    ,[`Mit unseren durchdachten und genau abgestimmten Lösungen schaffen wir eine solide Grundlage für Ihr Projekt – für maximale Planungssicherheit und den Erfolg Ihrer Vorhaben.`, `Grâce à nos solutions bien pensées et précisément adaptées, nous créons une base solide pour votre projet, afin de maximiser la sécurité de planification et la réussite de vos opérations.`]
    ,[`Mit uns ist der Datenkonvertierungsprozess ein Leichtes. Wir wandeln Pläne zuverlässig von PDF in DXF und von DXF in QGIS um – schnell und präzise.`, `Avec nous, le processus de conversion des données devient simple. Nous convertissons de manière fiable les plans de PDF en DXF et de DXF vers QGIS, rapidement et avec précision.`]
    ,[`Mit dem fertigen Gesamttrassenplan können Sie sorgenfrei, strukturiert und effizient Ihr Bauvorhaben weiterführen. Unsere Planungslösung ermöglicht es Ihnen, Zeit und Aufwand zu sparen.`, `Avec le plan global des réseaux finalisé, vous pouvez poursuivre votre projet de construction de façon sereine, structurée et efficace. Notre solution de planification vous permet d’économiser du temps et des efforts.`]
    ,[`Mehr Referenzen`, `Plus de références`]
    ,[`Kostenlose Preisanfrage`, `Demande de prix gratuite`]
    ,[`Komplexität durch heterogene Datenformate`, `Complexité due à des formats de données hétérogènes`]
    ,[`Read time`, `Temps de lecture`]
    ,[`Published on`, `Publié le`]
    ,[`News & Articles`, `Actualités et articles`]
    ,[`Written by`, `Rédigé par`]
    ,[`Work`, `Travail`]
    ,[`Service`, `Service`]
    ,[`Shape / GQIS Projekt`, `Projet Shape / QGIS`]
    ,[`PDF`, `PDF`]
    ,[`Main Brand Color`, `Couleur principale de la marque`]
    ,[`Text Colors`, `Couleurs de texte`]
    ,[`Text Alignments`, `Alignements du texte`]
    ,[`Theme Styles`, `Styles du thème`]
    ,[`Symbols`, `Symboles`]
    ,[`Studio`, `Studio`]
    ,[`Powered by Webflow`, `Propulsé par Webflow`]
    ,[`White`, `Blanc`]
    ,[`Line Icons Rounded`, `Icônes linéaires arrondies`]
    ,[`Line Icons Square`, `Icônes linéaires carrées`]
    ,[`Social Media Icons`, `Icônes des réseaux sociaux`]
    ,[`Light Paragraphs`, `Paragraphes légers`]
    ,[`Paragraph Default - 18px/1.667em`, `Paragraphe par défaut - 18px/1.667em`]
    ,[`Paragraph Default - 16px/1em`, `Paragraphe par défaut - 16px/1em`]
    ,[`Paragraph Small - 15px/1.600em`, `Petit paragraphe - 15px/1.600em`]
    ,[`Paragraph Large - 24px/1.583em`, `Grand paragraphe - 24px/1.583em`]
    ,[`Level 1`, `Niveau 1`]
    ,[`Level 2`, `Niveau 2`]
    ,[`Level 3`, `Niveau 3`]
    ,[`Level 4`, `Niveau 4`]
    ,[`Level 5`, `Niveau 5`]
    ,[`Neutral Colors`, `Couleurs neutres`]
    ,[`License`, `Licence`]
    ,[`Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer`, `Nous ne sommes ni disposés ni tenus de participer à des procédures de règlement des litiges devant une`]
    ,[`Verbraucherschlichtungsstelle teilzunehmen.`, `instance de médiation pour les consommateurs.`]
    ,[`Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)`, `Droit d’opposition à la collecte des données dans des cas particuliers ainsi qu’à la prospection directe (art. 21 RGPD)`]
    ,[`Widerruf Ihrer Einwilligung zur Datenverarbeitung`, `Révocation de votre consentement au traitement des données`]
    ,[`Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht von Dritten mitgelesen werden.`, `Lorsque le chiffrement SSL ou TLS est activé, les données que vous nous transmettez ne peuvent pas être lues par des tiers.`]
    ,[`Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.`, `Si vous nous contactez par e-mail, téléphone ou fax, votre demande, y compris toutes les données personnelles qui en découlent (nom, demande), est enregistrée et traitée chez nous afin de traiter votre requête. Nous ne transmettons pas ces données sans votre consentement.`]
    ,[`Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abwägung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen überwiegen, haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.`, `Si vous avez formulé une opposition conformément à l’art. 21, al. 1 du RGPD, une mise en balance entre vos intérêts et les nôtres doit être effectuée. Tant qu’il n’est pas établi quels intérêts prévalent, vous avez le droit de demander la limitation du traitement de vos données personnelles.`]
    ,[`Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats verarbeitet werden.`, `Si vous avez limité le traitement de vos données personnelles, ces données ne peuvent, à l’exception de leur conservation, être traitées qu’avec votre consentement, ou pour la constatation, l’exercice ou la défense de droits en justice, ou pour protéger les droits d’une autre personne physique ou morale, ou pour des motifs d’intérêt public important de l’Union européenne ou d’un État membre.`]
    ,[`Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer der Prüfung haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.`, `Si vous contestez l’exactitude des données personnelles enregistrées chez nous, nous avons généralement besoin de temps pour le vérifier. Pendant la durée de cette vérification, vous avez le droit de demander la limitation du traitement de vos données personnelles.`]
    ,[`Welche Cookies und Dienste auf dieser Website eingesetzt werden, können Sie dieser Datenschutzerklärung entnehmen.`, `Vous trouverez dans la présente déclaration de confidentialité quels cookies et services sont utilisés sur ce site web.`]
    ,[`Unsere Internetseiten verwenden so genannte „Cookies“. Cookies sind kleine Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert. Session-Cookies werden nach Ende Ihres Besuchs automatisch gelöscht. Permanente Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese selbst löschen oder eine automatische Löschung durch Ihren Webbrowser erfolgt.`, `Nos pages internet utilisent ce que l’on appelle des « cookies ». Les cookies sont de petits paquets de données et ne causent aucun dommage à votre terminal. Ils sont enregistrés soit temporairement pour la durée d’une session (cookies de session), soit de manière permanente (cookies permanents) sur votre terminal. Les cookies de session sont automatiquement supprimés à la fin de votre visite. Les cookies permanents restent enregistrés sur votre terminal jusqu’à ce que vous les supprimiez vous-même ou qu’une suppression automatique soit effectuée par votre navigateur.`]
    ,[`Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben (z. B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.`, `Dans la mesure où aucune durée de conservation plus spécifique n’est mentionnée dans la présente déclaration de confidentialité, vos données personnelles restent enregistrées chez nous jusqu’à ce que la finalité du traitement des données cesse. Si vous faites valoir une demande légitime d’effacement ou révoquez votre consentement au traitement des données, vos données seront supprimées, à moins que nous n’ayons d’autres motifs légalement admissibles de conserver vos données personnelles (par exemple des délais de conservation en droit fiscal ou commercial) ; dans ce dernier cas, la suppression intervient une fois ces motifs disparus.`]
    ,[`Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO verarbeitet werden. Im Falle einer ausdrücklichen Einwilligung in die Übertragung personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung außerdem auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO. Sofern Sie in die Speicherung von Cookies oder in den Zugriff auf Informationen in Ihr Endgerät (z. B. via Device-Fingerprinting) eingewilligt haben, erfolgt die Datenverarbeitung zusätzlich auf Grundlage von § 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit widerrufbar. Sind Ihre Daten zur Vertragserfüllung oder zur Durchführung vorvertraglicher Maßnahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erfüllung einer rechtlichen Verpflichtung erforderlich sind auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. Über die jeweils im Einzelfall einschlägigen Rechtsgrundlagen wird in den folgenden Absätzen dieser Datenschutzerklärung informiert.`, `Si vous avez consenti au traitement des données, nous traitons vos données personnelles sur la base de l’art. 6, al. 1, let. a du RGPD ou de l’art. 9, al. 2, let. a du RGPD lorsque des catégories particulières de données visées à l’art. 9, al. 1 du RGPD sont traitées. En cas de consentement exprès au transfert de données personnelles vers des pays tiers, le traitement repose également sur l’art. 49, al. 1, let. a du RGPD. Si vous avez consenti au stockage de cookies ou à l’accès à des informations sur votre terminal (par ex. via le device fingerprinting), le traitement repose en outre sur le § 25, al. 1 du TDDDG. Le consentement peut être révoqué à tout moment. Si vos données sont nécessaires à l’exécution du contrat ou à la mise en œuvre de mesures précontractuelles, nous les traitons sur la base de l’art. 6, al. 1, let. b du RGPD. Nous les traitons également si cela est nécessaire à l’exécution d’une obligation légale sur la base de l’art. 6, al. 1, let. c du RGPD. Le traitement peut aussi reposer sur notre intérêt légitime conformément à l’art. 6, al. 1, let. f du RGPD. Les bases juridiques applicables dans chaque cas sont précisées dans les paragraphes suivants de la présente déclaration de confidentialité.`]
    ,[`Bitte wählen Sie ihr bevorzugtes Ausgabeformat aus der Liste aus`, `Veuillez choisir votre format de sortie préféré dans la liste.`]
    ,[`Kmz (Google Earth)`, `KMZ (Google Earth)`]
    ,[`Dxf`, `DXF`]
    ,[`Dwg`, `DWG`]
    ,[`Ihr Wunschformat ist nicht in der Liste? Tragen Sie es hier ein`, `Votre format souhaité n’est pas dans la liste ? Indiquez-le ici.`]
    ,[`Thank you! Your submission has been received!`, `Merci ! Votre demande a bien été reçue.`]
    ,[`Diese Seite befindet sich noch im Aufbau`, `Cette page est encore en cours de construction`]
    ,[`Incorrect password. Please try again.`, `Mot de passe incorrect. Veuillez réessayer.`]
    ,[`Link 1`, `Lien 1`]
    ,[`Link 2`, `Lien 2`]
    ,[`Link 3`, `Lien 3`]
    ,[`Flughafen`, `Aéroport`]
    ,[`In Ihrem persönlichen Dashboard finden Sie alles Wichtige rund um Ihr Projekt – übersichtlich, aktuell und jederzeit abrufbar.`, `Dans votre tableau de bord personnel, vous trouvez tout ce qui est important pour votre projet : clair, à jour et accessible à tout moment.`]
    ,[`Wenn Sie Fragen haben oder Unterstützung brauchen, melden Sie sich gern jederzeit bei uns.`, `Si vous avez des questions ou besoin d’aide, n’hésitez pas à nous contacter à tout moment.`]
    ,[`Category`, `Catégorie`]
    ,[`About Architecturefolio X`, `À propos d’Architecturefolio X`]
    ,[`Browse Articles`, `Parcourir les articles`]
    ,[`Articles by`, `Articles par`]
    ,[`Awards`, `Récompenses`]
    ,[`Team`, `Équipe`]
    ,[`Website by Flowbase`, `Site web par Flowbase`]
    ,[`M.Eng Geoinformation & Kommunaltechnik`, `M.Eng. Géoinformation et ingénierie communale`]
    ,[`Vermessung`, `Topographie`]
    ,[`Dateien importieren`, `Importer des fichiers`]
    ,[`Dateien hierher ziehen, um zu importieren`, `Faites glisser les fichiers ici pour les importer`]
    ,[`Ich stimme zu, dass meine Daten zur Bearbeitung der Anfrage gemäß Datenschutz verarbeitet werden. *`, `J’accepte que mes données soient traitées pour le traitement de la demande conformément à la politique de confidentialité. *`]
    ,[`Bitte den Datenschutz bestätigen.`, `Veuillez confirmer la politique de confidentialité.`]
    ,[`Copyright © 2023 Creative Studio.`, `Droits d’auteur © 2023 Creative Studio.`]
    ,[`Digitale Trassenpläne`, `Plans de tracé numériques`]
    ,[`Kennen Sie diese Probleme?`, `Connaissez-vous ces problèmes ?`]
    ,[`Problem 1`, `Problème 1`]
    ,[`Problem 2`, `Problème 2`]
    ,[`Problem 3`, `Problème 3`]
    ,[`Problem 4`, `Problème 4`]
    ,[`Hoher Arbeitsaufwand`, `Charge de travail élevée`]
    ,[`Experten-Engpass`, `Pénurie d’experts`]
    ,[`Unübersichtlich viele Informationen`, `Trop d’informations difficiles à exploiter`]
    ,[`Die Lösung`, `La solution`]
    ,[`Einen einzigen Plan`, `Un seul plan`]
    ,[`Vereinheitlichung aller Pläne in einem Format Ihrer Wahl`, `Uniformisation de tous les plans dans le format de votre choix`]
    ,[`PDF zu DXF, DXG zu qGIS`, `PDF vers DXF, DXG vers QGIS`]
    ,[`Attribuierung nach Wahl`, `Attribution au choix`]
    ,[`Schritt für Schritt Anleitung, wie eine zusammenarbeit mit uns aussehen würde`, `Guide étape par étape montrant à quoi peut ressembler une collaboration avec nous`]
    ,[`Beschaffung der Trassenpläne`, `Obtention des plans de réseaux`]
    ,[`Sie besorgen die benötigten Trassenpläne:`, `Vous obtenez les plans de réseaux nécessaires :`]
    ,[`-Sie können diese selbst bereitstellen.`, `-Vous pouvez les fournir vous-même.`]
    ,[`-Alternativ können Sie Pläne von einer Leitungsauskunftsfirma Ihrer Wahl beziehen.`, `-Vous pouvez aussi obtenir les plans auprès d’une société de renseignements de réseaux de votre choix.`]
    ,[`-Auf Wunsch übernehmen wir die Leitungsauskunft für Sie als Komplettpaket.`, `-Si vous le souhaitez, nous prenons en charge pour vous la demande d’informations sur les réseaux sous forme de pack complet.`]
    ,[`Erstellung des digitalen Gesamttrassenplans`, `Création du plan global numérique des réseaux`]
    ,[`Effiziente Weiterarbeit an Ihrem Bauvorhaben`, `Poursuite efficace de votre projet de construction`]
    ,[`Das Zusammenführen, Sichten, Filtern und Vereinheitlichen von Fremdleitungsdaten ist zeitintensiv, da eine Vielzahl an unterschiedlichen Informationen von verschiedensten Stellen vorliegt.`, `Le regroupement, l’examen, le filtrage et l’uniformisation des données de réseaux tiers prennent du temps, car une multitude d’informations différentes provient de très nombreux organismes.`]
    ,[`Die Menge an Daten und die Komplexität im Umgang mit diesen führt zum Bedarf an Fachkräften mit Know-How. Im aktuellen Rausch der Digitalisierung sind deren Kapazitäten stark begrenzt.`, `Le volume des données et la complexité de leur traitement créent un besoin important en spécialistes qualifiés. Dans l’élan actuel de numérisation, leurs capacités sont fortement limitées.`]
    ,[`Die Verzögerung der Informationszusammenstellung sowie mangelnde Qualitätsstandards dabei können die Projektergebnisse negativ beeinflussen.`, `Les retards dans la consolidation des informations ainsi que l’absence de standards de qualité peuvent avoir un impact négatif sur les résultats du projet.`]
    ,[`Fremdleitungsdaten liegen in unterschiedlichen Raster- und Vektorformaten vor, was die Verarbeitung und Integration in bestehende Systeme erschwert und besonderes Know-How im Umgang mit Geodaten erfordert`, `Les données de réseaux tiers existent dans différents formats raster et vectoriels, ce qui complique leur traitement et leur intégration dans les systèmes existants et exige un savoir-faire particulier en géodonnées.`]
    ,[`Global Classes`, `Classes globales`]
    ,[`Neutral 800`, `Neutre 800`]
    ,[`Neutral 700`, `Neutre 700`]
    ,[`Neutral 600`, `Neutre 600`]
    ,[`Neutral 500`, `Neutre 500`]
    ,[`Neutral 400`, `Neutre 400`]
    ,[`Neutral 300`, `Neutre 300`]
    ,[`Neutral 200`, `Neutre 200`]
    ,[`Black`, `Noir`]
    ,[`Display 1 Text`, `Texte Display 1`]
    ,[`Heading H1 - Aa Bb Cc Dd`, `Titre H1 - Aa Bb Cc Dd`]
    ,[`Heading H2 - Aa Bb Cc Dd`, `Titre H2 - Aa Bb Cc Dd`]
    ,[`Heading H3 - Aa Bb Cc Dd`, `Titre H3 - Aa Bb Cc Dd`]
    ,[`Heading H4 - Aa Bb Cc Dd`, `Titre H4 - Aa Bb Cc Dd`]
    ,[`Heading H5 - Aa Bb Cc Dd`, `Titre H5 - Aa Bb Cc Dd`]
    ,[`Heading H6 - Aa Bb Cc Dd`, `Titre H6 - Aa Bb Cc Dd`]
    ,[`All Paragraphs`, `Tous les paragraphes`]
    ,[`Bold - Lorem ipsum dolor sit amet`, `Gras - Lorem ipsum dolor sit amet`]
    ,[`Bold Text`, `Texte en gras`]
    ,[`Italic - Lorem ipsum dolor sit amet`, `Italique - Lorem ipsum dolor sit amet`]
    ,[`Italic Text`, `Texte en italique`]
    ,[`Bullet List`, `Liste à puces`]
    ,[`Numbered List`, `Liste numérotée`]
    ,[`Block Quote`, `Citation bloc`]
    ,[`Figure and Figure Caption`, `Figure et légende`]
    ,[`Icon Fonts`, `Polices d’icônes`]
    ,[`Filled Icons`, `Icônes pleines`]
    ,[`Button Dark`, `Bouton sombre`]
    ,[`Button Light`, `Bouton clair`]
    ,[`Utility spacing system - padding classes. [padding-direction] + [padding-size].`, `Système utilitaire d’espacement interne : classes de padding. [padding-direction] + [padding-size].`]
    ,[`Utility spacing system - padding classes. [margin-direction] + [margin-size].`, `Système utilitaire de marges : classes de margin. [margin-direction] + [margin-size].`]
    ,[`Unified spacer system for the project.`, `Système d’espacement unifié pour le projet.`]
    ,[`This element is hidden`, `Cet élément est masqué`]
    ,[`hide`, `masquer`]
    ,[`Tomer Maith - Webdesign - maithstudio.`, `Conception web par Tomer Maith - maithstudio.`]
    ,[`Handelsregister: HRB 137523`, `Registre du commerce : HRB 137523`]
    ,[`Registergericht: Amtsgericht Frankfurt am Main`, `Tribunal d’enregistrement : Amtsgericht Frankfurt am Main`]
    ,[`Vertreten durch:`, `Représenté par :`]
    ,[`E-Mail: info@trassify.fr`, `E-mail : info@trassify.fr`]
    ,[`Datenschutzerklärung`, `Déclaration de confidentialité`]
    ,[`1. Datenschutz auf einen Blick`, `1. La protection des données en un coup d’œil`]
    ,[`Allgemeine Hinweise`, `Informations générales`]
    ,[`Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.`, `Les informations suivantes donnent un aperçu simple de ce qu’il advient de vos données personnelles lorsque vous visitez ce site web. Les données personnelles sont toutes les données permettant de vous identifier personnellement. Vous trouverez des informations détaillées sur la protection des données dans la présente déclaration de confidentialité, reproduite ci-dessous.`]
    ,[`Datenerfassung auf dieser Website`, `Collecte des données sur ce site web`]
    ,[`Wer ist verantwortlich für die Datenerfassung auf dieser Website?`, `Qui est responsable de la collecte des données sur ce site web ?`]
    ,[`Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle“ in dieser Datenschutzerklärung entnehmen.`, `Le traitement des données sur ce site web est effectué par l’exploitant du site. Vous trouverez ses coordonnées dans la section « Information sur le responsable du traitement » de la présente déclaration de confidentialité.`]
    ,[`Wie erfassen wir Ihre Daten?`, `Comment collectons-nous vos données ?`]
    ,[`Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.`, `Vos données sont d’une part collectées lorsque vous nous les communiquez. Il peut s’agir, par exemple, de données que vous saisissez dans un formulaire de contact.`]
    ,[`Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.`, `D’autres données sont collectées automatiquement par nos systèmes informatiques, ou après votre consentement, lorsque vous visitez le site. Il s’agit principalement de données techniques (par ex. navigateur internet, système d’exploitation ou heure de consultation de la page). Ces données sont collectées automatiquement dès que vous accédez à ce site web.`]
    ,[`Wofür nutzen wir Ihre Daten?`, `À quelles fins utilisons-nous vos données ?`]
    ,[`Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden. Sofern über die Website Verträge geschlossen oder angebahnt werden können, werden die übermittelten Daten auch für Vertragsangebote, Bestellungen oder sonstige Auftragsanfragen verarbeitet.`, `Une partie des données est collectée afin de garantir une mise à disposition sans erreur du site web. D’autres données peuvent être utilisées pour analyser votre comportement d’utilisation. Si des contrats peuvent être conclus ou préparés via le site web, les données transmises sont également traitées pour des offres contractuelles, des commandes ou d’autres demandes liées à une mission.`]
    ,[`Welche Rechte haben Sie bezüglich Ihrer Daten?`, `Quels sont vos droits concernant vos données ?`]
    ,[`Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.`, `Vous avez à tout moment le droit d’obtenir gratuitement des informations sur l’origine, les destinataires et la finalité de vos données personnelles enregistrées. Vous avez également le droit de demander la rectification ou l’effacement de ces données. Si vous avez donné votre consentement au traitement des données, vous pouvez le révoquer à tout moment pour l’avenir. En outre, vous avez le droit, dans certaines circonstances, de demander la limitation du traitement de vos données personnelles. Vous disposez également d’un droit de recours auprès de l’autorité de contrôle compétente.`]
    ,[`Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden.`, `Pour cela ainsi que pour toute autre question relative à la protection des données, vous pouvez nous contacter à tout moment.`]
    ,[`Analyse-Tools und Tools von Drittanbietern`, `Outils d’analyse et outils de fournisseurs tiers`]
    ,[`Detaillierte Informationen zu diesen Analyseprogrammen finden Sie in der folgenden Datenschutzerklärung.`, `Vous trouverez des informations détaillées sur ces programmes d’analyse dans la déclaration de confidentialité ci-dessous.`]
    ,[`Weitere Informationen entnehmen Sie der Datenschutzerklärung von Strato:`, `Pour plus d’informations, consultez la politique de confidentialité de Strato :`]
    ,[`Anbieter ist die Strato AG, Otto-Ostrowski-Straße 7, 10249 Berlin (nachfolgend „Strato“). Wenn Sie unsere Website besuchen, erfasst Strato verschiedene Logfiles inklusive Ihrer IP-Adressen.`, `Le prestataire est Strato AG, Otto-Ostrowski-Straße 7, 10249 Berlin (ci-après « Strato »). Lorsque vous visitez notre site web, Strato collecte différents fichiers journaux, y compris vos adresses IP.`]
    ,[`Anbieter ist die Webflow, Inc., 398 11th Street, 2nd Floor, San Francisco, CA 94103, USA (nachfolgend Webflow). Wenn Sie unsere Website besuchen, erfasst Webflow verschiedene Logfiles inklusive Ihrer IP-Adressen.`, `Le prestataire est Webflow, Inc., 398 11th Street, 2nd Floor, San Francisco, CA 94103, États-Unis (ci-après « Webflow »). Lorsque vous visitez notre site web, Webflow collecte différents fichiers journaux, y compris vos adresses IP.`]
    ,[`Webflow ist ein Tool zum Erstellen und zum Hosten von Websites. Webflow speichert Cookies oder sonstige Wiedererkennungstechnologien, die für die Darstellung der Seite, zur Bereitstellung bestimmter Webseitenfunktionen und zur Gewährleistung der Sicherheit erforderlich sind (notwendige Cookies).`, `Webflow est un outil de création et d’hébergement de sites web. Webflow enregistre des cookies ou d’autres technologies de reconnaissance nécessaires à l’affichage de la page, à la fourniture de certaines fonctionnalités du site et à la garantie de la sécurité (cookies nécessaires).`]
    ,[`Details entnehmen Sie der Datenschutzerklärung von Webflow:`, `Vous trouverez les détails dans la politique de confidentialité de Webflow :`]
    ,[`Die Verwendung von Webflow erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer möglichst zuverlässigen Darstellung unserer Website. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im Endgerät des Nutzers (z. B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.`, `L’utilisation de Webflow repose sur l’art. 6, al. 1, let. f du RGPD. Nous avons un intérêt légitime à une présentation aussi fiable que possible de notre site web. Si un consentement correspondant a été demandé, le traitement repose exclusivement sur l’art. 6, al. 1, let. a du RGPD et sur le § 25, al. 1 du TDDDG, dans la mesure où ce consentement couvre le stockage de cookies ou l’accès à des informations dans le terminal de l’utilisateur (par ex. via le device fingerprinting) au sens du TDDDG. Le consentement peut être révoqué à tout moment.`]
    ,[`Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission gestützt. Details finden Sie hier:`, `Le transfert de données vers les États-Unis s’appuie sur les clauses contractuelles types de la Commission européenne. Vous trouverez les détails ici :`]
    ,[`Das Unternehmen verfügt über eine Zertifizierung nach dem „EU-US Data Privacy Framework“ (DPF). Der DPF ist ein Übereinkommen zwischen der Europäischen Union und den USA, der die Einhaltung europäischer Datenschutzstandards bei Datenverarbeitungen in den USA gewährleisten soll. Jedes nach dem DPF zertifizierte Unternehmen verpflichtet sich, diese Datenschutzstandards einzuhalten. Weitere Informationen hierzu erhalten Sie vom Anbieter unter folgendem Link:`, `L’entreprise dispose d’une certification au titre du « EU-US Data Privacy Framework » (DPF). Le DPF est un accord entre l’Union européenne et les États-Unis visant à garantir le respect des normes européennes de protection des données lors de traitements effectués aux États-Unis. Toute entreprise certifiée au titre du DPF s’engage à respecter ces normes. Vous trouverez plus d’informations auprès du prestataire via le lien suivant :`]
    ,[`3. Allgemeine Hinweise und Pflichtinformationen`, `3. Informations générales et obligations légales`]
    ,[`Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.`, `Les exploitants de ce site prennent la protection de vos données personnelles très au sérieux. Nous traitons vos données personnelles de manière confidentielle et conformément aux dispositions légales en matière de protection des données ainsi qu’à la présente déclaration de confidentialité.`]
    ,[`Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.`, `Lorsque vous utilisez ce site web, différentes données personnelles sont collectées. Les données personnelles sont des données permettant de vous identifier personnellement. La présente déclaration de confidentialité explique quelles données nous collectons et à quelles fins nous les utilisons. Elle explique également comment et pourquoi cela est fait.`]
    ,[`Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.`, `Nous attirons votre attention sur le fait que la transmission de données sur Internet (par exemple lors de communications par e-mail) peut présenter des failles de sécurité. Une protection complète des données contre l’accès par des tiers n’est pas possible.`]
    ,[`Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:`, `Le responsable du traitement des données sur ce site web est :`]
    ,[`Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website`, `Informations générales sur les bases juridiques du traitement des données sur ce site web`]
    ,[`Empfänger von personenbezogenen Daten`, `Destinataires des données personnelles`]
    ,[`Im Rahmen unserer Geschäftstätigkeit arbeiten wir mit verschiedenen externen Stellen zusammen. Dabei ist teilweise auch eine Übermittlung von personenbezogenen Daten an diese externen Stellen erforderlich. Wir geben personenbezogene Daten nur dann an externe Stellen weiter, wenn dies im Rahmen einer Vertragserfüllung erforderlich ist, wenn wir gesetzlich hierzu verpflichtet sind (z. B. Weitergabe von Daten an Steuerbehörden), wenn wir ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO an der Weitergabe haben oder wenn eine sonstige Rechtsgrundlage die Datenweitergabe erlaubt. Beim Einsatz von Auftragsverarbeitern geben wir personenbezogene Daten unserer Kunden nur auf Grundlage eines gültigen Vertrags über Auftragsverarbeitung weiter. Im Falle einer gemeinsamen Verarbeitung wird ein Vertrag über gemeinsame Verarbeitung geschlossen.`, `Dans le cadre de notre activité commerciale, nous collaborons avec différents organismes externes. Cela peut impliquer un transfert de données personnelles vers ces organismes. Nous ne transmettons des données personnelles à des tiers externes que si cela est nécessaire à l’exécution d’un contrat, si nous y sommes légalement tenus (par ex. transmission aux autorités fiscales), si nous avons un intérêt légitime à ce transfert au sens de l’art. 6, al. 1, let. f du RGPD, ou si une autre base juridique l’autorise. En cas de recours à des sous-traitants, nous ne transmettons les données personnelles de nos clients que sur la base d’un contrat de sous-traitance valide. En cas de traitement conjoint, un contrat de responsabilité conjointe est conclu.`]
    ,[`Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.`, `Vous avez le droit de recevoir, dans un format courant et lisible par machine, les données que nous traitons de manière automatisée sur la base de votre consentement ou dans le cadre de l’exécution d’un contrat, pour vous-même ou pour un tiers. Si vous demandez la transmission directe des données à un autre responsable du traitement, cela ne sera fait que dans la mesure où cela est techniquement possible.`]
    ,[`Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.`, `Le responsable du traitement est la personne physique ou morale qui décide, seule ou conjointement avec d’autres, des finalités et des moyens du traitement des données personnelles (par ex. noms, adresses e-mail, etc.).`]
    ,[`Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.`, `De nombreuses opérations de traitement des données ne sont possibles qu’avec votre consentement explicite. Vous pouvez révoquer à tout moment un consentement déjà donné. La légalité du traitement effectué jusqu’à la révocation n’est pas affectée par celle-ci.`]
    ,[`WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT AUCH FÜR EIN AUF DIESE BESTIMMUNGEN GESTÜTZTES PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT, ENTNEHMEN SIE DIESER DATENSCHUTZERKLÄRUNG. WENN SIE WIDERSPRUCH EINLEGEN, WERDEN WIR IHRE BETROFFENEN PERSONENBEZOGENEN DATEN NICHT MEHR VERARBEITEN, ES SEI DENN, WIR KÖNNEN ZWINGENDE SCHUTZWÜRDIGE GRÜNDE FÜR DIE VERARBEITUNG NACHWEISEN, DIE IHRE INTERESSEN, RECHTE UND FREIHEITEN ÜBERWIEGEN ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, AUSÜBUNG ODER VERTEIDIGUNG VON RECHTSANSPRÜCHEN (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).`, `SI LE TRAITEMENT DES DONNÉES REPOSE SUR L’ART. 6, AL. 1, LET. E OU F DU RGPD, VOUS AVEZ À TOUT MOMENT LE DROIT, POUR DES MOTIFS LIÉS À VOTRE SITUATION PARTICULIÈRE, DE VOUS OPPOSER AU TRAITEMENT DE VOS DONNÉES PERSONNELLES ; CELA VAUT ÉGALEMENT POUR UN PROFILAGE FONDÉ SUR CES DISPOSITIONS. LA BASE JURIDIQUE SUR LAQUELLE REPOSE LE TRAITEMENT FIGURE DANS LA PRÉSENTE DÉCLARATION DE CONFIDENTIALITÉ. SI VOUS VOUS Y OPPOSEZ, NOUS NE TRAITERONS PLUS VOS DONNÉES PERSONNELLES CONCERNÉES, SAUF SI NOUS POUVONS DÉMONTRER DES MOTIFS IMPÉRIEUX ET LÉGITIMES POUR CE TRAITEMENT QUI PRÉVALENT SUR VOS INTÉRÊTS, DROITS ET LIBERTÉS, OU SI LE TRAITEMENT SERT À CONSTATER, EXERCER OU DÉFENDRE DES DROITS EN JUSTICE (OPPOSITION SELON L’ART. 21, AL. 1 DU RGPD).`]
    ,[`WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO HABEN SIE DAS RECHT, JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG SIE BETREFFENDER PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER WERBUNG EINZULEGEN; DIES GILT AUCH FÜR DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT. WENN SIE WIDERSPRECHEN, WERDEN IHRE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT MEHR ZUM ZWECKE DER DIREKTWERBUNG VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2 DSGVO).`, `SI VOS DONNÉES PERSONNELLES SONT TRAITÉES À DES FINS DE PROSPECTION DIRECTE, VOUS AVEZ LE DROIT DE VOUS OPPOSER À TOUT MOMENT AU TRAITEMENT DE VOS DONNÉES PERSONNELLES À CES FINS ; CELA S’APPLIQUE ÉGALEMENT AU PROFILAGE DANS LA MESURE OÙ IL EST LIÉ À UNE TELLE PROSPECTION DIRECTE. SI VOUS VOUS Y OPPOSEZ, VOS DONNÉES PERSONNELLES NE SERONT ENSUITE PLUS UTILISÉES À DES FINS DE PROSPECTION DIRECTE (OPPOSITION SELON L’ART. 21, AL. 2 DU RGPD).`]
    ,[`Beschwerderecht bei der zuständigen Aufsichtsbehörde`, `Droit de recours auprès de l’autorité de contrôle compétente`]
    ,[`Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.`, `En cas d’infraction au RGPD, les personnes concernées disposent d’un droit de recours auprès d’une autorité de contrôle, en particulier dans l’État membre de leur résidence habituelle, de leur lieu de travail ou du lieu de l’infraction présumée. Ce droit de recours existe sans préjudice de tout autre recours administratif ou judiciaire.`]
    ,[`Recht auf Datenübertragbarkeit`, `Droit à la portabilité des données`]
    ,[`Auskunft, Berichtigung und Löschung`, `Information, rectification et effacement`]
    ,[`Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden.`, `Dans le cadre des dispositions légales applicables, vous avez à tout moment le droit d’obtenir gratuitement des informations sur les données personnelles vous concernant qui sont enregistrées, sur leur origine, leurs destinataires et la finalité du traitement, ainsi que, le cas échéant, un droit de rectification ou d’effacement de ces données. Pour cela ainsi que pour toute autre question relative aux données personnelles, vous pouvez nous contacter à tout moment.`]
    ,[`Recht auf Einschränkung der Verarbeitung`, `Droit à la limitation du traitement`]
    ,[`Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu können Sie sich jederzeit an uns wenden. Das Recht auf Einschränkung der Verarbeitung besteht in folgenden Fällen:`, `Vous avez le droit de demander la limitation du traitement de vos données personnelles. Vous pouvez nous contacter à tout moment à cet effet. Le droit à la limitation du traitement existe dans les cas suivants :`]
    ,[`Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht, können Sie statt der Löschung die Einschränkung der Datenverarbeitung verlangen.`, `Si le traitement de vos données personnelles a été ou est illicite, vous pouvez demander la limitation du traitement au lieu de leur suppression.`]
    ,[`Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen, haben Sie das Recht, statt der Löschung die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.`, `Si nous n’avons plus besoin de vos données personnelles, mais que vous en avez besoin pour la constatation, l’exercice ou la défense de droits en justice, vous avez le droit de demander la limitation de leur traitement au lieu de leur suppression.`]
    ,[`SSL- bzw. TLS-Verschlüsselung`, `Chiffrement SSL ou TLS`]
    ,[`Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.`, `Pour des raisons de sécurité et afin de protéger la transmission de contenus confidentiels, comme par exemple des commandes ou des demandes que vous nous envoyez en tant qu’exploitant du site, cette page utilise un chiffrement SSL ou TLS. Vous reconnaissez une connexion chiffrée au fait que la ligne d’adresse du navigateur passe de « http:// » à « https:// » et au symbole de cadenas dans la barre de votre navigateur.`]
    ,[`Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-E-Mails, vor.`, `L’utilisation des coordonnées publiées dans le cadre des mentions légales obligatoires pour l’envoi de publicités et d’informations non expressément demandées est par la présente interdite. Les exploitants du site se réservent expressément le droit d’engager des poursuites en cas d’envoi non sollicité d’informations publicitaires, par exemple sous forme de spams.`]
    ,[`Cookies können von uns (First-Party-Cookies) oder von Drittunternehmen stammen (sog. Third-Party-Cookies). Third-Party-Cookies ermöglichen die Einbindung bestimmter Dienstleistungen von Drittunternehmen innerhalb von Webseiten (z. B. Cookies zur Abwicklung von Zahlungsdienstleistungen).`, `Les cookies peuvent provenir de nous-mêmes (cookies first party) ou d’entreprises tierces (cookies third party). Les cookies tiers permettent l’intégration de certains services d’entreprises tierces au sein des pages web (par ex. des cookies pour le traitement de services de paiement).`]
    ,[`Cookies haben verschiedene Funktionen. Zahlreiche Cookies sind technisch notwendig, da bestimmte Webseitenfunktionen ohne diese nicht funktionieren würden (z. B. die Warenkorbfunktion oder die Anzeige von Videos). Andere Cookies können zur Auswertung des Nutzerverhaltens oder zu Werbezwecken verwendet werden.`, `Les cookies remplissent différentes fonctions. De nombreux cookies sont techniquement nécessaires, car certaines fonctions du site ne fonctionneraient pas sans eux (par ex. la fonction panier ou l’affichage de vidéos). D’autres cookies peuvent être utilisés pour analyser le comportement des utilisateurs ou à des fins publicitaires.`]
    ,[`Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs, zur Bereitstellung bestimmter, von Ihnen erwünschter Funktionen (z. B. für die Warenkorbfunktion) oder zur Optimierung der Website (z. B. Cookies zur Messung des Webpublikums) erforderlich sind (notwendige Cookies), werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert, sofern keine andere Rechtsgrundlage angegeben wird. Der Websitebetreiber hat ein berechtigtes Interesse an der Speicherung von notwendigen Cookies zur technisch fehlerfreien und optimierten Bereitstellung seiner Dienste. Sofern eine Einwilligung zur Speicherung von Cookies und vergleichbaren Wiedererkennungstechnologien abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage dieser Einwilligung (Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG); die Einwilligung ist jederzeit widerrufbar.`, `Les cookies nécessaires à l’exécution du processus de communication électronique, à la fourniture de certaines fonctions que vous souhaitez (par ex. la fonction panier) ou à l’optimisation du site web (par ex. cookies de mesure d’audience) sont enregistrés sur la base de l’art. 6, al. 1, let. f du RGPD, sauf si une autre base juridique est indiquée. L’exploitant du site a un intérêt légitime au stockage de cookies nécessaires à la fourniture techniquement correcte et optimisée de ses services. Si un consentement au stockage de cookies et de technologies de reconnaissance comparables a été demandé, le traitement a lieu exclusivement sur la base de ce consentement (art. 6, al. 1, let. a du RGPD et § 25, al. 1 du TDDDG) ; le consentement peut être révoqué à tout moment.`]
    ,[`Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität dieser Website eingeschränkt sein.`, `Vous pouvez configurer votre navigateur pour être informé du dépôt de cookies et n’autoriser les cookies qu’au cas par cas, refuser les cookies dans certains cas ou de manière générale, ainsi qu’activer la suppression automatique des cookies à la fermeture du navigateur. En cas de désactivation des cookies, la fonctionnalité de ce site web peut être limitée.`]
    ,[`Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sofern diese abgefragt wurde; die Einwilligung ist jederzeit widerrufbar.`, `Le traitement de ces données repose sur l’art. 6, al. 1, let. b du RGPD, dans la mesure où votre demande est liée à l’exécution d’un contrat ou est nécessaire à la mise en œuvre de mesures précontractuelles. Dans tous les autres cas, le traitement repose sur notre intérêt légitime à traiter efficacement les demandes qui nous sont adressées (art. 6, al. 1, let. f du RGPD) ou sur votre consentement (art. 6, al. 1, let. a du RGPD) si celui-ci a été demandé ; le consentement peut être révoqué à tout moment.`]
    ,[`Die von Ihnen im Kontaktformular eingegebenen Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt (z. B. nach abgeschlossener Bearbeitung Ihrer Anfrage). Zwingende gesetzliche Bestimmungen – insbesondere Aufbewahrungsfristen – bleiben unberührt.`, `Les données que vous saisissez dans le formulaire de contact restent chez nous jusqu’à ce que vous nous demandiez de les supprimer, que vous révoquiez votre consentement à leur conservation ou que la finalité de leur stockage disparaisse (par ex. après traitement complet de votre demande). Les dispositions légales impératives, notamment les délais de conservation, restent inchangées.`]
    ,[`Die von Ihnen an uns per Kontaktanfragen übersandten Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt (z. B. nach abgeschlossener Bearbeitung Ihres Anliegens). Zwingende gesetzliche Bestimmungen – insbesondere gesetzliche Aufbewahrungsfristen – bleiben unberührt.`, `Les données que vous nous transmettez via des demandes de contact restent chez nous jusqu’à ce que vous nous demandiez de les supprimer, que vous révoquiez votre consentement à leur conservation ou que la finalité de leur stockage disparaisse (par ex. après traitement complet de votre demande). Les dispositions légales impératives, notamment les délais légaux de conservation, restent inchangées.`]
    ,[`(1) Die Einhaltung unserer Leistungspflichten setzt die rechtzeitige und ordnungsgemäße Erfüllung der Verpflichtungen des Kunden voraus.`, `(1) Le respect de nos obligations de prestation suppose que le client remplisse ses propres obligations en temps utile et de manière conforme.`]
    ,[`(2) Verbindlich vereinbarte Termine und Fristen für Lieferungen und Leistungen beginnen mit dem Tag der Vereinbarung. Sollten Ausführungseinzelheiten zwischen uns und dem Kunden noch nicht geklärt sein, so beginnen Termine und Fristen erst nach deren Klärung.`, `(2) Les dates et délais convenus de manière contraignante pour les livraisons et prestations commencent le jour de l’accord. Si certains détails d’exécution ne sont pas encore clarifiés entre nous et le client, les dates et délais ne commencent qu’après leur clarification.`]
    ,[`(3) Änderung und Umplanungen des Kunden können zu Terminverschiebungen führen. Wir werden den Kunden in diesem Fall darüber nach Kenntnis und Einschätzung des Aufwandes der Änderung informieren.`, `(3) Les modifications et replanifications demandées par le client peuvent entraîner un décalage des délais. Dans ce cas, nous informerons le client dès que nous aurons connaissance de la modification et évalué son impact en termes de charge.`]
    ,[`(4) Wir verpflichten uns über alle Informationen, die im Zusammenhang mit unserer Tätigkeit für den Kunden bekannt werden, Stillschweigen zu bewahren, unabhängig davon, ob es sich dabei um den Kunden selbst oder dessen Geschäftsbeziehungen handelt, es sei denn, dass der Kunde uns von dieser Schweigepflicht entbindet.`, `(4) Nous nous engageons à garder confidentielles toutes les informations portées à notre connaissance dans le cadre de notre activité pour le client, qu’elles concernent le client lui-même ou ses relations commerciales, sauf si le client nous libère de cette obligation de confidentialité.`]
    ,[`(1) Der Vertrag zwischen Trassify und dem Kunden kommt durch Angebot und Annahme zustande.`, `(1) Le contrat entre Trassify et le client est conclu par offre et acceptation.`]
    ,[`(2) Der Leistungsumfang wird durch das gewählte Leistungspaket definiert und ist den jeweils gültigen Preislisten oder individuellen Angeboten zu entnehmen.`, `(2) L’étendue des prestations est définie par la formule choisie et résulte des listes de prix en vigueur ou des offres individuelles.`]
    ,[`(1) Der Kunde ist verpflichtet, alle für die Leistungserbringung erforderlichen Unterlagen, Informationen und Zugänge zeitnah, vollständig und wahrheitsgemäß bereitzustellen.`, `(1) Le client est tenu de mettre à disposition, en temps utile, de manière complète et véridique, tous les documents, informations et accès nécessaires à l’exécution de la prestation.`]
    ,[`(2) Der Kunde hat die von Trassify bereitgestellten Ergebnisse auf Vollständigkeit, Plausibilität und Genauigkeit zu überprüfen, bevor diese in Bau- oder Planungsmaßnahmen einfließen.`, `(2) Le client doit vérifier que les résultats fournis par Trassify sont complets, plausibles et exacts avant de les intégrer à des mesures de construction ou de planification.`]
    ,[`(3) Vor der Nutzung der digitalisierten Leitungspläne hat der Kunde sicherzustellen, dass diese mit der realen Örtlichkeit übereinstimmen. Trassify empfiehlt eine Abstimmung mit den zuständigen Netzbetreibern oder weiteren Fachstellen.`, `(3) Avant d’utiliser les plans de réseaux numérisés, le client doit s’assurer qu’ils correspondent à la situation réelle sur le terrain. Trassify recommande une coordination avec les exploitants de réseaux compétents ou d’autres services spécialisés.`]
    ,[`(4) Der Kunde stellt sicher, dass unsere Leistungen von seiner Berufshaftpflichtversicherung erfasst sind und informiert uns vor Vertragsschluss über eine fehlende Deckung. Soweit keine entsprechende Versicherung besteht und wir darüber nicht informiert wurden, haften wir nur im Rahmen der Deckung unserer eigenen Haftpflichtversicherung, sofern eine solche besteht.`, `(4) Le client s’assure que nos prestations sont couvertes par son assurance responsabilité professionnelle et nous informe avant la conclusion du contrat de toute absence de couverture. Si une telle assurance n’existe pas et que nous n’en avons pas été informés, notre responsabilité n’est engagée que dans la limite de la couverture de notre propre assurance responsabilité civile, si une telle couverture existe.`]
    ,[`(1) Trassify übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der von Netzbetreibern, Dritten oder dem Kunden bereitgestellten Daten.`, `(1) Trassify ne garantit ni l’exactitude, ni l’exhaustivité, ni l’actualité des données fournies par les exploitants de réseaux, par des tiers ou par le client.`]
    ,[`(2) Trassify übernimmt keine Haftung für Schäden, die dem Kunden oder Dritten durch dem vom Kunden unvollständig übermittelten Informationen entstehen.`, `(2) Trassify décline toute responsabilité pour les dommages subis par le client ou des tiers en raison d’informations transmises de manière incomplète par le client.`]
    ,[`(3) Trassify haftet nur für Vorsatz und grobe Fahrlässigkeit. Bei einfacher Fahrlässigkeit haftet Trassify lediglich bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten), jedoch beschränkt auf den typischen und vorhersehbaren Schaden. Kardinalpflichten sind solche Pflichten, die eine ordnungsgemäße Durchführung des Vertrages erst ermöglichen und auf deren Einhaltung der Kunde regelmäßig vertrauen darf.`, `(3) Trassify n’est responsable qu’en cas de faute intentionnelle ou de négligence grave. En cas de négligence simple, la responsabilité de Trassify n’est engagée qu’en cas de violation d’obligations contractuelles essentielles (obligations cardinales), et uniquement à hauteur du dommage typique et prévisible. Les obligations cardinales sont celles dont l’exécution permet la bonne réalisation du contrat et sur le respect desquelles le client peut régulièrement compter.`]
    ,[`(4) Trassify übernimmt keine Haftung für Schäden, die durch Ungenauigkeiten oder Abweichungen der digitalisierten Pläne entstehen.`, `(4) Trassify décline toute responsabilité pour les dommages résultant d’imprécisions ou d’écarts dans les plans numérisés.`]
    ,[`(5) Je nach Auftragserteilung werden die digitalisierten Pläne in unterschiedliche Formate konvertiert (bspw. .dwg, .dxf oder .kmz). Es ist nicht auszuschließen, dass Abweichungen in den Konvertierungsdaten von den Ursprungsdaten auftreten. Wir sichern nicht zu, dass alle Details eines digitalen Planes in einer sichtbar gemachten Datei oder auf einem Ausdruck der Datei einwandfrei erkennbar sind.`, `(5) Selon la commande passée, les plans numérisés sont convertis dans différents formats (par ex. .dwg, .dxf ou .kmz). Il ne peut être exclu que des écarts apparaissent entre les données converties et les données d’origine. Nous ne garantissons pas que tous les détails d’un plan numérique soient parfaitement visibles dans un fichier affiché ou sur une impression de ce fichier.`]
    ,[`(6) Der Kunde ist verpflichtet, die gelieferten Dateien bzw. Pläne unverzüglich zu prüfen und offensichtliche Mängel unverzüglich, spätestens binnen 10 Tagen nach Ablieferung, schriftlich anzuzeigen.`, `(6) Le client est tenu de vérifier sans délai les fichiers ou plans livrés et de signaler sans délai, au plus tard dans les 10 jours suivant la livraison, tout défaut apparent par écrit.`]
    ,[`(1) Die von Trassify bereitgestellten digitalen Pläne und Ergebnisse dürfen ausschließlich für den vertraglich vereinbarten Zweck verwendet werden.`, `(1) Les plans numériques et résultats fournis par Trassify ne peuvent être utilisés qu’aux fins convenues contractuellement.`]
    ,[`(2) Urheberrechte und Schutzrechte an den von Trassify erstellten digitalen Plänen verbleiben bei Trassify. Eine Weitergabe an Dritte oder eine anderweitige Nutzung bedarf der vorherigen schriftlichen Zustimmung von Trassify.`, `(2) Les droits d’auteur et droits de protection relatifs aux plans numériques créés par Trassify demeurent la propriété de Trassify. Toute transmission à des tiers ou toute autre utilisation nécessite l’accord écrit préalable de Trassify.`]
    ,[`(1) Trassify verarbeitet personenbezogene Daten des Kunden ausschließlich im Rahmen der Leistungserbringung und gemäß den gesetzlichen Datenschutzbestimmungen.`, `(1) Trassify traite les données personnelles du client exclusivement dans le cadre de l’exécution de la prestation et conformément aux dispositions légales en matière de protection des données.`]
    ,[`(2) Der Kunde erklärt sich mit der Speicherung und Verarbeitung seiner Daten durch Trassify für die Dauer des Vertragsverhältnisses einverstanden.`, `(2) Le client accepte que ses données soient conservées et traitées par Trassify pendant toute la durée de la relation contractuelle.`]
    ,[`(3) Der Kunde hat das Recht, jederzeit Auskunft über die zu seiner Person gespeicherten Daten zu verlangen.`, `(3) Le client a le droit de demander à tout moment des informations sur les données le concernant qui sont enregistrées.`]
    ,[`(1) Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand für alle Streitigkeiten aus dem Vertragsverhältnis ist der Sitz von Trassify.`, `(1) Le droit de la République fédérale d’Allemagne s’applique. Le tribunal compétent pour tout litige découlant de la relation contractuelle est celui du siège de Trassify.`]
    ,[`(2) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, so bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Die unwirksame Bestimmung wird durch eine Regelung ersetzt, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.`, `(2) Si certaines dispositions des présentes CGV devaient être invalides, la validité des autres dispositions n’en serait pas affectée. La disposition invalide sera remplacée par une règle se rapprochant le plus possible de l’objectif économique de la disposition invalide.`]
  ]);

  const ATTR_REPLACEMENTS = {
    title: Object.fromEntries([
      [`Untitled`, `Sans titre`],
      [`Datei importieren`, `Importer le fichier`],
      [`Vermessung`, `Topographie`],
      [`Leitungsauskunft`, `Renseignement sur les réseaux`]
    ]),
    content: Object.fromEntries([
      [`Blog`, `Blog`],
      [`Karriere`, `Carrières`],
      [`Referenzen`, `Références`],
      [`AGB`, `CGV`],
      [`Impressum`, `Mentions légales`],
      [`Datenschutz`, `Politique de confidentialité`],
      [`Style Guide`, `Guide de styles`],
      [`Passend für Sie`, `Adapté à vos besoins`],
      [`Projekt A661`, `Projet A661`],
      [`Preisrechner-Demo`, `Démo du calculateur de prix`],
      [`Protected page`, `Page protégée`],
      [`Not Found`, `Introuvable`],
      [`Test Geoserver`, `Test Geoserver`],
      [`Trassify – Digitale Trassenpläne & Gesamtleitungspläne`, `Trassify – Plans de tracé numériques et plans globaux des réseaux`],
      [`Trassify – Ihr Experte für digitale Trassenpläne`, `Trassify – Votre expert en plans de tracé numériques`],
      [`Trassify – Transparente Preisanfrage für digitale Trassenpläne`, `Trassify – Demande de prix transparente pour les plans de tracé numériques`],
      [`Trassify – Kontakt aufnehmen für digitale Trassenpläne`, `Trassify – Contact pour les plans de tracé numériques`],
      [`Trassify erstellt digitale Trassenpläne und fasst viele Einzeldokumente zu einem Gesamtleitungsplan zusammen. Effizient, präzise und digital.`, `Trassify crée des plans de tracé numériques et regroupe de nombreux documents individuels dans un plan global des réseaux. Efficace, précis et numérique.`],
      [`Erfahren Sie mehr über Trassify, unseren Ansatz und unsere Expertise in der Erstellung digitaler Trassen- und Gesamtleitungspläne.`, `Découvrez Trassify, notre approche et notre expertise dans la création de plans de tracé numériques et de plans globaux des réseaux.`],
      [`Entdecken Sie die Preisgestaltung von Trassify. Wir bieten faire und transparente Preise für die Erstellung digitaler Trassen- und Gesamtleitungspläne.`, `Découvrez la tarification de Trassify. Nous proposons des prix justes et transparents pour la création de plans de tracé numériques et de plans globaux des réseaux.`],
      [`Nehmen Sie Kontakt mit Trassify auf. Wir beantworten Ihre Fragen zu digitalen Trassenplänen und Gesamtleitungsplänen schnell und zuverlässig.`, `Prenez contact avec Trassify. Nous répondons rapidement et de manière fiable à vos questions sur les plans de tracé numériques et les plans globaux des réseaux.`]
    ]),
    placeholder: Object.fromEntries([
      [`Enter your email`, `Entrez votre adresse e-mail`],
      [`Bsp. Projektname1234`, `Ex. Projet1234`],
      [`Bsp. 20Km oder 10Km²`, `Ex. 20 km ou 10 km²`],
      [`Bsp. Frankfurt (Westend)`, `Ex. Francfort (Westend)`],
      [`Bsp. Errichtung einer Windkraftanlage`, `Ex. Construction d’une éolienne`],
      [`Upload-Link hier einfügen`, `Insérer ici le lien de dépôt`],
      [`Bsp. svg`, `Ex. svg`],
      [`Datum eintragen`, `Indiquer la date`],
      [`Example Text`, `Texte d’exemple`],
      [`z.B. A661-Trasse Abschnitt Nord`, `p. ex. tracé A661, section nord`],
      [`optional`, `optionnel`],
      [`Vor- und Nachname`, `Prénom et nom`],
      [`you@example.com`, `vous@exemple.com`],
      [`Hinweise, Besonderheiten…`, `Remarques, particularités…`],
      [`Vorname`, `Prénom`],
      [`Nachname`, `Nom`],
      [`Firmenname`, `Nom de l’entreprise`],
      [`Telefonnummer`, `Numéro de téléphone`],
      [`E-Mail`, `E-mail`],
      [`Mit Passwort eintreten`, `Entrer avec le mot de passe`],
      [`Max Mustermann`, `Jean Dupont`],
      [`Musterfirma`, `Entreprise exemple`],
      [`Geben Sie Ihre E-Mail ein`, `Saisissez votre adresse e-mail`],
      [`Geben Sie Ihre Telefonnummer ein`, `Saisissez votre numéro de téléphone`],
      [`Ihre Nachricht...`, `Votre message...`]
    ]),
    value: Object.fromEntries([
      [`Absenden`, `Envoyer`],
      [`Subscribe now`, `S’abonner maintenant`],
      [`Nachricht senden`, `Envoyer le message`],
      [`Gesamttrassenplan für Ihr Vorhaben`, `Plan global des réseaux pour votre projet`],
      [`Georeferenzierung Ihrer Pläne`, `Géoréférencement de vos plans`],
      [`Noch unklar`, `Encore indéterminé`]
    ]),
    alt: Object.fromEntries([
      [`Button Icon - Architecture X Webflow Template`, `Icône de bouton - modèle Webflow Architecture X`],
      [`Card Icon - Architecture X Webflow Template`, `Icône de carte - modèle Webflow Architecture X`],
      [`Logo Company - Architecture X Webflow Template`, `Logo de l’entreprise - modèle Webflow Architecture X`],
      [`Pause video`, `Mettre la vidéo en pause`],
      [`Play video`, `Lire la vidéo`],
      [`Colors Icon - Architecture X Webflow Template`, `Icône des couleurs - modèle Webflow Architecture X`],
      [`Typography Icon - Architecture X Webflow Template`, `Icône de typographie - modèle Webflow Architecture X`],
      [`Icons Icon - Architecture X Webflow Template`, `Icône d’icônes - modèle Webflow Architecture X`],
      [`Rich Text - Architecture X Webflow Template`, `Texte enrichi - modèle Webflow Architecture X`]
    ]),
    "data-wait": Object.fromEntries([
      [`Please wait...`, `Veuillez patienter...`],
      [`Bitte warten...`, `Veuillez patienter...`]
    ]),
    "aria-label": Object.fromEntries([
      [`Basiskarte wechseln`, `Changer de fond de carte`],
      [`Datei importieren`, `Importer le fichier`],
      [`Dateien importieren`, `Importer des fichiers`],
      [`Vermessung`, `Topographie`],
      [`Leitungsauskunft`, `Renseignement sur les réseaux`]
    ])
  };

  function normalizeText(value) {
    return value
      .replace(/\u00a0/g, " ")
      .replace(/\u00ad/g, "")
      .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function translateStandaloneText(value) {
    const normalized = normalizeText(value);
    if (!normalized) return value;

    const translated = TEXT_REPLACEMENTS[normalized];
    if (!translated) return value;

    const leading = value.match(/^\s*/u)?.[0] || "";
    const trailing = value.match(/\s*$/u)?.[0] || "";
    return `${leading}${translated}${trailing}`;
  }

  function translateTextNodes(root) {
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
      if (node.parentElement && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName)) {
        const translated = translateStandaloneText(node.textContent);
        if (translated !== node.textContent) {
          node.textContent = translated;
        }
      }
      node = walker.nextNode();
    }
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
    const selector = attrNames.map((attrName) => `[${attrName}]`).join(",");
    if (!selector) return;

    root.querySelectorAll(selector).forEach((element) => {
      translateElementAttributes(element, attrNameFilter);
    });
  }

  function setFallbackAltTexts() {
    document.querySelectorAll('img[alt=""]').forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (/logo/i.test(src)) {
        img.alt = "Logo de Trassify";
      }
    });
  }

  function setTeamPortraitAltTexts() {
    document.querySelectorAll('img[src*="images/team/"][alt]').forEach((img) => {
      const rawAlt = normalizeText(img.getAttribute("alt") || "");
      if (!rawAlt || rawAlt.startsWith("Portrait de ")) return;
      img.alt = `Portrait de ${rawAlt}`;
    });
  }

  function cleanupDecorativeArtifacts() {
    document.querySelectorAll(".text-span-4").forEach((element) => {
      if (normalizeText(element.textContent) === "Ü") {
        element.textContent = "";
      }
    });
  }

  function installTranslatedAlert() {
    if (typeof window.alert !== "function" || window.__TRASSIFY_FR_ALERT__) return;
    window.__TRASSIFY_FR_ALERT__ = true;

    const originalAlert = window.alert.bind(window);
    window.alert = (message) => {
      if (typeof message === "string" && message.startsWith("Nicht unterstützter Dateityp: ")) {
        const filename = message.slice("Nicht unterstützter Dateityp: ".length);
        return originalAlert(`Type de fichier non pris en charge : ${filename}`);
      }
      return originalAlert(message);
    };
  }

  function translateNode(node) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      if (node.parentElement && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName)) {
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

  function startMutationObserver() {
    if (typeof MutationObserver !== "function" || window.__TRASSIFY_FR_OBSERVER__) return;
    window.__TRASSIFY_FR_OBSERVER__ = true;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => translateNode(node));
        }

        if (mutation.type === "attributes" && mutation.target?.nodeType === Node.ELEMENT_NODE) {
          translateAttributes(mutation.target, mutation.attributeName);
        }
      });

      setFallbackAltTexts();
      setTeamPortraitAltTexts();
      cleanupDecorativeArtifacts();
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: Object.keys(ATTR_REPLACEMENTS)
    });
  }

  function translateDocument() {
    document.documentElement.lang = "fr-FR";
    installTranslatedAlert();
    translateAttributes(document);
    const title = document.querySelector("title");
    if (title) {
      title.textContent = translateStandaloneText(title.textContent);
    }
    translateTextNodes(document.body);
    setFallbackAltTexts();
    setTeamPortraitAltTexts();
    cleanupDecorativeArtifacts();
    startMutationObserver();
    revealDocument();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", translateDocument);
  } else {
    translateDocument();
  }
})();
