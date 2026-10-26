<template><div class="space-y-6"><CPageHeader title="Simulación de pago" description="Este formulario pertenece a la demo del template." back-to="/portal" /><p v-if="error" role="alert" class="operation-error">{{ error }}</p><CCard v-if="payment" class="space-y-5"><h2>Sin cobro real</h2><p>No ingreses datos de tarjeta. Esta simulación registra un movimiento de ejemplo para que puedas probar el portal y sus comprobantes.</p><p>Reserva #{{ payment.reservation_id }} · {{ payment.amount }} {{ payment.currency }}</p><p>Estado: {{ states[payment.status] || 'Estado desconocido' }}</p><CButton v-if="payment.provider==='demo' && payment.status==='pending'" :loading="busy" @click="confirm">Simular pago aprobado</CButton><NuxtLink :to="`/portal/reservations/${payment.reservation_id}`" class="block underline">Volver a mi reserva</NuxtLink></CCard></div></template>
<script setup lang="ts">
import {ONLINE_PAYMENT_STATUS_LABELS} from '~/utils/constants'
import {useApiClient} from '~/services/api'
import type {ApiResponse} from '~/types'
import type {OnlinePayment} from '~/types/guestServices'
definePageMeta({layout:'guest',middleware:'auth'})
const api=useApiClient(),route=useRoute(),payment=ref<OnlinePayment>(),busy=ref(false),error=ref('')
const states=ONLINE_PAYMENT_STATUS_LABELS
const run=async(fn:()=>Promise<void>)=>{busy.value=true;error.value='';try{await fn()}catch(e){error.value=(e as {data?:{message?:string}}).data?.message||'No se pudo consultar el pago'}finally{busy.value=false}}
const load=async()=>{payment.value=(await api.request<ApiResponse<OnlinePayment>>(`/portal/online-payments/${route.params.id}`)).data}
const confirm=()=>run(async()=>{await api.request(`/portal/online-payments/${route.params.id}/demo-confirm`,{method:'POST',retry:0});await load()})
onMounted(()=>run(load))
</script>
