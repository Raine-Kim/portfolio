# Sunghyun (Raine) Kim — Portfolio

Web Designer / Front-end Developer 포트폴리오 사이트입니다.
빌드 과정 없는 순수 **HTML / CSS / JavaScript**라서 Cloudflare Pages에 그대로 올리면 됩니다.

- **컬러**: PANTONE 11-4201 *Cloud Dancer*(2026 올해의 컬러) 배경 + PANTONE 17-1230 *Mocha Mousse* + Tangerine / Digital Lavender 포인트
- **폰트**: Geist, Instrument Serif (이탤릭), Geist Mono
- **모션**: 프리로더 카운터, 글자 단위 등장 애니메이션, Lenis 스무스 스크롤, 스크롤 속도에 반응하는 마퀴, 클립패스로 열리는 카드, 스크롤 따라 켜지는 About 문장, 가로로 고정 스크롤되는 Process 섹션, 마그네틱 버튼, 커스텀 커서, 다크 모드(View Transition)
- 시스템 설정에서 *동작 줄이기*를 켠 방문자에게는 애니메이션을 끕니다.

## 폴더 구조

```
index.html          메인 페이지
admin.html          프로젝트 관리 페이지 (/admin)
css/, js/           스타일과 스크립트
data/projects.js    프로필, 서비스, 프로세스, 스킬
data/work.js        Selected work 프로젝트 목록 (admin 페이지가 저장)
media/              사진, 영상, 이력서 PDF
_headers            Cloudflare Pages 캐시/보안 헤더
```

## 프로젝트 올리고 수정하기 — /admin

사이트 주소 뒤에 `/admin` 을 붙여 엽니다. 프로젝트 추가·수정·삭제·순서 변경, 커버 이미지와 호버 영상, 상세 갤러리(사진·영상·YouTube/Vimeo 링크), 담당 범위(%)를 화면에서 편집할 수 있습니다.

**게시하기**를 누르면 올린 파일과 `data/work.js` 가 GitHub 저장소에 커밋 하나로 저장되고, Cloudflare가 1~2분 안에 다시 배포합니다.

### 처음 한 번: GitHub 토큰 연결

1. GitHub → Settings → Developer settings → Fine-grained tokens → **Generate new token**
2. **Repository access**: Only select repositories → 이 저장소만 선택
3. **Permissions → Repository permissions → Contents**: Read and write
4. 만든 토큰을 admin 페이지의 **GitHub 연결** 칸에 붙여넣고 연결

- 토큰은 그 브라우저에만 저장되고 api.github.com 으로만 전송됩니다. 토큰이 없으면 누구도 저장할 수 없습니다.
- 공용 컴퓨터에서는 작업 후 **토큰 지우기**를 누르세요.
- 파일은 하나당 25MB까지입니다 (Cloudflare Pages 제한). 더 큰 영상은 YouTube/Vimeo에 올리고 **영상 링크 추가**를 쓰세요.

### 프로필 사진, 이력서, 쇼릴

`media/` 에 파일을 올리고 `data/projects.js` 의 `profile.portrait`, `profile.resume`, `profile.showreel` 에 경로를 적습니다.

## 로컬에서 보기

```bash
npx serve .
```

## Cloudflare Pages 배포

1. Cloudflare 대시보드 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 이 저장소 선택
3. 빌드 설정
   - Framework preset: **None**
   - Build command: *(비워두기)*
   - Build output directory: **/**
4. **Save and Deploy** → `*.pages.dev` 주소가 생깁니다.
5. 도메인을 연결하려면: 프로젝트 → **Custom domains** → **Set up a custom domain**

이후 `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다.
