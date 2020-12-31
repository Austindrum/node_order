var tempprices = document.querySelectorAll(".meal-price");
var prices = [];
for (let i = 0; i < tempprices.length; i++) {
    prices.push(tempprices[i]);
}
var totalPrice = document.getElementById("price");
var priceAdd = 0;
for (let i = 0; i < prices.length; i++) {
    priceAdd += parseInt(prices[i].textContent);
}
// prices.forEach(price=>{
//     priceAdd += parseInt(price.textContent);
// })
totalPrice.innerHTML = priceAdd;