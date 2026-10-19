import type { PaginatedApiResponse } from '~/types'
import { useApiClient } from '~/services/api'
export type PaymentSummary = import('~/types/generated/api').PaymentListSummary
export const useTableList = <T>(path:string, filters:()=>Record<string,string|number|undefined> = ()=>({}), pageSize=10) => {
  const api=useApiClient()
  const rows=ref<T[]>([]) as Ref<T[]>
  const page=ref(1), loading=ref(true), error=ref('')
  const pagination=ref({page:1,pageSize,total:0,totalPages:0})
  const summary=ref<PaymentSummary>()
  let version=0
  const load=async()=>{
    const current=++version
    loading.value=true; error.value=''
    try {
      const result=await api.request<PaginatedApiResponse<T>&{summary?:PaymentSummary}>(path,{query:{...filters(),page:page.value,pageSize}})
      if(current!==version)return
      rows.value=result.data||[];pagination.value=result.pagination;summary.value=result.summary
      if(page.value>Math.max(1,result.pagination.totalPages)){page.value=Math.max(1,result.pagination.totalPages)}
    } catch(e:unknown){if(current===version){error.value=(e as {data?:{message?:string}}).data?.message||'No se pudo cargar la lista. Intenta de nuevo.'}}
    finally{if(current===version)loading.value=false}
  }
  let timer:ReturnType<typeof setTimeout>|undefined
  watch(filters,()=>{version++;loading.value=true;clearTimeout(timer);timer=setTimeout(()=>{if(page.value===1)load();else page.value=1},250)},{deep:true})
  watch(page,load)
  onMounted(load)
  onBeforeUnmount(()=>{version++;clearTimeout(timer)})
  return {rows,page,loading,error,pagination,summary,load}
}
