"""Host-side LLM bridge for CORRIDOR.

The backend runs in Docker and cannot see the host's Claude CLI, so this tiny
zero-dependency server runs on the host and shells out to `claude -p`. The
backend posts to http://host.docker.internal:8077/route. If this is not
running (for example a judge's cold clone), the backend falls back to keyword
routing, so nothing breaks.

The Claude call runs in a neutral temp directory so it does not absorb this
project's Hormuz-heavy context and bias the routing.

Run it from a shell where `claude` is installed:  python tools/llm_sidecar.py
"""

import json
import shutil
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, HTTPServer

CLAUDE = shutil.which("claude") or "claude"
NEUTRAL_CWD = tempfile.gettempdir()


def call_claude(prompt: str) -> str:
    try:
        res = subprocess.run(
            [CLAUDE, "-p", prompt],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=NEUTRAL_CWD,
        )
        return res.stdout.strip()
    except Exception:
        return ""


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("content-length", 0))
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            body = {}
        text = call_claude(body.get("prompt", ""))
        payload = json.dumps({"text": text}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        return


if __name__ == "__main__":
    print(f"LLM sidecar on :8077 bridging to {CLAUDE}")
    HTTPServer(("0.0.0.0", 8077), Handler).serve_forever()
