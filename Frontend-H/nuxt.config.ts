// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/global.css"],
  runtimeConfig: {
    apiInternalBase:
      process.env.NUXT_API_INTERNAL_BASE || "http://localhost:3000/api",
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:3000/api",
    },
  },
  components: [{ path: "~/components", pathPrefix: false }],
  modules: ["@nuxt/eslint", "@pinia/nuxt", "@nuxt/ui", "@nuxt/image"],
  ui: {
    colorMode: false,
  },
  fonts: {
    families: [
      {
        name: "Alata",
        provider: "google",
        weights: [400],
        styles: ["normal"],
        preload: true,
      },
    ],
  },
  image: {
    domains: ["images.unsplash.com"],
    format: ["webp"],
    quality: 80,
  },
});
