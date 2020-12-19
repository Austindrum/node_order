var prices = Array.from(document.querySelectorAll(".meal-price"));
var totalPrice = document.getElementById("price");
var priceAdd = 0; 
prices.forEach(price=>{
    priceAdd += parseInt(price.textContent);
})
totalPrice.innerHTML = priceAdd;