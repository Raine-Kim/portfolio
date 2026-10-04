# Sunghyun (Raine) Kim — Portfolio

Web Designer / Front-end Developer 포트폴리오 사이트입니다.
빌드 과정 없는 순수 **HTML / CSS / JavaScript** 사이트이고, Cloudflare Workers로 호스팅합니다.

- **컬러**: PANTONE 11-4201 *Cloud Dancer*(2026 올해의 컬러) 배경 + PANTONE 17-1230 *Mocha Mousse* + Tangerine / Digital Lavender 포인트
- **폰트**: Geist, Instrument Serif (이탤릭), Geist Mono
- **모션**: 프리로더 카운터, 글자 단위 등장 애니메이션, Lenis 스무스 스크롤, 스크롤 속도에 반응하는 마퀴, 클립패스로 열리는 카드, 스크롤 따라 켜지는 About 문장, 가로로 고정 스크롤되는 Process 섹션, 마그네틱 버튼, 커스텀 커서, 다크 모드(View Transition)
- 시스템 설정에서 *동작 줄이기*를 켠 방문자에게는 애니메이션을 끕니다.

## 폴더 구조

```
public/               사이트 파일 (Cloudflare가 그대로 서비스)
  index.html          메인 페이지
  admin.html          프로젝트 관리 페이지 (/admin)
  css/, js/           스타일과 스크립트
  data/projects.js    프로필, 서비스, 프로세스, 스킬
  data/work.js        샘플 프로젝트 목록 (admin에서 한 번도 저장하지 않았을 때만 사용)
  media/              프로필 사진, 이력서 PDF 등
src/worker.js         admin용 API (로그인, 프로젝트 저장, 사진·영상 업로드)
wrangler.jsonc        Cloudflare Worker 설정
```

## 프로젝트 올리고 수정하기 — /admin

사이트 주소 뒤에 `/admin` 을 붙여 열고 비밀번호를 입력합니다.

- 프로젝트 추가·수정·복제·삭제·순서 변경
- 커버 이미지, 호버 영상, 상세 갤러리(사진·영상·YouTube/Vimeo 링크)
- 담당 범위(%) 편집
- **게시하기**를 누르면 바로 사이트에 반영됩니다 (다시 배포할 필요 없음).

프로젝트 목록과 올린 파일은 Cloudflare KV(무료)에 저장됩니다.

| 무료 한도 | |
| --- | --- |
| 파일 하나 | 25MB까지. 더 큰 영상은 YouTube/Vimeo 링크로 추가 |
| 전체 저장 용량 | 1GB |
| 저장 횟수 | 하루 1,000번 (파일 1개 = 1번) |

### 비밀번호

비밀번호는 저장소에 없고 Cloudflare 시크릿으로만 저장됩니다. 바꾸려면:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

틀린 비밀번호는 1시간에 10번까지만 시도할 수 있습니다. 로그인은 그 브라우저에서 30일 동안 유지됩니다.

### 프로필 사진, 이력서, 쇼릴

`public/media/` 에 파일을 넣고 `public/data/projects.js` 의 `profile.portrait`, `profile.resume`, `profile.showreel` 에 경로(`media/...`)를 적은 뒤 배포합니다.

## 로컬에서 보기

`.dev.vars` 파일에 로컬용 값을 넣고 실행합니다.

```
ADMIN_PASSWORD=0000
SESSION_SECRET=아무-문자열
```

```bash
npx wrangler dev
```

## 배포

`main` 브랜치에 푸시하면 Cloudflare Workers Builds가 `npx wrangler deploy` 로 배포합니다. 직접 배포하려면:

```bash
npx wrangler deploy
```
