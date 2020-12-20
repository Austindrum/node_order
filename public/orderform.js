var dateOrderMeals = document.querySelectorAll(".meals");
dateOrderMeals.forEach(dateOrder=>{ 
    if(dateOrder.children.length === 0){
        dateOrder.innerHTML = "<p>No Order</p>"
    }
})