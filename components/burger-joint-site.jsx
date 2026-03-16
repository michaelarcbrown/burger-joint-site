import { useState, useEffect } from "react";

const PEXELS_KEY = "blnzWjU5objkH1ZNtuCVJFcHBEvxGEC9ywWC2oH4gnttOZUosvO1akW7";

const COLOR_PALETTES = [
  { name: "ember", bg: "#1a1210", surface: "#2a1f1a", accent: "#e8552e", text: "#f5efe8", muted: "#a89585", accent2: "#d4844e" },
  { name: "midnight", bg: "#0c1017", surface: "#161c28", accent: "#4ea8de", text: "#e8edf5", muted: "#7b8ba3", accent2: "#6e78de" },
  { name: "forest", bg: "#101a12", surface: "#1a2c1e", accent: "#6dbf73", text: "#eaf5eb", muted: "#88a88c", accent2: "#a8bf6d" },
  { name: "plum", bg: "#18101a", surface: "#281a2c", accent: "#c17bd4", text: "#f3eaf5", muted: "#a088a8", accent2: "#d47ba0" },
  { name: "sand", bg: "#1a1815", surface: "#2c2820", accent: "#d4a84e", text: "#f5f0e8", muted: "#a8a085", accent2: "#d4784e" },
  { name: "slate", bg: "#121416", surface: "#1e2226", accent: "#e85050", text: "#f0f2f5", muted: "#8a9099", accent2: "#e89050" },
];

const HERO_LAYOUTS = ["img-left", "img-right", "img-bg"];
const ABOUT_LAYOUTS = ["centered", "split-left", "split-right"];
const MENU_LAYOUTS = ["grid", "list", "cards"];
const GALLERY_LAYOUTS = ["masonry", "filmstrip", "featured"];
const TESTIMONIAL_LAYOUTS = ["carousel", "stacked", "highlight"];
const CONTACT_LAYOUTS = ["centered", "split", "minimal"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const PROMPTS = {
  headline: (biz) => `You are a copywriter. Write a punchy 3-6 word headline for a ${biz} homepage hero. Just the headline, no quotes.`,
  tagline: (biz) => `You are a copywriter. Write a one-sentence tagline (max 12 words) for a ${biz}. Just the tagline, no quotes.`,
  about: (biz) => `You are a copywriter. Write a 3-sentence about section for a generic ${biz} website. Describe the experience, atmosphere, and what makes this type of business special. No specific names or locations. Just the text, no quotes.`,
  menuIntro: (biz) => `You are a copywriter. Write one sentence introducing the menu section of a ${biz} website. Keep it inviting and generic. Just the sentence, no quotes.`,
  menuItems: (biz) => `You are a copywriter. Generate 8 menu items for a ${biz}. Return ONLY a JSON array of objects with "name" (string), "description" (max 8 words string), and "price" (string like "$12"). No markdown, no backticks, just the JSON array.`,
  galleryCaption: (biz) => `You are a copywriter. Write one evocative sentence describing the visual experience of a ${biz}. Just the sentence, no quotes.`,
  testimonials: (biz) => `You are a copywriter. Generate 3 fake customer reviews for a generic ${biz}. Return ONLY a JSON array of objects with "text" (1-2 sentences, max 25 words), "name" (first name only), and "rating" (number 4-5). No markdown, no backticks, just the JSON array.`,
  contactIntro: (biz) => `You are a copywriter. Write one welcoming sentence for the contact/visit section of a ${biz} website. Just the sentence, no quotes.`,
};

function gradientFallback(palette) {
  const g = [
    `radial-gradient(ellipse at 30% 50%, ${palette.accent}44 0%, ${palette.bg} 70%)`,
    `linear-gradient(135deg, ${palette.surface} 0%, ${palette.accent}33 50%, ${palette.bg} 100%)`,
    `radial-gradient(circle at 70% 40%, ${palette.accent}55 0%, ${palette.surface} 50%, ${palette.bg} 100%)`,
    `linear-gradient(160deg, ${palette.accent}22 0%, ${palette.surface} 40%, ${palette.accent}33 100%)`,
  ];
  return { url: pick(g), isGradient: true };
}

async function fetchPexelsImage(query, palette) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    const data = await res.json();
    if (data.photos?.length > 0) {
      const photo = pick(data.photos);
      return { url: photo.src.large2x || photo.src.large, isGradient: false };
    }
  } catch (e) {}
  return gradientFallback(palette);
}

async function fetchPexelsImages(query, count, palette) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${Math.max(count * 3, 15)}&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    const data = await res.json();
    if (data.photos?.length >= count) {
      const shuffled = data.photos.sort(() => Math.random() - 0.5).slice(0, count);
      return shuffled.map((p) => ({ url: p.src.large2x || p.src.large, isGradient: false }));
    }
  } catch (e) {}
  return Array.from({ length: count }, () => gradientFallback(palette));
}

async function generateCopy(prompt) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.find((b) => b.type === "text")?.text || "";
    return text.trim().replace(/^["']|["']$/g, "");
  } catch (e) {
    return null;
  }
}

async function generateJSON(prompt) {
  const raw = await generateCopy(prompt);
  if (!raw) return null;
  try {
    return JSON.parse(raw.replace(/```json?|```/g, "").trim());
  } catch (e) {
    return null;
  }
}

function imgBg(image) {
  if (image?.isGradient) return { background: image.url };
  return { backgroundImage: `url(${image?.url})`, backgroundSize: "cover", backgroundPosition: "center" };
}

const label = (palette) => ({ color: palette.accent, fontFamily: "sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", marginBottom: 24 });
const heading = (palette, size = "clamp(32px, 4vw, 56px)") => ({ fontFamily: "'Playfair Display', Georgia, serif", fontSize: size, color: palette.text, lineHeight: 1.1, marginBottom: 20 });
const body = (palette) => ({ color: palette.muted, fontSize: 17, lineHeight: 1.7, fontFamily: "'Playfair Display', Georgia, serif" });
const btn = (palette, variant = "filled") => variant === "filled"
  ? { display: "inline-block", padding: "14px 40px", background: palette.accent, color: palette.bg, fontFamily: "sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, cursor: "pointer", border: "none" }
  : { display: "inline-block", padding: "14px 40px", border: `2px solid ${palette.accent}`, color: palette.accent, fontFamily: "sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, cursor: "pointer", background: "transparent" };
const divider = (palette) => ({ width: 60, height: 2, background: palette.accent, margin: "0 auto 32px" });

/* ===== SECTION 1: HERO ===== */

function HeroImgLeft({ image, copy, palette }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }}>
      <div style={{ ...imgBg(image), minHeight: 500 }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 56px", background: palette.bg }}>
        <h1 style={heading(palette, "clamp(36px, 5vw, 72px)")}>{copy.headline}</h1>
        <p style={{ ...body(palette), maxWidth: 440 }}>{copy.tagline}</p>
        <div style={{ marginTop: 40 }}><span style={btn(palette)}>View Menu</span></div>
      </div>
    </section>
  );
}

function HeroImgRight({ image, copy, palette }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 56px", background: palette.bg }}>
        <h1 style={heading(palette, "clamp(36px, 5vw, 72px)")}>{copy.headline}</h1>
        <p style={{ ...body(palette), maxWidth: 440 }}>{copy.tagline}</p>
        <div style={{ marginTop: 40 }}><span style={btn(palette, "outline")}>Explore</span></div>
      </div>
      <div style={{ ...imgBg(image), minHeight: 500 }} />
    </section>
  );
}

function HeroImgBg({ image, copy, palette }) {
  const bg = image?.isGradient ? { background: image.url } : { backgroundImage: `linear-gradient(to bottom, ${palette.bg}aa, ${palette.bg}dd), url(${image?.url})`, backgroundSize: "cover", backgroundPosition: "center" };
  return (
    <section style={{ ...bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 48 }}>
      <h1 style={{ ...heading(palette, "clamp(40px, 6vw, 88px)"), maxWidth: 800 }}>{copy.headline}</h1>
      <p style={{ ...body(palette), maxWidth: 520, marginBottom: 44 }}>{copy.tagline}</p>
      <span style={btn(palette)}>Reserve a Table</span>
    </section>
  );
}

/* ===== SECTION 2: ABOUT ===== */

function AboutCentered({ image, copy, palette }) {
  return (
    <section style={{ background: palette.surface, padding: "120px 48px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "100%", ...imgBg(image), opacity: 0.15 }} />
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={label(palette)}>Our Story</p>
        <div style={divider(palette)} />
        <p style={{ ...body(palette), color: palette.text, fontSize: "clamp(18px, 2.2vw, 26px)" }}>{copy.about}</p>
      </div>
    </section>
  );
}

function AboutSplitLeft({ image, copy, palette }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 600, background: palette.surface }}>
      <div style={{ ...imgBg(image), minHeight: 400 }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 56px" }}>
        <p style={label(palette)}>Our Story</p>
        <h2 style={heading(palette, "clamp(28px, 3vw, 44px)")}>Crafted With Care</h2>
        <p style={{ ...body(palette), maxWidth: 460 }}>{copy.about}</p>
      </div>
    </section>
  );
}

function AboutSplitRight({ image, copy, palette }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 600, background: palette.surface }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 56px" }}>
        <p style={label(palette)}>Our Story</p>
        <h2 style={heading(palette, "clamp(28px, 3vw, 44px)")}>Crafted With Care</h2>
        <p style={{ ...body(palette), maxWidth: 460 }}>{copy.about}</p>
      </div>
      <div style={{ ...imgBg(image), minHeight: 400 }} />
    </section>
  );
}

/* ===== SECTION 3: MENU ===== */

function MenuGrid({ copy, palette }) {
  const items = copy.menuItems || [];
  return (
    <section style={{ background: palette.bg, padding: "120px 48px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={label(palette)}>The Menu</p>
          <div style={divider(palette)} />
          <p style={{ ...body(palette), maxWidth: 500, margin: "0 auto" }}>{copy.menuIntro}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: palette.surface, padding: 32, borderLeft: `3px solid ${palette.accent}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <p style={{ color: palette.text, fontFamily: "'Playfair Display', serif", fontSize: 18 }}>{item.name}</p>
                <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 14, fontWeight: 700 }}>{item.price}</p>
              </div>
              <p style={{ color: palette.muted, fontSize: 13, lineHeight: 1.5 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MenuList({ copy, palette }) {
  const items = copy.menuItems || [];
  return (
    <section style={{ background: palette.bg, padding: "120px 48px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={label(palette)}>The Menu</p>
          <div style={divider(palette)} />
          <p style={{ ...body(palette), maxWidth: 500, margin: "0 auto" }}>{copy.menuIntro}</p>
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0", borderBottom: `1px solid ${palette.muted}22` }}>
            <div>
              <p style={{ color: palette.text, fontFamily: "'Playfair Display', serif", fontSize: 19 }}>{item.name}</p>
              <p style={{ color: palette.muted, fontSize: 13, marginTop: 4 }}>{item.description}</p>
            </div>
            <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 24 }}>{item.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MenuCards({ copy, palette }) {
  const items = copy.menuItems || [];
  const half = Math.ceil(items.length / 2);
  return (
    <section style={{ background: palette.bg, padding: "120px 48px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={label(palette)}>The Menu</p>
          <div style={divider(palette)} />
          <p style={{ ...body(palette), maxWidth: 500, margin: "0 auto" }}>{copy.menuIntro}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          {[items.slice(0, half), items.slice(half)].map((col, ci) => (
            <div key={ci}>
              {col.map((item, i) => (
                <div key={i} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${palette.muted}15` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ color: palette.text, fontFamily: "'Playfair Display', serif", fontSize: 18 }}>{item.name}</p>
                    <span style={{ flex: 1, borderBottom: `1px dotted ${palette.muted}33`, margin: "0 12px", minWidth: 20 }} />
                    <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 15, fontWeight: 700 }}>{item.price}</p>
                  </div>
                  <p style={{ color: palette.muted, fontSize: 13, marginTop: 6 }}>{item.description}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== SECTION 4: GALLERY ===== */

function GalleryMasonry({ images, copy, palette }) {
  return (
    <section style={{ background: palette.surface, padding: "120px 48px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={label(palette)}>Gallery</p>
          <div style={divider(palette)} />
          <p style={body(palette)}>{copy.galleryCaption}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "280px 280px", gap: 16 }}>
          <div style={{ ...imgBg(images[0]), gridRow: "1 / 3", borderRadius: 4 }} />
          <div style={{ ...imgBg(images[1]), borderRadius: 4 }} />
          <div style={{ ...imgBg(images[2]), borderRadius: 4 }} />
          <div style={{ ...imgBg(images[3]), gridColumn: "2 / 4", borderRadius: 4 }} />
        </div>
      </div>
    </section>
  );
}

function GalleryFilmstrip({ images, copy, palette }) {
  return (
    <section style={{ background: palette.surface, padding: "120px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 64, padding: "0 48px" }}>
        <p style={label(palette)}>Gallery</p>
        <div style={divider(palette)} />
        <p style={body(palette)}>{copy.galleryCaption}</p>
      </div>
      <div style={{ display: "flex", gap: 16, overflow: "hidden", padding: "0 48px" }}>
        {images.map((img, i) => (
          <div key={i} style={{ ...imgBg(img), flex: i === 1 ? "2 0 0" : "1 0 0", height: 360, borderRadius: 4 }} />
        ))}
      </div>
    </section>
  );
}

function GalleryFeatured({ images, copy, palette }) {
  return (
    <section style={{ background: palette.surface, padding: "120px 48px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={label(palette)}>Gallery</p>
          <div style={divider(palette)} />
          <p style={body(palette)}>{copy.galleryCaption}</p>
        </div>
        <div style={{ ...imgBg(images[0]), height: 420, borderRadius: 4, marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {images.slice(1).map((img, i) => (
            <div key={i} style={{ ...imgBg(img), height: 200, borderRadius: 4 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== SECTION 5: TESTIMONIALS ===== */

function Stars({ count, palette }) {
  return <span style={{ color: palette.accent, fontSize: 16, letterSpacing: 2 }}>{"★".repeat(count)}{"☆".repeat(5 - count)}</span>;
}

function TestimonialsCarousel({ copy, palette }) {
  const reviews = copy.testimonials || [];
  return (
    <section style={{ background: palette.bg, padding: "120px 48px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={label(palette)}>What People Say</p>
          <div style={divider(palette)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32 }}>
          {reviews.map((r, i) => (
            <div key={i} style={{ background: palette.surface, padding: 40, borderTop: `3px solid ${palette.accent}` }}>
              <Stars count={r.rating} palette={palette} />
              <p style={{ ...body(palette), color: palette.text, marginTop: 16, marginBottom: 20, fontStyle: "italic" }}>"{r.text}"</p>
              <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>— {r.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsStacked({ copy, palette }) {
  const reviews = copy.testimonials || [];
  return (
    <section style={{ background: palette.bg, padding: "120px 48px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={label(palette)}>What People Say</p>
          <div style={divider(palette)} />
        </div>
        {reviews.map((r, i) => (
          <div key={i} style={{ padding: "36px 0", borderBottom: `1px solid ${palette.muted}22`, textAlign: "center" }}>
            <Stars count={r.rating} palette={palette} />
            <p style={{ ...body(palette), color: palette.text, marginTop: 16, marginBottom: 16, fontSize: 20, fontStyle: "italic" }}>"{r.text}"</p>
            <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>— {r.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsHighlight({ copy, palette }) {
  const reviews = copy.testimonials || [];
  const main = reviews[0] || { text: "", name: "", rating: 5 };
  const rest = reviews.slice(1);
  return (
    <section style={{ background: palette.bg, padding: "120px 48px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={label(palette)}>What People Say</p>
          <div style={divider(palette)} />
        </div>
        <div style={{ background: palette.surface, padding: "60px 48px", textAlign: "center", marginBottom: 32, borderLeft: `4px solid ${palette.accent}` }}>
          <Stars count={main.rating} palette={palette} />
          <p style={{ ...body(palette), color: palette.text, fontSize: 24, fontStyle: "italic", margin: "20px auto", maxWidth: 600 }}>"{main.text}"</p>
          <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>— {main.name}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {rest.map((r, i) => (
            <div key={i} style={{ background: palette.surface, padding: 32 }}>
              <Stars count={r.rating} palette={palette} />
              <p style={{ ...body(palette), color: palette.text, marginTop: 12, fontStyle: "italic" }}>"{r.text}"</p>
              <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginTop: 12 }}>— {r.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== SECTION 6: CONTACT ===== */

function ContactCentered({ image, copy, palette }) {
  return (
    <section style={{ position: "relative", padding: "120px 48px", overflow: "hidden", background: palette.bg }}>
      <div style={{ position: "absolute", inset: 0, ...imgBg(image), opacity: 0.12 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <p style={label(palette)}>Visit Us</p>
        <div style={divider(palette)} />
        <p style={{ ...body(palette), color: palette.text, fontSize: 20, marginBottom: 40 }}>{copy.contactIntro}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 40 }}>
          {[{ lbl: "Hours", val: "11am – 10pm" }, { lbl: "Phone", val: "(555) 123-4567" }, { lbl: "Email", val: "hello@example.com" }].map((d, i) => (
            <div key={i}>
              <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>{d.lbl}</p>
              <p style={{ color: palette.text, fontFamily: "Georgia, serif", fontSize: 15 }}>{d.val}</p>
            </div>
          ))}
        </div>
        <span style={btn(palette)}>Get Directions</span>
      </div>
    </section>
  );
}

function ContactSplit({ image, copy, palette }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 500 }}>
      <div style={{ ...imgBg(image), minHeight: 400 }} />
      <div style={{ background: palette.surface, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 56px" }}>
        <p style={label(palette)}>Visit Us</p>
        <h2 style={heading(palette, "clamp(24px, 3vw, 40px)")}>Come Say Hello</h2>
        <p style={{ ...body(palette), marginBottom: 32 }}>{copy.contactIntro}</p>
        <div style={{ marginBottom: 32 }}>
          {[{ lbl: "Hours", val: "11am – 10pm Daily" }, { lbl: "Phone", val: "(555) 123-4567" }, { lbl: "Address", val: "123 Main Street" }].map((d, i) => (
            <div key={i} style={{ display: "flex", gap: 16, marginBottom: 12 }}>
              <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", minWidth: 70 }}>{d.lbl}</p>
              <p style={{ color: palette.text, fontSize: 15 }}>{d.val}</p>
            </div>
          ))}
        </div>
        <span style={btn(palette, "outline")}>Get Directions</span>
      </div>
    </section>
  );
}

function ContactMinimal({ copy, palette }) {
  return (
    <section style={{ background: palette.surface, padding: "120px 48px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <p style={label(palette)}>Get In Touch</p>
        <div style={divider(palette)} />
        <p style={{ ...body(palette), color: palette.text, fontSize: 20, marginBottom: 48 }}>{copy.contactIntro}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 64, flexWrap: "wrap", marginBottom: 48 }}>
          {[{ lbl: "Hours", val: "11am – 10pm" }, { lbl: "Phone", val: "(555) 123-4567" }, { lbl: "Email", val: "hello@example.com" }, { lbl: "Address", val: "123 Main Street" }].map((d, i) => (
            <div key={i}>
              <p style={{ color: palette.accent, fontFamily: "sans-serif", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>{d.lbl}</p>
              <p style={{ color: palette.text, fontFamily: "Georgia, serif", fontSize: 16 }}>{d.val}</p>
            </div>
          ))}
        </div>
        <span style={btn(palette)}>Reserve a Table</span>
      </div>
    </section>
  );
}

/* ===== NAV + FOOTER ===== */

function Nav({ palette }) {
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", background: `${palette.bg}dd`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${palette.muted}15` }}>
      <span style={{ color: palette.accent, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700 }}>&#9670;</span>
      <div style={{ display: "flex", gap: 32 }}>
        {["About", "Menu", "Gallery", "Reviews", "Contact"].map((item) => (
          <span key={item} style={{ color: palette.text, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer", opacity: 0.8 }}>{item}</span>
        ))}
      </div>
    </nav>
  );
}

function Footer({ palette }) {
  return (
    <footer style={{ background: palette.bg, padding: 48, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${palette.muted}15`, flexWrap: "wrap", gap: 16 }}>
      <p style={{ color: palette.muted, fontSize: 12, fontFamily: "sans-serif" }}>&copy; {new Date().getFullYear()} All Rights Reserved</p>
      <div style={{ display: "flex", gap: 24 }}>
        {["Privacy", "Terms", "Accessibility"].map((item) => (
          <span key={item} style={{ color: palette.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", cursor: "pointer" }}>{item}</span>
        ))}
      </div>
    </footer>
  );
}

/* ===== LOADER + MAIN ===== */

function Loader({ palette, status }) {
  return (
    <div style={{ minHeight: "100vh", background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
      <div style={{ width: 48, height: 48, border: `3px solid ${palette.surface}`, borderTop: `3px solid ${palette.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: palette.muted, fontFamily: "Georgia, serif", fontSize: 13, letterSpacing: 2 }}>BUILDING YOUR SITE...</p>
      <p style={{ color: palette.muted, fontSize: 11, opacity: 0.5 }}>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const HERO_MAP = { "img-left": HeroImgLeft, "img-right": HeroImgRight, "img-bg": HeroImgBg };
const ABOUT_MAP = { centered: AboutCentered, "split-left": AboutSplitLeft, "split-right": AboutSplitRight };
const MENU_MAP = { grid: MenuGrid, list: MenuList, cards: MenuCards };
const GALLERY_MAP = { masonry: GalleryMasonry, filmstrip: GalleryFilmstrip, featured: GalleryFeatured };
const TESTIMONIAL_MAP = { carousel: TestimonialsCarousel, stacked: TestimonialsStacked, highlight: TestimonialsHighlight };
const CONTACT_MAP = { centered: ContactCentered, split: ContactSplit, minimal: ContactMinimal };

const FALLBACK_MENU = [
  { name: "Classic Smash", description: "Double patty, American cheese", price: "$14" },
  { name: "Truffle Burger", description: "Truffle aioli, arugula, gruyère", price: "$18" },
  { name: "BBQ Bacon Stack", description: "Smoked bacon, crispy onions", price: "$16" },
  { name: "Mushroom Swiss", description: "Sautéed mushrooms, Swiss cheese", price: "$15" },
  { name: "Loaded Fries", description: "Cheese, bacon, green onion", price: "$10" },
  { name: "Onion Rings", description: "Beer-battered, house dip", price: "$9" },
  { name: "Milkshake", description: "Hand-spun, seasonal flavors", price: "$8" },
  { name: "Craft Lemonade", description: "Fresh-squeezed, mint garnish", price: "$6" },
];

const FALLBACK_REVIEWS = [
  { text: "Best burger I've had in years. Incredible quality and atmosphere.", name: "Sarah", rating: 5 },
  { text: "The menu is creative and every dish delivers. Can't wait to return.", name: "Marcus", rating: 5 },
  { text: "Perfect spot for a casual dinner. Great food, friendly service.", name: "Elena", rating: 4 },
];

export default function SiteGenerator() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [palette] = useState(() => pick(COLOR_PALETTES));
  const [layouts] = useState(() => ({
    hero: pick(HERO_LAYOUTS),
    about: pick(ABOUT_LAYOUTS),
    menu: pick(MENU_LAYOUTS),
    gallery: pick(GALLERY_LAYOUTS),
    testimonials: pick(TESTIMONIAL_LAYOUTS),
    contact: pick(CONTACT_LAYOUTS),
  }));
  const [images, setImages] = useState({});
  const [copy, setCopy] = useState({});

  const bizType = "burger joint";

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setStatus("Fetching images...");
      const [heroImg, aboutImg, galleryImgs, contactImg] = await Promise.all([
        fetchPexelsImage(bizType, palette),
        fetchPexelsImage(`${bizType} interior`, palette),
        fetchPexelsImages(`${bizType} food`, 4, palette),
        fetchPexelsImage(`${bizType} restaurant exterior`, palette),
      ]);
      if (cancelled) return;
      setImages({ hero: heroImg, about: aboutImg, gallery: galleryImgs, contact: contactImg });

      setStatus("Generating copy...");
      const [headline, tagline, about, menuIntro, menuItems, galleryCaption, testimonials, contactIntro] = await Promise.all([
        generateCopy(PROMPTS.headline(bizType)),
        generateCopy(PROMPTS.tagline(bizType)),
        generateCopy(PROMPTS.about(bizType)),
        generateCopy(PROMPTS.menuIntro(bizType)),
        generateJSON(PROMPTS.menuItems(bizType)),
        generateCopy(PROMPTS.galleryCaption(bizType)),
        generateJSON(PROMPTS.testimonials(bizType)),
        generateCopy(PROMPTS.contactIntro(bizType)),
      ]);
      if (cancelled) return;

      setCopy({
        headline: headline || "Flavor Worth Finding",
        tagline: tagline || "Where every bite tells a story.",
        about: about || "A place dedicated to crafting exceptional burgers using the freshest ingredients. The atmosphere blends modern comfort with classic charm. Every visit is a new experience in bold flavor.",
        menuIntro: menuIntro || "Explore what we have to offer.",
        menuItems: (Array.isArray(menuItems) && menuItems.length > 0) ? menuItems : FALLBACK_MENU,
        galleryCaption: galleryCaption || "Every plate is a work of art, every moment worth savoring.",
        testimonials: (Array.isArray(testimonials) && testimonials.length > 0) ? testimonials : FALLBACK_REVIEWS,
        contactIntro: contactIntro || "We'd love to welcome you. Stop by or reach out anytime.",
      });
      setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader palette={palette} status={status} />;

  const Hero = HERO_MAP[layouts.hero];
  const About = ABOUT_MAP[layouts.about];
  const Menu = MENU_MAP[layouts.menu];
  const Gallery = GALLERY_MAP[layouts.gallery];
  const Testimonials = TESTIMONIAL_MAP[layouts.testimonials];
  const Contact = CONTACT_MAP[layouts.contact];

  return (
    <div style={{ background: palette.bg, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
      <Nav palette={palette} />
      <Hero image={images.hero} copy={copy} palette={palette} />
      <About image={images.about} copy={copy} palette={palette} />
      <Menu copy={copy} palette={palette} />
      <Gallery images={images.gallery} copy={copy} palette={palette} />
      <Testimonials copy={copy} palette={palette} />
      <Contact image={images.contact} copy={copy} palette={palette} />
      <Footer palette={palette} />
    </div>
  );
}
