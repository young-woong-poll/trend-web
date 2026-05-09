#!/usr/bin/env node
/**
 * 로컬 HTTPS 리버스 프록시 — WebSocket(HMR) 정상 처리.
 *
 * 기존 `local-ssl-proxy`는 WebSocket upgrade 이벤트를 처리하지 않아
 * Next dev의 `_next/webpack-hmr` 핸드셰이크에서 `HPE_INVALID_CONSTANT`가 떨어짐.
 * 여기서는 http-proxy의 `proxy.ws()`로 upgrade를 명시 위임해 HMR을 정상 동작.
 *
 * 사용:
 *   node scripts/ssl-proxy.mjs --source 443 --target 3002 \
 *     --cert certs/localhost-cert.pem --key certs/localhost-key.pem
 */
import { readFileSync } from 'node:fs';
import { createServer } from 'node:https';
import { resolve } from 'node:path';
import { argv, exit, stderr, stdout } from 'node:process';

import httpProxy from 'http-proxy';

const args = parseArgs(argv.slice(2));
const requiredKeys = ['source', 'target', 'cert', 'key'];
const missing = requiredKeys.filter((k) => !args[k]);
if (missing.length > 0) {
  stderr.write(`Missing required flags: ${missing.map((k) => `--${k}`).join(', ')}\n`);
  exit(1);
}

const source = Number(args.source);
const target = Number(args.target);
if (!Number.isFinite(source) || !Number.isFinite(target)) {
  stderr.write('--source and --target must be numeric ports\n');
  exit(1);
}

const cwd = process.cwd();
const cert = readFileSync(resolve(cwd, args.cert));
const key = readFileSync(resolve(cwd, args.key));

const proxy = httpProxy.createProxyServer({
  target: { host: '127.0.0.1', port: target, protocol: 'http:' },
  ws: true,
  xfwd: true,
  changeOrigin: true,
});

// 백엔드(Next dev)가 아직 안 떴거나 일시 단절 시 깔끔한 에러 — 502로 닫기.
proxy.on('error', (err, _req, res) => {
  // res가 ServerResponse가 아닌 경우(WebSocket socket)도 들어오므로 안전 가드.
  stderr.write(`proxy error: ${err.message}\n`);
  if (res && typeof res.writeHead === 'function' && !res.headersSent) {
    try {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end('Bad Gateway: upstream unavailable\n');
    } catch {
      // ignore
    }
  } else if (res && typeof res.destroy === 'function') {
    res.destroy();
  }
});

const server = createServer({ cert, key }, (req, res) => {
  proxy.web(req, res);
});

// HMR 등 WebSocket upgrade는 별도 이벤트로 위임 (이게 핵심 — local-ssl-proxy가 빠뜨리는 부분).
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(source, () => {
  stdout.write(`SSL proxy: https://localhost:${source} → http://localhost:${target} (ws ok)\n`);
});

function parseArgs(input) {
  const out = {};
  for (let i = 0; i < input.length; i++) {
    const arg = input[i];
    if (!arg.startsWith('--')) {
      continue;
    }
    const key = arg.slice(2);
    const next = input[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = 'true';
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}
