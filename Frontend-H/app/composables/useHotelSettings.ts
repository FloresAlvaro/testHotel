import { useApiClient } from '~/services/api'
import type { ApiResponse } from '~/types'
import type { HotelSettings } from '~/types/operations'
export const useHotelSettings = () => {
  const settings = useState<HotelSettings>('hotel-settings', () => ({hotel_name:'Mi hotel',city:'',email:'',phone:'',address:'',check_in_time:'15:00',check_out_time:'11:00',currency:'BOB',timezone:'America/La_Paz',version:1}))
  const api=useApiClient()
  const auth=useAuthStore()
  const load=async()=>{ const result=await api.request<ApiResponse<HotelSettings>>(auth.isCustomer ? '/portal/hotel' : '/operations/settings'); if(result.data && result.data.version >= settings.value.version) settings.value=result.data; return settings.value }
  const save=async(data:HotelSettings)=>{const result=await api.request<ApiResponse<HotelSettings>>('/operations/settings',{method:'PUT',body:Object.fromEntries(['hotel_name','city','email','phone','address','check_in_time','check_out_time','currency','timezone','version'].map(key=>[key,data[key as keyof HotelSettings]]))});if(result.data) settings.value=result.data;return settings.value}
  const money=(amount:number|string|null|undefined,currency=settings.value.currency)=>new Intl.NumberFormat('es-BO',{style:'currency',currency}).format(Number(amount||0))
  const dateTime=(value:string)=>new Intl.DateTimeFormat('es-BO',{dateStyle:'short',timeStyle:'short',timeZone:settings.value.timezone}).format(new Date(value))
  return {settings,load,save,money,dateTime}
}
