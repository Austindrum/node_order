var targetDay = document.getElementsByClassName("target-date")[0].dataset.date.split("-");
var tempdateOrders = document.querySelectorAll(".date-order").length > 0 ? document.getElementsByClassName("date-order") : [];
var dateOrders = [];
for (let i = 0; i < tempdateOrders.length; i++) {
    dateOrders.push(tempdateOrders[i]);
}
var Cal = function(divId) {
    //Store div id
    this.divId = divId;
    // Days of week, starting on Sunday
    this.DaysOfWeek = [
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat'
    ];
    // Months, stating on January
    this.Months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12' ];
    // Set the current month, year
    this.currMonth = parseInt(targetDay[1]) - 1;
    this.currYear = parseInt(targetDay[0]);
    this.currDay = parseInt(targetDay[2]);
    this.chkY = this.currYear;
    this.chkM = this.currMonth;
};
// Goes to next month
Cal.prototype.nextMonth = function() {
    if ( this.currMonth == 11 ) {
        this.currMonth = 0
        this.chkM = 0

        this.currYear = this.currYear + 1;
        this.chkY = this.chkY + 1;
    }
    else {
        this.chkM = this.chkM + 1;
        this.currMonth = this.currMonth + 1;
    }
    this.showcurr();
};
// Goes to previous month
Cal.prototype.previousMonth = function() {
    if ( this.currMonth == 0 ) {
        this.currMonth = 11;
        this.chkM = 11;

        this.currYear = this.currYear - 1;
        this.chkY = this.chkY - 1;

    }
    else {
        this.chkM = this.chkM - 1;
        this.currMonth = this.currMonth - 1;
    }
    this.showcurr();
};
// Show current month
Cal.prototype.showcurr = function() {
    this.showMonth(this.currYear, this.currMonth);
};
// Show month (year, month)
Cal.prototype.showMonth = function(y, m) {
    var d = new Date()
    // First day of the week in the selected month
    , firstDayOfMonth = new Date(y, m, 1).getDay()
    // Last day of the selected month
    , lastDateOfMonth =  new Date(y, m+1, 0).getDate()
    // Last day of the previous month
    , lastDayOfLastMonth = m == 0 ? new Date(y-1, 11, 0).getDate() : new Date(y, m, 0).getDate();
    var html = '<table>';

    // Write selected month and year
    html += '<thead><tr>';
    html += '<td colspan="7">'  + y + '-' + this.Months[m] + '</td>';
    html += '</tr></thead>';

    // Write the header of the days of the week
    html += '<tr class="days">';
    for(var i=0; i < this.DaysOfWeek.length;i++) {
        html += '<td>' + this.DaysOfWeek[i] + '</td>';
    }
    html += '</tr>';

    // Write the days
    var i=1;
    do {
        var dow = new Date(y, m, i).getDay();
        // If Sunday, start new row
        if ( dow == 0 ) {
            html += '<tr>';
        }
        // If not Sunday but first day of the month
        // it will write the last days from the previous month
        else if ( i == 1 ) {
            html += '<tr>';
            var k = lastDayOfLastMonth - firstDayOfMonth+1;
            for(var j=0; j < firstDayOfMonth; j++) {
                html += '<td class="not-current">' + k + '</td>';
                k++;
            }
        }
        // Write the current day in the loop
        let paramMonth = (this.currMonth + 1) < 10 ? "0" + (this.currMonth + 1) : this.currMonth + 1;
        let paramDate = i < 10 ? "0" + i : i;
        let paramYear = this.currYear;
        let isExsit = dateOrders.some(function(order){
            return order.dataset.orderdate === paramYear + '-' + paramMonth + '-' + paramDate;
        })
        if (this.chkY == this.currYear && this.chkM == this.currMonth && i == this.currDay) {
            if(isExsit){
                html += '<td class="today"><span class="light"></span><a href="/order/' + this.currYear + '-' + paramMonth + '-' + paramDate +'">' + i + '</a></td>';
            }else{
                html += '<td class="today"><a href="/order/' + this.currYear + '-' + paramMonth + '-' + paramDate +'">' + i + '</a></td>';
            }
        } else {
            if(isExsit){
                html += '<td class="normal"><span class="light"></span><a href="/order/' + this.currYear + '-' + paramMonth + '-' + paramDate +'">' + i + '</a></td>';
            }else{
                html += '<td class="normal"><a href="/order/' + this.currYear + '-' + paramMonth + '-' + paramDate +'">' + i + '</a></td>';
            }
        }
        // If Saturday, closes the row
        if ( dow == 6 ) {
            html += '</tr>';
        }
        // If not Saturday, but last day of the selected month
        // it will write the next few days from the next month
        else if ( i == lastDateOfMonth ) {
            var k=1;
            for(dow; dow < 6; dow++) {
                html += '<td class="not-current">' + k + '</td>';
                k++;
            }
        }
        i++;
    }while(i <= lastDateOfMonth);

    // Closes table
    html += '</table>';
    // Write HTML to the div
    document.getElementById(this.divId).innerHTML = html;
};
var isChange = false;
// On Load of the window
window.onload = function() {
    // Start calendar
    var c = new Cal("divCal");

    c.showcurr();
    
    // Bind next and previous button clicks

    $("select").on("change", function(){
        isChange = true;
    })
    $(window).bind('beforeunload', function (e){
        if(isChange){
            return true;
        }
    })
    $("input:submit").click(function(){
        $(window).unbind('beforeunload');
    })
    
    getId('btnNext').onclick = function() {
        c.nextMonth();
    };
    getId('btnPrev').onclick = function() {
        c.previousMonth();
    };
}
// Get element by id
function getId(id) {
    return document.getElementById(id);
}