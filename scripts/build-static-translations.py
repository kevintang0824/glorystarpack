#!/usr/bin/env python3
"""Build reusable static translations for every visible English HTML string.

The script intentionally writes translation dictionaries instead of editing HTML.
`generate-localized-site.mjs` consumes those dictionaries so localized pages remain
deterministic, reviewable static files and never depend on a browser translation
widget or a runtime translation service.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "data" / "full-translations"
LOCALE_TO_MODEL = {"fr": "fr", "es": "es", "pt": "pt", "ru": "ru", "zh-CN": "zh"}
PROTECTED_BLOCKS = re.compile(
    r"<(script|style|svg|noscript|code|pre)\b[\s\S]*?</\1\s*>", re.IGNORECASE
)
TEXT_NODE = re.compile(r">([^<>]+)<")
ATTRIBUTE = re.compile(
    r"\b(?:alt|aria-label|placeholder|title)=(?:\"([^\"]*)\"|'([^']*)')",
    re.IGNORECASE,
)


def source_files() -> list[Path]:
    tracked = subprocess.check_output(
        ["git", "ls-files", "*.html"], cwd=ROOT, text=True
    ).splitlines()
    return [
        ROOT / name
        for name in tracked
        if name
        and name != "google130558f0f0763df4.html"
        and not re.match(r"^(?:fr|es|pt|ru|zh-CN)/", name)
    ]


def normalized(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def should_translate(value: str) -> bool:
    decoded = html.unescape(value)
    if not re.search(r"[A-Za-z]{2}", decoded):
        return False
    if re.fullmatch(r"(?:https?://|mailto:|tel:)?\S+@?\S*", decoded) and (
        "://" in decoded or "@" in decoded
    ):
        return False
    if re.fullmatch(r"[A-Z0-9][A-Z0-9 /+_.:#×–—-]{0,24}", decoded):
        return False
    if decoded in {"GloryStarPack", "WhatsApp", "Instagram", "LinkedIn"}:
        return False
    return True


def translation_input(value: str) -> str:
    """Disambiguate recurring B2B packaging terms before machine translation."""
    value = re.sub(r"\bquotes\b", "price quotations", value, flags=re.IGNORECASE)
    value = re.sub(r"\bquote\b", "price quotation", value, flags=re.IGNORECASE)
    value = re.sub(r"\bquoting\b", "preparing a price quotation", value, flags=re.IGNORECASE)
    value = re.sub(r"\bvetting\b", "supplier evaluation", value, flags=re.IGNORECASE)
    value = re.sub(r"\bvet\b", "evaluate", value, flags=re.IGNORECASE)
    value = re.sub(r"\bhair mask\b", "hair treatment mask", value, flags=re.IGNORECASE)
    value = re.sub(r"\bhair conditioner\b|\bconditioner\b", "hair-care conditioner", value, flags=re.IGNORECASE)
    value = re.sub(r"\bhand cream\b", "hand-care cream", value, flags=re.IGNORECASE)
    value = re.sub(r"\bscalp treatment\b", "scalp-care product", value, flags=re.IGNORECASE)
    value = re.sub(r"\blead time\b", "production lead time", value, flags=re.IGNORECASE)
    value = re.sub(r"\bneck finish\b", "bottle neck specification", value, flags=re.IGNORECASE)
    value = re.sub(r"\bformula\b", "product formulation", value, flags=re.IGNORECASE)
    value = re.sub(r"\bclosure\b", "cap or dispensing closure", value, flags=re.IGNORECASE)
    value = re.sub(r"\bliner\b", "sealing liner", value, flags=re.IGNORECASE)
    value = re.sub(r"\btooling\b", "mold tooling", value, flags=re.IGNORECASE)
    value = re.sub(r"\bartwork\b", "print artwork", value, flags=re.IGNORECASE)
    value = re.sub(r"\bfinish\b", "surface finish", value, flags=re.IGNORECASE)
    return value


def postprocess_translation(language: str, source: str, value: str) -> str:
    value = re.sub(r"\s+", " ", value.replace("▁", " ").replace("_", " ")).strip()
    lower = source.casefold()
    if language == "zh-CN":
        if re.search(r"\bquote|quotes|quoting\b", source, re.IGNORECASE):
            value = re.sub(r"引用|引文|引号|引語|引述", "报价", value)
        if re.search(r"\bformula\b", source, re.IGNORECASE):
            value = value.replace("公式", "配方")
        if re.search(r"\bclosure\b", source, re.IGNORECASE):
            value = value.replace("关闭", "封口组件").replace("封顶", "瓶盖")
        if re.search(r"\bfinish\b", source, re.IGNORECASE):
            value = value.replace("完成", "表面工艺")
        if re.search(r"\bliner\b", source, re.IGNORECASE):
            value = value.replace("衬里", "密封垫片").replace("班轮", "密封垫片")
        if "hand cream" in lower:
            value = value.replace("手奶油", "护手霜").replace("手霜", "护手霜")
        if "hair mask" in lower:
            value = re.sub(r"(?:毛|头发|发型)(?:处理)?(?:面具|罩)", "发膜", value)
        if "conditioner" in lower:
            value = value.replace("空调", "护发素").replace("调理器", "护发素").replace("发型调节器", "护发素")
        if "scalp treatment" in lower:
            value = value.replace("头皮治疗", "头皮护理").replace("头皮处理", "头皮护理")
    return value


def extract_strings() -> list[str]:
    values: set[str] = set()
    for file_path in source_files():
        source = PROTECTED_BLOCKS.sub("", file_path.read_text(encoding="utf-8"))
        for match in TEXT_NODE.finditer(source):
            value = normalized(match.group(1))
            if should_translate(value):
                values.add(value)
        for match in ATTRIBUTE.finditer(source):
            value = normalized(match.group(1) if match.group(1) is not None else match.group(2))
            if should_translate(value):
                values.add(value)
    dynamic = json.loads(
        subprocess.check_output(
            ["node", "scripts/extract-dynamic-translation-strings.mjs"],
            cwd=ROOT,
            text=True,
        )
    )
    for raw_value in dynamic:
        value = normalized(raw_value)
        if should_translate(value):
            values.add(value)
    return sorted(values, key=lambda value: (len(value), value.casefold()))


def build(language: str, limit: int | None = None, refresh_glossary: bool = False) -> None:
    try:
        import argostranslate.settings
        import ctranslate2
        import sentencepiece
    except ImportError:
        sys.exit(
            "argostranslate is required. Install it in a Python 3.11+ environment "
            "and install the en→target language models first."
        )

    model_code = LOCALE_TO_MODEL[language]
    package_root = Path(argostranslate.settings.package_data_dir)
    package_path = None
    for metadata_path in package_root.glob("*/metadata.json"):
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        if metadata.get("from_code") == "en" and metadata.get("to_code") == model_code:
            package_path = metadata_path.parent
            break
    if package_path is None:
        sys.exit(f"Missing installed Argos model en→{model_code}")
    processor = sentencepiece.SentencePieceProcessor(model_file=str(package_path / "sentencepiece.model"))
    translator = ctranslate2.Translator(
        str(package_path / "model"),
        device=os.getenv("ARGOS_DEVICE_TYPE", "cpu"),
        inter_threads=int(os.getenv("ARGOS_INTER_THREADS", "1")),
        intra_threads=int(os.getenv("ARGOS_INTRA_THREADS", "0")),
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"{language}.json"
    cache = json.loads(output_path.read_text(encoding="utf-8")) if output_path.exists() else {}
    cache = {source: postprocess_translation(language, source, translated) for source, translated in cache.items()}
    strings = extract_strings()
    glossary_pattern = re.compile(r"\b(?:quote|quotes|quoting|vet|vetting)\b", re.IGNORECASE)
    pending = [
        value for value in strings
        if value not in cache or (refresh_glossary and glossary_pattern.search(value))
    ]
    if limit is not None:
        pending = pending[:limit]
    print(
        f"{language}: {len(strings)} strings, {len(cache)} cached, "
        f"{len(pending)} pending",
        flush=True,
    )

    batch_size = 64
    for start in range(0, len(pending), batch_size):
        sources = pending[start : start + batch_size]
        prepared = [translation_input(html.unescape(source)) for source in sources]
        token_batches = [processor.encode(value, out_type=str) for value in prepared]
        results = translator.translate_batch(
            token_batches,
            beam_size=int(os.getenv("ARGOS_BEAM_SIZE", "1")),
            batch_type="tokens",
            max_batch_size=2048,
            max_decoding_length=512,
        )
        for source, result in zip(sources, results):
            translated = processor.decode_pieces(result.hypotheses[0]).strip() or html.unescape(source)
            cache[source] = postprocess_translation(language, source, translated)
        output_path.write_text(
            json.dumps(cache, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
        print(f"{language}: translated {min(start + batch_size, len(pending))}/{len(pending)}", flush=True)

    missing = [value for value in strings if value not in cache]
    if not missing:
        # Remove obsolete entries after the English source changes.
        current = {value: cache[value] for value in strings}
        output_path.write_text(
            json.dumps(current, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
    print(f"{language}: complete={not missing}, missing={len(missing)}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--language", choices=LOCALE_TO_MODEL, required=True)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--refresh-glossary", action="store_true")
    args = parser.parse_args()
    build(args.language, args.limit, args.refresh_glossary)


if __name__ == "__main__":
    main()
