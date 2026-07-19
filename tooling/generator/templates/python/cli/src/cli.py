import argparse


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="{{name}}", description="{{description}}")
    parser.add_argument("input", nargs="?", help="Input value")
    return parser


def main() -> None:
    parser = create_parser()
    args = parser.parse_args()
    print(f"{{name}} executed with input: {args.input or '(none)'}")


if __name__ == "__main__":
    main()
