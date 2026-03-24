<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="#f59e0b" />
    <NuxtPage />
  </div>
</template>

<style>
@font-face {
  font-family: 'FS Magistral';
  src: url('/FS%20MAGISTRAL-BOLD.TTF') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  --app-font-family: 'FS Magistral', 'Trebuchet MS', 'Segoe UI', sans-serif;
}

body {
  font-family: var(--app-font-family);
}
</style>
