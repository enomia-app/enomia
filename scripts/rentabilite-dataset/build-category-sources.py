#!/usr/bin/env python3
"""
Construit les sets de communes (par code INSEE) pour la catégorisation rentabilité :
  - littoral-mer.json     : communes loi Littoral classées « Mer » (DGALN, data.gouv, COG 2022)
  - village-caractere.json : Plus Beaux Villages de France (labellisés) ∪ Petites Cités de Caractère
Sources officielles vérifiées (cf. recherche 2026-06-28). One-off, relançable.
"""
import urllib.request, json, csv, io, os, openpyxl

OUT = os.path.join(os.path.dirname(__file__))


def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = urllib.request.urlopen(req, timeout=90).read()
    with open(path, "wb") as f:
        f.write(data)
    return data


# ---------- Littoral (XLSX DGALN, onglet Perimetre, filtre CLASSEMENT == 'Mer') ----------
download("https://www.data.gouv.fr/api/1/datasets/r/5da30edb-2854-47c6-9537-192ee9ca2a70", "/tmp/littoral.xlsx")
wb = openpyxl.load_workbook("/tmp/littoral.xlsx", read_only=True, data_only=True)
ws = wb["Perimetre"]
rows = list(ws.iter_rows(values_only=True))
hidx = next(i for i, r in enumerate(rows) if r and "INSEE_COM" in [str(c) for c in r])
header = [str(c) for c in rows[hidx]]
ci = {h: i for i, h in enumerate(header)}
mer = sorted({
    str(r[ci["INSEE_COM"]]).strip()
    for r in rows[hidx + 1:]
    if r[ci["INSEE_COM"]] and r[ci["CLASSEMENT"]] == "Mer"
})
json.dump(mer, open(os.path.join(OUT, "littoral-mer.json"), "w"))
print("littoral (Mer):", len(mer))


# ---------- Village de caractère (PBVF labellisés + Petites Cités de Caractère) ----------
def read_csv_codes(url, want_filter=None):
    raw = download(url, "/tmp/x.csv").decode("utf-8", errors="replace")
    sample = raw[:3000]
    delim = ";" if sample.count(";") > sample.count(",") else ","
    rdr = csv.DictReader(io.StringIO(raw), delimiter=delim)
    cols = rdr.fieldnames or []
    code_col = next((c for c in cols if c and c.lower() in
                     ("code_commune", "code_insee", "insee", "codecommune", "code")), None)
    if not code_col:
        raise SystemExit(f"colonne code introuvable dans {cols}")
    codes = set()
    for row in rdr:
        if want_filter and not want_filter(row):
            continue
        c = (row.get(code_col) or "").strip()
        if c and c.lower() != "nan":
            codes.add(c.zfill(5) if c.isdigit() else c)
    return codes


pbvf = read_csv_codes(
    "https://dev.data.gouv.fr/api/1/datasets/r/e9021701-93cc-47b5-b652-f55c58d89aad",
    want_filter=lambda r: (r.get("labellisee", "") or "").strip().lower() == "oui",
)
pcc = read_csv_codes("https://www.data.gouv.fr/api/1/datasets/r/7427e38b-3f5d-41d5-aa15-b98445f9e4ef")
village = sorted(pbvf | pcc)
json.dump(village, open(os.path.join(OUT, "village-caractere.json"), "w"))
print("PBVF:", len(pbvf), "| PCC:", len(pcc), "| union village:", len(village))
