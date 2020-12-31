var dateOrderMeals = document.querySelectorAll(".meals");
for (let i = 0; i < dateOrderMeals.length; i++) {
    if(dateOrderMeals[i].children.length === 0){
        dateOrderMeals[i].innerHTML = "<p>No Order</p>"
    }
}
// dateOrderMeals.forEach(dateOrder=>{ 
//     if(dateOrder.children.length === 0){
//         dateOrder.innerHTML = "<p>No Order</p>"
//     }
// })