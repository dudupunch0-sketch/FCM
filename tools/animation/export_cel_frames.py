"""Copy validated sprite-gen output and write presentation-only landmarks.

Run the sprite-gen extraction/composition tools first. No image editing here;
this export retains the deterministic atlas bytes and its rectangle manifest.
"""
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUN = ROOT / "assets/animation/cel-frames-v1"
OUT = ROOT / "dist/assets/cel-boxer/animation"


def main():
    frames = json.loads((RUN / "frames/frames-manifest.json").read_text())
    report = json.loads((RUN / "sprite-sheet-alpha.report.json").read_text())
    manifest = json.loads((RUN / "manifest.json").read_text())
    if not frames["ok"] or not report["ok"]:
        raise SystemExit("Atlas QA failed; refusing export")
    cell = manifest["cell"]
    anchor = [cell["width"] / 2, cell["height"] - cell["safe_margin_y"]]
    rows = {}
    for row in frames["rows"]:
        records = row["frame_records"]
        standing_height = records[0]["bbox"][3] - records[0]["bbox"][1]
        points = []
        for i, record in enumerate(records):
            left, top, right, bottom = record["bbox"]
            head_x = left + (right - left) * (.7 if row["state"] == "weave" and i in [2, 3] else .57)
            points.append({"head": [head_x, top + standing_height * .115],
                           "body": [left + (right-left)*.52, top + standing_height*.34]})
        rows[row["state"]] = {"anchor": anchor, "scale": 209 / standing_height,
                              "enabled_in_game": row["state"] != "hook",
                              "landmarks": points}
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ["sprite-sheet-alpha.png", "manifest.json"]:
        shutil.copy2(RUN / name, OUT / name)
    presentation = {"version": 1, "rows": rows,
                    "note": "Approximate visual landmarks, never combat hitboxes. Hook candidate needs contact alignment and is disabled in game.",
                    "atlas_sha256": hashlib.sha256((OUT / "sprite-sheet-alpha.png").read_bytes()).hexdigest()}
    (OUT / "presentation.json").write_text(json.dumps(presentation, indent=2) + "\n")
    print(json.dumps({"ok": True, "rows": list(rows), "output": str(OUT)}))


if __name__ == "__main__":
    main()
