"""Check the real distribution, including data, without importing runtime secrets."""
import sys
from pathlib import Path
from zipfile import ZipFile

directory = Path(sys.argv[1])
wheels = list(directory.glob("regenai_assistant-*.whl"))
if len(wheels) != 1:
    raise SystemExit("Expected one assistant wheel")
with ZipFile(wheels[0]) as archive:
    names = archive.namelist()
    unexpected = [
        name for name in names
        if not name.startswith(("regenai_assistant/", "regenai_assistant-"))
    ]
    required = [
        "regenai_assistant/app.py", "regenai_assistant/cli.py",
        "regenai_assistant/bridge.py", "regenai_assistant/content/settings.json",
        "regenai_assistant/content/connectors.json", "regenai_assistant/static/index.html",
        "regenai_assistant/static/theme.css",
    ]
    missing = [name for name in required if name not in names]
    if unexpected or missing:
        raise SystemExit("Wheel scope or required package data failed")
print("Real assistant wheel contains only its package/metadata and required runtime data.")
