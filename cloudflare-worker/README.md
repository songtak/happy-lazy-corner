# Cloudflare Worker Proxy

`GpxMakerPage`에서 아래 기능을 프록시하는 Worker입니다.

- `OpenTopoData` 고도 조회
- NAVER Maps `Directions 15` 경로 검색

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
VITE_DIRECTIONS_PROXY_URL=https://<worker-name>.<subdomain>.workers.dev
```

그 후 프론트를 다시 빌드/배포하면 `GpxMakerPage`가 이 Worker를 통해 고도값과 경로 검색을 요청합니다.

## 6. Directions 15 시크릿 설정

Directions 15는 Worker에 NAVER Cloud Platform 인증 정보를 시크릿으로 넣어야 합니다.

```bash
npx wrangler secret put NAVER_DIRECTION_API_KEY_ID
npx wrangler secret put NAVER_DIRECTION_API_KEY
```

시크릿 설정 후 다시 배포하세요.
