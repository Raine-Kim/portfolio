/* ==========================================================================
   PORTFOLIO CONTENT — 이 파일만 수정하면 사이트 내용이 바뀝니다.
   --------------------------------------------------------------------------
   · 프로젝트(Selected work)는 /admin 페이지에서 올리고 수정합니다 (data/work.js 에 저장).
   · 여기서는 프로필, 서비스, 프로세스, 스킬을 수정합니다.
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

  // 프로젝트(Selected work)는 data/work.js 에 있습니다. /admin 페이지에서 수정하세요.

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
