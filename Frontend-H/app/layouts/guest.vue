<template>
  <div class="guest-shell">
    <a class="skip-link" href="#guest-content">Ir al contenido</a>
    <header class="guest-header">
      <NuxtLink to="/portal" class="guest-brand"><span class="guest-mark">r.</span><span>{{ hotel.settings.value.hotel_name }}<small>Portal del huésped</small></span></NuxtLink>
      <nav aria-label="Navegación del huésped" class="guest-navigation"><NuxtLink to="/portal/book" class="guest-book-link">Nueva reserva</NuxtLink><NuxtLink to="/portal" :aria-current="route.path==='/portal'?'page':undefined">Mis estancias</NuxtLink><button class="icon-button" :aria-label="ui.theme==='dark'?'Activar tema claro':'Activar tema oscuro'" @click="ui.toggleTheme"><Icon :name="ui.theme==='dark'?'system-uicons:sun':'system-uicons:moon'" /></button><CButton variant="secondary" size="sm" @click="logout">Cerrar sesión</CButton></nav>
    </header>
    <main id="guest-content" class="guest-content" tabindex="-1"><slot /></main>
    <footer class="guest-footer"><p>{{ hotel.settings.value.hotel_name }} · {{ hotel.settings.value.city }}</p><p v-if="hotel.settings.value.phone">Recepción: {{ hotel.settings.value.phone }}</p></footer>
  </div>
</template>
<script setup lang="ts">
const hotel=useHotelSettings(),ui=useUiStore(),route=useRoute(),{logout}=useAuth()
onMounted(()=>hotel.load().catch(()=>ui.error('No se pudo cargar la información del hotel')))
useHead({title:'Mis estancias · Portal del huésped'})
</script>
<style scoped>
.guest-shell{min-height:100dvh;background:var(--bg-primary);color:var(--text-primary)}.guest-header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px max(24px,calc((100vw - 1080px)/2));background:var(--bg-secondary);border-bottom:1px solid var(--border-color)}.guest-brand{display:flex;gap:12px;align-items:center;font-size:15px;font-weight:600;text-decoration:none;color:var(--text-primary)}.guest-mark{display:grid;place-items:center;width:38px;height:42px;border-radius:11px;background:#535ed6;color:white;font-size:28px;letter-spacing:-2px}.guest-brand small{display:block;font-size:11px;color:var(--text-secondary);font-weight:400;margin-top:4px}.guest-navigation{display:flex;align-items:center;flex-wrap:wrap;gap:18px;font-size:12px}.guest-navigation .guest-book-link{color:#535ed6;font-weight:600}.guest-navigation a{color:var(--text-secondary);text-decoration:none}.guest-navigation a[aria-current]{color:#535ed6}.guest-content{width:min(1080px,100%);margin:auto;padding:44px 24px 64px}.guest-footer{width:min(1080px,100%);margin:auto;padding:24px;border-top:1px solid var(--border-color);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--text-secondary)}@media(max-width:640px){.guest-header{padding:18px;align-items:flex-start;flex-wrap:wrap;gap:18px}.guest-navigation{width:100%;justify-content:space-between}.guest-content{padding:28px 18px 40px}}@media print{.guest-header,.guest-footer{display:none}.guest-content{padding:0;width:100%}}
</style>
