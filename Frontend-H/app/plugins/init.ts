export default defineNuxtPlugin(async () => {
  await useAuthStore().restoreSession();
});
