let age = 0;
var classifier = chrome.runtime.connectNative('host');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == "download"){
    classifier.postMessage({"request":request, "sender":sender}); 
  }

  if (request.type == "password") {
    
    if (request.password == "password") {
      sendResponse({type:"password",status:"correct"});
    } 
    else {
      sendResponse({type:"password",status:"incorrect"});
    }
  }
  
  if (request.type == "getAge") {
    sendResponse({type:"getAge",age:age});
  }

  if (request.type == "setAge") {
    age = request.age;
    sendResponse({type:"setAge",age:age});
  }
  
  console.log("Sent: " + JSON.stringify(request)); 

});

classifier.onMessage.addListener((response) => {
  console.log("Received: " + JSON.stringify(response));
  try {
    chrome.tabs.sendMessage(response.sender.tab.id, response);
  }
  catch(err) {
    //console.log("error")
  }
  //chrome.tabs.sendMessage(response.sender.tab.id, response);
});

