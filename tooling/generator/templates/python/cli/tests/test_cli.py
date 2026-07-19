from src.cli import create_parser


def test_parser_creates():
    parser = create_parser()
    assert parser.prog == "{{name}}"
