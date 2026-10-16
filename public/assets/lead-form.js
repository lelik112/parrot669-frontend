(function(){
  const form=document.getElementById("lead-form");
  if(!form)return;

  const editor=document.getElementById("lead-editor");
  const receipt=document.getElementById("lead-receipt");
  const status=document.getElementById("form-status");
  const submit=form.querySelector('button[type="submit"]');
  const newRequest=document.getElementById("lead-new-request");
  const controls=[...form.querySelectorAll("input,select,textarea")];
  const visibleControls=controls.filter(control=>control.name!=="website");
  const serviceKeys={rental:"optionRental",visit:"optionVisit",documents:"optionDocs",search:"optionSearch",owner:"optionOwner",other:"optionOther"};
  const messages={
    en:{initial:"We’ll use these details only to respond to your request.",submit:"Send request",sending:"Sending…",success:"Your request was accepted. We’ll reply with the next step; this is not a guarantee that a person has read it yet.",error:"The request was not accepted. Your draft is preserved; review it and try again.",uncertain:"We could not confirm whether the request was accepted. It may have arrived. Check before sending it again.",retry:"Try again",sendAgain:"Send again",receiptTitle:"Request received",summaryName:"Name",summaryContact:"Contact",summaryService:"Service",summaryMessage:"Message",newRequest:"Start a new request"},
    es:{initial:"Usaremos estos datos únicamente para responder a tu solicitud.",submit:"Enviar solicitud",sending:"Enviando…",success:"Tu solicitud ha sido aceptada. Responderemos con el siguiente paso; esto no garantiza que una persona ya la haya leído.",error:"La solicitud no fue aceptada. Tu borrador se conserva; revísalo e inténtalo de nuevo.",uncertain:"No pudimos confirmar si la solicitud fue aceptada. Puede haber llegado. Compruébalo antes de volver a enviarla.",retry:"Intentar de nuevo",sendAgain:"Enviar de nuevo",receiptTitle:"Solicitud recibida",summaryName:"Nombre",summaryContact:"Contacto",summaryService:"Servicio",summaryMessage:"Mensaje",newRequest:"Crear otra solicitud"},
    ca:{initial:"Farem servir aquestes dades únicament per respondre a la teva petició.",submit:"Enviar petició",sending:"Enviant…",success:"La teva petició ha estat acceptada. Respondrem amb el següent pas; això no garanteix que una persona ja l'hagi llegit.",error:"La petició no ha estat acceptada. El teu esborrany es conserva; revisa'l i torna-ho a provar.",uncertain:"No hem pogut confirmar si la petició ha estat acceptada. Pot haver arribat. Comprova-ho abans de tornar-la a enviar.",retry:"Tornar-ho a provar",sendAgain:"Tornar a enviar",receiptTitle:"Petició rebuda",summaryName:"Nom",summaryContact:"Contacte",summaryService:"Servei",summaryMessage:"Missatge",newRequest:"Crear una altra petició"},
    ru:{initial:"Мы используем эти данные только для ответа на ваш запрос.",submit:"Отправить заявку",sending:"Отправляем…",success:"Заявка принята. Мы ответим со следующим шагом; это ещё не означает, что её уже прочитал человек.",error:"Заявка не принята. Черновик сохранён — проверьте его и попробуйте снова.",uncertain:"Не удалось подтвердить, принята ли заявка. Она могла дойти. Проверьте это перед повторной отправкой.",retry:"Попробовать снова",sendAgain:"Отправить ещё раз",receiptTitle:"Заявка принята",summaryName:"Имя",summaryContact:"Контакт",summaryService:"Услуга",summaryMessage:"Сообщение",newRequest:"Создать новую заявку"}
  };
  const contextMessages={
    en:"I need help with an Airbnb listing ID that PARROT says is already connected to another account.",
    es:"Necesito ayuda con un ID de anuncio de Airbnb que PARROT indica que ya está conectado a otra cuenta.",
    ca:"Necessito ajuda amb un ID d'anunci d'Airbnb que PARROT indica que ja està connectat a un altre compte.",
    ru:"Нужна помощь с ID объявления Airbnb, которое, по данным PARROT, уже привязано к другому аккаунту."
  };
  let state={kind:"editing",snapshot:null};
  let requestSequence=0;
  let hasContextDraft=false;
  const language=()=>messages[document.documentElement.lang] ? document.documentElement.lang : "en";
  const copy=()=>messages[language()];
  const snapshot=()=>Object.freeze(Object.fromEntries(new FormData(form).entries()));
  const serviceLabel=(value)=>{
    const option=form.querySelector(`select[name="service"] option[value="${value}"]`);
    return option?.textContent || value;
  };
  const setText=(selector,value)=>{const node=receipt.querySelector(selector);if(node)node.textContent=value||"";};

  function focusReceipt(){
    receipt.focus({preventScroll:true});
    const title=receipt.querySelector("h3");
    if(!title)return;
    const headerBottom=document.querySelector(".topbar")?.getBoundingClientRect().bottom||0;
    const safeTop=Math.max(0,headerBottom)+16;
    const rect=title.getBoundingClientRect();
    if(rect.top<safeTop||rect.bottom>window.innerHeight-16){
      window.scrollBy({top:rect.top-safeTop,left:0,behavior:"auto"});
    }
  }

  function render({focus=false}={}){
    const text=copy();
    const busy=state.kind==="submitting";
    controls.forEach(control=>{control.disabled=busy;});
    submit.disabled=busy;
    submit.textContent=state.kind==="submitting" ? text.sending
      : state.kind==="error" ? text.retry
      : state.kind==="uncertain" ? text.sendAgain
      : text.submit;
    const statusText=state.kind==="submitting" ? text.sending
      : state.kind==="success" ? text.success
      : state.kind==="error" ? text.error
      : state.kind==="uncertain" ? text.uncertain
      : text.initial;
    status.textContent=statusText;
    status.dataset.state=state.kind;
    editor.hidden=state.kind==="success";
    receipt.hidden=state.kind!=="success";
    receipt.querySelector("h3").textContent=text.receiptTitle;
    receipt.querySelector('[data-lead-label="name"]').textContent=text.summaryName;
    receipt.querySelector('[data-lead-label="contact"]').textContent=text.summaryContact;
    receipt.querySelector('[data-lead-label="service"]').textContent=text.summaryService;
    receipt.querySelector('[data-lead-label="message"]').textContent=text.summaryMessage;
    newRequest.textContent=text.newRequest;
    if(state.snapshot){
      setText('[data-lead-value="name"]',state.snapshot.name);
      setText('[data-lead-value="contact"]',state.snapshot.contact);
      setText('[data-lead-value="service"]',serviceLabel(state.snapshot.service));
      setText('[data-lead-value="message"]',state.snapshot.message);
    }
    if(focus){
      if(state.kind==="success") focusReceipt();
      else status.focus();
    }
  }

  if(new URLSearchParams(window.location.search).get("contact")==="airbnb-listing-conflict"){
    form.elements.service.value="other";
    if(!form.elements.message.value){
      form.elements.message.value=contextMessages[language()]||contextMessages.en;
      hasContextDraft=true;
    }
  }
  form.elements.message.addEventListener("input",()=>{hasContextDraft=false;});

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    if(state.kind==="submitting"||state.kind==="success")return;
    if(!form.reportValidity())return;
    const attempt=++requestSequence;
    const submitted=snapshot();
    state={kind:"submitting",snapshot:submitted};
    render();
    try{
      const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(submitted)});
      if(attempt!==requestSequence)return;
      if(!response.ok){
        const kind=response.status>=400&&response.status<500 ? "error" : "uncertain";
        state={kind,snapshot:submitted};render({focus:true});return;
      }
      state={kind:"success",snapshot:submitted};
      render({focus:true});
    }catch(error){
      if(attempt!==requestSequence)return;
      console.error("Contact form outcome is unknown:",error);
      state={kind:"uncertain",snapshot:submitted};
      render({focus:true});
    }
  });

  newRequest.addEventListener("click",()=>{
    requestSequence+=1;
    form.reset();
    state={kind:"editing",snapshot:null};
    render();
    form.elements.name.focus();
  });

  document.querySelectorAll("[data-service],[data-service-card]").forEach(node=>{
    const activate=()=>{
      if(state.kind==="submitting"||state.kind==="success")return;
      const value=node.dataset.service||node.dataset.serviceCard;
      if(serviceKeys[value])form.elements.service.value=value;
      document.getElementById("contact")?.scrollIntoView({behavior:"smooth"});
    };
    node.addEventListener("click",event=>{if(event.target.closest("a")&&node.dataset.serviceCard)return;activate();});
    if(node.dataset.serviceCard)node.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();activate();}});
  });
  document.addEventListener("parrot:language",()=>{
    if(state.kind==="editing"&&hasContextDraft)form.elements.message.value=contextMessages[language()]||contextMessages.en;
    render();
  });
  render();
})();
