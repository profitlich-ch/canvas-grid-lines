# CLAUDE.md – canvas-grid-lines

Ergänzt die globalen Konventionen in `~/.claude/CLAUDE.md`. Was hier steht, geht der globalen Regel vor.

Öffentlich veröffentlichtes npm-Paket, kein CMS, kein Projekt-Stack. Daraus folgen die Abweichungen unten.

## Sprache

**Englisch, durchgehend** — Code, Kommentare, JSDoc, README, `CHANGELOG.md` **und Commit-Messages**.

Das weicht bei den Commit-Messages von der globalen Regel ab, die Deutsch vorsieht. Der Grund ist das Publikum: Paket und Repo liegen öffentlich, README und API sind englisch, und das Paket hat keine Konsumentendokumentation ausser diesen beiden. Die Git-Historie ist damit oft die einzige Erklärung, die jemand zu einer Änderung findet — eine deutsche Commit-Message neben einem englischen Changelog-Eintrag über dieselbe Änderung teilt diesen Nachweis auf zwei Sprachen auf.

Unverändert gilt die Aufteilung aus den globalen Konventionen: Betreffzeile sagt, **was** geändert wurde, Fliesstext **warum** — samt verworfener Alternative und dem, was nebenbei auffiel.

**Diese Datei ist die Ausnahme von der Ausnahme und bleibt deutsch.** Sie richtet sich nicht an Nutzer des Pakets, sondern ans Büro, und steht neben den anderen `CLAUDE.md`-Dateien.

## `dist/` ist versioniert

Anders als üblich liegt das Build-Ergebnis im Repo. **Vor jedem inhaltlichen Commit `npm run build` laufen lassen** und `dist/` mit committen, sonst treiben Quelltext und Auslieferung auseinander — und `docs/` bekommt seine Kopie erst über den `postbuild`-Schritt, die Demoseite zeigte sonst einen alten Stand.

## Veröffentlichung

`files` in `package.json` beschränkt das Tarball auf `/dist`. README, Lizenz und `package.json` legt npm von sich aus dazu.

**`CHANGELOG.md` gehört nicht hinein.** npmjs.com zeigt nur die README an, und die Werkzeuge, die Release Notes tatsächlich vor Augen führen — Renovate, Dependabot, die GitHub-Releases-Seite — lesen das Repository, nicht das Tarball. Im Paket läge er also dort, wo niemand nachsieht, und wüchse bei jeder Installation mit.

## Tests

`vitest` läuft mit `environment: 'node'` — **kein DOM, kein Canvas-Kontext**. Getestet werden ausschliesslich die reinen Helfer (`parseColumns`, `validateColumns`, `gapPattern`, `bandSpans`, `GRID_TYPE_CONFIG`).

Daraus folgt eine Bringschuld beim Entwurf: Was an einer neuen Rasterart prüfbar sein soll, gehört in eine **reine Funktion neben `gapPattern`**, nicht in eine private Zeichenmethode von `CanvasGridLines`. Sonst ist es nicht testbar, und das fällt erst auf, wenn es zu spät ist.

Alles, was tatsächlich Pixel setzt, wird von Hand auf `docs/index.html` geprüft: Kanten auf zwei Kacheln vergleichen, Fenster langsam ziehen (die Linien dürfen nicht wackeln), Retina gegen 1× halten.
