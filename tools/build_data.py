"""Build src/data/pes.json for the dashboard.

Reads the same files the report uses, so nothing on screen is typed by hand:
  ../05_Data_and_Code/results.json                 (written by calc.py)
  ../05_Data_and_Code/data/eia_monthly_2018_2020.csv
  ../05_Data_and_Code/data/reference_class_restarts.csv
  ../05_Data_and_Code/data/key_facts_with_sources.csv

A few facts that calc.py does not store (element contents, CML counts, state tax)
are read from key_facts_with_sources.csv when they are there, otherwise taken from
the CSB / City pages noted next to them.

Run:  python3 tools/build_data.py     (or: npm run data)
"""
import csv
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent / "05_Data_and_Code"
OUT = HERE.parent / "src" / "data" / "pes.json"

R = json.loads((ROOT / "results.json").read_text())


def read_csv(name):
    with open(ROOT / "data" / name, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


facts = {row["item"]: row["value"] for row in read_csv("key_facts_with_sources.csv")}


def fnum(key):
    return float(facts[key].replace(",", "").split()[0])


ni, cu = (float(x) for x in facts["Elbow Ni / Cu (wt%)"].split("/"))
hc_rel, hc_comb = (float(x.replace(",", "")) for x in facts["Hydrocarbons released / burned (lb)"].split("/"))

# ------------------------------------------------------------------ corrosion
corrosion = {
    "t0": fnum("Elbow original thickness (in)"),
    "tmin": fnum("Elbow minimum thickness (in)"),
    "tret": fnum("Retirement thickness (in)"),
    "adj": [0.29, 0.31],                       # CSB Table 3 ("0.29-0.31")
    "install": 1973,
    "fail": 2019,
    "rate_in_yr": R["cr_elbow_in_yr"],
    "rate_mpy": R["cr_elbow_mpy"],
    "adj_mpy": R["cr_adj_mpy"],
    "ratio": R["ratio"],
    "year_retire": R["year_retire"],
    "t2004": R["t2004"],
    "rl_adj": R["RL_adj"],
    "ni": ni,
    "cu": cu,
    "cuni": round(ni + cu, 2),
    "cuni_limit": 0.15,                        # NACE 03651 via CSB
    "c_min": 0.18,
    "cml_2002": 41,                            # CSB, as cited in the report §3.3
    "cml_2019": 141,                           # CSB, as cited in the report §3.3
}

# ------------------------------------------------------------------ release
release = {
    "hf_tot": fnum("HF released total (lb)"),
    "hf_cont": fnum("HF captured by water spray (lb)"),
    "hf_air": fnum("HF to atmosphere (lb)"),
    "hf_air_kg": R["hf_air_kg"],
    "hf_tot_kg": R["hf_tot_kg"],
    "spray_capture": R["spray_capture"],
    "rad_lb": R["rad_lb"],
    "rad_ratio": R["rad_ratio"],
    "hc_rel": hc_rel,
    "hc_comb": hc_comb,
    "hc_unburned": R["hc_unburned_lb"],
    "hc_unburned_t": R["hc_unburned_t"],
    "co2_lb": R["co2_lb"],
    "co2_t": R["co2_t"],
    "co2_hours": R["fire_co2_hours"],
    "ghg_mid": R["ghg_mid"],
    "frag_lb": 38000,                          # CSB, as cited in the report §2 (V-1 fragment)
    "proj_ft": fnum("Max projectile distance (ft)"),
}

# ------------------------------------------------------------------ zones
zones = {
    "r_iso_m": R["r_iso_m"],
    "a_iso_km2": R["A_iso_km2"],
    "r_proj_m": R["r_proj_m"],
    "a_proj_km2": R["A_proj_km2"],
    "proj_share_site": R["proj_share_site"],
    "r_1mi_m": 1609.344,
    "a_1mi_km2": R["A_1mi_km2"],
    "pop_1mi": R["pop_1mi"],
    "pop_city": 113271,                        # City report p.8
    "erg_day_km": R["erg_day_km"],
    "site_km2": R["site_km2"],
    "days_under_control": R["days_under_control"],
}

# ------------------------------------------------------------------ money
cases = []
for row in read_csv("reference_class_restarts.csv"):
    cases.append({
        "name": row["incident"],
        "start": row["incident_date"],
        "end": row["restart_date"].lstrip("~"),
        "approx": row["restart_date"].startswith("~"),
        "days": int(row["days"]),
    })

money = {
    "cap": R["cap"],
    "crack_2019": R["crack_2019"],
    "crack_monthly_2019": R["crack_monthly"],
    "prodval_2019": R["prodval_2019"],
    "gm_day": R["gm_day"],
    "rev_day": R["rev_day"],
    "prop_loss": R["prop_loss"],
    "breakeven_days": R["breakeven_days"],
    "cases": cases,
    "dt_min": R["dt_min"],
    "dt_median": R["dt_median"],
    "dt_mean": R["dt_mean"],
    "dt_max": R["dt_max"],
    "loss_min": R["gm_loss_dt_min"],
    "loss_median": R["gm_loss_dt_median"],
    "loss_max": R["gm_loss_dt_max"],
    "sens_base": R["sens_base"],
    "sens": R["sens"],
    "c_total": R["C_total"],
    "annuity": R["annuity"],
    "cb": R["cb"],
    "comp_day": R["comp_day"],
    "city_tax_day": R["city_tax_day"],
    "state_tax_day": 30e6 / 365,               # City report p.14
    "jobs_direct": 1100,                       # City report p.9
    "jobs_city": 6300,                         # City report p.14
    "jobs_state": 7650,
    "pes_share_padd1": R["pes_share_padd1"],
}

# ------------------------------------------------------------------ EIA monthly
eia = []
for row in read_csv("eia_monthly_2018_2020.csv"):
    eia.append({
        "m": row["month"],
        "runs": float(row["padd1_crude_input_kbd(MGIRIP12)"]),
        "gimp": float(row["padd1_gasoline_blending_imports_kbd(MBCIMP12)"])
        + float(row["padd1_finished_gasoline_imports_kbd(MGFIMP12)"]),
        "crack": float(row["crack_321_usd_bbl(calc)"]),
        "brent": float(row["brent_usd_bbl(RBRTE)"]),
        "gas": float(row["nyh_gasoline_usd_gal"]),
        "uls": float(row["nyh_ulsd_usd_gal"]),
    })

# sanity: the H2 comparison must match calc.py
def h2(year, key):
    v = [r[key] for r in eia if r["m"].startswith(str(year)) and int(r["m"][5:]) >= 7]
    return sum(v) / len(v)

for key, ck in (("runs", "runs"), ("gimp", "gimp"), ("crack", "crack")):
    assert abs(h2(2018, key) - R["cmp"][ck]["h2_2018"]) < 1e-6, key
    assert abs(h2(2019, key) - R["cmp"][ck]["h2_2019"]) < 1e-6, key

out = {
    "corrosion": corrosion,
    "release": release,
    "zones": zones,
    "money": money,
    "eia": eia,
    "cmp": R["cmp"],
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(f"wrote {OUT.relative_to(HERE.parent)}  ({len(eia)} EIA months, {len(cases)} restart cases)")
