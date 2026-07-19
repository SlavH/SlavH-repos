import http.server
import json
import os

PORT = int(os.environ.get("PORT", "8000"))


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "service": "{{name}}"}).encode())
        else:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())


def main():
    server = http.server.HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"{{name}} running on http://localhost:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
