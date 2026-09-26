/* ==========================================================================
   PORTFOLIO CONTENT — 이 파일만 수정하면 사이트 내용이 바뀝니다.
   --------------------------------------------------------------------------
   · 사진/영상은 media/projects/<프로젝트폴더>/ 에 올리고 아래 경로를 적어주세요.
   · 이미지: .jpg .png .webp .avif   영상: .mp4 .webm (Cloudflare Pages 파일당 25MB 제한)
   · 큰 영상은 YouTube / Vimeo 에 올리고 { type: "embed", src: "https://..." } 로 넣으세요.
   · cover / coverVideo 를 비워두면 자동으로 컬러 그래픽 카드가 표시됩니다.
   · 아래 projects 는 샘플입니다. 본인 작업으로 교체하세요.
   ========================================================================== */

window.PORTFOLIO = {
  profile: {
    name: "Sunghyun Kim",
    alias: "Raine",                   // 영어 이름 (About 섹션에 "Goes by Raine" 으로 표시)
    role: "Web Designer / Front-end Developer",
    location: "Toronto, ON",
    timezone: "America/Toronto",
    email: "rivernines@gmail.com",
    resume: "",                       // 예: "media/resume.pdf" (비워두면 버튼 숨김)
    portrait: "",                     // 예: "media/portrait.jpg" (About 섹션 사진)
    showreel: "",                     // 예: "media/showreel.mp4" (히어로 아래 쇼릴 영상)
    availability: "Open to full-time roles in Toronto",
    intro:
      "I design interfaces and then build them myself — responsive, fast, and on-brand. " +
      "From campaign landing pages to full brand sites, I care about the whole path: " +
      "the idea, the pixels, the code, and the results after launch.",
    socials: [
      { label: "GitHub", url: "https://github.com/Raine-Kim" },
      { label: "LinkedIn", url: "" },
      { label: "Instagram", url: "" },
      { label: "Behance", url: "" }
    ]
  },

  // 포트폴리오 필터에 쓰이는 카테고리
  categories: ["Restaurant", "Retail", "Corporate", "Event", "E-commerce"],

  // 담당 범위(scope)는 채용공고 요청 형식: Design 100% / HTML·CSS 100% / JavaScript 50%
  projects: [
    {
      slug: "harbour-noodle",
      title: "Harbour Noodle Bar",
      type: "New store launch site",
      category: "Restaurant",
      year: 2026,
      color: "#A47864",
      summary:
        "Launch site for a new downtown noodle bar — menu, reservations and a grand-opening event page, built mobile-first for Instagram traffic.",
      scope: { Design: 100, "HTML/CSS": 100, JavaScript: 80 },
      tools: ["Figma", "HTML", "CSS", "JavaScript", "Photoshop"],
      link: "",
      cover: "",
      coverVideo: "",
      gallery: [
        // { type: "image", src: "media/projects/harbour-noodle/01.jpg", caption: "Home — desktop" },
        // { type: "video", src: "media/projects/harbour-noodle/scroll.mp4", caption: "Scroll interaction" },
      ]
    },
    {
      slug: "north-thread",
      title: "North Thread",
      type: "Shopify storefront redesign",
      category: "E-commerce",
      year: 2026,
      color: "#FF5B2E",
      summary:
        "Redesigned product listing and product detail pages for an apparel brand. Cleaner hierarchy, faster images and a sticky add-to-cart for mobile.",
      scope: { Design: 100, "HTML/CSS": 90, JavaScript: 50 },
      tools: ["Figma", "Shopify", "Liquid", "Illustrator"],
      link: "",
      cover: "",
      coverVideo: "",
      gallery: []
    },
    {
      slug: "summer-night-market",
      title: "Summer Night Market",
      type: "Event registration page",
      category: "Event",
      year: 2025,
      color: "#7C6CF2",
      summary:
        "Campaign and registration page for a weekend outdoor market — vendor sign-up, schedule, map and a countdown that ties into the social campaign.",
      scope: { Design: 100, "HTML/CSS": 100, JavaScript: 100 },
      tools: ["Figma", "HTML", "CSS", "JavaScript", "Google Forms"],
      link: "",
      cover: "",
      coverVideo: "",
      gallery: []
    },
    {
      slug: "maple-partners",
      title: "Maple & Partners",
      type: "Corporate website",
      category: "Corporate",
      year: 2025,
      color: "#2F4A3A",
      summary:
        "Bilingual corporate site for a consulting firm on WordPress. A custom theme, a service structure users can scan and an easy editor for the client team.",
      scope: { Design: 80, "HTML/CSS": 100, JavaScript: 60 },
      tools: ["WordPress", "Figma", "PHP", "CSS"],
      link: "",
      cover: "",
      coverVideo: "",
      gallery: []
    },
    {
      slug: "glow-lab",
      title: "Glow Lab",
      type: "Product campaign landing page",
      category: "Retail",
      year: 2025,
      color: "#E8B4B8",
      summary:
        "Landing page for a skincare launch with scroll-driven product reveals, a quiz that recommends a routine and a promo code capture.",
      scope: { Design: 100, "HTML/CSS": 100, JavaScript: 70 },
      tools: ["Figma", "HTML", "CSS", "GSAP"],
      link: "",
      cover: "",
      coverVideo: "",
      gallery: []
    },
    {
      slug: "cafe-onda",
      title: "Café Onda",
      type: "Brand refresh & web graphics",
      category: "Restaurant",
      year: 2024,
      color: "#D9A441",
      summary:
        "Website refresh plus a banner and social graphic system for seasonal menus, so the café can swap promotions in minutes.",
      scope: { Design: 100, "HTML/CSS": 70, JavaScript: 30 },
      tools: ["Illustrator", "Photoshop", "Figma", "Squarespace"],
      link: "",
      cover: "",
      coverVideo: "",
      gallery: []
    }
  ],

  services: [
    { title: "UI/UX Design", desc: "Brand & corporate sites, user flows and wireframes to hi-fi Figma files.", tags: ["Figma", "Wireframes", "Design systems"] },
    { title: "Front-end Build", desc: "Pixel-accurate HTML, CSS and JavaScript that works on every device and browser.", tags: ["HTML", "CSS", "JavaScript", "GSAP"] },
    { title: "Campaign & Landing Pages", desc: "Promotion, event and registration pages that are built to convert and ship fast.", tags: ["Landing", "Event", "Registration"] },
    { title: "CMS & E-commerce", desc: "WordPress and Shopify setup, theme edits and content updates.", tags: ["WordPress", "Shopify", "SEO"] },
    { title: "Web Graphics", desc: "Banners, social assets and imagery that match each client's brand guide.", tags: ["Photoshop", "Illustrator", "Banners"] }
  ],

  process: [
    { step: "01", title: "Plan", desc: "Goals, audience and site map. What should a visitor do and how will we measure it?" },
    { step: "02", title: "Design", desc: "Wireframes to UI in Figma, built on the client's brand guide, mobile first." },
    { step: "03", title: "Build", desc: "Semantic HTML, modern CSS and light JavaScript. Tested across devices and browsers." },
    { step: "04", title: "Launch & Care", desc: "SEO basics, performance checks, then updates and fixes after launch." }
  ],

  skills: ["Figma", "Photoshop", "Illustrator", "HTML5", "CSS3", "JavaScript", "GSAP", "WordPress", "Shopify", "Git", "SEO", "Responsive Web"]
};
