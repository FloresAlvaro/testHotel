<template>
  <section class="mx-auto w-full max-w-md space-y-4 p-6">
    <h1 class="text-2xl font-bold">Acceso por invitación</h1>
    <p>Solicita una invitación al administrador del hotel. Con el enlace podrás activar tu cuenta y elegir tu contraseña.</p>
    <NuxtLink to="/auth/login" class="underline">Volver al inicio de sesión</NuxtLink>
  </section>
</template>
<script setup lang="ts">definePageMeta({ layout: 'auth', middleware: 'auth' });</script>
