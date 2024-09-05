/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };
  
  class Product {
    constructor(id, data) {
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

      console.log('new Product:', thisProduct);
    }

    renderInMenu() {
      const thisProduct = this;

      // generate HTML based on template
      const generatedHTML = templates.menuProduct(thisProduct.data);

      // create element using utils.createDOMFromHTML 
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      // find menu container 
      const menuContainer = document.querySelector(select.containerOf.menu);

      // add element to menu
      menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion() {
      const thisProduct = this;

      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        event.preventDefault();

        const activeProduct = document.querySelector(select.all.menuProductsActive);

        if (activeProduct && activeProduct !== thisProduct.element) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }

        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm() {
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });

      console.log('initOrderForm:', thisProduct);
    }

    initAmountWidget(){
      const thisProduct = this;
  
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
      });
    }
    
    processOrder() {
      const thisProduct = this;
      console.log('processOrder:', thisProduct);
  
      const formData = utils.serializeFormToObject(thisProduct.form);
      console.log('formData', formData);
  
      let price = thisProduct.data.price;
  
      for (let paramId in thisProduct.data.params) {
          const param = thisProduct.data.params[paramId];
          console.log(paramId, param);
  
          for (let optionId in param.options) {
              const option = param.options[optionId];
              console.log(optionId, option);
              const isDefaultOption = option.default;
              const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
  
              if (optionSelected) {
                  if (!isDefaultOption) {
                      price += option.price;
                  }
              } else {
                  if (isDefaultOption) {
                      price -= option.price;
                  }
              }
  
              const image = thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`);
              
              if (image) {
                  if (optionSelected) {
                      image.classList.add(classNames.menuProduct.imageVisible);
                  } else {
                      image.classList.remove(classNames.menuProduct.imageVisible);
                  }
              }
          }
      }
      thisProduct.priceSingle = price;

      //  multiply price by amount
      price *= thisProduct.amountWidget.value;

      thisProduct.price = price;

      thisProduct.priceElem.innerHTML = price;
  }
  
  addToCart (){
    const thisProduct = this;

    const productSummary = thisProduct.prepareCartProduct();
    app.cart.add(productSummary);
  }

  prepareCartProduct (){
    const thisProduct = this;
    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      price: thisProduct.price,
      priceSingle: thisProduct.priceSingle,
      params: thisProduct.prepareCartProductParams(),
    };
    console.log(productSummary);
    return productSummary;
  }

  prepareCartProductParams (){
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};

  // for very category (param)
  for(let paramId in thisProduct.data.params) {
    const param = thisProduct.data.params[paramId];

    // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
    params[paramId] = {
      label: param.label,
      options: {}
    }

    // for every option in this category
    for(let optionId in param.options) {
      const option = param.options[optionId];
      const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

      if(optionSelected) {
        // option is selected!
        params[paramId].options[optionId] = option.label;
      }
    }
  }

  return params;

  }
}

class AmountWidget {
  constructor(element) {
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value || settings.amountWidget.defaultValue);

      thisWidget.initActions();

      console.log('AmountWidget:', thisWidget);
      console.log('constructor arguments:', element);
  }

  getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);

      console.log('Elements:', {
          input: thisWidget.input,
          linkDecrease: thisWidget.linkDecrease,
          linkIncrease: thisWidget.linkIncrease
      });
  }

  setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value);
      const minValue = settings.amountWidget.defaultMin;
      const maxValue = settings.amountWidget.defaultMax;

      if (thisWidget.value !== newValue &&
         !isNaN(newValue) && 
         newValue >= minValue && 
         newValue <= maxValue) {

          thisWidget.value = newValue;
          thisWidget.input.value = thisWidget.value;
          thisWidget.announce();
          console.log('Value set to:', thisWidget.value);
      } else {
          console.log('Value not changed:', {
              current: thisWidget.value,
              newValue: newValue,
              reason: newValue < minValue ? 'below minimum' : newValue > maxValue ? 'above maximum' : 'unchanged or invalid'
          });
      }
  }

  initActions() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function() {
          console.log('Input changed to:', thisWidget.input.value);
          thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event) {
          event.preventDefault();
          console.log('Decrease clicked');
          thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event) {
          event.preventDefault();
          console.log('Increase clicked');
          thisWidget.setValue(thisWidget.value + 1);
      });

  }

  announce() {
      const thisWidget = this;

      const event = new CustomEvent('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
  }
}

class Cart {
constructor(element){
  const thisCart = this;

  thisCart.products = [];

  thisCart.getElements(element);
  thisCart.initActions();

  console.log('new Cart', thisCart);
}

getElements(element){
  const thisCart = this;

  thisCart.dom = {};

  thisCart.dom.wrapper = element;

  thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);

  thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);

  thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
  thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
  thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
  thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);

  thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);

  thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
  thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
}

initActions(){
  const thisCart = this;
  
  thisCart.dom.toggleTrigger.addEventListener('click', function(){
    thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
  });
  
  thisCart.dom.productList.addEventListener('updated', function(){
    thisCart.update();
  });
  
  thisCart.dom.productList.addEventListener('remove', function(event){
    thisCart.remove(event.detail.cartProduct);
  });

  thisCart.dom.form.addEventListener('submit', function (event) {
    event.preventDefault();
    thisCart.sendOrder();
  });
}

add(menuProduct){
  const thisCart = this;

  console.log('adding product', menuProduct);

  // Prepare the data for the template
  const generatedHTML = templates.cartProduct(menuProduct);

  // change HTML for DOM element
  const generatedDOM = utils.createDOMFromHTML(generatedHTML);

  // Add DOM element to product list in basket
  thisCart.dom.productList.appendChild(generatedDOM);

  // Add a product to the board in the cart
  thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

  console.log('thisCart.products:', thisCart.products);

  thisCart.update();
  }
  
  update(){
    const thisCart = this;
  
    let deliveryFee = settings.cart.defaultDeliveryFee;
    let subtotalPrice = 0;
    let totalNumber = 0;
  
    for(let product of thisCart.products){
      subtotalPrice += product.price;
      totalNumber += product.amount;
    }
  
    if (subtotalPrice === 0){
      deliveryFee = 0;
    }
  
    thisCart.subtotalPrice = subtotalPrice;
    thisCart.totalNumber = totalNumber;
    thisCart.totalPrice = subtotalPrice + deliveryFee;
  
    thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
    thisCart.dom.deliveryFee.innerHTML = deliveryFee;
  
    for(let priceElem of thisCart.dom.totalPrice) {
      priceElem.innerHTML = thisCart.totalPrice;
    }
  
    thisCart.dom.totalNumber.innerHTML = totalNumber;
  }
  
  remove(cartProduct){
    const thisCart = this;

    cartProduct.dom.wrapper.remove();

    // delete product from thisCart.Product array
    const indexOfProduct = thisCart.products.indexOf(cartProduct);
      if(indexOfProduct !== -1){
        thisCart.products.splice(indexOfProduct, 1);
      }
      thisCart.update();
  }
  sendOrder(){
    const thisCart = this;
 
    const url = settings.db.url + '/' + settings.db.orders;
    
    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: settings.cart.defaultDeliveryFee,
      products: []
    };
    
    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
  
    fetch(url, options)
      .then(function(response) {
        return response.json();
      })
      .then(function(parsedResponse) {
        console.log('parsedResponse', parsedResponse);
      });
  }
  
}

class CartProduct {
  constructor(menuProduct, element){
    const thisCartProduct = this;
    thisCartProduct.id = menuProduct.id;
    thisCartProduct.name = menuProduct.name;
    thisCartProduct.amount = menuProduct.amount;
    thisCartProduct.price = menuProduct.price;
    thisCartProduct.priceSingle = menuProduct.priceSingle;
    thisCartProduct.params = menuProduct.params;

    thisCartProduct.dom = {};
    thisCartProduct.dom.wrapper = element;
  }
  
  getData(){
    const thisCartProduct = this;
    
    return {
      id: thisCartProduct.id,
      name: thisCartProduct.name,
      amount: thisCartProduct.amount,
      price: thisCartProduct.price,
      priceSingle: thisCartProduct.priceSingle,
      params: thisCartProduct.params,
    };
  }
  
  getElements(element) {
    const thisCartProduct = this;
  
    thisCartProduct.dom = {};
  
    thisCartProduct.dom.wrapper = element;
  
    thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
    thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
    thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
    thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
  }
  
  initAmountWidget(){
    const thisCartProduct = this;

    thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);

    thisCartProduct.dom.amountWidget.addEventListener('updated', function() {
      thisCartProduct.updateAmountAndPrice();
      thisCartProduct.cart.update();
    });
  }

  updateAmountAndPrice(){
    const thisCartProduct = this;

    thisCartProduct.amount = thisCartProduct.amountWidget.value;

    thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;

    thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
  }

  remove(){
    const thisCartProduct = this;

    const event = new CustomEvent('remove', {
      bubbles: true,
      detail: {
        cartProduct: thisCartProduct,
      }
    });
    thisCartProduct.dom.wrapper.dispatchEvent(event);
  }

  initActions(){
    const thisCartProduct = this;

    thisCartProduct.dom.edit.addEventListener('click', function(event){
      event.preventDefault();
    });
    thisCartProduct.dom.remove.addEventListener('click', function(event){
      event.preventDefault();
      thisCartProduct.remove();
    });
  }
  
}


    const app = {
      initData: function () {
        const thisApp = this;
        thisApp.data = {};
        const url = settings.db.url + '/' + settings.db.products;

        fetch(url)
          .then(function(rawResponse){
            return rawResponse.json();
          })
          .then(function(parasedResponse){
            console.log('parasedResponse', parasedResponse);
          thisApp.data.products = parasedResponse; 
          
          thisApp.initMenu();
          });
          
        console.log('thisApp.data:', thisApp.data); // Checking if data is loaded
      },


      initMenu: function () {
        const thisApp = this;
        console.log('thisApp.data:', thisApp.data); // Checking if data is accessible
        for (let productData in thisApp.data.products) {
         new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
        }
      },

      init: function () {
        const thisApp = this;
        console.log('*** App starting ***');
        console.log('thisApp:', thisApp);
        console.log('classNames:', classNames);
        console.log('settings:', settings);
        console.log('templates:', templates);

        thisApp.initData();
        thisApp.initCart();
      },

      initCart: function(){
        const thisApp = this;
        
        const cartElem = document.querySelector(select.containerOf.cart);
        thisApp.cart = new Cart (cartElem);
      },
    };

  app.init();
}
