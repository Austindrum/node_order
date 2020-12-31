var tempprices = document.querySelectorAll(".meal-price");
var prices = [];
tempprices.forEach(function(price){
    prices.push(price);
})
var totalPrice = document.getElementById("price");
var priceAdd = 0;
for (let i = 0; i < prices.length; i++) {
    priceAdd += parseInt(prices[i].textContent);
}
// prices.forEach(price=>{
//     priceAdd += parseInt(price.textContent);
// })
totalPrice.innerHTML = priceAdd;