<template>
	<main class="min-h-screen flex items-center justify-center p-6 text-center">
		<div class="max-w-lg">
			<p class="text-sm font-semibold uppercase tracking-widest text-slate-500">
				Error {{ error.statusCode }}
			</p>
			<h1 class="mt-3 text-3xl font-bold text-slate-900">
				{{ error.statusCode === 404 ? 'Página no encontrada' : 'No se pudo cargar la página' }}
			</h1>
			<p class="mt-3 text-slate-600">
				{{ error.statusMessage || 'Ocurrió un error inesperado.' }}
			</p>
			<button
				class="mt-6 rounded border border-slate-300 px-4 py-2 font-medium text-slate-800 hover:bg-slate-50"
				@click="handleError"
			>
				Volver al inicio
			</button>
		</div>
	</main>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps<{ error: NuxtError }>();

const handleError = () => clearError({ redirect: '/' });
</script>
