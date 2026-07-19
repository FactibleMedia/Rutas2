import os
content = '''@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap");

:root {
  --glos-primary: #bb4c18;
  --glos-primary-dark: #a03d10;
  --glos-cream: #fffce6;
  --glos-gold: #e8981b;
  --glos-green: #464c33;
  --glos-purple: #564e87;
  --glos-bg-hero: #ffdd89;
  --glos-bg-cats: #fffce6;
  --glos-text-dark: #1f1b16;
  --font-trattatello: "Trattatello", "Bradley Hand", fantasy;
  --font-heritage: "Georgia", "Times New Roman", serif;
  --font-outfit: "Outfit", Arial, sans-serif;
}

.gloss-page {
  min-height: 100vh;
  background: var(--glos-bg-cats);
  color: var(--glos-text-dark);
  font-family: var(--font-outfit);
}

body {
  margin: 0;
}

.gloss-hero {
  position: relative;
  width: 100%;
  height: 1080px;
  overflow: hidden;
  background: var(--glos-bg-hero);
}

.gloss-hero__vector-bg {
  position: absolute;
  height: 946px;
  left: 55%;
  top: 50%;
  width: 776px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.gloss-hero__vector-bg img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gloss-hero__frame {
  position: absolute;
  border: 11px solid var(--glos-green);
  border-radius: 27px;
  height: 842px;
  left: 58%;
  top: 10%;
  width: 645px;
  pointer-events: none;
}

.gloss-hero__icon-top {
  position: absolute;
  left: 70%;
  width: 74px;
  height: 74px;
  top: 50%;
  overflow: clip;
  transform: translateY(-50%);
  pointer-events: none;
}

.gloss-hero__icon-top img {
  display: block;
  width: 100%;
  height: 100%;
}

.gloss-hero__text-card {
  position: absolute;
  background: var(--glos-cream);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  left: 5%;
  top: 50%;
  transform: translateY(-50%);
  width: 795px;
  padding: 60px 35px;
  border-radius: 44px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.12);
  z-index: 10;
}

.gloss-hero__text-card-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 728px;
}

.gloss-hero__heading {
  font-family: var(--font-heritage);
  font-size: 48px;
  line-height: 61px;
  color: var(--glos-primary);
  margin: 0;
}

.gloss-hero__subtitle-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 711px;
  margin-top: 0;
}

.gloss-hero__subtitle {
  font-family: var(--font-heritage);
  font-size: 64px;
  line-height: 40px;
  color: #000;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0;
  height: 96px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin-bottom: -15px;
}

.gloss-hero__subtitle p {
  margin: 0;
}

.gloss-hero__description {
  font-family: var(--font-outfit);
  font-size: 26px;
  font-weight: 500;
  line-height: 33px;
  color: #000;
  width: 691px;
  margin: 14px 0 0;
}

.gloss-hero__cta-wrap {
  margin-top: 32px;
}

.gloss-hero__cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--glos-primary);
  border: none;
  border-radius: 6px;
  padding: 5px 11px 4px;
  cursor: pointer;
  transition: transform 0.18s, background 0.18s;
  text-decoration: none;
}

.gloss-hero__cta:hover {
  background: var(--glos-primary-dark);
  transform: scale(1.05);
}

.gloss-hero__cta-text {
  font-family: var(--font-trattatello);
  font-size: 24px;
  line-height: 38px;
  letter-spacing: 2.16px;
  text-transform: uppercase;
  color: var(--glos-cream);
  padding: 10px;
  white-space: nowrap;
}

.gloss-hero__card-stack {
  position: absolute;
  height: 700px;
  width: 700px;
  left: 55%;
  top: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gloss-hero__card-wrapper {
  flex: none;
  position: absolute;
}

.gloss-hero__card {
  position: relative;
  width: 461px;
  height: 569px;
}

.gloss-hero__card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.gloss-hero__card-overlay {
  position: absolute;
  border: 3.7px solid var(--glos-gold);
  border-radius: 34px;
  inset: 4.13% 4.29%;
}

.gloss-hero__card-overlay--green {
  background: var(--glos-green);
}

.gloss-hero__card-overlay--purple {
  background: var(--glos-purple);
}

.gloss-hero__card-content {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  left: 39px;
  top: 82px;
  width: 381px;
  text-align: center;
}

.gloss-hero__card-word {
  font-family: var(--font-trattatello);
  font-size: 58px;
  letter-spacing: 2.3px;
  color: var(--glos-cream);
  margin: 16px 0 0;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.gloss-hero__card-meaning-label {
  font-family: var(--font-outfit);
  font-size: 29px;
  color: var(--glos-cream);
  margin-top: 40px;
}

.gloss-hero__card-meaning-text {
  font-family: var(--font-outfit);
  font-size: 26px;
  line-height: 30px;
  color: var(--glos-cream);
  padding: 0 32px;
  margin-top: 8px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.gloss-hero__card-type {
  font-family: var(--font-trattatello);
  font-size: 39px;
  letter-spacing: 1.5px;
  color: rgba(255, 252, 230, 0.75);
  margin-top: 32px;
}

.gloss-hero__nav {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 50px;
  left: 60%;
  top: 822px;
  z-index: 20;
}

.gloss-hero__nav-btn {
  background: var(--glos-primary);
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 75px;
  padding: 0 30px;
  cursor: pointer;
  transition: background 0.2s;
}

.gloss-hero__nav-btn:hover {
  background: var(--glos-primary-dark);
}

.gloss-hero__nav-btn-text {
  font-family: var(--font-heritage);
  font-size: 48px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--glos-cream);
}

.gloss-categories {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 96px 0;
  background: var(--glos-bg-cats);
  position: relative;
  overflow: hidden;
}

.gloss-categories__header {
  width: 100%;
  max-width: 900px;
  margin-bottom: 64px;
  text-align: center;
}

.gloss-categories__title {
  font-family: var(--font-heritage);
  font-size: 48px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--glos-primary);
  margin: 0 0 16px;
}

.gloss-categories__desc {
  font-family: var(--font-outfit);
  font-size: 26px;
  color: #000;
  margin: 0;
  line-height: 1.3;
}

.gloss-categories__grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 1700px;
  gap: 16px;
  padding: 0 40px;
}

.gloss-categories__item {
  position: relative;
  width: 335px;
  height: 118px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.gloss-categories__item-frame {
  position: absolute;
  inset: 0;
  padding: 12px;
  pointer-events: none;
}

.gloss-categories__item-frame-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.gloss-categories__item-frame-img {
  position: absolute;
  width: 110%;
  height: 250%;
  left: -5%;
  top: -75%;
  object-fit: contain;
  pointer-events: none;
}

.gloss-categories__item-content {
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 10;
  font-family: var(--font-trattatello);
}

.gloss-categories__item-name {
  font-size: 32px;
  letter-spacing: 0.02em;
  color: var(--glos-cream);
  margin: 0;
}

.gloss-categories__item-count {
  font-size: 22px;
  color: rgba(255, 252, 230, 0.8);
  margin: 0;
}

@media (max-width: 1400px) {
  .gloss-hero__text-card {
    width: 620px;
    padding: 40px 28px;
  }
  .gloss-hero__text-card-inner {
    width: 100%;
  }
  .gloss-hero__subtitle-row {
    width: 100%;
  }
  .gloss-hero__description {
    width: 100%;
    font-size: 22px;
  }
  .gloss-hero__heading {
    font-size: 38px;
    line-height: 48px;
  }
  .gloss-hero__subtitle {
    font-size: 48px;
    height: 72px;
  }
  .gloss-hero__frame {
    width: 500px;
    height: 700px;
    left: 54%;
  }
  .gloss-hero__card-stack {
    width: 550px;
    height
