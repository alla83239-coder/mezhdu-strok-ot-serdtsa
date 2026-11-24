const $=s=>document.querySelector(s), $=s=>[...document.querySelectorAll(s)],KEY="msxos_requests_v2";
const portraits=window.MS_PORTRAITS||{};
if(portraits.nastya && $("#nastyaPhoto")) $("#nastyaPhoto").src=portraits.nastya;
if(portraits.alla && $("#allaPhoto")) $("#allaPhoto").src=portraits.alla;
let requests=JSON.parse(localStorage.getItem(KEY)||"[]"),user=null;
const save=()=>localStorage.setItem(KEY,JSON.stringify(requests));
const open=id=>{$(id).classList.add("open");$(id).setAttribute("aria-hidden","false");document.body.style.overflow="hidden"};
const close=()=>{$$(".backdrop").forEach(x=>{x.classList.remove("open");x.setAttribute("aria-hidden","true")});document.body.style.overflow=""};
const bookingButtons=$$(".book");
const serviceSelect=$("#service");
bookingButtons.forEach(button=>{
  const option=document.createElement("option");
  option.value=button.dataset.service;
  option.textContent=button.dataset.service+" — "+button.dataset.author;
  option.dataset.author=button.dataset.author;
  serviceSelect.append(option);
});
$("#service").addEventListener("change",()=>{
  const option=$("#service").selectedOptions[0];
  if(option?.dataset.author)$("#author").value=option.dataset.author;
});
$$("[data-close]").forEach(button=>button.addEventListener("click",close));
$$(".backdrop").forEach(modal=>modal.addEventListener("click",event=>{if(event.target===modal)close()}));
document.addEventListener("keydown",event=>{if(event.key==="Escape")close()});
$("#menu").addEventListener("click",()=>{
  const nav=$("#nav"),expanded=$("#menu").getAttribute("aria-expanded")==="true";
  nav.classList.toggle("open");$("#menu").setAttribute("aria-expanded",String(!expanded));
});
$$("nav a").forEach(link=>link.addEventListener("click",()=>{$("#nav").classList.remove("open");$("#menu").setAttribute("aria-expanded","false")}));
function booking(service="",author="Алла"){
  $("#bookingForm").hidden=false;$("#bookingDone").hidden=true;
  $("#service").value=service;$("#author").value=author;
  if(service && !$("#service").value)$("#service").value="";
  open("#bookingModal");
}
bookingButtons.forEach(button=>button.addEventListener("click",()=>booking(button.dataset.service,button.dataset.author)));
$("#closingBook").addEventListener("click",()=>booking());
$("#bookingForm").addEventListener("submit",event=>{
  event.preventDefault();
  const request={
    id:Date.now(),service:$("#service").value,author:$("#author").value,
    date:$("#date").value,time:$("#time").value,name:$("#client").value.trim(),
    contact:$("#contact").value.trim(),comment:$("#comment").value.trim(),
    status:"Новая заявка",createdAt:new Date().toISOString()
  };
  requests.push(request);save();event.target.reset();
  $("#bookingForm").hidden=true;$("#bookingDone").hidden=false;
});
$("#loginOpen").addEventListener("click",()=>{renderAccount();open("#accountModal")});
$("#loginForm").addEventListener("submit",event=>{
  event.preventDefault();
  const name=$("#loginName").value.trim(),email=$("#email").value.trim();
  let admin=false;
  if(name.toLocaleLowerCase("ru-RU")==="администратор"){
    if(prompt("Демо-пароль администратора:")!=="demo2026"){alert("Неверный демо-пароль.");return}
    admin=true;
  }
  user={name,email,admin};renderAccount();
});
function renderAccount(){
  $("#loginPane").hidden=!!user;$("#dashboard").hidden=!user;
  if(!user)return;
  $("#dashName").textContent=user.name;$("#adminTab").hidden=!user.admin;
  drawOrders();drawAdmin();
}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]))}
function drawOrders(){
  const list=user.admin?requests:requests.filter(request=>
    request.name.toLocaleLowerCase("ru-RU")===user.name.toLocaleLowerCase("ru-RU") ||
    request.contact.toLocaleLowerCase("ru-RU")===user.email.toLocaleLowerCase("ru-RU")
  );
  $("#ordersPane").innerHTML=list.length?list.map(request=>
    '<div class="item"><b>'+escapeHtml(request.service)+'</b><p>'+escapeHtml(request.author)+' · '+escapeHtml(request.date||"дата не указана")+' '+escapeHtml(request.time||"")+'</p><p>'+escapeHtml(request.contact)+'</p><span class="status">'+escapeHtml(request.status)+'</span></div>'
  ).join(""):'<div class="empty">Пока нет заявок. Выберите услугу и отправьте запрос.</div>';
}
function drawAdmin(){
  if(!user.admin)return;
  $("#adminPane").innerHTML='<h3>Заявки клиентов</h3><p class="hint">Демо-данные доступны только в текущем браузере.</p>'+
    (requests.length?requests.map(request=>
      '<div class="admin-row"><div><b>'+escapeHtml(request.name)+'</b> · '+escapeHtml(request.service)+'<br>'+escapeHtml(request.author)+' · '+escapeHtml(request.contact)+' · '+escapeHtml(request.date||"без даты")+'</div><select data-id="'+request.id+'">'+
      ["Новая заявка","Связаться с клиентом","Подтверждена","Завершена","Отменена"].map(status=>'<option '+(status===request.status?"selected":"")+'>'+status+'</option>').join("")+
      '</select></div>'
    ).join(""):'<div class="empty">Заявок пока нет.</div>')+'<button class="button button-glass" id="csv">Экспорт заявок CSV</button>';
  $$("[data-id]").forEach(select=>select.addEventListener("change",()=>{
    const request=requests.find(item=>item.id===Number(select.dataset.id));
    if(request){request.status=select.value;save();drawOrders()}
  }));
  $("#csv").addEventListener("click",exportCsv);
}
$$(".tabs button").forEach(button=>button.addEventListener("click",()=>{
  $$(".tabs button").forEach(tab=>tab.classList.toggle("active",tab===button));
  ["orders","profile","admin"].forEach(name=>$("#"+name+"Pane").hidden=button.dataset.tab!==name);
  if(button.dataset.tab==="profile"){
    $("#profilePane").innerHTML='<div class="item"><b>'+escapeHtml(user.name)+'</b><p>'+escapeHtml(user.email)+'</p><button class="text-link" id="logout">Выйти из кабинета ↗</button></div>';
    $("#logout").addEventListener("click",()=>{user=null;renderAccount()});
  }
  if(button.dataset.tab==="admin")drawAdmin();
}));
function exportCsv(){
  const rows=[["Имя","Услуга","Автор","Дата","Время","Контакт","Комментарий","Статус"],
    ...requests.map(request=>[request.name,request.service,request.author,request.date,request.time,request.contact,request.comment,request.status])];
  const csv="\uFEFF"+rows.map(row=>row.map(value=>'"'+String(value||"").replaceAll('"','""')+'"').join(";")).join("\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const link=document.createElement("a");link.href=url;link.download="zayavki-mezhdu-strok.csv";link.click();URL.revokeObjectURL(url);
}
