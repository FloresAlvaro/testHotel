import { useApiClient } from '~/services/api'
import type { ApiResponse, PaginatedApiResponse } from '~/types'
export const useOperations = () => {
 const api=useApiClient()
 const error=ref(''), busy=ref(false)
 const run=async<T>(work:()=>Promise<T>):Promise<T|undefined>=>{busy.value=true;error.value='';try{return await work()}catch(e:unknown){const failure=e as {data?:{message?:string};message?:string};error.value=failure.data?.message||failure.message||'No se pudo completar la operación'}finally{busy.value=false}}
 const get=<T>(path:string,query:Record<string,string|number|undefined>={})=>api.request<ApiResponse<T>>(`/operations/${path}`,{query})
 const list=<T>(path:string,query:Record<string,string|number|undefined>={})=>api.request<PaginatedApiResponse<T>>(`/operations/${path}`,{query})
 const post=<T>(path:string,body:Record<string,unknown>,method:'POST'|'PATCH'='POST')=>api.request<ApiResponse<T>>(`/operations/${path}`,{method,body})
 return {get,list,post,run,error,busy}
}
