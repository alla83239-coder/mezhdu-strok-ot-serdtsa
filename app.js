const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const serviceList=window.SITE_SERVICES||[];
const REQUESTS_KEY="msos_client_requests_v3";
const USERS_KEY="msos_demo_users_v1";
const SESSION_KEY="msos_demo_session_v1";

function esc(value){
 return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function readJSON(key,fallback){
 try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}
}
function getRequests(){return readJSON(REQUESTS_KEY,[])}
function saveRequests(items){localStorage.setItem(REQUESTS_KEY,JSON.stringify(items))}
function getUsers(){return readJSON(USERS_KEY,[])}
function saveUsers(items){localStorage.setItem(USERS_KEY,JSON.stringify(items))}
function currentUsername(){return sessionStorage.getItem(SESSION_KEY)||""}
function localDateValue(date=new Date()){
 const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);
 return local.toISOString().slice(0,10);
}
function normaliseLogin(value){return String(value||"").trim().toLocaleLowerCase("ru-RU")}
function base64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes)))}
function unbase64(value){return Uint8Array.from(atob(value),char=>char.charCodeAt(0))}
async function passwordHash(password,saltText){
 if(!window.crypto?.subtle)throw new Error("Браузер не поддерживает безопасное создание демо-пароля. Откройте сайт по HTTPS в современном браузере.");
 const salt=saltText?unbase64(saltText):crypto.getRandomValues(new Uint8Array(16));
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:120000,hash:"SHA-256"},key,256);
 return {salt:base64(salt),hash:base64(bits)};
}

const menuButton=$("#menuButton"),mainNav=$("#mainNav");
if(menuButton&&mainNav){
 menuButton.addEventListener("click",()=>{
  const isOpen=mainNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded",String(isOpen));
 });
 $$(".main-nav a").forEach(link=>link.addEventListener("click",()=>{
  mainNav.classList.remove("open");menuButton.setAttribute("aria-expanded","false");
 }));
}
const currentPage=location.pathname.split("/").pop()||"index.html";
const navPageMap={"index.html":"index","about.html":"about","tarot.html":"tarot","matrices.html":"matrices","mak.html":"mak","library.html":"library"};
$$(".main-nav a").forEach(link=>{if(link.dataset.page===navPageMap[currentPage])link.classList.add("active")});

function renderCatalog(){
 const grid=$("#serviceGrid");if(!grid)return;
 const category=grid.dataset.category;
 const list=serviceList.filter(service=>service.category===category);
 grid.innerHTML=list.map((service,index)=>{
  const kind=category==="matrix"?"matrix-card":category==="mak"?"mak-card":"";
  const featured=service.id==="tarot-story"?"featured-story":"";
  return '<a class="service-card '+kind+" "+featured+'" href="service.html?id='+encodeURIComponent(service.id)+'">'+
   '<div class="service-number"><span>'+String(index+1).padStart(2,"0")+' / '+esc(service.type)+'</span><span class="service-symbol">✧</span></div>'+
   '<h3>'+esc(service.title)+'</h3><p>'+esc(service.short)+'</p>'+
   '<span class="service-open">Подробнее об услуге <b>↗</b></span></a>';
 }).join("");
}
renderCatalog();

function renderService(){
 const host=$("#serviceTitle");if(!host)return;
 const id=new URLSearchParams(location.search).get("id");
 const service=serviceList.find(item=>item.id===id);
 if(!service){
  host.textContent="Услуга не найдена";
  $("#serviceIntro").textContent="Вернитесь в каталог и выберите интересующее направление.";
  return;
 }
 $("#serviceType").textContent=service.type;
 host.textContent=service.title;
 $("#serviceBreadcrumb").textContent=service.title;
 $("#serviceIntro").textContent=service.intro;
 $("#serviceIncludes").innerHTML=service.includes.map(item=>"<li>"+esc(item)+"</li>").join("");
 $("#serviceFormat").textContent=service.format;
 $("#serviceDuration").textContent="Длительность: "+service.duration;
 $("#serviceAuthor").textContent=service.author;
 $("#servicePrice").textContent=service.price;
 const priceLink=$("#servicePriceLink");
 if(service.priceUrl){priceLink.href=service.priceUrl;priceLink.hidden=false}
 $("#serviceCategoryLink").href=service.categoryUrl;
 $("#serviceCategoryLink").textContent=service.categoryTitle;
 $("#serviceBack").href=service.categoryUrl;
 $("#serviceBook").href="booking.html?service="+encodeURIComponent(service.id);
}
renderService();

function setupBooking(){
 const form=$("#bookingForm");if(!form)return;
 const select=$("#bookingService");
 const dateInput=$("#bookingDate");
 select.innerHTML='<option value="">Выберите услугу</option>'+
  serviceList.map(service=>'<option value="'+esc(service.id)+'">'+esc(service.title)+' — '+esc(service.author)+'</option>').join("");
 const params=new URLSearchParams(location.search);
 if(params.has("service"))select.value=params.get("service");

 if(dateInput){
  dateInput.min=localDateValue();
  dateInput.addEventListener("focus",()=>{dateInput.min=localDateValue()});
  dateInput.addEventListener("change",()=>{
   dateInput.setCustomValidity(dateInput.value&&dateInput.value<dateInput.min?"Выберите сегодняшнюю или будущую дату.":"");
  });
  const calendarButton=$("#calendarTrigger");
  if(calendarButton)calendarButton.addEventListener("click",()=>{
   dateInput.min=localDateValue();
   try{if(typeof dateInput.showPicker==="function")dateInput.showPicker();else{dateInput.focus();dateInput.click()}}
   catch{dateInput.focus();dateInput.click()}
  });
 }
 function updateSummary(){
  const service=serviceList.find(item=>item.id===select.value);
  $("#bookingServiceInfo").textContent=service?
   service.title+" · "+service.author+" · "+service.format:
   "Выберите услугу, чтобы увидеть краткую информацию.";
 }
 select.addEventListener("change",updateSummary);updateSummary();
 let step=1;
 function showStep(next){
  step=next;
  $$(".booking-step").forEach(element=>element.classList.toggle("active",Number(element.dataset.step)===step));
  $$("[data-step-indicator]").forEach(element=>element.classList.toggle("active",Number(element.dataset.stepIndicator)<=step));
  const heading=$(".booking-step.active h2");if(heading)heading.focus?.();
 }
 $$("[data-next]").forEach(button=>button.addEventListener("click",()=>{
  const required=$$(".booking-step.active [required]");
  for(const field of required){if(!field.reportValidity())return}
  if(step===2&&dateInput){
   dateInput.min=localDateValue();
   if(dateInput.value&&dateInput.value<dateInput.min){dateInput.setCustomValidity("Выберите сегодняшнюю или будущую дату.");dateInput.reportValidity();return}
  }
  if(step<3)showStep(step+1);
 }));
 $$("[data-prev]").forEach(button=>button.addEventListener("click",()=>showStep(Math.max(1,step-1))));
 form.addEventListener("submit",event=>{
  event.preventDefault();
  if(!select.value||!$("#bookingName").value.trim()||!$("#bookingContact").value.trim())return;
  if(dateInput){
   dateInput.min=localDateValue();
   if(dateInput.value&&dateInput.value<dateInput.min){dateInput.setCustomValidity("Выберите сегодняшнюю или будущую дату.");dateInput.reportValidity();showStep(2);return}
  }
  const service=serviceList.find(item=>item.id===select.value);
  if(!service)return;
  const owner=currentUsername();
  const item={
   id:Date.now(),serviceId:service.id,service:service.title,author:service.author,
   date:dateInput?.value||"",time:$("#bookingTime").value,zone:$("#bookingZone").value,
   name:$("#bookingName").value.trim(),contact:$("#bookingContact").value.trim(),
   comment:$("#bookingComment").value.trim(),ownerUsername:owner||null,
   status:"Новая заявка",createdAt:new Date().toISOString()
  };
  const items=getRequests();items.push(item);saveRequests(items);
  form.hidden=true;$("#bookingSuccess").hidden=false;
 });
}
setupBooking();

function setupAccount(){
 const auth=$("#accountAuth"),loginForm=$("#loginForm"),registerForm=$("#registerForm");
 const dashboard=$("#accountDashboard");
 if(!auth||!loginForm||!registerForm||!dashboard)return;
 const loginPane=$("#loginPane"),registerPane=$("#registerPane");
 const message=$("#authMessage");
 const setMessage=(text,error=false)=>{message.textContent=text;message.classList.toggle("error",error)};
 function setAuthTab(which){
  const login=which==="login";
  loginPane.hidden=!login;registerPane.hidden=login;
  $("#showLogin").classList.toggle("active",login);
  $("#showRegister").classList.toggle("active",!login);
  $("#showLogin").setAttribute("aria-selected",String(login));
  $("#showRegister").setAttribute("aria-selected",String(!login));
  setMessage("");
 }
 $("#showLogin").addEventListener("click",()=>setAuthTab("login"));
 $("#showRegister").addEventListener("click",()=>setAuthTab("register"));
 function displayAccount(username){
  const user=getUsers().find(item=>item.loginKey===normaliseLogin(username));
  if(!user){sessionStorage.removeItem(SESSION_KEY);return false}
  auth.hidden=true;dashboard.hidden=false;
  $("#accountUserName").textContent=user.username;
  $("#accountUserEmail").textContent=user.email||"Локальный профиль";
  const requests=getRequests().filter(item=>
   item.ownerUsername===user.loginKey||
   (!item.ownerUsername&&normaliseLogin(item.name)===user.loginKey)
  );
  $("#accountRequests").innerHTML=requests.length?requests.map(item=>
   '<div class="request-card"><b>'+esc(item.service)+'</b><span>'+esc(item.author)+' · '+esc(item.date||"дата не указана")+' '+esc(item.time||"")+'</span><br><span>Статус: '+esc(item.status)+'</span></div>'
  ).join(""):'<div class="selection-summary">Пока нет заявок, привязанных к этому аккаунту. При создании следующей заявки в этом браузере она появится здесь.</div>';
  return true;
 }
 registerForm.addEventListener("submit",async event=>{
  event.preventDefault();setMessage("");
  const username=$("#registerUsername").value.trim();
  const key=normaliseLogin(username);
  const email=$("#registerEmail").value.trim();
  const password=$("#registerPassword").value;
  const repeated=$("#registerPasswordRepeat").value;
  if(username.length<3){setMessage("Логин должен содержать не менее 3 символов.",true);return}
  if(password.length<8){setMessage("Пароль должен содержать не менее 8 символов.",true);return}
  if(password!==repeated){setMessage("Пароли не совпадают. Проверьте оба поля.",true);return}
  const users=getUsers();
  if(users.some(user=>user.loginKey===key)){setMessage("Этот логин уже занят. Выберите другой.",true);return}
  const submit=registerForm.querySelector('button[type="submit"],button:not([type])');
  if(submit){submit.disabled=true;submit.textContent="Создаём аккаунт…"}
  try{
   const credentials=await passwordHash(password);
   users.push({username,loginKey:key,email,salt:credentials.salt,passwordHash:credentials.hash,createdAt:new Date().toISOString()});
   saveUsers(users);sessionStorage.setItem(SESSION_KEY,key);displayAccount(key);
  }catch(error){setMessage(error.message||"Не удалось создать аккаунт.",true)}
  finally{if(submit){submit.disabled=false;submit.innerHTML='Зарегистрироваться <span>↗</span>'}}
 });
 loginForm.addEventListener("submit",async event=>{
  event.preventDefault();setMessage("");
  const key=normaliseLogin($("#loginUsername").value);
  const password=$("#loginPassword").value;
  const user=getUsers().find(item=>item.loginKey===key);
  if(!user){setMessage("Аккаунт с таким логином не найден. Проверьте логин или зарегистрируйтесь.",true);return}
  const submit=loginForm.querySelector("button");
  if(submit){submit.disabled=true;submit.textContent="Проверяем…"}
  try{
   const credentials=await passwordHash(password,user.salt);
   if(credentials.hash!==user.passwordHash){setMessage("Неверный логин или пароль.",true);return}
   sessionStorage.setItem(SESSION_KEY,key);displayAccount(key);
  }catch(error){setMessage(error.message||"Не удалось выполнить вход.",true)}
  finally{if(submit){submit.disabled=false;submit.innerHTML='Войти <span>↗</span>'}}
 });
 $("#accountLogout").addEventListener("click",()=>{
  sessionStorage.removeItem(SESSION_KEY);dashboard.hidden=true;auth.hidden=false;
  loginForm.reset();registerForm.reset();setAuthTab("login");
 });
 const existing=currentUsername();
 if(existing)displayAccount(existing);
}
setupAccount();

/* Every internal HTML link opens a separate screen with a short fade transition. */
document.addEventListener("click",event=>{
 const link=event.target.closest("a[href]");
 if(!link||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 if(link.target&&link.target!=="_self")return;
 const href=link.getAttribute("href");
 if(!href||href.startsWith("#")||href.startsWith("mailto:")||href.startsWith("tel:"))return;
 let target;try{target=new URL(href,window.location.href)}catch{return}
 if(target.origin!==window.location.origin||!target.pathname.toLowerCase().endsWith(".html"))return;
 event.preventDefault();
 document.body.classList.add("screen-leaving");
 window.setTimeout(()=>{window.location.href=target.href},150);
});
