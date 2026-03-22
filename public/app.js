const docsElem = document.getElementById('docs-data')
const docs = docsElem ? JSON.parse(docsElem.textContent) : {}

const orderMap = {
  cart: [],
  express: { status: false, cost: 40 },
  costume: { status: false, cost: 40 },

  // сюда будем класть ссылку на текущую модалку, чтобы:
  // - не открывать 2 модалки
  // - нормально закрывать по Escape
  modalOverlay: null,
  modalLang: 'ua',

docsMapObj: {
  'ua-passport': {
    id: 'ua-passport',
    title: { ua: 'Паспорт України', ru: 'Паспорт Украины' },
    minCount: 6,
    basePrice: 200,
    discountPrice: 100,
    addCount: 2,
    addPrice: 30,
  },
  'personal-file': {
    id: 'personal-file',
    title: { ua: 'Особова справа', ru: 'Личное дело' },
    minCount: 1,
    basePrice: 200,
    discountPrice: 100,
    addCount: 1,
    addPrice: 100,
  },
  'ubd': {
    id: 'ubd',
    title: { ua: 'Посвідчення УБД', ru: 'Удостоверение УБД' },
    minCount: 6,
    basePrice: 200,
    discountPrice: 100,
    addCount: 2,
    addPrice: 30,
  },
  'pass': {
    id: 'pass',
    title: { ua: 'Перепустка', ru: 'Пропуск' },
    minCount: 6,
    basePrice: 200,
    discountPrice: 100,
    addCount: 2,
    addPrice: 30,
  },
  'pension': {
    id: 'pension',
    title: { ua: 'Пенсійне посвідчення', ru: 'Пенсионное удост' },
    minCount: 4,
    basePrice: 200,
    discountPrice: 100,
    addCount: 2,
    addPrice: 40,
  },
  'foreign-passport': {
    id: 'foreign-passport',
    title: { ua: 'Дитячий паспорт', ru: 'Детский паспорт' },
    minCount: 1,
    basePrice: 200,
    discountPrice: 100,
    addCount: 1,
    addPrice: 100,
  },
  'schengen-visa': {
    id: 'schengen-visa',
    title: { ua: 'Шенгенська віза', ru: 'Шенгенская виза' },
    minCount: 6,
    basePrice: 200,
    discountPrice: 100,
    addCount: 2,
    addPrice: 30,
  },
  'student-card': {
    id: 'student-card',
    title: { ua: 'Студентський квиток', ru: 'Студенческий билет' },
    minCount: 6,
    basePrice: 200,
    discountPrice: 100,
    addCount: 2,
    addPrice: 30,
  },
  'green-card': {
    id: 'green-card',
    title: { ua: 'Green Card USA', ru: 'Green Card USA' },
    minCount: 4,
    basePrice: 200,
    discountPrice: 100,
    addCount: 2,
    addPrice: 40,
  },
},
}

orderMap.stateById = {}

for (let key in orderMap.docsMapObj) {
  orderMap.stateById[key] = {inCart: false, count: orderMap.docsMapObj[key].minCount}
}

//  GLOBAL EVENTS (DELEGATION)
document.addEventListener("click", (event) => {
    const burger = event.target.closest('.site-burger');
  const menu = event.target.closest('#mobileMenu');
  const menuLink = event.target.closest('#mobileMenu a');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!mobileMenu) return;

  // клик по бургеру
  if (burger) {
    if (mobileMenu.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu(burger, mobileMenu);      
    }
    return;
  }

  // клик по ссылке внутри меню
  if (menuLink) {
    closeMenu();
    return;
  }

  // клик внутри меню, но не по ссылке
  if (menu) {
    return;
  }

  // клик вне меню
  closeMenu();
  // 1) Кнопки выбора типа документа на странице
  const docTypeBtn = event.target.closest('.doc-button')
  if (docTypeBtn) {
    renderDocumentType(docTypeBtn)
    return
  }

  // 2) Открыть модалку
  const calcPriceBtn = event.target.closest('.calc-price-btn')
  if (calcPriceBtn) {
    const lang = calcPriceBtn.dataset.lang || 'ua'
    orderMap.modalLang = lang
    openModal(lang)
    return
  }

  // 3) Действия внутри модалки (и только если модалка реально открыта)
  const actionBtn = event.target.closest('[data-action]')  
  
  if (!actionBtn) return
  if (!orderMap.modalOverlay) return // модалка не открыта -> игнор

  const cart = document.querySelector('.modal-cart')
  const content = document.querySelector('.modal-content')
  if (!cart || !content) return

  const lang = orderMap.modalLang || 'ua'

  const id = actionBtn.value
  const action = actionBtn.dataset.action

  // На всякий: если id пустой
  if (!id) return

  if (action === "cart-remove") {
    removeCart(content, lang, cart);
    return
  }

  if (action === 'express') {
    orderMap.express.status = actionBtn.checked ? true : false
    renderCart(cart, lang) 
    return
  }
  if (action === 'costume') {
    orderMap.costume.status = actionBtn.checked ? true : false
    renderCart(cart, lang) 
    return
  }

  const currentPack = getCurrentPack(orderMap.docsMapObj, id)
  const currentState = orderMap.stateById[id]
  if (!currentPack || !currentState) return  

  if (action === 'add-active') {
    addPack(currentPack, currentState)
    const docBtn = document.querySelector(`.modal-btn[value="${id}"]`)
    if (docBtn) changeBtnState(docBtn)
  }

  if (action === 'delete') {
    deletePack(currentPack, currentState)
    const docBtn = document.querySelector(`.modal-btn[value="${id}"]`)
    if (docBtn) changeBtnState(docBtn)
  }

  if (action === 'plus') plusPrice(currentPack, currentState)

  if (action === 'min') {
    minusPrice(currentPack, currentState)
    renderCart(cart, lang) 
    return
  }

  renderCart(cart, lang)  
})

// Закрытие по Escape — теперь работает всегда
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  closeModalGlobal()
})



//  PAGE RENDER (doc type card)
function renderDocumentType(docTypeBtn) {
  const btnId = docTypeBtn.dataset.id
  const currentDoc = getCurrentPack(docs, btnId)
  if (!currentDoc) return // защита от кривого id

  const currentBtn = document.querySelector('.doc-active')
  if (currentBtn) currentBtn.classList.remove('doc-active')
  docTypeBtn.classList.add('doc-active')

  const docPhotoInfo = document.querySelector('.doc-photo-cont')
  if (!docPhotoInfo) return

  const lang = docTypeBtn.dataset.lang || 'ua'

  const title = currentDoc.title[lang]
  const image = currentDoc.image
  const desc = currentDoc.desc[lang]

  const priceStandard = currentDoc.prices.standard[lang]
  const priceStandardVal = currentDoc.prices.standard.value
  const priceExpress = currentDoc.prices.express[lang]
  const priceExpressVal = currentDoc.prices.express.value

  const sizeTop = currentDoc.size.top
  const sizeLeft = currentDoc.size.left

  const desc1 = currentDoc.cartDesc.desc1
  const desc2 = currentDoc.cartDesc.desc2
  const hasDesc = currentDoc.position

      //   <div class="doc-popular-image">  
      //   <div class="txt-desc" style="top:${position}">
      //     <span>${desc1}</span>
      //     <span>${desc2}</span>
      //   </div>   
      //   <img src="${image}" alt="${title}"  width="300" height="600" loading="lazy"/>
      // </div>

  docPhotoInfo.innerHTML = `

      <div class="doc-popular-image">
        <div class="doc-popular-media">
          <img src="${image}" alt="Green Card USA">
        </div>

        <div class="txt-desc" style="display:${hasDesc}">
          <span>${desc1}</span>
          <span>${desc2}</span>
        </div>
      </div>

      <div class="doc-desc">    
      <div class="doc-desc-head">
          <div class="doc-title">${title}</div>       
          <div>${desc}</div><hr>   

        </div>

        <div class="doc-price-small__row">
          <span class="doc-price__label">${priceStandard}</span>
          <span class="doc-price__value">${priceStandardVal} грн</span>
        </div>
        
      </div>

      <div class="doc-price">
        <div class="doc-price__row">
          <span class="doc-price__label">${priceStandard}</span>
          <span class="doc-price__value">${priceStandardVal} грн</span>
        </div>
        <div class="doc-calc-btns">
          <button class="calc-price-btn" data-lang="${lang}">Зателефонуйте</button>
          <button class="calc-price-btn" data-lang="${lang}">Порахувати</button>
        </div>
      </div>
    `
}

function isFirstPack(id) {
  return orderMap.cart.length > 0 && orderMap.cart[0].id === id
}

function getCurrentPack(object, btnId) {
  return object[btnId]  
}

//  STATE / ACTIONS
function addPack(currentPack, currentState) {
  if (currentState.inCart) return

  // на всякий: если count был накручен раньше — приводим к минимуму
  if (currentState.count < currentPack.minCount) {
    currentState.count = currentPack.minCount
  }

  orderMap.cart.push(currentPack)  
  currentState.inCart = true
}

function deletePack(currentPack, currentState) {
  const id = currentPack.id

  currentState.inCart = false
  currentState.count = currentPack.minCount

  for (let i = 0; i < orderMap.cart.length; i++) {
    if (orderMap.cart[i].id === id) {
      orderMap.cart.splice(i, 1)
      break
    }
  }

  if (orderMap.cart.length === 0) {
    orderMap.express.status = false
    orderMap.costume.status = false
  }
}

function plusPrice(currentPack, currentState) {
  // защита: нельзя плюсоваться, если не выбран тип
  if (!currentState.inCart) return
  currentState.count += currentPack.addCount
}

function minusPrice(currentPack, currentState) {
  // защита: нельзя минусоваться, если не выбран тип
  if (!currentState.inCart) return
  if (currentState.count === currentPack.minCount) return
  currentState.count -= currentPack.addCount

  // на всякий: не дать уйти ниже минимума
  if (currentState.count < currentPack.minCount) {
    currentState.count = currentPack.minCount
  }
}

function calculateTotalSum() {
  let sum = 0
  if (orderMap.express.status) sum += orderMap.express.cost
  if (orderMap.costume.status) sum += orderMap.costume.cost

  for (let i = 0; i < orderMap.cart.length; i++) {
    const item = orderMap.cart[i]
    const state = orderMap.stateById[item.id]
    if (!state) continue

    // базовая цена: первый выбранный тип = basePrice, остальные = discountPrice
    sum += (i === 0) ? item.basePrice : item.discountPrice

    const extra = state.count - item.minCount
    if (extra > 0) {
      const steps = Math.floor(extra / item.addCount)
      sum += steps * item.addPrice
    }
  }
  return sum
}

function calculateSum(currentPack) { 
  const state = orderMap.stateById[currentPack.id]
  if (!state) return 0

  const packPrice = isFirstPack(currentPack.id)
  ? currentPack.basePrice
  : currentPack.discountPrice


  const extra = state.count - currentPack.minCount
  if (extra <= 0) return packPrice

  const steps = Math.floor(extra / currentPack.addCount)
  return packPrice + (steps * currentPack.addPrice)
}


//  RENDER MODAL (top + cart)
function renderModalInner(content, lang, cart) {
  let priceHTML = ``  

  for (let key in orderMap.docsMapObj) {
    const item = orderMap.docsMapObj[key]
    const state = orderMap.stateById[item.id]
    if (!state) continue // защита: если забыли stateById

    priceHTML += `
      <div class="modal-item">
        <div class="modal-doc-title">${item.title[lang]}</div>        
        <div>              
          <button
            data-action="${state.inCart ? 'delete' : 'add-active'}"
            class="modal-btn ${state.inCart ? 'delete' : 'add-active'}"
            value="${item.id}"
          >${state.inCart ? 'Видалити' : 'Обрати'}</button>
        </div>
      </div>      
    `
  }
  content.innerHTML = priceHTML  

  renderCart(cart, lang)  
}

function changeBtnState(docBtn) {

  const isAddBtn = docBtn.dataset.action === 'add-active' ? true : false

  if (isAddBtn) {
    docBtn.classList.remove('add-active')
    docBtn.classList.add('delete')
    docBtn.dataset.action = 'delete'
    docBtn.textContent = 'Видалити'
  }
  else {
    docBtn.classList.remove('delete')
    docBtn.classList.add('add-active')
    docBtn.dataset.action = 'add-active'
    docBtn.textContent = 'Обрати'
  }

}

function renderCart(cart, lang) {
  let priceHTML = ``

  const isExpress = orderMap.express.status
  const addCostume = orderMap.costume.status

  if (orderMap.cart.length > 0) {
    priceHTML = `
    <div class="modal-cart-header">      
      <div class="cart-options"> 
        <div class="cart-option-item">   
          <div class="modal-checkbox">     
            <input type="checkbox" ${isExpress ? 'checked' : ''} data-action="express" value="express">
            <span>Термінове фото </span>            
          </div>
          <span class="cart-option-price">+${orderMap.express.cost} грн</span>
        </div>

        <div class="cart-option-item">   
          <div class="modal-checkbox">       
            <input type="checkbox" ${addCostume ? 'checked' : ''} data-action="costume" value="costume">
            <span>Підставити костюм/форму </span>
          </div>
          <span class="cart-option-price">+${orderMap.costume.cost} грн</span>
        </div>
      </div>
    </div>      
  `
  }

  priceHTML += `<div class="modal-cart-inner">`

  if (orderMap.cart.length < 1) {
    priceHTML += `<div class="modal-cart-inner-empty">ОБЕРІТЬ НЕОБХІДНИЙ КОМПЛЕКТ</div>`
  }

  for (let i = 0; i < orderMap.cart.length; i++) {
    const item = orderMap.cart[i]
    const state = orderMap.stateById[item.id]
    if (!state) continue
    const curSum = calculateSum(item)

    priceHTML += `
      <div class="modal-item">
        <div class="modal-doc-title">${item.title[lang]}</div>
        <div class="cart-count-container">
            <button data-action="min" class="min" value="${item.id}">-</button>
            <span class="cart-doc-count">${state.count}шт</span>
            <button data-action="plus" class="plus" value="${item.id}">+</button>
        </div>
        <div class="modal-cart-price">
        <span>${curSum} грн</span>
        <button data-action="delete" class="delete-pack" value="${item.id}" type="button" aria-label="Видалити комплект">
          🗑️
        </button>
        </div>
      </div>      
    `
  }
  priceHTML += `</div>`

  const totalSum = calculateTotalSum()
  const hasPack = orderMap.cart.length > 0 ? true : false

  cart.innerHTML = priceHTML + `
    <div class="modal-footer">
        <h3>Загальна сума: ${totalSum} грн</h3>
        <button style="display:${hasPack ? 'block' : 'none'}"
            data-action="cart-remove"
            class="modal-btn delete"
            value="cart-remove"
        >Видалити все</button>
    </div>
    `
}

function removeCart(content, lang, cart) {
  orderMap.cart = [];

  for (let key in orderMap.docsMapObj) {
    orderMap.stateById[key].inCart = false
    orderMap.stateById[key].count = orderMap.docsMapObj[key].minCount
  }


  orderMap.express.status = false
  orderMap.costume.status = false

  renderModalInner(content, lang, cart)
}


//  MODAL OPEN / CLOSE
function openModal(lang) {
  // не открываем вторую модалку поверх первой
  if (orderMap.modalOverlay) return

  // overlay
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'

  // modal window
  const modal = document.createElement('div')
  modal.className = 'modal'
  modal.innerHTML = `<h3 class="modal-title">Оберіть потрібний комплект</h3>`

  const pos = modalPosition() // ТУТ можно скроллить
  orderMap.modalMetrics = pos // сохранили

  modal.style.top = `${pos.modalTop}px`
  modal.style.height = `${pos.modalHeight}px`   

  // close button
  const closeBtn = document.createElement('button')
  closeBtn.className = 'modal-close'
  closeBtn.textContent = '×'

  // content
  const content = document.createElement('div')  
  content.className = 'modal-content'

  const cart = document.createElement('div')
  cart.className = 'modal-cart'

    // сборка
  modal.appendChild(closeBtn)
  modal.appendChild(content)
  modal.appendChild(cart)
  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  // сохраняем ссылку на открытую модалку
  orderMap.modalOverlay = overlay
  orderMap.modalLang = lang || 'ua'

  // первичный рендер
  renderModalInner(content, orderMap.modalLang, cart)

  // закрытие по кнопке
  closeBtn.addEventListener('click', closeModal)

  // закрытие по клику на фон
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal()
  })

  function closeModal() {
    overlay.remove()
    orderMap.modalOverlay = null
  }
}

function closeModalGlobal() {
  // закрытие снаружи (Escape), работает всегда
  if (!orderMap.modalOverlay) return
  orderMap.modalOverlay.remove()
  orderMap.modalOverlay = null
}

function modalPosition() {
    // скролл до контейнера
  const targetElem = document.querySelector('.doc-popular-cont')
  const DOMrect = targetElem.getBoundingClientRect() // получаем позицию элемента
  const absoluteTop = window.scrollY + DOMrect.top - (window.innerHeight / 2) + (DOMrect.height / 2) // считаем центрирование
  targetElem.classList.remove('doc-animation') // сбрасываем анимацию, чтобы можно было запустить повторно
  void targetElem.offsetHeight // "фокус" для перезапуска анимации
  targetElem.classList.add('doc-animation')

  window.scrollTo({
    top: absoluteTop,
    behavior: 'smooth'
  });

  const modalTop = window.scrollY + DOMrect.top - absoluteTop
  const modalHeight = DOMrect.height
  const cartHeight = modalHeight - 440  

  return {modalTop, modalHeight, cartHeight}
}


// BURGER MENU
function closeMenu() {
  const burger = document.getElementById('siteBurger')
  const mobileMenu = document.getElementById('mobileMenu')

  if (!burger || !mobileMenu) return

  burger.classList.remove('is-active')
  mobileMenu.classList.remove('is-open')
  burger.setAttribute('aria-expanded', 'false')
  document.body.classList.remove('menu-open')
}

function openMenu(burger, mobileMenu) {

  if (!burger || !mobileMenu) return

  burger.classList.add('is-active')
  mobileMenu.classList.add('is-open')
  burger.setAttribute('aria-expanded', 'true')
  document.body.classList.add('menu-open')
}


