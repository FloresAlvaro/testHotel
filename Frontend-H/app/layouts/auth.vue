<template>
  <main class="auth-layout">
    <section class="auth-introduction" aria-labelledby="auth-introduction-title">
      <NuxtLink to="/auth/login" class="auth-brand"><span>r.</span>roomly</NuxtLink>
      <div class="auth-story"><p class="auth-kicker">UN ESPACIO PARA TU HOTEL</p><h1 id="auth-introduction-title">Menos tareas.<br>Más hospitalidad.</h1><p>Reservas, huéspedes y operación.<br>Todo lo que necesitas, en su lugar.</p><div class="auth-architecture" aria-hidden="true"><div class="architecture-tower"><span v-for="window in 9" :key="window" /></div><div class="architecture-wing"><span v-for="window in 6" :key="window" /></div></div></div>
      <p class="auth-brand-caption">Hecho para recibir mejor.</p>
    </section>
    <section class="auth-access" aria-label="Acceso al sistema"><button class="icon-button auth-theme" :aria-label="uiStore.theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'" @click="uiStore.toggleTheme"><Icon :name="uiStore.theme === 'dark' ? 'system-uicons:sun' : 'system-uicons:moon'" /></button><div class="auth-access-content"><slot /></div><footer class="auth-access-footer">Roomly · Huéspedes y equipo del hotel</footer></section>
  </main>
</template>
<script setup lang="ts">
const uiStore = useUiStore();
</script>
<style scoped>
.auth-layout { display:grid; grid-template-columns:.95fr 1.05fr; min-height:100dvh; color:var(--text-primary); }
.auth-introduction { background:var(--surface-subtle); padding:44px clamp(30px,5vw,78px); display:flex; flex-direction:column; border-right:1px solid var(--border-color); }
.auth-brand { display:inline-flex; align-items:center; width:fit-content; gap:10px; color:var(--text-primary); font-size:25px; font-weight:650; letter-spacing:-1px; text-decoration:none; }
.auth-brand > span { display:grid; place-items:center; width:33px; height:36px; background:#252a36; color:white; font-size:27px; border-radius:9px; }
.auth-story { margin:auto 0; padding:65px 0 40px; }
.auth-kicker { color:var(--text-tertiary); font-size:10px; letter-spacing:1.5px; margin-bottom:22px; font-weight:500; }
.auth-story h1 { font-size:clamp(36px,4vw,54px); line-height:1.1; font-weight:550; letter-spacing:-2.5px; margin:0 0 22px; }
.auth-story > p:last-of-type { font-size:14px; line-height:1.8; color:var(--text-secondary); }
.auth-brand-caption { margin:0; color:var(--text-tertiary); font-size:11px; }
.auth-access { display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; background:var(--bg-secondary); padding:72px 32px; }
.auth-theme { position:absolute; top:30px; right:32px; }
.auth-access-content { width:100%; max-width:350px; padding-block:40px; }
.auth-access-footer { position:absolute; bottom:30px; font-size:10px; color:var(--text-tertiary); }
.auth-architecture { display:flex; align-items:flex-end; height:160px; margin-top:44px; max-width:350px; opacity:.75; border-bottom:1px solid var(--border-color); }
.architecture-tower { display:grid; grid-template-columns:repeat(3,1fr); gap:13px; padding:22px; width:146px; height:155px; border:1px solid var(--border-color); background:var(--bg-secondary); border-radius:50px 50px 0 0; }
.architecture-wing { display:grid; grid-template-columns:repeat(3,1fr); gap:13px; padding:24px; width:145px; height:103px; border:1px solid var(--border-color); border-left:0; background:var(--accent-soft); border-radius:0 12px 0 0; }
.architecture-tower span,.architecture-wing span { background:#bac0e6; border-radius:8px 8px 0 0; width:15px; height:20px; }
.architecture-tower span:nth-child(2n) { background:#d5d8e9; }
@media(max-width:760px) { .auth-layout { display:flex; flex-direction:column; } .auth-introduction { border-right:0; border-bottom:1px solid var(--border-color); padding:22px 24px; background:var(--bg-secondary); } .auth-story,.auth-brand-caption { display:none; } .auth-access { flex:1; justify-content:flex-start; padding:50px 24px 80px; min-height:calc(100dvh - 81px); } .auth-theme { top:16px; right:18px; } .auth-access-content { padding-block:30px; max-width:390px; } }
</style>
