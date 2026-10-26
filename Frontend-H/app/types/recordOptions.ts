export interface RecordOption { id:number; label:string; disabled?:boolean }
export interface RecordOptionsPage { options:RecordOption[]; pagination:{total:number;totalPages:number} }
