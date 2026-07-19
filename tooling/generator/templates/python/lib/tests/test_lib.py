from src import greet, version


def test_greet():
    assert "world" in greet("world")


def test_version():
    assert version() == "1.0.0"
