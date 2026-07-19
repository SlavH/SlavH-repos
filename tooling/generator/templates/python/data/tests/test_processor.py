import json
from src.processor import load_csv, to_json
import tempfile
import os


def test_load_csv_and_to_json():
    content = "name,age\nAlice,30\nBob,25\n"
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False, encoding="utf-8") as f:
        f.write(content)
        path = f.name
    try:
        data = load_csv(path)
        assert len(data) == 2
        assert data[0]["name"] == "Alice"
        result = json.loads(to_json(data))
        assert len(result) == 2
    finally:
        os.unlink(path)
