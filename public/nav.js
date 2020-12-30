$('.hamburger').on('click', function(e){
    e.preventDefault();
    $('.menu').addClass('show');
    $('body').addClass('show');
})
$('.close').on('click', function(e){
    e.preventDefault();
    $('.menu').removeClass('show');
    $('body').removeClass('show');
})