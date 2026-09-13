"""Build a portable static workbench bundle. No AI, network or dependencies."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[2]
FILES = ["motion-workbench.html", "motion-workbench.js", "rig-motion.js",
         "rig-painter.js", "cel-boxer.js", "assets/cel-boxer/guard.png",
         "assets/cel-boxer/head-source.png"]

if __name__ == "__main__":
    out = ROOT / "artifacts/motion-workbench.zip"
    out.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(out, "w", ZIP_DEFLATED) as archive:
        for name in FILES:
            archive.write(ROOT / "dist" / name, name)
        archive.writestr("README.txt", "FCM Motion Workbench\n"
                         "Serve this folder with any static HTTP server.\n"
                         "Example: python3 -m http.server 8000\n"
                         "Open /motion-workbench.html. No AI or API keys required.\n"
                         "JSON clips are portable. Original art belongs to the project.\n"
                         "The game link is available only inside the full FCM project.\n")
    print(out)
