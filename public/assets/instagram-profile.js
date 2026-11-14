import {record} from "./shared/http.js";

export const validInstagram = value => value === null || record(value)
  && Object.keys(value).length === 2 && Object.hasOwn(value,"userName") && Object.hasOwn(value,"verified")
  && typeof value.userName === "string" && value.userName.length > 0 && value.userName.length <= 30
  && !/[^A-Za-z0-9._]/.test(value.userName) && typeof value.verified === "boolean";

/** Own session-scoped read state. No persistence, mutation, polling or process inference. */
export function createInstagramReader({request,onChange=()=>{}}) {
  let owner=null,epoch=null,status="anonymous",version=0,controller;
  let state={phase:"anonymous",value:undefined,busy:false};
  const emit=()=>onChange({...state});
  return {
    get state(){return {...state};},
    setSession(next){
      const account=next.status==="authenticated"?next.accountId:null;
      if(account===owner && next.epoch===epoch && next.status===status)return false;
      owner=account;epoch=next.epoch;status=next.status;version++;controller?.abort();
      state={phase:owner?"idle":"anonymous",value:undefined,busy:false};emit();return true;
    },
    async load(){
      if(!owner || state.busy)return false;
      const run=version;controller=new AbortController();
      state={...state,phase:"loading",busy:true};emit();
      try{
        const value=await request("/api/instagram",{method:"GET",authenticated:true,signal:controller.signal,
          successStatus:200,validate:validInstagram});
        if(run!==version)return false;
        state={phase:"ready",value,busy:false};emit();return true;
      }catch(error){
        if(run!==version)return false;
        state={...state,phase:"error",busy:false};emit();return false;
      }
    }
  };
}

export const instagramCopy={
  en:{private:"Only you",loading:"Loading Instagram…",refreshing:"Refreshing…",empty:"No Instagram added",unverified:"Instagram not confirmed",
    verified:"Instagram confirmed",error:"We couldn't load Instagram. Try refreshing.",last:"Last received status",refresh:"Refresh status",
    privacy:"Only a confirmed Instagram is visible on your published profile. Confirmation does not verify identity.",
    unverifiedBody:"This name is visible only to you. Confirmation has not been received.",read:"Refreshing reads the current status. It does not start a new check."},
  es:{private:"Solo tú",loading:"Cargando Instagram…",refreshing:"Actualizando…",empty:"No se ha añadido Instagram",unverified:"Instagram sin confirmar",
    verified:"Instagram confirmado",error:"No pudimos cargar Instagram. Intenta actualizar.",last:"Último estado recibido",refresh:"Actualizar estado",
    privacy:"Solo un Instagram confirmado es visible en tu perfil publicado. La confirmación no verifica la identidad.",
    unverifiedBody:"Solo tú puedes ver este nombre. Aún no se ha recibido la confirmación.",read:"Actualizar consulta el estado actual. No inicia una nueva comprobación."},
  ca:{private:"Només tu",loading:"Carregant Instagram…",refreshing:"Actualitzant…",empty:"No s'ha afegit Instagram",unverified:"Instagram sense confirmar",
    verified:"Instagram confirmat",error:"No hem pogut carregar Instagram. Torna a actualitzar.",last:"Últim estat rebut",refresh:"Actualitzar estat",
    privacy:"Només un Instagram confirmat és visible al teu perfil publicat. La confirmació no verifica la identitat.",
    unverifiedBody:"Només tu pots veure aquest nom. Encara no s'ha rebut la confirmació.",read:"Actualitzar consulta l'estat actual. No inicia una nova comprovació."},
  ru:{private:"Только вам",loading:"Загружаем Instagram…",refreshing:"Обновляем…",empty:"Instagram пока не добавлен",unverified:"Instagram не подтверждён",
    verified:"Instagram подтверждён",error:"Не удалось загрузить Instagram. Повторите обновление.",last:"Последний полученный статус",refresh:"Обновить статус",
    privacy:"Подтверждённый Instagram виден только в опубликованном профиле. Подтверждение не удостоверяет личность.",
    unverifiedBody:"Имя видно только вам. Подтверждение ещё не получено.",read:"Обновление показывает текущий статус. Оно не начинает новую проверку."}
};
