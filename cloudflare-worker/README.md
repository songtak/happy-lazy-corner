# Cloudflare Worker Proxy

`GpxMakerPage`에서 고도값을 얻기 위해 `OpenTopoData`를 프록시하는 Worker입니다.

## 1. 설치

```bash
cd cloudflare-worker
npm install
```

## 2. 로그인

```bash
npx wrangler login
```

## 3. 로컬 실행

```bash
npm run dev
```

## 4. 배포

```bash
npm run deploy
```

배포가 끝나면 `https://<worker-name>.<subdomain>.workers.dev` 형태의 URL이 나옵니다.

## 5. 프론트 연결

루트 `.env`에 아래 값을 추가합니다.

```env
VITE_ELEVATION_PROXY_URL=https://<worker-name>.<subdomain>.workers.dev
```

그 후 프론트를 다시 빌드/배포하면 `GpxMakerPage`가 이 Worker를 통해 고도값을 조회합니다.
