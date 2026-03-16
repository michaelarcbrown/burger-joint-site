import { useState, useEffect } from "react";

const PEXELS_KEY = "blnzWjU5objkH1ZNtuCVJFcHBEvxGEC9ywWC2oH4gnttOZUosvO1akW7";

const COLOR_PALETTES = [
  { name: "ember", bg: "#1a1210", surface: "#2a1f1a", accent: "#e8552e", text: "#f5efe8", muted: "#a89585" },
  { name: "midnight", bg: "#0c1017", surface: "#161c28", accent: "#4ea8de", text: "#e8edf5", muted: "#7b8ba3" },
  { name: "forest", bg: "#101a12", surface: "#1a2c1e", accent: "#6dbf73", text: "#eaf5eb", muted: "#88a88c" },
  { name: "plum", bg: "#18101a", surface: "#281a2c", accent: "#c17bd4", text: "#f3eaf5", muted: "#a088a8" },
  { name: "sand", bg: "#1a1815", surface: "#2c2820", accent: "#d4a84e", text: "#f5f0e8", muted: "#a8a085" },
  { name: "slate", bg: "#121416", surface: "#1e2226", accent: "#e85050", text: "#f0f2f5", muted: "#8a9099" },
];

const LAYOUTS = ["img-left", "img-right", "img-bg"];

const SECTION_PROMPTS = {
  headline: (biz) =>
    `You are a copywriter. Write a punchy 3-6 word headline for a ${biz} restaurant homepage hero. Just the headline, no quotes.`,
  tagline: (biz) =>
    `You are a copywriter. Write a one-sentence tagline (max 12 words) for a ${biz} restaurant. Just the tagline, no quotes.`,
  about: (biz) =>
    `You are a copywriter. Write a 2-sentence about blurb for a generic ${biz} restaurant website. Describe what this type of restaurant offers in general terms. No specific names or locations. Just the blurb, no quotes.`,
  menuIntro: (biz) =>
    `You are a copywriter. Write one sentence introducing the menu section of a ${biz} restaurant website. Keep it generic. Just the sentence, no quotes.`,
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchPexelsImage(query) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    const data = await res.json();
    if (data.photos && data.photos.length > 0) {
      const photo = pick(data.photos);
      return { url: photo.src.large2x || photo.src.large, photographer: photo.photographer };
    }
  } catch (e) {
    console.error("Pexels error:", e);
  }
  return null;
}

async function generateCopy(prompt) {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.text || null;
  } catch (e) {
    console.error("Copy generation error:", e);
    return null;
  }
}

function Nav({ palette }) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 40px",
        background: `${palette.bg}dd`,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${palette.muted}15`,
      }}
    >
      <span style={{ color: palette.accent, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700 }}>
        &#9670;
      </span>
      <div style={{ display: "flex", gap: 32 }}>
        {["About", "Menu", "Contact"].map((item) => (
          <span key={item} style={{ color: palette.text, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer", opacity: 0.8 }}>
            {item}
          </span>
        ))}
      </div>
    </nav>
  );
}

function imgStyle(image) {
  if (!image) return { background: "#333", minHeight: 500 };
  return { backgroundImage: `url(${image.url})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: 500 };
}

function HeroImgLeft({ image, headline, tagline, palette }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }}>
      <div style={imgStyle(image)} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px", background: palette.bg }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(32px, 4vw, 64px)", color: palette.text, lineHeight: 1.05, marginBottom: 20 }}>{headline}</h1>
        <p style={{ color: palette.muted, fontSize: 17, lineHeight: 1.6, maxWidth: 420 }}>{tagline}</p>
        <div style={{ marginTop: 36 }}>
          <span style={{ display: "inline-block", padding: "14px 36px", background: palette.accent, color: palette.bg, fontFamily: "sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, cursor: "pointer" }}>View Menu</span>
        </div>
      </div>
    </section>
  );
}

function HeroImgRight({ image, headline, tagline, palette }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px", background: palette.bg }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(32px, 4vw, 64px)", color: palette.text, lineHeight: 1.05, marginBottom: 20 }}>{headline}</h1>
        <p style={{ color: palette.muted, fontSize: 17, lineHeight: 1.6, maxWidth: 420 }}>{tagline}</p>
        <div style={{ marginTop: 36 }}>
          <span style={{ display: "inline-block", padding: "14px 36px", border: `2px solid ${palette.accent}`, color: palette.accent, fontFamily: "sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, cursor: "pointer" }}>Explore</span>
        </div>
      </div>
      <div style={imgStyle(image)} />
    </section>
  );
}

function HeroImgBg({ image, headline, tagline, palette }) {
  const bgStyle = image
    ? { backgroundImage: `linear-gradient(to bottom, ${palette.bg}cc, ${palette.bg}ee), url(${image.url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: palette.surface };
  return (
    <section style={{ ...bgStyle, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(38px, 5vw, 80px)", color: palette.text, lineHeight: 1.05, marginBottom: 24, maxWidth: 740 }}>{headline}</h1>
      <p style={{ color: palette.muted, fontSize: 19, lineHeight: 1.6, maxWidth: 500, marginBottom: 40 }}>{tagline}</p>
      <span style={{ display: "inline-block", padding: "16px 48px", background: palette.accent, color: palette.bg, fontFamily: "sans-serif", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, cursor: "pointer" }}>Reserve a Table</span>
    </section>
  );
}

function About({ copy, palette }) {
  return (
    <section style={{ background: palette.surface, padding: "90px 48px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", marginBottom: 24 }}>About Us</p>
        <p style={{ color: palette.text, fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(18px, 2.2vw, 26px)", lineHeight: 1.7 }}>{copy}</p>
      </div>
    </section>
  );
}

function MenuSection({ intro, palette }) {
  const cats = ["Starters", "Mains", "Sides", "Drinks"];
  return (
    <section style={{ background: palette.bg, padding: "90px 48px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>The Menu</p>
        <p style={{ color: palette.muted, fontFamily: "Georgia, serif", fontSize: 17, textAlign: "center", marginBottom: 52, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>{intro}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 20 }}>
          {cats.map((c) => (
            <div key={c} style={{ border: `1px solid ${palette.muted}33`, padding: 28, textAlign: "center" }}>
              <p style={{ color: palette.text, fontFamily: "Georgia, serif", fontSize: 17 }}>{c}</p>
              <p style={{ color: palette.muted, fontSize: 12, marginTop: 8 }}>Coming soon</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ palette }) {
  return (
    <footer style={{ background: palette.surface, padding: "40px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${palette.muted}22`, flexWrap: "wrap", gap: 16 }}>
      <p style={{ color: palette.muted, fontSize: 12, fontFamily: "sans-serif" }}>&copy; {new Date().getFullYear()} All Rights Reserved</p>
      <div style={{ display: "flex", gap: 24 }}>
        {["Hours", "Location", "Contact"].map((item) => (
          <span key={item} style={{ color: palette.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer" }}>{item}</span>
        ))}
      </div>
    </footer>
  );
}

export default function SiteGenerator() {
  const [loading, setLoading] = useState(true);
  const [palette] = useState(() => pick(COLOR_PALETTES));
  const [layout] = useState(() => pick(LAYOUTS));
  const [image, setImage] = useState(null);
  const [copy, setCopy] = useState({ headline: "", tagline: "", about: "", menuIntro: "" });

  const bizType = "burger joint";

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const [img, headline, tagline, about, menuIntro] = await Promise.all([
        fetchPexelsImage(bizType),
        generateCopy(SECTION_PROMPTS.headline(bizType)),
        generateCopy(SECTION_PROMPTS.tagline(bizType)),
        generateCopy(SECTION_PROMPTS.about(bizType)),
        generateCopy(SECTION_PROMPTS.menuIntro(bizType)),
      ]);

      if (cancelled) return;

      setImage(img);
      setCopy({
        headline: headline || "Flavor Worth Finding",
        tagline: tagline || "Where every bite tells a story.",
        about: about || "A place dedicated to crafting exceptional burgers using the freshest ingredients. Every visit is a new experience in bold flavor.",
        menuIntro: menuIntro || "Explore what we have to offer.",
      });
      setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 44, height: 44, border: `3px solid ${palette.surface}`, borderTop: `3px solid ${palette.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: palette.muted, fontFamily: "Georgia, serif", fontSize: 13, letterSpacing: 2 }}>BUILDING YOUR SITE...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const HeroComponent = layout === "img-left" ? HeroImgLeft : layout === "img-right" ? HeroImgRight : HeroImgBg;

  return (
    <div style={{ background: palette.bg, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
      <Nav palette={palette} />
      <HeroComponent image={image} headline={copy.headline} tagline={copy.tagline} palette={palette} />
      <About copy={copy.about} palette={palette} />
      <MenuSection intro={copy.menuIntro} palette={palette} />
      <Footer palette={palette} />
    </div>
  );
}
