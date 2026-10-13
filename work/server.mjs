import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, 'extracted_rootfs', 'web');
const PORT = 8080;

// Read menu.json
let menuList = [];
try {
  const menuPath = path.join(WEB_ROOT, 'static', 'json', 'menu.json');
  menuList = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
} catch (e) {
  console.error('Error loading menu.json:', e);
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let reqPath = decodeURIComponent(url.pathname);

  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, zySessionKey',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(200, jsonHeaders);
    res.end();
    return;
  }

  // RSA Public Key requested before login
  if (reqPath === '/getRSAPublickKey') {
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({
      result: 'success',
      RSAPublicKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3r1X3...',
      sessionkey: 'mock-session-123'
    }));
    return;
  }

  // User Login request - Accepts ANY password!
  if (reqPath === '/UserLogin') {
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({
      result: 'success',
      loginAccount: 'admin',
      loginLevel: 'high',
      loginPassword: '',
      ThemeColor: 'yellow',
      changePw: 0,
      quickStart: 0,
      sessionkey: 'mock-session-123'
    }));
    return;
  }

  // Active login check
  if (reqPath === '/cgi-bin/UserLoginCheck') {
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({
      result: 'success',
      sessionkey: 'mock-session-123'
    }));
    return;
  }

  // Menu list for dashboard
  if (reqPath === '/cgi-bin/MenuList') {
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({
      result: 'success',
      MenuList: menuList,
      sessionkey: 'mock-session-123'
    }));
    return;
  }

  // Login privilege query
  if (reqPath === '/cgi-bin/DAL' && url.searchParams.get('oid') === 'login_privilege') {
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({
      result: 'ZCFG_SUCCESS',
      Object: [
        {
          Username: 'admin',
          EnableQuickStart: true,
          Index0: 2,
          Index1: 0
        }
      ],
      sessionkey: 'mock-session-123'
    }));
    return;
  }

  // General Basic Info
  if (reqPath === '/getBasicInformation') {
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({
      result: 'success',
      ModelName: 'NR7101',
      SoftwareVersion: 'V1.00(ABUV.11)C0',
      CurrentLanguage: 'it',
      AvailableLanguages: 'en,it,de,es,fr',
      RememberPassword: 1,
      HTTP_Redirect_HTTPS: 0,
      sessionkey: 'mock-session-123'
    }));
    return;
  }

  // Web GUI Flags
  if (reqPath === '/getWebGuiFlag') {
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({
      result: 'success',
      Support5G: true,
      HideSkipPassword: false,
      showSkipBtn: true,
      hideOneSsid: false,
      WifiOnessidSecuritySync: false,
      InputCheckList: [{ RuleString: '4-32 alphanumeric characters' }],
      sessionkey: 'mock-session-123'
    }));
    return;
  }

  // Customization Data
  if (reqPath === '/getCustomizationData') {
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({
      result: 'success',
      ModelName: 'NR7101',
      sessionkey: 'mock-session-123'
    }));
    return;
  }

  // All other CGI-BIN requests
  if (reqPath.startsWith('/cgi-bin/')) {
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({
      result: 'ZCFG_SUCCESS',
      Object: [
        {
          level: 'high',
          status: 'success',
          GP_Privilege: 'HTTP, HTTPS'
        }
      ],
      data: {},
      code: 0,
      sessionkey: 'mock-session-123'
    }));
    return;
  }

  // Static File Serving
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(WEB_ROOT, reqPath.startsWith('/') ? reqPath.slice(1) : reqPath);

  if (!filePath.startsWith(WEB_ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(WEB_ROOT, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Zyxel NR7101 Web Simulator running at http://127.0.0.1:${PORT}`);
});
