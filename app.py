#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
TOOLS_DIR = ROOT / "tools"
MANIFEST_PATH = ROOT / "tools.json"
TAG_RE = re.compile(r"<[^>]+>")


def prettify_slug(slug: str) -> str:
    cleaned = slug.replace("-", " ").replace("_", " ").strip()
    return cleaned or "Unbenanntes Tool"


def strip_tags(value: str) -> str:
    return TAG_RE.sub("", value).strip()


def extract_tag_text(document: str, tag_name: str) -> str:
    match = re.search(
        rf"<{tag_name}\b[^>]*>(.*?)</{tag_name}>",
        document,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return ""
    return html.unescape(strip_tags(match.group(1)))


def extract_meta_description(document: str) -> str:
    match = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
        document,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if match:
        return html.unescape(match.group(1).strip())
    return ""


def load_tool_metadata(tool_dir: Path) -> dict[str, str | int]:
    slug = tool_dir.name
    index_path = tool_dir / "index.html"
    if not index_path.exists():
        index_path = tool_dir / "index.php"
    if not index_path.exists():
        return {}

    document = index_path.read_text(encoding="utf-8")
    metadata_path = tool_dir / "tool.json"
    metadata: dict[str, str | int] = {}

    if metadata_path.exists():
        try:
            raw_metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            if isinstance(raw_metadata, dict):
                metadata = raw_metadata
        except json.JSONDecodeError:
            metadata = {}

    inferred_name = (
        extract_tag_text(document, "title")
        or extract_tag_text(document, "h1")
        or prettify_slug(slug)
    )
    inferred_description = extract_meta_description(document)
    name = str(metadata.get("name", inferred_name)).strip() or inferred_name
    description = str(metadata.get("description", inferred_description)).strip()
    category = str(metadata.get("category", "Allgemein")).strip() or "Allgemein"
    icon = str(metadata.get("icon", name[:1].upper() or "T")).strip() or "T"

    try:
        order = int(metadata.get("order", 999))
    except (TypeError, ValueError):
        order = 999

    return {
        "slug": slug,
        "name": name,
        "description": description,
        "category": category,
        "icon": icon,
        "path": f"./tools/{slug}/",
        "order": order,
    }


def discover_tools() -> list[dict[str, str]]:
    tools: list[dict[str, str]] = []
    if not TOOLS_DIR.exists():
        return tools

    for tool_dir in sorted(path for path in TOOLS_DIR.iterdir() if path.is_dir()):
        metadata = load_tool_metadata(tool_dir)
        if metadata:
            tools.append(metadata)

    return sorted(tools, key=lambda item: (item["order"], item["name"].lower()))


def write_manifest() -> None:
    manifest = json.dumps(discover_tools(), ensure_ascii=False, indent=2)
    MANIFEST_PATH.write_text(f"{manifest}\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync tools.json and optionally serve the static site.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host")
    parser.add_argument("--port", default=8000, type=int, help="Bind port")
    parser.add_argument(
        "--build-only",
        action="store_true",
        help="Only regenerate tools.json and exit.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    write_manifest()

    if args.build_only:
        print(f"Generated {MANIFEST_PATH.name}")
        return

    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f"Dashboard running on http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
