#!/usr/bin/env python3
"""
Fetch all medications from INHRR (Venezuela) and generate normalized SQL seed.

Usage:
    python3 scripts/fetch_inhrr_medications.py

Output:
    supabase/medications_seed_normalized.sql
    supabase/inhrr_raw.json (full unfiltered dump for reference)
"""

import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from typing import Dict, List, Optional, Set

INHRR_API = "https://inhrr.gob.ve/sismed/api/productos-farma"
OUTPUT_SQL = "supabase/medications_seed_normalized.sql"
OUTPUT_JSON = "supabase/inhrr_raw.json"
BATCH_SIZES = [100, 500, 1000, 5000, 10000, 25000, 50000]


def post_json(url: str, payload: dict, retries: int = 3) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; ClinicBoard/1.0)",
        },
        method="POST",
    )
    for attempt in range(retries):
        try:
            resp = urllib.request.urlopen(req, timeout=60)
            return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            print(f"  HTTP {e.code} on attempt {attempt+1}, retrying...", file=sys.stderr)
            time.sleep(2 ** attempt)
        except Exception as e:
            print(f"  Error: {e}", file=sys.stderr)
            time.sleep(2)
    raise RuntimeError(f"Failed after {retries} attempts")


def normalize_form(form: str) -> Optional[str]:
    if not form:
        return None
    f = form.strip().upper()
    mapping = {
        "TABLETAS": "TABLETA",
        "TABLETAS RECUBIERTAS": "TABLETA RECUBIERTA",
        "COMPRIMIDOS": "COMPRIMIDO",
        "CAPSULAS": "CÁPSULA",
        "CAPSULAS BLANDAS": "CÁPSULA BLANDA",
        "SOLUCION INYECTABLE": "SOLUCIÓN INYECTABLE",
        "SOLUCION ORAL": "SOLUCIÓN ORAL",
        "SUSPENSION": "SUSPENSIÓN",
        "JARABE": "JARABE",
        "CREMA": "CREMA",
        "TABLETAS MASTICABLES": "TABLETA MASTICABLE",
        "UNGUENTO": "UNGUENTO",
        "GOTAS OFTALMICAS": "GOTAS OFTÁLMICAS",
        "GRANULADO": "GRANULADO",
        "POLVO": "POLVO",
        "SOLUCION": "SOLUCIÓN",
        "SOLUCION TOPICA": "SOLUCIÓN TÓPICA",
        "SOLUCION TOPICA BUCAL": "SOLUCIÓN TÓPICA BUCAL",
        "SOLUCION NASAL": "SOLUCIÓN NASAL",
        "SOLUCION PARA INFUSION": "SOLUCIÓN PARA INFUSIÓN",
        "SOLUCION ELECTROLITICA USO ORAL": "SOLUCIÓN ELECTROLÍTICA ORAL",
        "SOLUCION INHALADORA": "SOLUCIÓN INHALADORA",
        "OVULOS VAGINALES": "ÓVULO VAGINAL",
        "SUPOSITORIOS": "SUPOSITORIO",
        "POLVO LIOFILIZADO PARA": "POLVO LIOFILIZADO",
        "POLVO PARA": "POLVO",
        "GRANULADO PARA": "GRANULADO",
    }
    return mapping.get(f, form.strip())


def normalize_concentration(conc: str) -> Optional[str]:
    if not conc:
        return None
    c = conc.strip()
    c = re.sub(r"\s+", " ", c)
    c = c.replace("MG", "mg")
    c = c.replace("ML", "mL")
    c = re.sub(r"\s*/\s*", " / ", c)
    c = re.sub(r"\s*-\s*", " - ", c)
    c = re.sub(r"  +", " ", c)
    return c.strip()


def _match_form(n: str, needle: str) -> bool:
    """Case-sensitive substring search, handles Cc variation for soluCion."""
    if needle.lower() == "soluc":
        return "solucion" in n.lower() or "solución" in n.lower()
    return needle.lower() in n.lower()


def extract_form_from_name(name: str) -> Optional[str]:
    """Extract pharmaceutical form from product name via keyword search."""
    if not name:
        return None
    n = name.strip()

    # Ordered by specificity (most specific first)
    # Use substring matching to avoid regex Unicode gotchas
    form_keywords = [
        ("POLVO LIOFILIZADO", "POLVO LIOFILIZADO"),
        ("SOLUCIÓN INYECTABLE", "SOLUCIÓN INYECTABLE"),
        ("SOLUCION INYECTABLE", "SOLUCIÓN INYECTABLE"),
        ("SOLUCIÓN PARA INFUSIÓN", "SOLUCIÓN PARA INFUSIÓN"),
        ("SOLUCION PARA INFUSION", "SOLUCIÓN PARA INFUSIÓN"),
        ("SOLUCIÓN ELECTROLÍTICA ORAL", "SOLUCIÓN ELECTROLÍTICA ORAL"),
        ("SOLUCION ELECTROLITICA USO ORAL", "SOLUCIÓN ELECTROLÍTICA ORAL"),
        ("SOLUCIÓN TÓPICA BUCAL", "SOLUCIÓN TÓPICA BUCAL"),
        ("SOLUCION TOPICA BUCAL", "SOLUCIÓN TÓPICA BUCAL"),
        ("SOLUCIÓN TÓPICA", "SOLUCIÓN TÓPICA"),
        ("SOLUCION TOPICA", "SOLUCIÓN TÓPICA"),
        ("SOLUCIÓN NASAL", "SOLUCIÓN NASAL"),
        ("SOLUCION NASAL", "SOLUCIÓN NASAL"),
        ("SOLUCIÓN ORAL", "SOLUCIÓN ORAL"),
        ("SOLUCION ORAL", "SOLUCIÓN ORAL"),
        ("SOLUCIÓN", "SOLUCIÓN"),
        ("SOLUCION", "SOLUCIÓN"),
        ("SUSPENSIÓN ORAL", "SUSPENSIÓN"),
        ("SUSPENSIÓN", "SUSPENSIÓN"),
        ("SUSPENSION ORAL", "SUSPENSIÓN"),
        ("SUSPENSION", "SUSPENSIÓN"),
        ("GRANULADO", "GRANULADO"),
        ("TABLETAS RECUBIERTAS", "TABLETA RECUBIERTA"),
        ("TABLETA RECUBIERTA", "TABLETA RECUBIERTA"),
        ("TABLETAS MASTICABLES", "TABLETA MASTICABLE"),
        ("TABLETA MASTICABLE", "TABLETA MASTICABLE"),
        ("TABLETAS", "TABLETA"),
        ("TABLETA", "TABLETA"),
        ("COMPRIMIDOS", "COMPRIMIDO"),
        ("COMPRIMIDO", "COMPRIMIDO"),
        ("CAPSULAS BLANDAS", "CÁPSULA BLANDA"),
        ("CÁPSULA BLANDA", "CÁPSULA BLANDA"),
        ("CAPSULAS", "CÁPSULA"),
        ("CÁPSULA", "CÁPSULA"),
        ("JARABE", "JARABE"),
("GEL", "GEL"),
        ("ESPUMA", "ESPUMA"),
        ("SPRAY NASAL", "SPRAY NASAL"),
        ("SPRAY", "SPRAY"),
        ("ATOMIZADOR", "ATOMIZADOR"),
        ("NEBULIZADOR NASAL", "NEBULIZADOR NASAL"),
        ("AEROSOL NASAL", "AEROSOL NASAL"),
        ("AEROSOL", "AEROSOL"),
        ("INFUSION INTRAVENOSA", "INFUSIÓN INTRAVENOSA"),
        ("INFUSIÓN INTRAVENOSA", "INFUSIÓN INTRAVENOSA"),
        ("EMULSION INTRAVENOSA", "EMULSIÓN INTRAVENOSA"),
        ("EMULSIÓN INTRAVENOSA", "EMULSIÓN INTRAVENOSA"),
        ("EMULSION OFTALMICA", "EMULSIÓN OFTÁLMICA"),
        ("EMULSIÓN OFTÁLMICA", "EMULSIÓN OFTÁLMICA"),
        ("EMULSION TOPICA", "EMULSIÓN TÓPICA"),
        ("EMULSION TÓPICA", "EMULSIÓN TÓPICA"),
        ("EMULSION", "EMULSIÓN"),
        ("COMPRIMDOS", "COMPRIMIDO"),
        ("COMPRIMIDO", "COMPRIMIDO"),
        ("GRANULOS DE LIBERACION PROLONGADA", "GRÁNULOS DE LIBERACIÓN PROLONGADA"),
        ("GRANULOS", "GRÁNULOS"),
        ("LACA PARA UÑAS", "LACA PARA UÑAS"),
        ("DUCHA VAGINAL", "DUCHA VAGINAL"),
        ("EQUIPO DE NUTRICION PARENTERAL", "EQUIPO DE NUTRICIÓN PARENTERAL"),
        ("JABON LIQUIDO", "JABÓN LÍQUIDO"),
        ("JABÓN LÍQUIDO", "JABÓN LÍQUIDO"),
        ("AGUA ESTERIL", "AGUA ESTÉRIL"),
        ("LOCION", "LOCIÓN"),
        ("LOCIÓN", "LOCIÓN"),
        ("CHAMPU", "CHAMPÚ"),
        ("PARCHES TRANSDERMICOS", "PARCHE TRANSDÉRMICO"),
        ("PARCHE TRANSDÉRMICO", "PARCHE TRANSDÉRMICO"),
        ("CAPSULA BLANDA VAGINAL", "CÁPSULA BLANDA VAGINAL"),
        ("CÁPSULA BLANDA VAGINAL", "CÁPSULA BLANDA VAGINAL"),
        ("CAPSULA BLANDA", "CÁPSULA BLANDA"),
        ("CÁPSULA BLANDA", "CÁPSULA BLANDA"),
        ("CAPSULA DURA LIQUIDA", "CÁPSULA DURA LÍQUIDA"),
        ("CÁPSULA DURA LÍQUIDA", "CÁPSULA DURA LÍQUIDA"),
        ("CAPSULA", "CÁPSULA"),
        ("CÁPSULA", "CÁPSULA"),
        ("AEROSOL PARA INHALACION", "AEROSOL PARA INHALACIÓN"),
        ("AEROSOL PARA INHALACIÓN", "AEROSOL PARA INHALACIÓN"),
        ("EMULSION LIPIDICA PARA INFUSION", "EMULSIÓN LÍQUIDA PARA INFUSIÓN"),
        ("EMULSIÓN LÍQUIDA PARA INFUSIÓN", "EMULSIÓN LÍQUIDA PARA INFUSIÓN"),
        ("LAMINA ORODISPERSABLE", "LÁMINA ORODISPERSABLE"),
        ("SISTEMA DE LIBERACION INTRAUTERINO", "SISTEMA DE LIBERACIÓN INTRAUTERINO"),
        ("ENEMA", "ENEMA"),
        ("ELIXIR", "ELIXIR"),
        ("GRAGEAS", "GRAGEA"),
        ("COMP RECUBIERTOS", "COMPRIMIDO RECUBIERTO"),
        ("COMPPRIMIDOS RECUBIERTOS", "COMPRIMIDO RECUBIERTO"),
        ("COMPRIMIDOS RECUBIERTOS", "COMPRIMIDO RECUBIERTO"),
        ("COMPRIMIDO RECUBIERTO", "COMPRIMIDO RECUBIERTO"),
        ("INYECTABLE", "INYECTABLE"),
        ("INYECCION", "INYECTABLE"),
        ("INHLACION", "INHALACIÓN"),
        ("INHALACION", "INHALACIÓN"),
        ("PASTILLAS", "COMPRIMIDO"),
        ("PASTILLA", "COMPRIMIDO"),
        ("EMULSION INYECTABLE", "EMULSIÓN INYECTABLE"),
        ("EMULSIÓN INYECTABLE", "EMULSIÓN INYECTABLE"),
        ("LIQUIDO PARA INHALACION", "LÍQUIDO PARA INHALACIÓN"),
        ("LÍQUIDO PARA INHALACIÓN", "LÍQUIDO PARA INHALACIÓN"),
        ("ANILLO VAGINAL", "ANILLO VAGINAL"),
        ("ÓVULOS VAGINALES", "ÓVULO VAGINAL"),
        ("OVULOS VAGINALES", "ÓVULO VAGINAL"),
        ("ÓVULO VAGINAL", "ÓVULO VAGINAL"),
        ("ÓVULOS", "ÓVULO VAGINAL"),
        ("OVULOS", "ÓVULO VAGINAL"),
        ("ÓVULO", "ÓVULO VAGINAL"),
        ("OVULO VAGINAL", "ÓVULO VAGINAL"),
        ("UNGÜENTO", "UNGUENTO"),
        ("UNGÃœENTO", "UNGUENTO"),
        ("SUPOSITORIOS", "SUPOSITORIO"),
        ("SUPOSITORIO", "SUPOSITORIO"),
        ("CREMA", "CREMA"),
        ("UNGUENTO", "UNGUENTO"),
        ("GOTAS OFTÁLMICAS", "GOTAS OFTÁLMICAS"),
        ("GOTAS", "GOTAS"),
        ("POLVO", "POLVO"),
    ]

    for keyword, canonical in form_keywords:
        if keyword.lower() in n.lower():
            return canonical
    return None


def normalize_name(name: str) -> str:
    if not name:
        return None
    n = name.strip()
    n = re.sub(r"\s+SOLU[CcIÓN]+\s+INYECTABLE\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+SOLU[CcIÓN]+\s+ORAL\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+SOLU[CcIÓN]+\s+PARA\s+INFUSIÓN\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+SOLU[CcIÓN]+\s+NASAL\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+SOLU[CcIÓN]+\s+T[OÓ]PICA\s+BUCAL\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+SOLU[CcIÓN]+\s+T[OÓ]PICA\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+SOLU[CcIÓN]+\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+POLVO\s+LIOFILIZADO\s+PARA.*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+POLVO\s+PARA.*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+GRANULADO\s+PARA.*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+[ÓO]VULOS?\s+VAGINALES?\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+SUPOSITORIOS?\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+TABLETA\s+RECUBIERTA\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+TABLETAS?\s+MASTICABLES?\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+CAPSULAS?\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+COMPRIMIDOS?\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+JARABE\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+/ ?[mL]+\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+-\s*[\d,.]+\s*g\s+POLVO\s+PARA\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+\d+[.,]?\d*\s*mg\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+\d+[.,]?\d*\s*%\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+-\s*[\d,.]+\s*mg\s*-\s*[\d,.]+\s*mg\s*$", "", n, flags=re.IGNORECASE)
    n = re.sub(r"\s+", " ", n).strip()
    return n


def sql_escape(s: str) -> str:
    if s is None:
        return "NULL"
    return s.replace("'", "''")


def sql_val(s: Optional[str]) -> str:
    if s is None or s == "":
        return "NULL"
    return f"'{sql_escape(s)}'"


def process_item(item: Dict, seen_codes: Set) -> Optional[Dict]:
    code = (item.get("ef") or "").strip()
    if not code or code in seen_codes:
        return None

    nombre_raw = (item.get("nombre") or "").strip()
    principio = (item.get("principioActivo") or "").strip()

    if principio:
        generic_name = principio.upper().strip()
    else:
        generic_name = normalize_name(nombre_raw).upper() if nombre_raw else ""
        if not generic_name:
            generic_name = code.upper()

    conc_match = re.search(
        r"(\d+[.,]?\d*)\s*(mg|g|UI|mL|mEq|%|mcg|ug)\s*(/\s*\d+[.,]?\d*\s*(mg|g|mL|mEq|%)?)?",
        nombre_raw,
        re.IGNORECASE,
    )
    concentration = None
    if conc_match:
        concentration = normalize_concentration(conc_match.group(0))

    form_suffix = extract_form_from_name(nombre_raw)
    pharmaceutical_form = normalize_form(form_suffix) if form_suffix else None

    if not pharmaceutical_form:
        form_in_name = re.search(
            r"(TABLETA|COMPRIMIDO|CÁPSULA|SOLUCIÓN|JARABE|SUSPENSIÓN|CREMA|UNGUENTO|POLVO|GRANULADO|ÓVULO|GOTAS)",
            nombre_raw,
            re.IGNORECASE,
        )
        if form_in_name:
            pharmaceutical_form = normalize_form(form_in_name.group(0))

    return {
        "code": code,
        "name": generic_name,
        "generic_name": generic_name,
        "pharmaceutical_form": pharmaceutical_form,
        "concentration": concentration,
    }


def generate_sql(records: List[Dict]) -> str:
    lines = [
        "-- Generated by scripts/fetch_inhrr_medications.py",
        f"-- Date: {datetime.now().isoformat()}",
        f"-- Total records: {len(records)}",
        "",
        "INSERT INTO medications (code, name, generic_name, pharmaceutical_form, concentration) VALUES",
    ]
    rows = []
    for r in records:
        rows.append(
            f"({sql_val(r['code'])}, {sql_val(r['name'])}, "
            f"{sql_val(r['generic_name'])}, {sql_val(r['pharmaceutical_form'])}, "
            f"{sql_val(r['concentration'])})"
        )
    lines.append(",\n".join(rows) + ";")
    return "\n".join(lines)


def main():
    print("=" * 60)
    print("INHRR Medication Fetcher - ClinicBoard")
    print("=" * 60)

    all_items = []
    total_count = None

    for take in BATCH_SIZES:
        print(f"\nFetching with take={take}...")
        payload = {
            "reqQuery": {
                "general": "",
                "representante": "",
                "nombreProd": "",
                "principioActivo": "",
                "numeroRegistro": "",
                "desdeFechaAprobado": "",
                "hastaFechaAprobado": "",
                "farmaceuticoPatrocinante": "",
                "take": take,
            }
        }
        result = post_json(INHRR_API, payload)
        items = result.get("combinedData", [])
        count_total = result.get("countTotal", 0)

        print(f"  Returned: {len(items)} items | Total available: {count_total}")

        if total_count is None:
            total_count = count_total

        # If API reports total and we got all of them, we're done
        if count_total > 0 and len(items) >= count_total:
            all_items = items
            print(f"  Got all {count_total} items")
            break
        elif take == BATCH_SIZES[-1]:
            # Last resort: use whatever we got
            all_items = items
            print(f"  Warning: using all {len(items)} available items (of ~{count_total})")

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump({"countTotal": total_count, "items": all_items}, f, ensure_ascii=False, indent=2)
    print(f"\nRaw data saved to {OUTPUT_JSON}")

    print(f"\nProcessing {len(all_items)} items...")
    seen_codes: Set = set()
    records: List[Dict] = []
    skipped = 0

    for item in all_items:
        processed = process_item(item, seen_codes)
        if processed:
            records.append(processed)
            seen_codes.add(processed["code"])
        else:
            skipped += 1

    print(f"  Unique records: {len(records)} | Duplicates skipped: {skipped}")

    sql = generate_sql(records)
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write(sql)
    print(f"\nNormalized SQL seed written to {OUTPUT_SQL}")
    print(f"  Total INSERT rows: {len(records)}")

    print("\n--- Sample (first 10) ---")
    for r in records[:10]:
        print(
            f"  {r['code']} | {r['name'][:50]} | "
            f"{r['pharmaceutical_form'] or '?'} | {r['concentration'] or '?'}"
        )


if __name__ == "__main__":
    main()