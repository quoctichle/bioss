<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>

<template>
  <svg v-if="name === 'shop'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 7V5a5 5 0 0 1 10 0v2h2a1 1 0 0 1 1 1l-1 9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3L4 8a1 1 0 0 1 1-1h2zm2 0h6V5a3 3 0 0 0-6 0v2zm0 5a1 1 0 0 0-2 0 5 5 0 0 0 10 0 1 1 0 1 0-2 0 3 3 0 0 1-6 0z" fill="currentColor"/>
  </svg>
  <svg v-else-if="name === 'chat'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3C6.477 3 2 6.91 2 11.733c0 2.557 1.263 4.857 3.278 6.461L4.5 22l4.164-2.062A12.06 12.06 0 0 0 12 20.467c5.523 0 10-3.91 10-8.734C22 6.91 17.523 3 12 3zm-4 9a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 8 12zm4 0a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 12 12zm4 0a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 16 12z" fill="currentColor"/>
  </svg>
  <svg v-else-if="name === 'flag'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 3a1 1 0 0 1 1 1v2h9.764c.828 0 1.31.94.827 1.613L15.4 10.5l2.191 2.887A1 1 0 0 1 16.764 15H7v5a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1z" fill="currentColor"/>
  </svg>
  <svg v-else-if="name === 'building'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 21V8a1 1 0 0 1 .684-.949l6-2A1 1 0 0 1 12 6v15H4zm10 0V4a1 1 0 0 1 1.447-.894l4 2A1 1 0 0 1 20 6v15h-6zM8 10H6v2h2v-2zm0 4H6v2h2v-2zm4-4h-2v2h2v-2zm0 4h-2v2h2v-2zm4-4h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="currentColor"/>
  </svg>
  <svg v-else-if="name === 'star'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 2.75 2.761 5.595 6.176.898-4.468 4.355 1.055 6.151L12 16.846l-5.524 2.903 1.055-6.151-4.468-4.355 6.176-.898L12 2.75z" fill="currentColor"/>
  </svg>
  <svg v-else-if="name === 'phone'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.62 2.93a1.5 1.5 0 0 1 1.67-.34l2.62 1.05a1.5 1.5 0 0 1 .9 1.62l-.36 2.88a1.5 1.5 0 0 1-1.1 1.25l-1.22.33a14.13 14.13 0 0 0 5.25 5.25l.33-1.22a1.5 1.5 0 0 1 1.25-1.1l2.88-.36a1.5 1.5 0 0 1 1.62.9l1.05 2.62a1.5 1.5 0 0 1-.34 1.67l-1.56 1.56a2.5 2.5 0 0 1-2.34.67c-3.32-.77-6.36-2.47-8.78-4.89-2.42-2.42-4.12-5.46-4.89-8.78a2.5 2.5 0 0 1 .67-2.34l1.56-1.56z" fill="currentColor"/>
  </svg>
  <svg v-else-if="name === 'spark'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2 14.35 8.65 21 11l-6.65 2.35L12 20l-2.35-6.65L3 11l6.65-2.35L12 2zm7-1 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15z" fill="currentColor"/>
  </svg>
  <svg v-else viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm6.93 9h-3.07a15.7 15.7 0 0 0-1.18-5.02A8.03 8.03 0 0 1 18.93 11zM12 4.07c1.2 1.47 2.11 3.84 2.39 6.93H9.61C9.89 7.91 10.8 5.54 12 4.07zM5.07 13h3.07c.13 1.79.55 3.5 1.18 5.02A8.03 8.03 0 0 1 5.07 13zM5.07 11a8.03 8.03 0 0 1 4.25-5.02A15.7 15.7 0 0 0 8.14 11H5.07zM12 19.93c-1.2-1.47-2.11-3.84-2.39-6.93h4.78c-.28 3.09-1.19 5.46-2.39 6.93zM14.68 18.02A15.7 15.7 0 0 0 15.86 13h3.07a8.03 8.03 0 0 1-4.25 5.02z" fill="currentColor"/>
  </svg>
</template>

<style scoped>
svg {
  width: 1.5rem;
  height: 1.5rem;
  display: block;
}
</style>