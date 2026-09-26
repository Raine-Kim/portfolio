# Raine Kim — Portfolio

Web Designer / Front-end Developer 포트폴리오 사이트입니다.
빌드 과정 없는 순수 **HTML / CSS / JavaScript**라서 Cloudflare Pages에 그대로 올리면 됩니다.

- **컬러**: PANTONE 11-4201 *Cloud Dancer*(2026 올해의 컬러) 배경 + PANTONE 17-1230 *Mocha Mousse* + Tangerine / Digital Lavender 포인트
- **폰트**: Geist, Instrument Serif (이탤릭), Geist Mono
- **모션**: 프리로더 카운터, 글자 단위 등장 애니메이션, Lenis 스무스 스크롤, 스크롤 속도에 반응하는 마퀴, 클립패스로 열리는 카드, 스크롤 따라 켜지는 About 문장, 가로로 고정 스크롤되는 Process 섹션, 마그네틱 버튼, 커스텀 커서, 다크 모드(View Transition)
- 시스템 설정에서 *동작 줄이기*를 켠 방문자에게는 애니메이션을 끕니다.

## 폴더 구조

```
index.html          페이지 뼈대
css/style.css       스타일 (컬러 토큰은 맨 위 :root)
js/main.js          렌더링 + 애니메이션
data/projects.js    ← 내용은 전부 여기서 수정
media/              ← 사진, 영상, 이력서 PDF 업로드
_headers            Cloudflare Pages 캐시/보안 헤더
```

## 사진·영상 올리기

1. `media/projects/<프로젝트이름>/` 폴더에 파일을 넣습니다.
   - 이미지: `.jpg` `.png` `.webp` `.avif` (가로 2000px 이하, WebP 권장)
   - 영상: `.mp4` `.webm`. **Cloudflare Pages는 파일 하나당 25MB까지만 올라갑니다.** 그보다 큰 영상은 YouTube나 Vimeo에 올리고 `embed`로 넣으세요.
2. `data/projects.js`에서 해당 프로젝트에 경로를 적습니다.

```js
{
  slug: "harbour-noodle",
  title: "Harbour Noodle Bar",
  cover: "media/projects/harbour-noodle/cover.jpg",       // 카드 썸네일
  coverVideo: "media/projects/harbour-noodle/hover.mp4",  // 마우스 올리면 재생 (선택)
  scope: { Design: 100, "HTML/CSS": 100, JavaScript: 50 }, // 담당 범위 %
  link: "https://live-site.com",
  gallery: [
    { type: "image", src: "media/projects/harbour-noodle/01.jpg", caption: "Home — desktop" },
    { type: "video", src: "media/projects/harbour-noodle/scroll.mp4", caption: "Scroll interaction" },
    { type: "embed", src: "https://www.youtube.com/embed/VIDEO_ID", caption: "Full walkthrough" }
  ]
}
```

- `cover`를 비워두면 프로젝트 `color`로 만든 그래픽 카드가 대신 나옵니다.
- 프로필 사진은 `profile.portrait`, 이력서는 `profile.resume`, 히어로 아래 쇼릴 영상은 `profile.showreel`에 경로를 넣으면 나타납니다.
- **웹에서 바로 올리기**: GitHub 저장소 → 폴더로 이동 → *Add file → Upload files*. 커밋하면 Cloudflare가 1~2분 안에 자동으로 다시 배포합니다.

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
