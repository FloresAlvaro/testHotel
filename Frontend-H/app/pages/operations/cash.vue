<template>
 <div class="space-y-6">
  <CPageHeader title="Caja" description="Abre tu turno antes de completar o reembolsar pagos. El arqueo considera únicamente efectivo." />
  <p v-if="error" role="alert" class="operation-error">{{ error }}</p>
  <CCard v-if="!current"><form class="operation-form" @submit.prevent="open"><label>Fondo inicial <input v-model.number="opening" type="number" min="0" step="0.01" required></label><CButton :loading="busy" type="submit">Abrir mi turno</CButton></form></CCard>
  <CCard v-else><h2>Mi turno #{{ current.id }} · {{ current.currency }}</h2><div class="operation-stats"><span>Fondo: <strong>{{ money(current.opening_amount,current.currency) }}</strong></span><span>Efectivo esperado: <strong>{{ money(expected,current.currency) }}</strong></span></div><form class="operation-form" @submit.prevent="close"><label>Efectivo contado <input v-model.number="counted" type="number" min="0" step="0.01" required></label><label>Observaciones <input v-model="notes" maxlength="2000"></label><CButton :loading="busy" type="submit">Cerrar y guardar arqueo</CButton></form></CCard>
  <CCard><div class="operation-heading"><h2>Últimos 100 turnos</h2><CButton variant="secondary" :loading="busy" @click="load">Actualizar</CButton></div><div class="operation-scroll"><table class="operation-table"><thead><tr><th>Turno / persona</th><th>Apertura</th><th>Estado</th><th>Movimientos por medio</th><th>Arqueo</th></tr></thead><tbody><tr v-for="s in shifts" :key="s.id"><td>#{{ s.id }} · {{ s.user_name }}</td><td>{{ dateTime(s.opened_at) }}</td><td>{{ s.closed_at ? 'Cerrado' : 'Abierto' }}</td><td><div v-for="t in s.totals" :key="t.method">{{ methods[t.method] || t.method }}: {{ money(t.total,s.currency) }} ({{ t.movements }})</div><span v-if="!s.totals.length">Sin movimientos</span></td><td v-if="s.closed_at">Esperado {{ money(s.expected_amount || 0,s.currency) }}<br>Contado {{ money(s.counted_amount || 0,s.currency) }}<br>Diferencia {{ money(Number(s.counted_amount)-Number(s.expected_amount),s.currency) }}<div>{{ s.notes }}</div></td><td v-else>En curso</td></tr></tbody></table></div><p v-if="!shifts.length">Todavía no hay turnos.</p></CCard>
 </div>
</template>
<script setup lang="ts">
import type { CashShift } from '~/types/operations'
definePageMeta({middleware:'auth'})
const {get,post,run,error,busy}=useOperations(), {money,dateTime}=useHotelSettings(), auth=useAuthStore()
const shifts=ref<CashShift[]>([]), opening=ref(0), counted=ref(0), notes=ref('')
const methods:Record<string,string>={cash:'Efectivo',credit_card:'Tarjeta de crédito',debit_card:'Tarjeta de débito',transfer:'Transferencia',check:'Cheque'}
const current=computed(()=>shifts.value.find(s=>s.user_id===auth.user?.id&&!s.closed_at))
const expected=computed(()=>Number(current.value?.opening_amount||0)+Number(current.value?.totals.find(t=>t.method==='cash')?.total||0))
const load=()=>run(async()=>{shifts.value=(await get<CashShift[]>('cash-shifts')).data||[]})
const open=()=>run(async()=>{await post('cash-shifts',{opening_amount:opening.value});shifts.value=(await get<CashShift[]>('cash-shifts')).data||[]})
const close=()=>run(async()=>{if(!current.value)return;await post(`cash-shifts/${current.value.id}/close`,{counted_amount:counted.value,notes:notes.value});shifts.value=(await get<CashShift[]>('cash-shifts')).data||[];notes.value='';counted.value=0})
onMounted(load)
</script>
