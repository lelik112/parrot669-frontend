(function(root){
  const copy={
    en:{name:"Airbnb calendar",loading:"Loading verification status…",required:"Verification required",verified:"✓ Calendar control verified",preparing:"Getting the initial calendar snapshot…",ready:"Ready to verify",waiting:"Waiting for the calendar change",failed:"No availability change found",expired:"Verification expired",changed:"Calendar link changed",failedFetch:"Could not complete verification",blocked:"Verification temporarily blocked. Try again later.",cancelled:"Verification cancelled",cancelledDetail:"The previous verification was cancelled. Select new nights when ready.",cancel:"Cancel verification",start:"Start verification",restart:"Start a new attempt",check:"Check verification",refresh:"Refresh status",intro:"Start verification first. Then choose a suitable period in Airbnb, change its availability and click Check verification.",instructions:"Choose a suitable period in Airbnb, change its availability and click Check verification. Either blocking or reopening dates works.",retries:"PARROT will check automatically. You can close this page.",scope:"This confirms control of the calendar source, not identity or property ownership.",disabled:"Calendar disabled. Enable it to verify.",unavailable:"Could not load verification status. Please retry.",fetchError:"Airbnb's calendar is temporarily unavailable. We will retry automatically.",invalid:"Airbnb returned an incomplete calendar. We will retry automatically.",signIn:"Log in again to verify the calendar.",attempt:(n,max)=>`Attempt ${n} of ${max}`,deadline:v=>`Make the change and check by ${v}.`,next:v=>`Next automatic check: ${v}`,until:v=>`You can start again after ${v}.`,verifiedAt:v=>`Verified: ${v}`},
    es:{name:"Calendario de Airbnb",loading:"Cargando estado de verificación…",required:"Verificación pendiente",verified:"✓ Control del calendario verificado",preparing:"Obteniendo el estado inicial del calendario…",ready:"Listo para verificar",waiting:"Esperando el cambio del calendario",failed:"No se detectaron cambios de disponibilidad",expired:"La verificación ha caducado",changed:"El enlace del calendario ha cambiado",failedFetch:"No se pudo completar la verificación",blocked:"Verificación bloqueada temporalmente. Inténtalo más tarde.",cancelled:"Verificación cancelada",cancelledDetail:"La verificación anterior se canceló. Selecciona nuevas noches cuando quieras.",cancel:"Cancelar verificación",start:"Iniciar verificación",restart:"Iniciar otro intento",check:"Comprobar verificación",refresh:"Actualizar estado",intro:"Inicia la verificación. Después elige un período adecuado en Airbnb, cambia su disponibilidad y pulsa Comprobar verificación.",instructions:"Elige un período adecuado en Airbnb, cambia su disponibilidad y pulsa Comprobar verificación. Puedes bloquear o volver a abrir fechas.",retries:"PARROT comprobará el calendario automáticamente. Puedes cerrar esta página.",scope:"Esto confirma el control del calendario, no la identidad ni la propiedad de la vivienda.",disabled:"Calendario desactivado. Actívalo para verificarlo.",unavailable:"No se pudo cargar el estado. Inténtalo de nuevo.",fetchError:"El calendario de Airbnb no está disponible temporalmente. Reintentaremos automáticamente.",invalid:"Airbnb devolvió un calendario incompleto. Reintentaremos automáticamente.",signIn:"Vuelve a iniciar sesión para verificar el calendario.",attempt:(n,max)=>`Intento ${n} de ${max}`,deadline:v=>`Cambia las fechas y comprueba antes de ${v}.`,next:v=>`Próxima comprobación automática: ${v}`,until:v=>`Puedes volver a empezar después de ${v}.`,verifiedAt:v=>`Verificado: ${v}`},
    ca:{name:"Calendari d’Airbnb",loading:"Carregant l’estat de verificació…",required:"Cal verificar el calendari",verified:"✓ Control del calendari verificat",preparing:"Obtenint l’estat inicial del calendari…",ready:"A punt per verificar",waiting:"Esperant el canvi del calendari",failed:"No s’han detectat canvis de disponibilitat",expired:"La verificació ha caducat",changed:"L’enllaç del calendari ha canviat",failedFetch:"No s’ha pogut completar la verificació",blocked:"Verificació bloquejada temporalment. Torna-ho a provar més tard.",cancelled:"Verificació cancel·lada",cancelledDetail:"La verificació anterior s’ha cancel·lat. Selecciona noves nits quan vulguis.",cancel:"Cancel·lar verificació",start:"Iniciar verificació",restart:"Iniciar un altre intent",check:"Comprovar verificació",refresh:"Actualitzar estat",intro:"Inicia la verificació. Després tria un període adequat a Airbnb, canvia’n la disponibilitat i prem Comprovar verificació.",instructions:"Tria un període adequat a Airbnb, canvia’n la disponibilitat i prem Comprovar verificació. Pots bloquejar o tornar a obrir dates.",retries:"PARROT comprovarà el calendari automàticament. Pots tancar aquesta pàgina.",scope:"Això confirma el control del calendari, no la identitat ni la propietat de l’habitatge.",disabled:"Calendari desactivat. Activa’l per verificar-lo.",unavailable:"No s’ha pogut carregar l’estat. Torna-ho a provar.",fetchError:"El calendari d’Airbnb no està disponible temporalment. Ho tornarem a provar automàticament.",invalid:"Airbnb ha retornat un calendari incomplet. Ho tornarem a provar automàticament.",signIn:"Torna a iniciar sessió per verificar el calendari.",attempt:(n,max)=>`Intent ${n} de ${max}`,deadline:v=>`Canvia les dates i comprova abans de ${v}.`,next:v=>`Propera comprovació automàtica: ${v}`,until:v=>`Pots tornar a començar després de ${v}.`,verifiedAt:v=>`Verificat: ${v}`},
    ru:{name:"Календарь Airbnb",loading:"Загружаем статус проверки…",required:"Требуется проверка",verified:"✓ Управление календарём подтверждено",preparing:"Получаем исходное состояние календаря…",ready:"Можно проверять",waiting:"Ожидаем изменения календаря",failed:"Изменений доступности не найдено",expired:"Время проверки истекло",changed:"Ссылка календаря изменилась",failedFetch:"Не удалось завершить проверку",blocked:"Проверка временно заблокирована. Попробуйте позже.",cancelled:"Проверка отменена",cancelledDetail:"Предыдущая проверка отменена. Можно выбрать другие ночи и начать снова.",cancel:"Отменить проверку",start:"Начать проверку",restart:"Начать новую попытку",check:"Проверить",refresh:"Обновить статус",intro:"Сначала начните проверку. Затем выберите подходящий период в Airbnb, измените его доступность и нажмите «Проверить».",instructions:"Выберите подходящий период в Airbnb, измените его доступность и нажмите «Проверить». Можно как закрыть, так и открыть даты.",retries:"PARROT проверит календарь автоматически. Страницу можно закрыть.",scope:"Подтверждается управление календарём. Личность и право собственности на жильё не проверяются.",disabled:"Календарь выключен. Включите его для проверки.",unavailable:"Не удалось загрузить статус проверки. Попробуйте ещё раз.",fetchError:"Календарь Airbnb временно недоступен. Повторим запрос автоматически.",invalid:"Airbnb вернул неполный календарь. Повторим запрос автоматически.",signIn:"Войдите снова, чтобы проверить календарь.",attempt:(n,max)=>`Попытка ${n} из ${max}`,deadline:v=>`Измените даты и нажмите «Проверить» до ${v}.`,next:v=>`Следующая автоматическая проверка: ${v}`,until:v=>`Новая попытка будет доступна после ${v}.`,verifiedAt:v=>`Подтверждено: ${v}`}
  };
  const challengeCopy={
    en:{from:"First night",to:"Last night (included)",choose:"Select the nights to verify, then start. Airbnb may take time to update its calendar.",bounds:(a,b)=>`Use dates from ${a} through ${b} (six calendar months).`,close:"These nights are free. Block all selected nights in Airbnb, then check here.",open:"These nights are blocked by you in Airbnb. Reopen all selected nights, then check here.",waitingClose:"These nights are free. Block all selected nights in Airbnb.",waitingOpen:"These nights are blocked by you in Airbnb. Reopen all selected nights.",dates:(a,b)=>`Selected nights: ${a} – ${b}`,invalidDates:(a,b)=>`Select dates from ${a} through ${b}, in order.`,reserved:"These nights include a reservation or an unknown block. Select unreserved nights.",mixed:"These nights mix free and blocked dates. Select a uniform range.",restore:"You can restore the temporary calendar change in Airbnb now.",again:"Select new nights to try again."},
    es:{from:"Primera noche",to:"Última noche (incluida)",choose:"Selecciona las noches que deseas verificar y comienza. Airbnb puede tardar en actualizar el calendario.",bounds:(a,b)=>`Usa fechas desde ${a} hasta ${b} (seis meses naturales).`,close:"Estas noches están libres. Bloquea todas las noches seleccionadas en Airbnb y comprueba aquí.",open:"Estas noches están bloqueadas por ti en Airbnb. Vuelve a abrir todas las noches seleccionadas y comprueba aquí.",waitingClose:"Estas noches están libres. Bloquea todas las noches seleccionadas en Airbnb.",waitingOpen:"Estas noches están bloqueadas por ti en Airbnb. Vuelve a abrir todas las noches seleccionadas.",dates:(a,b)=>`Noches seleccionadas: ${a} – ${b}`,invalidDates:(a,b)=>`Selecciona fechas desde ${a} hasta ${b}, en orden.`,reserved:"Estas noches incluyen una reserva o un bloqueo desconocido. Selecciona noches sin reservar.",mixed:"Estas noches mezclan fechas libres y bloqueadas. Selecciona un período uniforme.",restore:"Ya puedes deshacer el cambio temporal en el calendario de Airbnb.",again:"Selecciona otras noches para intentarlo de nuevo."},
    ca:{from:"Primera nit",to:"Última nit (inclosa)",choose:"Selecciona les nits que vols verificar i comença. Airbnb pot trigar a actualitzar el calendari.",bounds:(a,b)=>`Fes servir dates des de ${a} fins a ${b} (sis mesos naturals).`,close:"Aquestes nits són lliures. Bloqueja totes les nits seleccionades a Airbnb i comprova-ho aquí.",open:"Aquestes nits estan bloquejades per tu a Airbnb. Torna a obrir totes les nits seleccionades i comprova-ho aquí.",waitingClose:"Aquestes nits són lliures. Bloqueja totes les nits seleccionades a Airbnb.",waitingOpen:"Aquestes nits estan bloquejades per tu a Airbnb. Torna a obrir totes les nits seleccionades.",dates:(a,b)=>`Nits seleccionades: ${a} – ${b}`,invalidDates:(a,b)=>`Selecciona dates des de ${a} fins a ${b}, en ordre.`,reserved:"Aquestes nits inclouen una reserva o un bloqueig desconegut. Selecciona nits sense reserva.",mixed:"Aquestes nits barregen dates lliures i bloquejades. Selecciona un període uniforme.",restore:"Ara pots desfer el canvi temporal al calendari d’Airbnb.",again:"Selecciona altres nits per tornar-ho a provar."},
    ru:{from:"Первая ночь",to:"Последняя ночь (включительно)",choose:"Выберите ночи для проверки и начните. Airbnb может обновлять календарь с задержкой.",bounds:(a,b)=>`Выбирайте даты с ${a} по ${b} (шесть календарных месяцев).`,close:"Эти ночи свободны. Закройте в Airbnb все выбранные ночи и нажмите «Проверить».",open:"Эти ночи закрыты вами в Airbnb. Откройте все выбранные ночи и нажмите «Проверить».",waitingClose:"Эти ночи свободны. Закройте в Airbnb все выбранные ночи.",waitingOpen:"Эти ночи закрыты вами в Airbnb. Откройте все выбранные ночи.",dates:(a,b)=>`Выбранные ночи: ${a} – ${b}`,invalidDates:(a,b)=>`Выберите даты с ${a} по ${b}, по порядку.`,reserved:"Среди этих ночей есть бронь или неизвестная блокировка. Выберите ночи без брони.",mixed:"Здесь смешаны свободные и закрытые ночи. Выберите однородный период.",restore:"Теперь временное изменение календаря Airbnb можно вернуть обратно.",again:"Выберите другие ночи для новой попытки."}
  };
  function create({calendar,request,language="en",onUnauthorized=()=>{},onStatus=()=>{}}){
    let tr=copy[language]||copy.en,ch=challengeCopy[language]||challengeCopy.en;
    const node=document.createElement("section");node.className="calendar-verification";node.setAttribute("aria-live","polite");
    const title=document.createElement("strong"),detail=document.createElement("p"),timing=document.createElement("p"),attempt=document.createElement("p");
    const notice=document.createElement("p");notice.className="calendar-verification-error";notice.setAttribute("role","alert");
    const button=document.createElement("button");button.type="button";button.className="button button-small";
    const cancelButton=document.createElement("button");cancelButton.type="button";cancelButton.className="button button-small button-ghost calendar-verification-cancel";
    const dates=document.createElement("div");dates.className="calendar-verification-dates";
    const fromLabel=document.createElement("label"),toLabel=document.createElement("label");
    const from=document.createElement("input"),to=document.createElement("input");
    from.type="date";to.type="date";from.required=true;to.required=true;
    fromLabel.append(document.createTextNode(ch.from),from);toLabel.append(document.createTextNode(ch.to),to);
    dates.append(fromLabel,toLabel);
    const selected=document.createElement("p");selected.className="calendar-verification-selected";
    const scope=document.createElement("p");scope.className="calendar-verification-scope";scope.textContent=tr.scope;
    node.append(title,detail,dates,selected,timing,attempt,notice,button,cancelButton,scope);
    let value=null,error="",formError="",busy=false,disposed=false,timer,controller,action="refresh";
    const text=(element,value)=>{if(element.textContent!==value)element.textContent=value;element.hidden=!value;};
    const canonical=value=>typeof value==="string"?value.toLowerCase():"";
    function date(value){
      const parsed=new Date(value);
      return Number.isFinite(parsed.getTime())?parsed.toLocaleString(language,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"";
    }
    function addCalendarMonths(iso,months){
      const [year,month,day]=iso.split("-").map(Number);
      const target=new Date(Date.UTC(year,month-1+months,1));
      const lastDay=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
      return [target.getUTCFullYear(),String(target.getUTCMonth()+1).padStart(2,"0"),
        String(Math.min(day,lastDay)).padStart(2,"0")].join("-");
    }
    // Calendar-date arithmetic only: HOST last night is inclusive, API end exclusive.
    function shiftDate(iso,days){
      const date=new Date(`${iso}T00:00:00Z`);
      if(!Number.isFinite(date.getTime()))return "";
      date.setUTCDate(date.getUTCDate()+days);
      return date.toISOString().slice(0,10);
    }
    function selectableBounds(){
      const minimum=value?.minSelectableDate||new Date().toISOString().slice(0,10);
      return {minimum,maximum:value?.maxSelectableDate||addCalendarMonths(minimum,6)};
    }
    function applyBounds(){
      const {minimum,maximum}=selectableBounds();
      from.min=minimum;from.max=maximum;to.min=from.value||minimum;to.max=maximum;
    }
    function render(notify=true){
      const state=canonical(value?.status),expectedAction=canonical(value?.expectedAction);
      node.dataset.status=state||"loading";
      let heading=tr.loading,description="",time="";
      action="refresh";
      applyBounds();
      button.hidden=!error;
      button.textContent=tr.refresh;
      cancelButton.hidden=true;cancelButton.textContent=tr.cancel;
      if(value){
        if(state==="verified"){
          heading=tr.verified;description=ch.restore;time=value.verifiedAt?tr.verifiedAt(date(value.verifiedAt)):"";
        }else if(state==="blocked"){
          heading=tr.blocked;time=value.blockedUntil?tr.until(date(value.blockedUntil)):"";
        }else if(state==="cancelled"){
          heading=tr.cancelled;description=tr.cancelledDetail;
        }else if(state==="pending"){
          heading=!value.baselineReady?tr.preparing:value.canCheck?tr.ready:tr.waiting;
          description=value.baselineReady?(value.canCheck?
            (expectedAction==="close"?ch.close:ch.open):
            (expectedAction==="close"?ch.waitingClose:ch.waitingOpen)):tr.preparing;
          if(value.baselineReady && !value.canCheck)description+=` ${tr.retries}`;
          if(value.nextCheckAt)time=tr.next(date(value.nextCheckAt));
          else if(value.canCheck && value.expiresAt)time=tr.deadline(date(value.expiresAt));
        }else{
          heading=state==="failed"?(value.lastError==="expired"?tr.expired:value.lastError==="source_changed"?tr.changed:
            ["fetch_failed","invalid_calendar"].includes(value.lastError)?tr.failedFetch:tr.failed):tr.required;
          const {minimum,maximum}=selectableBounds();
          description=state==="rejected"?(value.lastError==="choose_unreserved_dates"?ch.reserved:ch.mixed):
            `${ch.choose} ${ch.bounds(minimum,maximum)}`;
        }
        if(calendar.enabled===false)description=tr.disabled;
        if(value.canStart && calendar.enabled!==false && ["required","failed","rejected","cancelled"].includes(state)){
          action="start";button.textContent=["failed","rejected","cancelled"].includes(state)?tr.restart:tr.start;button.hidden=false;
        }
        if(value.canCheck && calendar.enabled!==false){action="check";button.textContent=tr.check;button.hidden=false;}
        if(state==="pending" && value.canCancel===true){cancelButton.hidden=false;}
        if(state==="pending" && !error){
          if(value.lastError==="fetch_failed")description=tr.fetchError;
          if(value.lastError==="invalid_calendar")description=tr.invalid;
        }
      }
      dates.hidden=!(value?.canStart && calendar.enabled!==false && ["required","failed","rejected","cancelled"].includes(state));
      text(selected,value?.selectedFrom && value?.selectedTo && state!=="required"?
        ch.dates(value.selectedFrom,shiftDate(value.selectedTo,-1)):"");
      text(title,heading);text(detail,description);text(timing,time);
      if(error && !(action==="start" && value?.canStart && errorFromStart)){
        action="refresh";button.hidden=false;button.textContent=tr.refresh;
      }
      text(attempt,value?.attemptsCount && !["verified","cancelled"].includes(state)?tr.attempt(value.attemptsCount,value.maxAttempts):"");
      text(notice,formError||error);button.disabled=busy;cancelButton.disabled=busy;node.setAttribute("aria-busy",String(busy));
      if(value && notify)onStatus(value);
    }
    function schedule(){
      clearTimeout(timer);
      if(disposed || document.visibilityState==="hidden")return;
      if(canonical(value?.status)==="pending" || error)timer=setTimeout(()=>load(),error?30000:15000);
      else if(canonical(value?.status)==="blocked" && value.blockedUntil){
        timer=setTimeout(()=>load(),Math.max(1000,new Date(value.blockedUntil).getTime()-Date.now()+1000));
      }
    }
    let errorFromStart=false;
    async function load(operation="refresh"){
      if(disposed || busy)return;
      if(operation==="start"){
        const first=from.value,last=to.value,{minimum,maximum}=selectableBounds();
        const days=(Date.parse(last)-Date.parse(first))/86400000;
        if(!first || !last || first<minimum || first>maximum || last>maximum ||
          !Number.isFinite(days) || days<0){
          formError=ch.invalidDates(minimum,maximum);render();return;
        }
      }
      busy=true;error="";formError="";errorFromStart=false;clearTimeout(timer);render();controller=new AbortController();
      try{
        const path=`/calendars/${encodeURIComponent(calendar.id)}/verification`;
        value=await request(path+(operation==="refresh"?"":"/"+operation),{
          method:operation==="refresh"?"GET":"POST",signal:controller.signal,
          ...(operation==="start"?{body:JSON.stringify({from:from.value,to:shiftDate(to.value,1)})}:{})});
        if(disposed)return;
        if(value?.selectedFrom && value?.selectedTo && !from.value && !to.value){
          from.value=value.selectedFrom;to.value=shiftDate(value.selectedTo,-1);applyBounds();
        }
      }catch(err){
        if(disposed || err.name==="AbortError")return;
        error=err.status===401?tr.signIn:err.status===400?err.message:tr.unavailable;
        errorFromStart=operation==="start" && err.status===400;
        if(err.status===401){dispose();onUnauthorized();return;}
        // Another tab can have started the check or exhausted the last attempt.
        if(operation!=="refresh" && [409,429].includes(err.status)){
          try{value=await request(`/calendars/${encodeURIComponent(calendar.id)}/verification`,{signal:controller.signal});error="";}catch{}
        }
      }finally{
        busy=false;if(!disposed){render();schedule();}
      }
    }
    function alignLastNight(){
      // The native date picker opens around its selected value, not just its min.
      const {minimum,maximum}=selectableBounds();
      to.min=from.value||minimum;
      to.max=maximum;
      to.value=from.value;
      formError="";text(notice,error);
    }
    from.addEventListener("input",alignLastNight);
    from.addEventListener("change",alignLastNight);
    to.addEventListener("input",()=>{formError="";text(notice,error);});
    button.addEventListener("click",()=>load(action));
    cancelButton.addEventListener("click",()=>load("cancel"));
    function visible(){if(document.visibilityState!=="hidden")void load();else clearTimeout(timer);}
    document.addEventListener("visibilitychange",visible);
    function dispose(){disposed=true;clearTimeout(timer);controller?.abort();document.removeEventListener("visibilitychange",visible);}
    function updateLanguage(next){
      if(disposed)return;
      language=copy[next]?next:"en";
      tr=copy[language];ch=challengeCopy[language];
      fromLabel.firstChild.nodeValue=ch.from;toLabel.firstChild.nodeValue=ch.to;
      scope.textContent=tr.scope;
      render(false);
    }
    render();void load();
    return {node,get name(){return tr.name;},dispose,updateLanguage};
  }
  root.ParrotCalendarVerification={create};
})(window);
