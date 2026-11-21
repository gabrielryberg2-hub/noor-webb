NOOR – GRATIS WEBBAPP FÖR IPHONE OCH ANDROID
=================================================

Det här är en separat webbversion, inte ett bygge av Expo-appen.
Den går att använda på båda mobiltyperna efter att den publicerats på HTTPS.
Koden är självständig och behöver INGEN npm-installation eller programmeringsmiljö.

INGÅR
- Mobilanpassad NOOR-webbplats och hemskärmsikon (PWA)
- Ungefärliga Ja'fari-inspirerade bönetider, soluppgång och nästa bön
- Qibla i grader. Försök till livekompass när mobilens sensor ger nordriktning
- Dhikr: Tasbih Fatima al-Zahra, 34 + 33 + 33; sparat på mobilen
- Dagens dua (koranverser i arabisk text med svensk återgivning)
- Manuellt ortval i Sverige eller användarens plats med tillstånd
- Grundläggande offline-funktion efter första besöket
- Hjälp för att lägga till NOOR på iPhones hemskärm
- Förberedd knapp för Android APK (inaktiv tills en godkänd länk anges)

VIKTIGT
- Webbappen har ännu INGA automatiska böneaviseringar eller Adhan-väckaralarm.
- Android APK ingår INTE. Publicera bara en APK som är testad och signerat korrekt.
- Webbappens bönetider är en ASTRONOMISK UPPSKATTNING. Jämför med lokal Shia-kalender.
- Integritetspolicyn är ett UTKAST och måste granskas före publicering.
- Appen är ännu INTE publicerad på nätet och finns ännu INTE i Google-sökning.

GRATIS PUBLICERING PÅ GITHUB PAGES – STEG FÖR STEG
1. Gå till https://github.com/new och logga in eller skapa ett gratiskonto.
2. Ange Repository name: noor-webb (namnet kan väljas fritt).
3. Välj PUBLIC (krävs normalt för gratis GitHub Pages).
4. Klicka Create repository.
5. I projektet, välj Add file > Upload files.
6. PACKA UPP ZIP-filen på datorn och dra in FILERNA OCH MAPPARNA I DEN,
   inte hela ZIP-filen och inte en extra överordnad mapp.
   index.html måste ligga direkt i REPOSITORY ROOT.
7. Klicka Commit changes.
8. Gå till Settings > Pages > Build and deployment.
9. Under Source: Deploy from a branch. Välj Branch: main, Folder: /(root).
   Tryck Save.
10. GitHub visar webbplatsens adress i Pages-sektionen efter publicering.
    Den liknar https://DITT_GITHUB_NAMN.github.io/noor-webb/
    (ersätt med din riktiga adress).
11. Öppna adressen på iPhone med Safari. Tryck Dela > Lägg till på hemskärmen.
12. Öppna adressen på Android med Chrome. Välj Installera app i menyn.

FÖR ATT GÖRA DEN SYNLIG I GOOGLE-SÖKNING
- En ny webbplats kan ta tid att hittas och är inte garanterad plats i sökresultat.
- När sajten är live kan du lägga in din webbadress i Google Search Console:
  https://search.google.com/search-console
- Verifiera webbplatsen och begär indexering via URL-granskning.

ANDROID-APK-LÄNK (FRIVILLIG, SENARE)
- Lägg den testade NOOR.apk-filen i en GitHub Release (Releases > New release).
- Kopiera den officiella URL:en till APK-filen från releasen.
- Öppna download-config.json i GitHub, klicka Edit och skriv in länken
  som värde till androidApkUrl (börjar med https://).
- Spara/Commit. Då aktiveras knappen på webbplatsen när användaren laddar om.
- Ändra INTE download-config.json förrän APK:n fungerar och är granskad.
- Android kan visa en varning för APK-installation utanför Google Play.

KONTAKT
norapp.support@gmail.com

FÖR UTVECKLAREN: Projektet består av statiska HTML/CSS/JS-filer. Testa lokalt
med en HTTP-server, t.ex. python -m http.server 8000. Safari-installation och
platsåtkomst kräver i praktiken HTTPS, vilket GitHub Pages ger.
