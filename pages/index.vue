<script setup lang="ts">
import type { LandingConfig, LandingLink, LanguageCode } from '~/shared/landing';
import { createDefaultLandingConfig, languageOptions } from '~/shared/landing';
import { computed, ref } from 'vue';
import { loadSlim } from 'tsparticles-slim';
import type { ISourceOptions } from '@tsparticles/engine';
import LandingIcon from '~/components/LandingIcon.vue';

const { data } = await useAsyncData<LandingConfig>('landing-config', () => $fetch('/api/landing-config'), {
  default: () => createDefaultLandingConfig(),
});

const config = computed(() => data.value || createDefaultLandingConfig());
const languageMenu = languageOptions;
const currentLanguage = ref<LanguageCode>('ja');
const languageMenuOpen = ref(false);
const activeTranslation = computed(() => config.value.translations[currentLanguage.value]);
const heroTitle = computed(() => activeTranslation.value?.greenTitle ?? config.value.greenTitle);
const heroSubtitle = computed(() => activeTranslation.value?.orangeSubtitle ?? config.value.orangeSubtitle);
const activeLanguageOption = computed(() => languageMenu.find((language) => language.code === currentLanguage.value));
const activeLanguageLabel = computed(() => activeLanguageOption.value?.label ?? '');
const activeLanguageFlag = computed(() => getLanguageFlag(currentLanguage.value));

function isExternal(url: string) {
  return /^(https?:|mailto:|tel:)/i.test(url);
}

function buttonClass(link: LandingLink) {
  return link.tone === 'orange' ? 'landing-link landing-link--orange' : 'landing-link landing-link--green';
}

function linkLabelText(link: LandingLink) {
  return activeTranslation.value?.linkLabels?.[link.id] ?? link.label;
}

function changeLanguage(code: LanguageCode) {
  currentLanguage.value = code;
  languageMenuOpen.value = false;
}

function getLanguageFlag(code: LanguageCode): string {
  const customFlag = config.value.languageFlags?.[code];
  if (customFlag && customFlag.trim().length > 0) {
    return customFlag.trim();
  }

  return languageMenu.find((language) => language.code === code)?.flag ?? '';
}

function isUploadedLanguageFlag(value: string | undefined): boolean {
  return typeof value === 'string' && (value.startsWith('/') || value.startsWith('http'));
}

function toggleLanguageMenu() {
  languageMenuOpen.value = !languageMenuOpen.value;
}

useSeoMeta({
  title: 'Sunshine Ecosystem',
  description: 'Landing page user cho he sinh thai Sunshine',
});

const particlesOptionsPage = ref<ISourceOptions>({
  background: {
    color: {
      value: 'transparent',
    },
  },
  fpsLimit: 120,
  particles: {
    color: {
      value: '#ffeebb',
    },
    links: {
      color: '#ffd085',
      distance: 150,
      enable: true,
      opacity: 0.35,
      width: 1,
    },
    move: {
      enable: true,
      speed: 1,
      direction: 'none',
      random: false,
      straight: false,
      outModes: 'out',
    },
    number: {
      density: {
        enable: true,
      },
      value: 60,
    },
    opacity: {
      value: 0.4,
    },
    shape: {
      type: 'circle',
    },
    size: {
      value: { min: 1, max: 3 },
    },
  },
  detectRetina: true,
});

const particlesOptionsCard = ref<ISourceOptions>({
  background: {
    color: {
      value: 'transparent',
    },
  },
  fpsLimit: 120,
  particles: {
    color: {
      value: '#ffeebb',
    },
    links: {
      color: '#ffd085',
      distance: 120,
      enable: true,
      opacity: 0.25,
      width: 1,
    },
    move: {
      enable: false,
    },
    number: {
      density: {
        enable: true,
      },
      value: 30,
    },
    opacity: {
      value: 0.4,
    },
    shape: {
      type: 'circle',
    },
    size: {
      value: { min: 1, max: 3 },
    },
  },
  detectRetina: true,
});

const particlesInit = async (engine: any) => {
  await loadSlim(engine);
};
</script>

<template>
  <main class="landing-page">
    <ClientOnly>
      <Particles
        id="tsparticles-page"
        class="tsparticles"
        :particlesInit="particlesInit"
        :options="particlesOptionsPage"
      />
    </ClientOnly>
    
    
    
    
    
    

    <div class="top-nav">
      <div class="language-switcher">
        <button
          type="button"
          class="language-toggle"
          :aria-expanded="languageMenuOpen"
          :aria-label="`Chuyển ngôn ngữ (${activeLanguageLabel})`"
          @click="toggleLanguageMenu"
        >
          <span class="language-flag">
            <img v-if="isUploadedLanguageFlag(activeLanguageFlag)" :src="activeLanguageFlag" alt="" />
            <span v-else>{{ activeLanguageFlag }}</span>
          </span>
          <span class="language-label">{{ activeLanguageLabel }}</span>
          <span class="language-chevron" aria-hidden="true">▾</span>
        </button>
        <div v-if="languageMenuOpen" class="language-dropdown" role="menu">
          <button
            v-for="language in languageMenu"
            :key="language.code"
            type="button"
            class="language-option"
            :class="{ 'language-option--active': language.code === currentLanguage }"
            @click="changeLanguage(language.code)"
            :aria-label="language.label"
          >
            <span class="language-flag">
              <img v-if="isUploadedLanguageFlag(getLanguageFlag(language.code))" :src="getLanguageFlag(language.code)" alt="" />
              <span v-else>{{ getLanguageFlag(language.code) }}</span>
            </span>
            <span class="language-label">{{ language.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <section class="landing-card">
      <div class="hero-header">
        <div class="brand-block">
          <div v-if="config.logoUrl" class="brand-logo brand-logo--image">
          <img :src="config.logoUrl" alt="Sunshine logo" />
        </div>
        <div v-else class="brand-logo brand-logo--fallback" aria-hidden="true">
          <div class="orbit orbit--outer"></div>
          <div class="orbit orbit--inner"></div>
          <div class="planet-core"></div>
        </div>

        <h1 class="brand-title">{{ heroTitle }}</h1>
        <p class="brand-subtitle">{{ heroSubtitle }}</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="link-list">
        <a
          v-for="link in config.links"
          :key="link.id"
          :href="link.url"
          :target="isExternal(link.url) ? '_blank' : undefined"
          :rel="isExternal(link.url) ? 'noopener noreferrer' : undefined"
          :class="buttonClass(link)"
        >
          <span class="link-icon">
            <img v-if="link.icon && (link.icon.startsWith('/') || link.icon.startsWith('http'))" :src="link.icon" class="link-custom-icon" alt="" />
            <LandingIcon v-else :name="link.icon" />
          </span>
          <span class="link-flags-group" v-if="link.flag1 || link.flag2">
            <template v-if="link.flag1">
              <img v-if="link.flag1.startsWith('/') || link.flag1.startsWith('http')" :src="link.flag1" class="link-flag-img" alt="" />
              <span v-else class="link-flag">{{ link.flag1 }}</span>
            </template>
            <span v-if="link.flag1 && link.flag2" class="link-separator">|</span>
            <template v-if="link.flag2">
              <img v-if="link.flag2.startsWith('/') || link.flag2.startsWith('http')" :src="link.flag2" class="link-flag-img" alt="" />
              <span v-else class="link-flag">{{ link.flag2 }}</span>
            </template>
          </span>
          <span class="link-label">{{ linkLabelText(link) }}</span>
        </a>
      </div>
    </section>
  </main>
</template>

<style scoped>
#tsparticles-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

#tsparticles-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  border-radius: 36px;
}

:deep(#tsparticles-card canvas) {
  opacity: 0.55;
  filter: blur(0.2px);
  mix-blend-mode: screen;
}

:global(body) {
  margin: 0;
  font-family: var(--app-font-family);
  background: 
    radial-gradient(circle at 50% 45%, #ffffff 0%, rgba(255,255,255,0.8) 25%, rgba(255,255,255,0) 65%),
    linear-gradient(180deg, #ffd88a 0%, #8bc49c 50%, #2f6b43 100%);
  background-attachment: fixed;
  color: #13462b;
}

.landing-page {
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
  padding-block: clamp(12px, 2.5vw, 32px);
  padding-inline: clamp(12px, 3vw, 24px);
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.top-nav {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 100;
}

.landing-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 50% 50%, transparent 30%, rgba(60, 35, 10, 0.4) 150%),
    repeating-linear-gradient(0deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 1px, transparent 1px, transparent 3px);
  pointer-events: none;
  z-index: 90;
  mix-blend-mode: multiply;
  animation: vintageFlicker 8s infinite;
}

.landing-page::after {
  content: '';
  position: absolute;
  inset: -100% -100%;
  background-image: url('https://www.transparenttextures.com/patterns/dust.png');
  opacity: 0.85;
  mix-blend-mode: color-dodge;
  pointer-events: none;
  z-index: -3;
  animation: dustDrift 40s linear infinite;
}

.landing-card {
  width: min(100%, 460px);
  margin: 0 auto;
  padding: 24px 16px 40px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: center;
  background: rgba(255, 248, 235, 0.25);
  backdrop-filter: blur(12px) sepia(25%);
  -webkit-backdrop-filter: blur(12px) sepia(25%);
  border-radius: 36px;
  box-shadow: 0 10px 40px rgba(80, 50, 20, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.landing-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('https://www.transparenttextures.com/patterns/dust.png');
  opacity: 0.6;
  mix-blend-mode: color-dodge;
  pointer-events: none;
  border-radius: 36px;
  z-index: -1;
}

.hero-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
  text-align: center;
}

.language-switcher {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
}
.landing-orb {
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  opacity: 0.35;
  filter: blur(2px);
  pointer-events: none;
  z-index: -1;
}

.language-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  color: #1a5c36;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.language-toggle:focus-visible {
  outline: 2px solid #0f776e;
  outline-offset: 2px;
}

.language-toggle:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(241, 245, 249, 0.8));
  box-shadow: 0 8px 20px rgba(15, 118, 110, 0.25);
}

.language-flag {
  font-size: 1.3rem;
  line-height: 1;
}
.language-flag img {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 999px;
  object-fit: cover;
}

.language-label {
  opacity: 0.9;
  font-size: 0.95rem;
}

.language-chevron {
  display: inline-flex;
  font-size: 0.9rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.language-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 220px;
  background: rgba(244, 250, 235, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 18px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 18px 34px rgba(27, 52, 45, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.language-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: transparent;
  color: #1a5c36;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.language-option:hover,
.language-option:focus-visible {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.4);
}

.language-option--active {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(34, 197, 94, 0.5);
  color: #0b462f;
}

.language-option:hover,
.language-option:focus-visible {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.4);
}

.language-option--active {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(34, 197, 94, 0.5);
  color: #0b462f;
}



.brand-block,
.divider,
.link-list {
  position: relative;
  z-index: 1;
}

.brand-block {
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 6px;
  animation: fadeUp 0.6s ease both;
}

.brand-logo {
  width: 100px;
  height: 80px;
  display: grid;
  place-items: center;
  animation: floatSlow 6s ease-in-out infinite;
}

@media (max-width: 520px) {
  .landing-card {
    width: calc(100% - 32px);
    padding: 24px 20px 28px;
  }

  .language-toggle {
    padding: 8px 14px;
  }

  .language-dropdown {
    width: 220px;
    right: 0;
  }
}

.brand-logo--image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.5));
}

.brand-logo--fallback {
  position: relative;
}

.planet-core {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffb11b, #2f7f4b);
  box-shadow: inset 0 6px 12px rgba(255, 255, 255, 0.34);
}

.orbit {
  position: absolute;
  border-radius: 999px;
  border: 7px solid transparent;
}

.orbit--outer {
  width: 90px;
  height: 40px;
  border-top-color: #f59e0b;
  border-bottom-color: #f59e0b;
  transform: rotate(-14deg);
}

.orbit--inner {
  width: 60px;
  height: 66px;
  border-left-color: #66a84f;
  border-right-color: #2f7f4b;
  transform: rotate(28deg);
}

.brand-title {
  margin: 0;
  font-size: clamp(1.4rem, 4.5vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: #1a5c36;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
}

.brand-subtitle {
  margin: 0;
  font-size: clamp(0.85rem, 1.8vw, 0.95rem);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ed8936;
  text-wrap: balance;
}

.divider {
  height: 1px;
  margin: 16px 12px;
  background: linear-gradient(90deg, rgba(134, 239, 172, 0), rgba(134, 239, 172, 0.25), rgba(134, 239, 172, 0));
  animation: fadeUp 0.7s ease both;
}

.link-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
  animation: fadeUp 0.8s ease both;
}

.landing-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  border-radius: 999px;
  padding: 14px 20px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
  min-height: 54px;
  width: calc(100% - 16px);
  max-width: 440px;
}

.link-flags-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .link-flag {
    font-size: 1.3rem;
    line-height: 1;
  }

  .link-flag-img {
    width: 30px;
    height: 22px;
    border-radius: 4px;
    object-fit: cover;
  }

  .link-separator {
    opacity: 0.6;
    margin: 0 3px;
    font-size: 1.1rem;
  font-weight: 300;
}

.landing-link::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('https://www.transparenttextures.com/patterns/dust.png');
  opacity: 0.85;
  mix-blend-mode: color-dodge;
  pointer-events: none;
}

.landing-link:hover {
  transform: translateY(-3px) rotate(-0.5deg) scale(1.02);
  box-shadow: inset 0 0 15px rgba(0,0,0,0.3), 0 8px 16px rgba(40,25,10,0.25);
  filter: saturate(1.15) brightness(1.1) contrast(1.05);
}

.landing-link--green {
  background: radial-gradient(ellipse 130% 120% at 50% 50%, #18633F 0%, #2f8e60 45%, #cae872 90%, #fcec88 100%);
  border: 1px solid #10482d;
  border-bottom: 6px solid #0a331f;
  color: white;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.35), 0 6px 12px rgba(0, 0, 0, 0.2);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.25);
}

.landing-link--orange {
  background: radial-gradient(ellipse 130% 120% at 50% 50%, #F38E26 0%, #fbab52 45%, #ffd28c 90%, #fcec88 100%);
  border: 1px solid #d17518;
  border-bottom: 6px solid #b3610e;
  color: white;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.35), 0 6px 12px rgba(0, 0, 0, 0.2);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.25);
}

.link-icon,
.link-label {
  position: relative;
  z-index: 1;
}

.link-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.link-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.link-custom-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.link-label {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

@media (min-width: 768px) {
  .landing-page {
    padding: 24px;
  }

  .landing-card {
    width: min(100%, 500px);
    padding: 32px 40px;
    gap: 20px;
  }

  .hero-header {
    margin-bottom: 18px;
  }

  .brand-logo {
    width: 120px;
    height: 90px;
    justify-content: center;  /* Ensure this property is set correctly for mobile */
  }

  .divider {
    margin: 20px 18px;
  }

  .link-list {
    gap: 16px;
  }

  .landing-link {
    padding: 14px 24px;
  }
}

@media (min-width: 1024px) {
  .landing-page {
    padding: 32px;
  }

  .landing-card {
    width: min(100%, 520px);
  }
}

@media (max-width: 767px) {
  .landing-page {
    align-items: start;
  }

  .landing-orb {
    opacity: 0.2;
  }

  .landing-mesh {
    opacity: 0.4;
  }
}

@media (max-width: 480px) {
  .landing-page {
    padding: 24px 16px;
  }

  .landing-card {
    width: min(100%, 420px);
    padding: 24px 20px;
  }

  .brand-logo {
    width: 126px;
    height: 96px;
  }

  .brand-title {
    font-size: 1.55rem;
  }

  .brand-subtitle {
    font-size: 0.84rem;
    letter-spacing: 0.12em;
  }

  .landing-link {
    padding: 12px 16px;
    gap: 12px;
    min-height: 58px;
  }

  .link-icon {
    width: 38px;
    height: 38px;
  }

  .link-icon :deep(svg) {
    width: 28px;
    height: 28px;
  }

  .link-label {
    font-size: 0.94rem;
  }
}

@keyframes meshFloat {
  0%,
  100% {
    transform: translateY(0) rotate(var(--mesh-rotate, 0deg));
  }
  50% {
    transform: translateY(12px) rotate(var(--mesh-rotate, 0deg));
  }
}

@media (max-width: 360px) {
  .brand-title {
    font-size: 1.35rem;
  }

  .brand-subtitle {
    font-size: 0.78rem;
    letter-spacing: 0.08em;
  }

  .landing-link {
    padding-inline: 14px;
  }

  .link-label {
    font-size: 0.86rem;
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardLift {
  from {
    opacity: 0;
    transform: translateY(22px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes floatSlow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(16px);
  }
}

@keyframes drift {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(12px, -14px);
  }
}

@keyframes dustDrift {
  0% { transform: translate(0, 0); }
  50% { transform: translate(-30px, -30px); }
  100% { transform: translate(0, 0); }
}

@keyframes vintageFlicker {
  0% { opacity: 0.9; }
  10% { opacity: 0.85; }
  20% { opacity: 1; }
  30% { opacity: 0.9; }
  40% { opacity: 0.8; }
  50% { opacity: 0.95; }
  60% { opacity: 0.85; }
  70% { opacity: 1; }
  80% { opacity: 0.9; }
  90% { opacity: 0.8; }
  100% { opacity: 0.9; }
}

@media (prefers-reduced-motion: reduce) {
  .landing-card,
  .brand-block,
  .divider,
  .link-list,
  .landing-backdrop,
  .landing-orb {
    animation: none;
  }

  .landing-link,
  .landing-link::before {
    transition: none;
  }
}
</style>