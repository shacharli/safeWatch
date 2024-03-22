function submitPassword() {
    var loginField = document.getElementById('login');
    var passwordField = document.getElementById('password');
    var password = passwordField.value;
    chrome.runtime.sendMessage({type:"password",password: password}, function(response) {
        console.log(response);
        passwordField.value = '';
        if (response.status == "correct") {
            //loginField.textContent = 'Logged in';
            
            window.location.replace("ageSelection.html");
        }
        else {
            //loginField.textContent = 'Incorrect password';
            showNotification('Incorrect password');
        }
    });
}

function showNotification(message) {

    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

document.addEventListener('DOMContentLoaded', function() {
    var submit = document.getElementById('Submit');
    submit.addEventListener('click', submitPassword);
});
  

