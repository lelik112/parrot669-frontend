(() => {
  "use strict";
  const copy={
    en:{title:"Password recovery",email:"Account email",request:"Send recovery link",requestLead:"Enter the email used for your PARROT 669 account.",confirmLead:"Choose a new password for your account.",password:"New password",repeat:"Repeat new password",passwordHelp:"10–256 characters. All previous sessions will be signed out.",save:"Save new password",login:"Back to log in",messages:"Messages",again:"Request another link",busy:"Please wait…",sent:"If an account exists, a recovery email will be sent. Check your spam folder. If no email arrives, retry in a few minutes.",done:"Password updated. Log in again with your new password.",mismatch:"The passwords do not match.",invalid:"This link is invalid, expired or already used. Request a new one.",error:"Could not complete the request. Please try again.",passwordError:"Use between 10 and 256 characters."},
    es:{title:"Recuperar acceso",email:"Email de la cuenta",request:"Enviar enlace de recuperación",requestLead:"Introduce el email de tu cuenta de PARROT 669.",confirmLead:"Elige una nueva contraseña para tu cuenta.",password:"Nueva contraseña",repeat:"Repite la nueva contraseña",passwordHelp:"Entre 10 y 256 caracteres. Se cerrarán todas las sesiones anteriores.",save:"Guardar nueva contraseña",login:"Volver al inicio de sesión",messages:"Mensajes",again:"Pedir otro enlace",busy:"Un momento…",sent:"Si existe una cuenta, enviaremos un email de recuperación. Revisa spam. Si no llega, vuelve a intentarlo en unos minutos.",done:"Contraseña actualizada. Inicia sesión con la nueva contraseña.",mismatch:"Las contraseñas no coinciden.",invalid:"Este enlace no es válido, ha caducado o ya se ha usado. Solicita uno nuevo.",error:"No se pudo completar la solicitud. Inténtalo de nuevo.",passwordError:"Usa entre 10 y 256 caracteres."},
    ca:{title:"Recuperar l’accés",email:"Correu del compte",request:"Enviar l’enllaç de recuperació",requestLead:"Introdueix el correu del teu compte de PARROT 669.",confirmLead:"Tria una contrasenya nova per al compte.",password:"Contrasenya nova",repeat:"Repeteix la contrasenya nova",passwordHelp:"Entre 10 i 256 caràcters. Es tancaran totes les sessions anteriors.",save:"Desar la contrasenya nova",login:"Tornar a l’inici de sessió",messages:"Missatges",again:"Demanar un altre enllaç",busy:"Un moment…",sent:"Si el compte existeix, enviarem un correu de recuperació. Revisa el correu brossa. Si no arriba, torna-ho a provar d’aquí a uns minuts.",done:"Contrasenya actualitzada. Inicia sessió amb la contrasenya nova.",mismatch:"Les contrasenyes no coincideixen.",invalid:"Aquest enllaç no és vàlid, ha caducat o ja s’ha utilitzat. Demana’n un de nou.",error:"No s’ha pogut completar la petició. Torna-ho a provar.",passwordError:"Fes servir entre 10 i 256 caràcters."},
    ru:{title:"Восстановление доступа",email:"Email аккаунта",request:"Отправить ссылку",requestLead:"Укажите почту, на которую зарегистрирован аккаунт PARROT 669.",confirmLead:"Задайте новый пароль для своего аккаунта.",password:"Новый пароль",repeat:"Повторите новый пароль",passwordHelp:"От 10 до 256 символов. Все прежние сессии будут завершены.",save:"Сохранить новый пароль",login:"Вернуться ко входу",messages:"Сообщения",again:"Запросить новую ссылку",busy:"Подождите…",sent:"Если аккаунт существует, на почту придёт ссылка для восстановления. Проверьте папку «Спам». Если письма нет, повторите запрос через несколько минут.",done:"Пароль обновлён. Войдите заново с новым паролем.",mismatch:"Пароли не совпадают.",invalid:"Ссылка недействительна, устарела или уже использована. Запросите новую.",error:"Не удалось выполнить запрос. Попробуйте ещё раз.",passwordError:"Используйте от 10 до 256 символов."}
  };
  const $=id=>document.getElementById(id);
  const requestForm=$("recovery-request"), confirmForm=$("recovery-confirm"), status=$("recovery-status"), again=$("recovery-again");
  let token=new URLSearchParams(location.hash.slice(1)).get("token"), busy=false, completed=false, statusKey="", statusKind="";
  if(location.hash) history.replaceState(null,"",location.pathname+location.search);
  const initial=new URLSearchParams(location.search).get("lang")||localStorage.getItem("parrot669-language")||(navigator.language||"en").slice(0,2);
  let lang=copy[initial]?initial:"en";
  const t=key=>copy[lang][key];
  function render(){
    document.documentElement.lang=lang;document.title=`PARROT 669 — ${t("title")}`;
    document.querySelectorAll("[data-recovery-i18n]").forEach(el=>el.textContent=t(el.dataset.recoveryI18n));
    document.querySelectorAll("[data-recovery-lang]").forEach(el=>el.classList.toggle("active",el.dataset.recoveryLang===lang));
    $("recovery-lead").textContent=completed?"":t(token?"confirmLead":"requestLead");
    requestForm.hidden=Boolean(token)||completed;confirmForm.hidden=!token||completed;
    status.textContent=statusKey?t(statusKey):"";status.className=statusKind;
    status.setAttribute("role",statusKind==="error"?"alert":"status");
  }
  function message(key,kind=""){statusKey=key;statusKind=kind;render()}
  function setBusy(value){busy=value;document.querySelectorAll("form input,form button,#recovery-again").forEach(el=>el.disabled=value)}
  async function post(action,body){
    const response=await fetch(`/api/host/auth/password-reset/${action}`,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(body)});
    if(!response.ok){
      const detail=await response.json().catch(()=>({}));
      const error=new Error(detail.error||"request failed");error.status=response.status;throw error;
    }
  }
  requestForm.addEventListener("submit",async event=>{
    event.preventDefault();if(busy||!requestForm.reportValidity()) return;
    setBusy(true);message("busy");
    try{await post("request",{email:requestForm.elements.email.value.trim(),language:lang});message("sent","success")}
    catch{message("error","error")}
    finally{setBusy(false)}
  });
  confirmForm.addEventListener("submit",async event=>{
    event.preventDefault();if(busy||!token||!confirmForm.reportValidity()) return;
    if(confirmForm.elements.password.value!==confirmForm.elements.repeat.value){message("mismatch","error");return}
    setBusy(true);message("busy");
    try{
      await post("confirm",{token,password:confirmForm.elements.password.value,language:lang});
      token=null;completed=true;confirmForm.reset();again.hidden=true;message("done","success");
    }catch(error){
      const invalid=error.message==="reset token is invalid or expired";
      message(invalid?"invalid":error.message.includes("password must")?"passwordError":"error","error");
      again.hidden=!invalid;
    }finally{setBusy(false)}
  });
  again.addEventListener("click",()=>{if(busy)return;token=null;confirmForm.reset();again.hidden=true;message("")});
  document.querySelectorAll("[data-recovery-lang]").forEach(button=>button.addEventListener("click",()=>{lang=button.dataset.recoveryLang;localStorage.setItem("parrot669-language",lang);render()}));
  if(token&&!/^[A-Za-z0-9_-]{43}$/.test(token)){token=null;message("invalid","error")}else render();
})();
