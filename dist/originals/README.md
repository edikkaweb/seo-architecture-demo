# Matrice de décision Architecture SEO / SEO Architecture Decision Matrix

Version 1.1.0 — révision du 21 septembre 2026.

Cette ressource réunit une matrice vierge, un exemple Edikka et un extrait de données documenté. Elle ne constitue ni un crawler, ni une mesure Search Console, ni une preuve d'effet SEO. L'archive source du 9 septembre est postérieure à l'intervention du 15 août et ne doit pas être présentée comme un état avant intervention.

This resource combines a blank decision matrix, an Edikka example and a documented data extract. It is neither a crawler, a Search Console measurement nor proof of an SEO effect. The 9 September source archive post-dates the 15 August intervention and must not be presented as a before-state.

## Files

- pages.csv — selected observed URLs; editorial role is separate from technical properties.
- links.csv — observed directed links to the two Architecture editions. Anchor and page area are explicitly unavailable because the source archive did not retain them.
- paths.csv — shortest observed paths from the declared root to each guide edition.
- graph.json — complete normalised adjacency list used for the 188-page calculation.
- reproduce-paths.mjs — dependency-free breadth-first replay and exact comparison with path-analysis.json.
- path-analysis.json — full shortest-path calculation output, including every minimal path found in the 188-page archive and the source SHA-256.
- decisions.csv — verified and unavailable findings with their method and limits.
- decisions-blank.csv — blank matrix using exactly the same schema as decisions.csv.
- data-dictionary.csv — field definitions, types and missing-value rules.
- manifest.json — sources, parameters, hashes and limitations.
- license.txt — CC BY 4.0 for this package only.

## Reproduction

From this public package directory: node reproduce-paths.mjs

The command reads only graph.json and path-analysis.json, recomputes every shortest path and exits non-zero on any difference. The package builder itself requires the archived audit/reference-france-2026-09-09/crawl.json file and refuses a source that does not contain exactly 188 pages. URL fragments are removed; trailing slashes are removed except for the origin root; query strings are preserved. No private URL, token, personal address or raw Search Console export is included.
