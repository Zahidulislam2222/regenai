"""Derive the assistant's brand tokens and font assets from the storefront."""

import argparse
import json
import re
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    config = json.loads((Path(__file__).parent / "theme-sync.json").read_text(encoding="utf-8"))
    source = (root / config["source_css"]).read_text(encoding="utf-8")
    match = re.search(r":root\s*\{[^}]+\}", source)
    if not match:
        raise ValueError("The storefront's authoritative theme tokens were not found")
    destination = root / config["destination"]
    css = "/* Generated from the storefront. Run sync_theme.py to refresh. */\n" + match[0]
    for font in config["fonts"]:
        css += (
            "\n@font-face{font-family:'"
            + font["family"]
            + "';font-style:normal;font-weight:100 900;font-display:swap;src:url('./"
            + font["filename"]
            + "') format('woff2')}\n"
        )
    outputs = {destination / "theme.css": css.encode()}
    for font in config["fonts"]:
        outputs[destination / font["filename"]] = (root / font["source"]).read_bytes()
    catalog = json.loads((root / config["source_catalog"]).read_text(encoding="utf-8"))
    knowledge = {
        **config["knowledge_context"],
        "products": [
            {key: product[key] for key in config["catalog_fields"]} for product in catalog
        ],
    }
    outputs[root / config["knowledge_destination"]] = (
        json.dumps(knowledge, ensure_ascii=False, indent=2) + "\n"
    ).encode()
    for path, data in outputs.items():
        if args.check:
            if not path.exists() or path.read_bytes() != data:
                raise ValueError("Assistant theme drift: " + path.name)
        else:
            path.write_bytes(data)
    print("Storefront theme/font parity:", len(outputs), "files")


if __name__ == "__main__":
    main()
