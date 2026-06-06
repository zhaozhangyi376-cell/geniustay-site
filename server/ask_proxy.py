#!/usr/bin/env python3
"""Small streaming proxy for the personal-site ask card."""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import urllib.error
import urllib.request


HOST = os.getenv("ASK_PROXY_HOST", "127.0.0.1")
PORT = int(os.getenv("ASK_PROXY_PORT", "8787"))
MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
MAX_QUESTION_CHARS = 1000

PROMPT_PATH = Path(
    os.getenv(
        "ASK_SYSTEM_PROMPT_PATH",
        Path(__file__).with_name("ask_system_prompt.md"),
    )
)


def load_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def sse_payload(content: str) -> bytes:
    return f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n".encode(
        "utf-8"
    )


class AskHandler(BaseHTTPRequestHandler):
    server_version = "GeniustayAskProxy/1.0"

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args), flush=True)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "https://geniustay.cn")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/healthz":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"ok")
            return
        self.send_error(404)

    def do_POST(self):
        if self.path != "/api/ask":
            self.send_error(404)
            return

        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            self.send_error(500, "DEEPSEEK_API_KEY is not configured")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(min(length, 16_384))
            payload = json.loads(body.decode("utf-8"))
            question = str(payload.get("question", "")).strip()
        except Exception:
            self.send_error(400, "Invalid JSON body")
            return

        if not question:
            self.send_error(400, "Question is required")
            return
        if len(question) > MAX_QUESTION_CHARS:
            self.send_error(400, "Question is too long")
            return

        request_body = {
            "model": MODEL,
            "stream": True,
            "temperature": 0.55,
            "max_tokens": 700,
            "messages": [
                {"role": "system", "content": load_system_prompt()},
                {"role": "user", "content": question},
            ],
        }

        upstream = urllib.request.Request(
            f"{BASE_URL.rstrip('/')}/v1/chat/completions",
            data=json.dumps(request_body, ensure_ascii=False).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            },
            method="POST",
        )

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache, no-transform")
        self.send_header("Connection", "close")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()

        try:
            with urllib.request.urlopen(upstream, timeout=90) as response:
                for raw_line in response:
                    line = raw_line.decode("utf-8", errors="replace").strip()
                    if not line.startswith("data:"):
                        continue

                    data = line[5:].strip()
                    if data == "[DONE]":
                        self.wfile.write(b"data: [DONE]\n\n")
                        self.wfile.flush()
                        self.close_connection = True
                        return

                    try:
                        chunk = json.loads(data)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content")
                    except Exception:
                        content = None

                    if content:
                        self.wfile.write(sse_payload(content))
                        self.wfile.flush()
        except BrokenPipeError:
            return
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:300]
            self.wfile.write(sse_payload(f"模型接口暂时不可用：{exc.code}"))
            self.wfile.write(sse_payload(detail))
            self.wfile.write(b"data: [DONE]\n\n")
            self.wfile.flush()
            self.close_connection = True
        except Exception:
            self.wfile.write(sse_payload("模型接口暂时不可用，请稍后再试。"))
            self.wfile.write(b"data: [DONE]\n\n")
            self.wfile.flush()
            self.close_connection = True


def main():
    server = ThreadingHTTPServer((HOST, PORT), AskHandler)
    print(f"Ask proxy listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
