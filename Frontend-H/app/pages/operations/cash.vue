<template>
 <div class="space-y-6">
  <CPageHeader title="Caja" description="Abre tu turno antes de completar o reembolsar pagos. El arqueo considera únicamente efectivo." />
  <p v-if="error" role="alert" class="operation-error">{{ error }}</p>
  <CCard v-if="!busy && !error && !current"><form class="operation-form" @submit.prevent="open"><label>Fondo inicial <input v-model.number="opening" type="number" min="0" step="0.01" required></label><CButton :loading="busy" type="submit">Abrir mi turno</CButton></form></CCard>
  <CCard v-else-if="current"><h2>Mi turno #{{ current.id }} · {{ current.currency }}</h2><div class="operation-stats"><span>Fondo: <strong>{{ money(current.opening_amount,current.currency) }}</strong></span><span>Efectivo esperado: <strong>{{ money(expected,current.currency) }}</strong></span></div><form class="operation-form" @submit.prevent="reviewClose"><label>Efectivo contado ({{ current.currency }}) <input v-model.number="counted" type="number" min="0" step="0.01" required></label><label>Observaciones <input v-model="notes" maxlength="2000"></label><CButton :loading="busy" type="submit">Revisar cierre de caja</CButton></form></CCard>
  <CModal :is-open="reviewing" title="Revisar cierre de caja" @close="cancelReview">
    <div v-if="current" class="space-y-4">
      <p v-if="error" role="alert" class="operation-error">{{ error }}</p>
      <p>Turno #{{ current.id }} · {{ current.currency }}</p>
      <dl class="space-y-2"><div><dt>Efectivo esperado</dt><dd>{{ money(expected,current.currency) }}</dd></div><div><dt>Efectivo contado</dt><dd>{{ money(Number(counted),current.currency) }}</dd></div><div><dt>Diferencia</dt><dd>{{ money(difference,current.currency) }}</dd></div></dl>
      <p v-if="difference !== 0" role="alert">{{ difference < 0 ? 'Hay un faltante de efectivo.' : 'Hay un sobrante de efectivo.' }} Revisa el importe antes de guardar el arqueo.</p>
      <p v-else>El efectivo contado coincide con el esperado.</p>
      <p>Al confirmar se cerrará este turno y se guardará el arqueo.</p>
      <div class="flex flex-wrap gap-2"><CButton variant="secondary" :disabled="busy" @click="cancelReview">Volver a contar</CButton><CButton :loading="busy" @click="close">{{ difference !== 0 ? 'Confirmar cierre con diferencia' : 'Confirmar cierre' }}</CButton></div>
    </div>
  </CModal>
  <CCard><div class="operation-heading"><h2>Últimos 100 turnos</h2><CButton variant="secondary" :loading="busy" @click="load">Actualizar</CButton></div><div class="operation-form mb-4"><label>Buscar en los últimos 100 turnos<input v-model="query" type="search"></label><label>Estado<select v-model="status"><option value="">Todos</option><option value="open">Abierto</option><option value="closed">Cerrado</option></select></label><CButton v-if="query||status" variant="secondary" @click="query='';status=''">Limpiar filtros</CButton></div><p v-if="busy" role="status">Cargando turnos…</p><CTableHint /><div class="operation-scroll" tabindex="0" role="region" aria-label="Resultados de la tabla"><table class="operation-table cash-shifts-table"><thead><tr><th scope="col">Turno / persona</th><th scope="col">Apertura</th><th scope="col">Estado</th><th scope="col">Movimientos por medio</th><th scope="col">Arqueo</th></tr></thead><tbody><tr v-for="s in visibleShifts" :key="s.id"><td>#{{ s.id }} · {{ s.user_name }}</td><td>{{ dateTime(s.opened_at) }}</td><td><span class="status-badge" :class="s.closed_at ? 'status-checked_out' : 'status-completed'">{{ s.closed_at ? 'Cerrado' : 'Abierto' }}</span></td><td><div v-for="t in s.totals" :key="t.method">{{ methods[t.method] || t.method }}: {{ money(t.total,s.currency) }} ({{ t.movements }})</div><span v-if="!s.totals.length">Sin movimientos</span></td><td v-if="s.closed_at">Esperado {{ money(s.expected_amount || 0,s.currency) }}<br>Contado {{ money(s.counted_amount || 0,s.currency) }}<br><strong class="cash-difference" :data-mismatch="Number(s.counted_amount)!==Number(s.expected_amount)">{{ Number(s.counted_amount)===Number(s.expected_amount)?'Caja cuadrada':'Diferencia de arqueo' }}: {{ money(Number(s.counted_amount)-Number(s.expected_amount),s.currency) }}</strong><div>{{ s.notes }}</div></td><td v-else>En curso</td></tr></tbody></table></div><p v-if="!busy && !error && !filteredShifts.length">No hay turnos para estos filtros.</p><CTablePagination :pagination="pagination" :loading="busy" @change="page=$event" /></CCard>
 </div>
</template>
<script setup lang="ts">
import type { CashShift } from '~/types/operations'
definePageMeta({middleware:'auth'})
const {get,post,run,error,busy}=useOperations(), {money,dateTime}=useHotelSettings(), auth=useAuthStore()
const shifts=ref<CashShift[]>([]), opening=ref(0), counted=ref<number | string>(''), notes=ref('')
const query=ref(''),status=ref(''),page=ref(1)
const filteredShifts=computed(()=>shifts.value.filter(s=>(!query.value||`${s.id} ${s.user_name}`.toLowerCase().includes(query.value.trim().toLowerCase()))&&(!status.value||(status.value==='closed'?!!s.closed_at:!s.closed_at))))
const visibleShifts=computed(()=>filteredShifts.value.slice((page.value-1)*10,page.value*10))
const pagination=computed(()=>({page:page.value,pageSize:10,total:filteredShifts.value.length,totalPages:Math.ceil(filteredShifts.value.length/10)}))
watch([query,status],()=>{page.value=1})
watch(()=>filteredShifts.value.length,()=>{page.value=Math.min(page.value,Math.max(1,pagination.value.totalPages))})
const methods:Record<string,string>={cash:'Efectivo',credit_card:'Tarjeta de crédito',debit_card:'Tarjeta de débito',transfer:'Transferencia',check:'Cheque'}
const current=computed(()=>shifts.value.find(s=>s.user_id===auth.user?.id&&!s.closed_at))
const expected=computed(()=>Number(current.value?.opening_amount||0)+Number(current.value?.totals.find(t=>t.method==='cash')?.total||0))
const load=()=>run(async()=>{shifts.value=(await get<CashShift[]>('cash-shifts')).data||[]})
const open=()=>run(async()=>{await post('cash-shifts',{opening_amount:opening.value});shifts.value=(await get<CashShift[]>('cash-shifts')).data||[]})
const reviewing=ref(false)
const difference=computed(()=>Math.round((Number(counted.value)-expected.value)*100)/100)
const validCount=()=>counted.value!=='' && Number.isFinite(Number(counted.value)) && Number(counted.value)>=0
const reviewClose=()=>{if(!busy.value && current.value && validCount())reviewing.value=true}
const cancelReview=()=>{if(!busy.value)reviewing.value=false}
const close=()=>run(async()=>{if(!current.value || !reviewing.value || !validCount())return;await post(`cash-shifts/${current.value.id}/close`,{counted_amount:Number(counted.value),notes:notes.value});shifts.value=(await get<CashShift[]>('cash-shifts')).data||[];notes.value='';counted.value='';reviewing.value=false})
onMounted(load)
</script>

<style scoped>
.cash-shifts-table tbody td:nth-child(2),
.cash-shifts-table tbody td:nth-child(3) { text-align: center; }
</style>
