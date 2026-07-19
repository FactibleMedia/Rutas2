css = '''@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Roboto:wght@400;500;700&display=swap");

@font-face { font-family: "Heritage Sans"; src: url("/fonts/Heritage-Sans.otf") format("opentype"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Trattatello"; src: url("/fonts/Trattatello.ttf") format("truetype"); font-weight: 400; font-style: normal; font-display: swap; }

:root {
  --glos-primary: #bb4c18;
  --glos-cream: #fffce6;
  --glos-bg-cats: #fffce6;
  --font-heritage: "Heritage Sans", Georgia, serif;
  --font-trattatello: "Trattatello", fantasy;
  --font-outfit: "Outfit", Arial, sans-serif;
  --font-roboto: "Roboto", Arial, sans-serif;
}

body { margin: 0; }

/* Hero Float Animation */
@keyframes heroFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-16px); }
}

.gloss-page { min-height: 100vh; background: var(--glos-bg-cats); color: #1f1b16; font-family: var(--font-outfit); }

/* === NEW HERO SECTION === */
.gloss-hero-new {
  position: relative;
  overflow: hidden;
  background: #0b0a0f;
  color: #fff;
  min-height: calc(100vh - 72px);
}

.gloss-hero-new__bg-glow {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(255,214,109,0.2), transparent 24%),
              radial-gradient(circle at bottom right, rgba(255,255,230,0.12), transparent 30%);
}

.gloss-hero-new__bg-blob-1 {
  position: absolute;
  left: 0;
  top: 80px;
  width: 288px;
  height: 288px;
  border-radius: 50%;
  background: rgba(255,204,84,0.20);
  filter: blur(64px);
  animation: heroFloat 6.5s ease-in-out infinite;
}

.gloss-hero-new__bg-blob-2 {
  position: absolute;
  right: 0;
  top: 160px;
  width: 208px;
  height: 208px;
  border-radius: 50%;
  background: rgba(187,76,24,0.20);
  filter: blur(64px);
  animation: heroFloat 6.5s ease-in-out infinite;
  animation-delay: 1.5s;
}

.gloss-hero-new__bg-blob-3 {
  position: absolute;
  left: -40px;
  bottom: 96px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(232,221,174,0.15);
  filter: blur(64px);
}

.gloss-hero-new__inner {
  position: relative;
  margin: 0 auto;
  max-width: 1420px;
  min-height: calc(100vh - 5rem);
  display: flex;
  flex-direction: column;
  gap: 48px;
  padding: 48px 24px 48px;
}

@media (min-width: 1024px) {
  .gloss-hero-new__inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.gloss-hero-new__content {
  z-index: 10;
  max-width: 42rem;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

@media (min-width: 1024px) {
  .gloss-hero-new__content {
    max-width: 672px;
  }
}

.gloss-hero-new__badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  padding: 8px 16px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.35em;
  color: #ffebc9;
  box-shadow: 0 20px 80px -55px rgba(255,211,117,0.8);
  width: fit-content;
}

.gloss-hero-new__text-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.gloss-hero-new__title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 900;
  line-height: 1.02;
  letter-spacing: -0.03em;
  color: #fff;
  margin: 0;
}

.gloss-hero-new__subtitle {
  max-width: 680px;
  font-size: clamp(1rem, 1.3vw, 1.25rem);
  line-height: 2;
  color: #f0e4c2;
  margin: 0;
}

.gloss-hero-new__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.gloss-hero-new__btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #bb4c18;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fffde8;
  text-decoration: none;
  box-shadow: 0 22px 80px -40px rgba(187,76,24,0.9);
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.gloss-hero-new__btn-primary:hover { background: #d15a24; }

.gloss-hero-new__btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.gloss-hero-new__btn-secondary:hover { border-color: rgba(255,255,255,0.3); }

/* Card Section */
.gloss-hero-new__card-section {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 680px;
}

.gloss-hero-new__card-glow {
  position: absolute;
  right: -48px;
  top: 32px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255,204,84,0.15);
  filter: blur(64px);
}

.gloss-hero-new__card-container {
  border-radius: 44px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.gloss-hero-new__card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  border-radius: 30px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(15,13,19,0.7);
  padding: 16px 20px;
  box-shadow: 0 16px 60px -40px rgba(0,0,0,0.45);
}

.gloss-hero-new__card-header-title {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: #f6d484;
  margin: 0 0 8px;
  font-size: 14px;
}

.gloss-hero-new__card-header-desc {
  color: #c8b18f;
  font-size: 14px;
  margin: 0;
}

.gloss-hero-new__card-header-badge {
  border-radius: 24px;
  background: rgba(255,255,255,0.1);
  padding: 8px 16px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: #fffde8;
  white-space: nowrap;
}

.gloss-hero-new__card {
  position: relative;
  overflow: hidden;
  border-radius: 36px;
  padding: 24px;
  box-shadow: 0 35px 120px -60px rgba(0,0,0,0.5);
}

.gloss-hero-new__card-image-wrap {
  position: absolute;
  inset: 0;
  opacity: 0.30;
}

.gloss-hero-new__card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gloss-hero-new__card-image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.25);
  mix-blend-mode: multiply;
}

.gloss-hero-new__card-body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gloss-hero-new__card-label {
  display: inline-flex;
  width: fit-content;
  border-radius: 9999px;
  background: rgba(255,255,255,0.12);
  padding: 8px 16px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.35em;
  color: #fffce0;
}

.gloss-hero-new__card-word {
  font-size: clamp(2rem, 3.5vw, 3.25rem);
  font-weight: 900;
  line-height: 1.05;
  color: #fff;
  margin: 0;
}

.gloss-hero-new__card-desc {
  max-width: 520px;
  font-size: 17px;
  line-height: 2;
  color: #f9f0d5;
  margin: 0;
}

.gloss-hero-new__card-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 24px;
}

.gloss-hero-new__card-nav-btn {
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.1);
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  cursor: pointer;
  transition: border-color 0.2s;
}

.gloss-hero-new__card-nav-btn--prev { color: #fffce6; }
.gloss-hero-new__card-nav-btn--prev:hover { border-color: rgba(255,255,255,0.2); }
.gloss-hero-new__card-nav-btn--next {
  color: #0b0a0f;
  background: #bb4c18;
  border-color: transparent;
}
.gloss-hero-new__card-nav-btn--next:hover { background: #d15a24; }

/* Category List */
.gloss-categories {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 96px 0;
  background: var(--glos-bg-cats);
  overflow: hidden;
}

.gloss-categories__header {
  max-width: 900px;
  margin-bottom: 64px;
  text-align: center;
  padding: 0 20px;
}

.gloss-categories__title {
  font-f
