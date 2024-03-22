document.addEventListener('DOMContentLoaded', function() {
    var login = document.getElementById('login');
    login.addEventListener('click', function() {
        window.location.replace("password.html");
    });
    var statistics= document.getElementById('statistics');
    statistics.addEventListener('click', function() {
        window.location.replace("statistics.html");
    });
});
