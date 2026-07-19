import csv
import json
import sys


def load_csv(path: str) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def to_json(data: list[dict[str, str]], output: str | None = None) -> str:
    result = json.dumps(data, indent=2)
    if output:
        with open(output, "w", encoding="utf-8") as f:
            f.write(result)
    return result


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m src.processor <input.csv> [output.json]", file=sys.stderr)
        sys.exit(1)

    data = load_csv(sys.argv[1])
    result = to_json(data, sys.argv[2] if len(sys.argv) > 2 else None)
    if not sys.argv[2:]:
        print(result)


if __name__ == "__main__":
    main()
