<script setup lang="ts">
import type { LandingConfig, LandingLanguageCopy, LandingLink, LanguageCode } from '~/shared/landing';
import { createDefaultLandingConfig, createLink, iconOptions, languageOptions, toneOptions } from '~/shared/landing';
import { computed, ref, reactive, watch } from 'vue';
import LandingIcon from '~/components/LandingIcon.vue';

const message = ref('');
const errorMessage = ref('');
const saving = ref(false);
const uploading = ref(false);
const form = reactive<LandingConfig>(createDefaultLandingConfig());
const translationLanguages = languageOptions;
const languageUploading = reactive<Record<LanguageCode, boolean>>(
  translationLanguages.reduce((acc, language) => {
    acc[language.code] = false;
    return acc;
  }, {} as Record<LanguageCode, boolean>),
);
const activeLanguage = ref<LanguageCode>('ja');

function cloneTranslations(source?: Record<LanguageCode, LandingLanguageCopy>): Record<LanguageCode, LandingLanguageCopy> {
  const base = source ? JSON.parse(JSON.stringify(source)) : createDefaultLandingConfig().translations;
  return base;
}

function cloneLanguageFlags(source?: Record<LanguageCode, string>): Record<LanguageCode, string> {
  const defaults = translationLanguages.reduce((acc, language) => {
    acc[language.code] = language.flag;
    return acc;
  }, {} as Record<LanguageCode, string>);

  translationLanguages.forEach((language) => {
    const candidate = source?.[language.code];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      defaults[language.code] = candidate.trim();
    }
  });

  return defaults;
}

function ensureTranslationsForLinks(links: LandingLink[]) {
  translationLanguages.forEach((language) => {
    if (!form.translations[language.code]) {
      form.translations[language.code] = {
        greenTitle: form.greenTitle,
        orangeSubtitle: form.orangeSubtitle,
        linkLabels: {},
      };
    }

    const linkLabels = form.translations[language.code].linkLabels;
    if (!linkLabels) {
      form.translations[language.code].linkLabels = {};
    }

    links.forEach((link) => {
      linkLabels[link.id] = linkLabels[link.id] || link.label;
    });
  });
}

const activeLanguageLabel = computed(() => translationLanguages.find((language) => language.code === activeLanguage.value)?.label ?? '');

function setActiveLanguage(code: LanguageCode) {
  activeLanguage.value = code;
}

const { data } = await useAsyncData<LandingConfig>('admin-landing-config', () => $fetch('/api/landing-config'), {
  default: () => createDefaultLandingConfig(),
});

watch(
  data,
  (value) => {
    const source = value || createDefaultLandingConfig();

    form.logoUrl = source.logoUrl;
    form.greenTitle = source.greenTitle;
    form.orangeSubtitle = source.orangeSubtitle;
    form.links = source.links.map((link) => createLink(link));
    form.translations = cloneTranslations(source.translations);
    form.languageFlags = cloneLanguageFlags(source.languageFlags);
    ensureTranslationsForLinks(form.links);
  },
  { immediate: true },
);

function resetNotices() {
  message.value = '';
  errorMessage.value = '';
}

function addLink() {
  const link = createLink();
  form.links.push(link);
  ensureTranslationsForLinks([link]);
}

function removeLink(id: string) {
  form.links = form.links.filter((link) => link.id !== id);
  translationLanguages.forEach((language) => {
    form.translations[language.code]?.linkLabels && delete form.translations[language.code].linkLabels[id];
  });
}

async function saveConfig() {
  resetNotices();
  saving.value = true;

  try {
    const saved = await $fetch<LandingConfig>('/api/admin/landing-config', {
      method: 'PUT',
      body: {
        logoUrl: form.logoUrl,
        greenTitle: form.greenTitle,
        orangeSubtitle: form.orangeSubtitle,
        links: form.links,
        translations: form.translations,
        languageFlags: form.languageFlags,
      },
    });

    form.logoUrl = saved.logoUrl;
    form.greenTitle = saved.greenTitle;
    form.orangeSubtitle = saved.orangeSubtitle;
    form.links = saved.links.map((link) => createLink(link));
    form.translations = cloneTranslations(saved.translations);
    form.languageFlags = cloneLanguageFlags(saved.languageFlags);
    data.value = saved;
    message.value = 'Đã lưu cấu hình trang thành công.';
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Không thể lưu cấu hình, vui lòng thử lại.';
  }
  finally {
    saving.value = false;
  }
}

async function uploadLogo(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  resetNotices();
  uploading.value = true;

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Không thể đọc file logo.'));
      reader.readAsDataURL(file);
    });

    const response = await $fetch<{ logoUrl: string }>('/api/admin/logo', {
      method: 'POST',
      body: {
        dataUrl,
        previousLogoUrl: form.logoUrl,
      },
    });

    form.logoUrl = response.logoUrl;
    message.value = 'Đã tải logo lên máy chủ. Nhấn "Lưu cấu hình" để áp dụng cập nhật.';
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Tải logo thất bại.';
  }
  finally {
    uploading.value = false;
    input.value = '';
  }
}

async function uploadFlag(link: LandingLink, flagKey: 'icon' | 'flag1' | 'flag2', event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  resetNotices();

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Không thể đọc file cờ.'));
      reader.readAsDataURL(file);
    });

    const response = await $fetch<{ fileUrl: string }>('/api/admin/flag', {
      method: 'POST',
      body: {
        dataUrl,
        previousUrl: link[flagKey],
      },
    });

    link[flagKey] = response.fileUrl;
    message.value = 'Đã tải cờ lên máy chủ. Nhấn "Lưu cấu hình" để áp dụng cập nhật.';
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Tải cờ thất bại.';
  }
  finally {
    input.value = '';
  }
}

function isUploadedLanguageFlag(value: string | undefined): boolean {
  return typeof value === 'string' && (value.startsWith('/') || value.startsWith('http'));
}

async function uploadLanguageFlag(languageCode: LanguageCode, event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  resetNotices();
  languageUploading[languageCode] = true;

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Không thể đọc file cờ ngôn ngữ.'));
      reader.readAsDataURL(file);
    });

    const response = await $fetch<{ fileUrl: string }>('/api/admin/flag', {
      method: 'POST',
      body: {
        dataUrl,
        previousUrl: form.languageFlags[languageCode],
      },
    });

    form.languageFlags[languageCode] = response.fileUrl;
    message.value = 'Đã tải cờ ngôn ngữ lên máy chủ. Nhấn "Lưu cấu hình" để áp dụng.';
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Tải cờ ngôn ngữ thất bại.';
  }
  finally {
    languageUploading[languageCode] = false;
    input.value = '';
  }
}

useSeoMeta({
  title: 'Quản trị trang chủ',
  description: 'Trang quản trị nội dung của hệ sinh thái Sunshine',
});
</script>

<template>
  <main class="admin-page">
    <section class="admin-shell">
      <div class="admin-glow admin-glow--left"></div>
      <div class="admin-glow admin-glow--right"></div>
      <header class="admin-header">
        <div class="header-text">
          <p class="eyebrow">Bảng Điều Khiển</p>
          <h1>Quản lý giao diện trang chủ</h1>
          <p class="lead">Thiết lập logo, tiêu đề và các nút liên kết hiển thị trên trang người dùng.</p>
        </div>
        <div class="header-actions">
           <button class="save-button" type="button" :disabled="saving" @click="saveConfig">
              <span class="btn-icon">💾</span> {{ saving ? 'Đang lưu...' : 'Lưu cấu hình' }}
            </button>
           <a class="preview-link" href="/" target="_blank" rel="noopener noreferrer">
              <span class="btn-icon">👁️</span> Xem trang chủ
           </a>
        </div>
      </header>

      <div class="status-row" v-if="message || errorMessage">
        <div v-if="message" class="status status--ok">✅ {{ message }}</div>
        <div v-if="errorMessage" class="status status--error">❌ {{ errorMessage }}</div>
      </div>

      <div class="admin-grid">
        <section class="panel">
          <div class="panel-header">
            <h2>Thiết lập chung</h2>
            <p>Tùy chỉnh Logo và các câu tiêu đề chính trên trang.</p>
          </div>

          <div class="panel-body">
            <label class="field-group">
              <span class="field-label">Logo thương hiệu</span>
              <div class="logo-upload-box">
                <div class="logo-preview" v-if="form.logoUrl">
                  <img :src="form.logoUrl" alt="Logo preview" />
                  <div class="logo-actions">
                    <label class="upload-button outline-btn" for="logo-upload">
                       {{ uploading ? 'Đang tải...' : 'Chỉnh sửa logo' }}
                    </label>
                  </div>
                </div>
                <div v-else class="logo-empty-state">
                  <span class="empty-icon">🖼️</span>
                  <p>Chưa có logo được tải lên</p>
                  <label class="upload-button primary-btn" for="logo-upload">
                    {{ uploading ? 'Đang tải...' : 'Tải thiết kế lên' }}
                  </label>
                </div>
                <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" :disabled="uploading" @change="uploadLogo" />
                <p class="hint">Hỗ trợ định dạng: PNG, JPG, WEBP, SVG. Dung lượng tối đa: 4MB.</p>
              </div>
            </label>

            <div class="divider"></div>

            <label class="field-group">
              <span class="field-label">Tiêu đề chính (Xanh)</span>
              <input v-model="form.greenTitle" type="text" maxlength="80" placeholder="Ví dụ: HỆ SINH THÁI SUNSHINE" />
            </label>

            <label class="field-group">
              <span class="field-label">Phụ đề (Cam)</span>
              <input v-model="form.orangeSubtitle" type="text" maxlength="80" placeholder="Ví dụ: SUNSHINE ECOSYSTEM" />
            </label>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header flex-between">
             <div>
               <h2>Danh sách liên kết</h2>
               <p>Quản lý các nút bấm dẫn tới trang đích.</p>
             </div>
             <button class="secondary-button" type="button" @click="addLink">
               <span class="btn-icon">➕</span> Thêm liên kết
             </button>
          </div>

          <div class="link-editor-list">
            <article v-for="(link, index) in form.links" :key="link.id" class="link-editor-card">
              <div class="link-editor-top">
                <div class="link-drag-handle">
                  <span class="drag-icon">⋮⋮</span>
                  <h3>Liên kết #{{ index + 1 }}</h3>
                </div>
                <button class="remove-button" type="button" @click="removeLink(link.id)" title="Xóa liên kết này">
                  <span class="btn-icon">🗑️</span> Xóa
                </button>
              </div>

              <div class="field-row">
                <label class="field-group flex-1">
                  <span class="field-label">Tên nút hiển thị</span>
                  <input v-model="link.label" type="text" maxlength="80" placeholder="Ví dụ: Official Website" />
                </label>
              </div>
              
              <div class="field-row">
                <label class="field-group flex-1">
                  <span class="field-label">Đường dẫn (URL)</span>
                  <input v-model="link.url" type="text" maxlength="500" placeholder="https://..." />
                </label>
              </div>

              <div class="field-grid">
                <label class="field-group">
                  <span class="field-label">Biểu tượng (Icon)</span>
                  <div class="flag-input-row">
                    <input v-model="link.icon" type="text" maxlength="200" list="icon-datalist" placeholder="Chọn hoặc tải ảnh lên" />
                    <datalist id="icon-datalist">
                      <option v-for="option in iconOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </datalist>
                    <label :for="`icon-upload-${index}`" class="flag-upload-btn" title="Tải ảnh icon">
                      📁
                    </label>
                    <input :id="`icon-upload-${index}`" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="sr-only" @change="e => uploadFlag(link, 'icon', e)" />
                  </div>
                </label>

                <label class="field-group">
                  <span class="field-label">Màu sắc</span>
                  <div class="select-wrapper">
                    <select v-model="link.tone">
                      <option v-for="option in toneOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </div>
                </label>
              </div>
              
              <div class="field-grid">
                <label class="field-group">
                  <span class="field-label">Cờ 1 (Tùy chọn)</span>
                  <div class="flag-input-row">
                    <input v-model="link.flag1" type="text" maxlength="200" placeholder="Emoji hoặc tải ảnh cờ lên" />
                    <label :for="`flag1-upload-${index}`" class="flag-upload-btn" title="Tải ảnh cờ">
                      📁
                    </label>
                    <input :id="`flag1-upload-${index}`" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="sr-only" @change="e => uploadFlag(link, 'flag1', e)" />
                  </div>
                </label>

                <label class="field-group">
                  <span class="field-label">Cờ 2 (Tùy chọn)</span>
                  <div class="flag-input-row">
                    <input v-model="link.flag2" type="text" maxlength="200" placeholder="Emoji hoặc tải ảnh cờ lên" />
                    <label :for="`flag2-upload-${index}`" class="flag-upload-btn" title="Tải ảnh cờ">
                      📁
                    </label>
                    <input :id="`flag2-upload-${index}`" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="sr-only" @change="e => uploadFlag(link, 'flag2', e)" />
                  </div>
                </label>
              </div>

                <div class="mini-preview-wrap">
                <p class="preview-label">Xem trước nút:</p>
                <div class="mini-preview" :class="link.tone === 'orange' ? 'mini-preview--orange' : 'mini-preview--green'">
                  <span class="mini-preview__icon">
                    <img v-if="link.icon && (link.icon.startsWith('/') || link.icon.startsWith('http'))" :src="link.icon" class="mini-custom-icon" alt="" />
                    <LandingIcon v-else :name="link.icon" />
                  </span>
                  
                  <span class="mini-flags-group" v-if="link.flag1 || link.flag2">
                    <template v-if="link.flag1">
                      <img v-if="link.flag1.startsWith('/') || link.flag1.startsWith('http')" :src="link.flag1" class="mini-flag-img" alt="" />
                      <span v-else class="mini-flag">{{ link.flag1 }}</span>
                    </template>
                    
                    <span v-if="link.flag1 && link.flag2" class="mini-separator">|</span>
                    
                    <template v-if="link.flag2">
                      <img v-if="link.flag2.startsWith('/') || link.flag2.startsWith('http')" :src="link.flag2" class="mini-flag-img" alt="" />
                      <span v-else class="mini-flag">{{ link.flag2 }}</span>
                    </template>
                  </span>

                  <span>{{ link.label || 'Liên kết mới' }}</span>
                </div>
              </div>
            </article>
            
            <div v-if="form.links.length === 0" class="empty-links-state">
              <span class="empty-icon">🔗</span>
              <p>Chưa có liên kết nào được tạo.</p>
              <button class="secondary-button" type="button" @click="addLink">Thêm liên kết đầu tiên</button>
            </div>
          </div>
        </section>

        <section class="panel translations-panel">
          <div class="panel-header flex-between">
            <div>
              <h2>Đa ngôn ngữ</h2>
              <p>Chỉnh nội dung hiển thị theo từng ngôn ngữ hiện tại.</p>
            </div>
            <div class="language-pill-group">
              <div
                v-for="language in translationLanguages"
                :key="language.code"
                class="language-pill-slot"
              >
                <div class="language-pill-actions">
                  <button
                    type="button"
                    class="language-pill"
                    :class="{ 'language-pill--active': language.code === activeLanguage }"
                    @click="setActiveLanguage(language.code)"
                    :aria-pressed="language.code === activeLanguage"
                  >
                    <span class="pill-flag">
                      <img
                        v-if="isUploadedLanguageFlag(form.languageFlags[language.code])"
                        :src="form.languageFlags[language.code]"
                        alt=""
                      />
                      <span v-else>{{ form.languageFlags[language.code] || language.flag }}</span>
                    </span>
                    <span class="pill-label">{{ language.label }}</span>
                  </button>
                  <label
                    :for="`language-flag-upload-${language.code}`"
                    class="language-pill-upload"
                    :class="{ 'language-pill-upload--loading': languageUploading[language.code] }"
                    :aria-busy="languageUploading[language.code]"
                    :title="`Tải cờ ${language.label}`"
                  >
                    <span class="upload-icon">{{ languageUploading[language.code] ? '⌛' : '⬆️' }}</span>
                    <span class="upload-text">Cờ</span>
                  </label>
                  <input
                    :id="`language-flag-upload-${language.code}`"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    class="sr-only"
                    @change="e => uploadLanguageFlag(language.code, e)"
                  />
                </div>
                <label class="language-flag-field">
                  <span class="language-flag-label">Đường dẫn hoặc emoji</span>
                  <input
                    v-model="form.languageFlags[language.code]"
                    type="text"
                    maxlength="200"
                    class="language-flag-input"
                    placeholder="Ví dụ: 🇻🇳 hoặc https://..."
                  />
                </label>
              </div>
            </div>
          </div>

          <div class="panel-body">
            <div class="field-grid translation-hero-grid">
              <label class="field-group">
                <span class="field-label">Tiêu đề chính ({{ activeLanguageLabel }})</span>
                <input v-model="form.translations[activeLanguage].greenTitle" type="text" maxlength="80" :placeholder="`Ví dụ: ${activeLanguageLabel}`" />
              </label>
              <label class="field-group">
                <span class="field-label">Phụ đề ({{ activeLanguageLabel }})</span>
                <input v-model="form.translations[activeLanguage].orangeSubtitle" type="text" maxlength="80" placeholder="SUNSHINE ECOSYSTEM" />
              </label>
            </div>

            <div class="translation-links-grid">
              <label v-for="link in form.links" :key="link.id" class="field-group">
                <span class="field-label">{{ link.label || 'Liên kết mới' }}</span>
                <input v-model="form.translations[activeLanguage].linkLabels[link.id]" type="text" maxlength="80" :placeholder="`Nhập nhãn ${activeLanguageLabel}`" />
              </label>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: var(--app-font-family);
  background:
    radial-gradient(circle at 10% 10%, rgba(245, 158, 11, 0.14), transparent 32%),
    radial-gradient(circle at 90% 20%, rgba(34, 197, 94, 0.12), transparent 30%),
    linear-gradient(170deg, #f8f6f0 0%, #eef6ef 60%, #f0f6f7 100%);
  color: #21372a;
}

.admin-page {
  min-height: 100vh;
  padding: 32px 16px 52px;
}

.admin-shell {
  width: min(1240px, 100%);
  margin: 0 auto;
  position: relative;
}

.admin-glow {
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  filter: blur(8px);
  opacity: 0.35;
  pointer-events: none;
  animation: floatSlow 12s ease-in-out infinite;
}

.admin-glow--left {
  top: -60px;
  left: -80px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.5), rgba(245, 158, 11, 0));
}

.admin-glow--right {
  bottom: -80px;
  right: -70px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.5), rgba(34, 197, 94, 0));
  animation-direction: reverse;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: end;
  margin-bottom: 24px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.8rem;
  color: #cc7a15;
  font-weight: 700;
}

.admin-header h1 {
  margin: 0;
  font-size: clamp(2rem, 3.2vw, 3rem);
  color: #2d6a46;
  text-wrap: balance;
}

.lead {
  margin: 12px 0 0;
  color: #4f6356;
  max-width: 720px;
  line-height: 1.45;
}

.preview-link,
.save-button,
.secondary-button,
.remove-button,
.upload-button {
  border: 0;
  text-decoration: none;
  cursor: pointer;
  border-radius: 999px;
  font-weight: 700;
  transition: transform 0.22s ease, box-shadow 0.22s ease, opacity 0.22s ease;
}

.preview-link,
.save-button,
.upload-button {
  background: linear-gradient(135deg, #f6a824, #ee7a14);
  color: #fffdf8;
  box-shadow: 0 14px 24px rgba(240, 130, 24, 0.22);
}

.preview-link,
.save-button {
  padding: 14px 22px;
}

.save-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.secondary-button {
  padding: 12px 18px;
  background: #e4f2e6;
  color: #2d6a46;
}

.remove-button {
  padding: 8px 14px;
  background: #fff0ea;
  color: #b44627;
}

.preview-link:hover,
.save-button:hover,
.secondary-button:hover,
.remove-button:hover,
.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 28px rgba(44, 71, 52, 0.16);
}

.admin-grid {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  position: relative;
  z-index: 1;
}

.panel {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(220, 233, 221, 0.95);
  border-radius: 28px;
  padding: 22px;
  box-shadow: 0 20px 52px rgba(33, 55, 42, 0.1);
  position: relative;
  overflow: hidden;
  animation: fadeUp 0.6s ease both;
}

.panel::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.6), transparent 40%);
  opacity: 0.6;
  pointer-events: none;
}

.panel-title-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
  margin-bottom: 18px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.panel h2,
.link-editor-card h3 {
  margin: 0;
  color: #2d6a46;
  letter-spacing: 0.01em;
}

.panel p {
  margin: 6px 0 0;
  color: #647668;
}

.status-row {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.translations-panel .panel-body {
  padding-top: 8px;
}

.language-pill-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.language-pill-slot {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 180px;
}

.language-pill-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.language-flag-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.language-flag-label {
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #4f6356;
}

.language-flag-input {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 6px 10px;
  font-size: 0.9rem;
  width: 100%;
  background: rgba(255, 255, 255, 0.85);
  color: #1f2c1f;
}

.language-flag-input:focus {
  outline: 2px solid #22c55e;
  outline-offset: 2px;
}

.language-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 6px 10px;
  border: 1px solid rgba(15, 23, 42, 0.2);
  background: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.language-pill--active {
  background: #e9f7ec;
  border-color: #22c55e;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.28);
}

.language-pill .pill-flag {
  font-size: 1.1rem;
}

.language-pill .pill-flag img {
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 999px;
  object-fit: cover;
}

.language-pill-upload {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 14px;
  border: 1px dashed rgba(34, 197, 94, 0.5);
  background: rgba(255, 255, 255, 0.65);
  gap: 2px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #2d6a46;
  cursor: pointer;
  transition: border-color 0.22s ease, background 0.22s ease;
}

.language-pill-upload:hover {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}

.language-pill-upload--loading {
  opacity: 0.7;
  cursor: wait;
}

.language-pill-upload .upload-icon {
  font-size: 0.95rem;
}

.language-pill-upload .upload-text {
  font-size: 0.65rem;
  letter-spacing: 0.05em;
}

.translation-hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.translation-links-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.status {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  font-weight: 600;
}

.status--ok {
  background: #ebf8ef;
  color: #2d6a46;
}

.status--error {
  background: #fff1ec;
  color: #b44627;
}

.field-group {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.field-group span {
  font-size: 0.94rem;
  font-weight: 700;
  color: #395443;
  line-height: 1.3;
}

input,
select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d6e5d8;
  border-radius: 16px;
  padding: 14px 16px;
  font: inherit;
  background: #fcfdfb;
  color: #21372a;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus,
select:focus {
  outline: 2px solid rgba(245, 163, 21, 0.25);
  border-color: #f5a315;
  box-shadow: 0 0 0 4px rgba(245, 163, 21, 0.12);
}

.logo-upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

#logo-upload {
  display: none;
}

.upload-button {
  padding: 12px 18px;
}

.hint {
  color: #6b7a70;
  font-size: 0.9rem;
  line-height: 1.4;
}

.logo-preview {
  border-radius: 22px;
  background: linear-gradient(180deg, #fffdf9, #eef6ef);
  border: 1px solid #e6efe4;
  display: grid;
  place-items: center;
  min-height: 160px;
  margin-bottom: 16px;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.logo-preview img {
  max-width: 100%;
  max-height: 140px;
  object-fit: contain;
}

.link-editor-list {
  display: grid;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.link-editor-card {
  padding: 18px;
  border-radius: 22px;
  background: linear-gradient(180deg, #fcfdfb, #f2f8f3);
  border: 1px solid #e1ece2;
  box-shadow: 0 14px 26px rgba(33, 55, 42, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.link-editor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(33, 55, 42, 0.12);
}

.link-editor-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.mini-preview {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 999px;
  color: #fffefb;
  font-weight: 700;
  overflow-wrap: anywhere;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
}

.mini-preview--green {
  background: linear-gradient(180deg, #86c95d 0%, #4baf54 100%);
}

.mini-preview--orange {
  background: linear-gradient(180deg, #ffb01c 0%, #ff8f00 100%);
}

.mini-preview__icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.18);
  overflow: hidden;
}

.mini-custom-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.mini-preview__icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.mini-flags-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.mini-flag {
  font-size: 1.25rem;
  line-height: 1;
}

.mini-separator {
  opacity: 0.6;
  margin: 0 3px;
  font-weight: 300;
}

.mini-flag-img {
  width: 28px;
  height: 20px;
  border-radius: 4px;
  object-fit: cover;
}

.flag-input-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.flag-input-row input[type="text"] {
  flex: 1;
}

.flag-upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  background: #f0fdf4;
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.2rem;
}

.flag-upload-btn:hover {
  background: #dcfce7;
  border-color: #4ade80;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (min-width: 768px) and (max-width: 1100px) {
  .admin-page {
    padding: 24px 20px 40px;
  }

  .admin-grid {
    grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
    gap: 18px;
  }

  .panel {
    padding: 20px;
  }
}

@media (max-width: 920px) {
  .admin-header,
  .panel-title-row,
  .link-editor-top {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-grid {
    grid-template-columns: 1fr;
  }

  .preview-link,
  .save-button,
  .secondary-button {
    align-self: flex-start;
  }
}

@media (max-width: 640px) {
  .admin-page {
    padding: 18px 10px 28px;
  }

  .admin-header {
    gap: 16px;
    margin-bottom: 18px;
  }

  .admin-header h1 {
    font-size: 1.65rem;
  }

  .lead {
    font-size: 0.94rem;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 18px;
    border-radius: 22px;
  }

  .preview-link,
  .save-button,
  .secondary-button,
  .upload-button,
  .remove-button {
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    justify-content: center;
  }

  .logo-upload-row {
    align-items: stretch;
  }

  .link-editor-card {
    padding: 16px;
  }

  .mini-preview {
    padding: 12px;
    border-radius: 18px;
  }
}

@media (max-width: 420px) {
  .panel {
    padding: 14px;
    border-radius: 18px;
  }

  input,
  select {
    padding: 12px 14px;
    border-radius: 14px;
  }

  .status {
    padding: 10px 12px;
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

@keyframes floatSlow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(18px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-glow,
  .panel,
  .link-editor-card {
    animation: none;
  }

  .link-editor-card,
  .preview-link,
  .save-button,
  .secondary-button,
  .remove-button,
  .upload-button {
    transition: none;
  }
}
</style>