
function submitAge() {
    var age = document.getElementById('age').value;
    chrome.runtime.sendMessage({type:"setAge",age: age}, function(response) {
        console.log(response);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    var submit = document.getElementById('Submit');
    submit.addEventListener('click', submitAge);
});
  

