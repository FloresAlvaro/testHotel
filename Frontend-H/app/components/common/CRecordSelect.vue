<template>
  <div class="space-y-2">
    <label :for="`${id}-search`" class="block text-sm">Buscar {{ label.toLowerCase() }}
      <input :id="`${id}-search`" v-model="query" type="search" maxlength="200" class="operation-filter block w-full" :disabled="disabled" placeholder="Nombre o identificador">
    </label>
    <label :for="id" class="select-field"><span>{{ label }}</span>
      <select :id="id" :value="modelValue" :disabled="disabled || loading" :required="required" @change="select">
        <option value="" disabled>Seleccionar {{ label.toLowerCase() }}</option>
        <option v-if="selected && !options.some(item=>item.id===selected?.id)" :value="String(selected.id)" :disabled="selected.disabled">{{ selected.label }}</option>
        <option v-for="option in options" :key="option.id" :value="String(option.id)" :disabled="option.disabled">{{ option.label }}</option>
      </select>
    </label>
    <p v-if="loading" role="status" class="text-sm">Cargando opciones…</p>
    <p v-else-if="error" role="alert" class="operation-error">{{ error }} <button type="button" class="underline" @click="load">Reintentar</button></p>
    <p v-else-if="!options.length" role="status" class="text-sm">Sin coincidencias. Cambia la búsqueda.</p>
    <div v-if="pagination.totalPages>1 && !disabled" class="flex flex-wrap items-center gap-2 text-sm">
      <CButton type="button" variant="secondary" size="sm" :disabled="loading||page<=1" @click="page--">Anterior</CButton>
      <span aria-live="polite">{{ page }} / {{ pagination.totalPages }} · {{ pagination.total }} opciones</span>
      <CButton type="button" variant="secondary" size="sm" :disabled="loading||page>=pagination.totalPages" @click="page++">Siguiente</CButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { RecordOption, RecordOptionsPage } from '~/types/recordOptions'
const props=withDefaults(defineProps<{modelValue:string;label:string;fetchOptions:(page:number,q:string)=>Promise<RecordOptionsPage>;resolveOption?:(id:number)=>Promise<RecordOption>;disabled?:boolean;required?:boolean}>(),{disabled:false,required:true,resolveOption:undefined})
const emit=defineEmits<{'update:modelValue':[value:string]}>()
const id=useId(),query=ref(''),page=ref(1),loading=ref(false),error=ref('')
const options=ref<RecordOption[]>([]),selected=ref<RecordOption>(),pagination=ref({total:0,totalPages:0})
let version=0,selectionVersion=0,timer:ReturnType<typeof setTimeout>|undefined
const load=async()=>{
 const request=++version;loading.value=true;error.value=''
 try{const result=await props.fetchOptions(page.value,query.value.trim());if(request!==version)return;options.value=result.options;pagination.value=result.pagination;const match=result.options.find(item=>String(item.id)===props.modelValue);if(match)selected.value=match}
 catch{if(request===version)error.value='No se pudieron cargar las opciones.'}
 finally{if(request===version)loading.value=false}
}
const select=(event:Event)=>{const value=(event.target as HTMLSelectElement).value;selected.value=options.value.find(item=>String(item.id)===value)||selected.value;emit('update:modelValue',value)}
watch(query,()=>{version++;loading.value=true;clearTimeout(timer);timer=setTimeout(()=>{if(page.value===1)load();else page.value=1},250)})
watch(page,load)
watch(()=>props.modelValue,async value=>{
 const request=++selectionVersion
 if(!value){selected.value=undefined;return}
 const match=options.value.find(item=>String(item.id)===value)
 if(match){selected.value=match;return}
 if(props.resolveOption)try{const option=await props.resolveOption(Number(value));if(request===selectionVersion)selected.value=option}catch{if(request===selectionVersion)error.value='No se pudo recuperar la selección. Reintenta la carga.'}
},{immediate:true})
onMounted(load)
onBeforeUnmount(()=>{version++;selectionVersion++;clearTimeout(timer)})
</script>
