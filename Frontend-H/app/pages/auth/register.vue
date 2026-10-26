<template>
  <section class="space-y-5" aria-labelledby="access-title">
    <Icon name="system-uicons:lock" size="36" class="access-icon" />
    <h1 id="access-title" class="text-2xl font-semibold">Solicita tu acceso</h1>
    <p class="text-slate-600 dark:text-slate-300">El hotel activa las cuentas de huéspedes y del equipo. Si ya tienes una reserva, contacta con recepción para solicitar acceso a tus estancias y comprobantes.</p>
    <div v-if="contact" class="space-y-3"><p>{{ contact.hotel_name }}</p><a v-if="phoneLink" :href="phoneLink" class="button-link block">Llamar a recepción: {{ contact.phone }}</a><a v-if="emailLink" :href="emailLink" class="button-link block">Escribir a recepción: {{ contact.email }}</a><p v-if="!phoneLink && !emailLink">El hotel aún no publicó un canal de contacto. Solicita ayuda en recepción.</p></div>
    <p v-if="contactError" role="alert">No se pudo cargar el contacto. <button class="underline" @click="loadContact">Reintentar</button></p>
    <NuxtLink to="/auth/login" class="button-link">Volver al inicio de sesión</NuxtLink>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'auth' });
const config=useRuntimeConfig(),contact=ref<{hotel_name:string;phone:string;email:string}|null>(null),contactError=ref(false)
const phoneLink=computed(()=>{const phone=contact.value?.phone.replace(/[^+0-9]/g,'');return phone?`tel:${phone}`:undefined})
const emailLink=computed(()=>contact.value?.email&&/^[^\s@]+@[^\s@]+$/.test(contact.value.email)?`mailto:${encodeURIComponent(contact.value.email)}`:undefined)
const loadContact=async()=>{contactError.value=false;try{contact.value=(await $fetch<{data:typeof contact.value}>(`${config.public.apiBase}/hotel/contact`,{retry:0})).data}catch{contactError.value=true}}
onMounted(loadContact)
</script>
