let videosClassified = {};
let age = 0;
let currentPage = location.href;

chrome.runtime.sendMessage({type:"getAge"}, function(response) {
  age = response.age;
});

function detectNewPage() {
  if (currentPage != location.href) {
    currentPage = location.href;
    videosClassified = {};
    notify("new page detected, please refresh to watch video")
    chrome.runtime.sendMessage({ type:"stop" });
    blockVideoPerm();
  }
}

setInterval(detectNewPage, 1000);

function launch_poke() {
    var x = document.getElementById("safeWatch-notify")
    x.className = "show";
    setTimeout(function(){x.className = x.className.replace("show", ""); }, 2500);
    
}

function getVideos() {
  return document.getElementsByTagName("video");
}

let listenedVideos = new Set();

function addVideoListeners() {
  var videos = getVideos();
  if (videos.length > 1) {
    blockVideoPerm();
    console.log("blocked video")
    for (var i = 0; i < videos.length; i++) {
      if (listenedVideos.has(videos[i]) == false) {
        listenedVideos.add(videos[i]);
      }
    }
  }
  else if (videos.length == 1) {
    if (listenedVideos.has(videos[0]) == false) {
      console.log("added listener")
      videojs(videos[0], {controls: false, autoplay: false, preload: 'auto'});
      videos[0].addEventListener("play",handle(videos[0]),{once: true});
      listenedVideos.add(videos[0]);
    }
  }
  console.log(listenedVideos)
  return listenedVideos;
}

setInterval(addVideoListeners, 1000);

function goBack(video) {
  for (var i = Math.floor(video.currentTime); i > 0; i--) {
    console.log("checking "+i);
    if (videosClassified[i] != undefined && safeForAge(videosClassified[i])) {
      video.currentTime = i;
      console.log("going back to "+i);
      return 
    }
  }
}

function firstSafeFrame(currentTime){
 
  let goodTime = true;
  console.log(Object.keys(videosClassified).length)
  for (var i = currentTime; i < Object.keys(videosClassified).length; i++) {
    goodTime = true;
    for (var j = 0; j < 5; j++) {
      if (videosClassified[i+j] == undefined) {
        return 0;
      }
      if (safeForAge(videosClassified[i+j]) == false) {
        goodTime = false;
        break;
      }
    }
    if (goodTime) {
      return i;
    }
  }
  return 0;
}

async function notify(message) {
  existance = document.getElementById("safeWatch-notify");
  if (existance != undefined) {
    existance.remove();
  }
  var poke = document.createElement("div");
  poke.id = "safeWatch-notify";
  poke.innerHTML='<div id="img">Icon</div><div id="desc">'+message+'</div>';
  document.body.appendChild(poke);
  launch_poke();
}

async function handle(video){
  var currentUrl = window.location.href;
  console.log(currentUrl);
  chrome.runtime.sendMessage({ type:"download", url: currentUrl});
  notify("video found, preparing analysis")
  while (videosClassified[5]==undefined) {
    await new Promise(r => setTimeout(r, 200));
    video.currentTime = 0;
    video.pause();
  }
  video.play();
  
  video.addEventListener("timeupdate", function() {

    pauseVideo(video, Math.floor(this.currentTime));
    
  });
}

function pauseVideo(video, currentTime) {
  if (video.paused || video.ended) {
    return
  }
 
  if (videosClassified[currentTime] == undefined || videosClassified[currentTime+1] == undefined) {
    video.pause();  
    notify("still analyzing this");
    goBack(video);
    video.play();
    return
  }

  if (safeForAge(videosClassified[currentTime+1]) == false && safeForAge(videosClassified[currentTime+2]) == false) {
    notify("inappropriate content detected, skipping to next safe frame");
    safeFrame=firstSafeFrame(currentTime);
    if (safeFrame == 0) {
      video.pause();
    }
    video.currentTime = safeFrame;
    video.play();
    
    return 
  }

}

function safeForAge(chance){
   
    if (age < 13 && chance.porn > 0.6) {
      return false;
    }
    if (age>13 && age<16 && chance.sexy > 0.5) {
      return false;
    }
    if (age>16 && age<18 && chance.sexy > 0.8) {
      return false;
    }
    return true;
}

async function blockVideoPerm(message) {
  videos = getVideos();
  console.log(videos)
  for (var i = 0; i < videos.length; i++) {
    var image=document.createElement("img");
    image.src = "https://www.computips.org/wp-content/uploads/2019/09/this-video-is-unavailable.png";
    try {
      image.width = videos[i].width;
      image.height = videos[i].height;
      videos[i].parentNode.replaceChild(image, videos[i]);
      if (message != undefined) {
        videos[i].addEventListener("play",function(){
        notify(message)
      });
    }
      return
    }
    catch(err) {
      console.log(err)
    }
    
  }
}

function markVidSafe() {
  video= getVideos()[0];
  videosClassified = {};
  videoLength = video.duration;
  for (var i = 0; i < videoLength; i++) { 
    videosClassified[i] = 0;
  }
}

chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {

  if (request.type == "status" && request.status == "downloaded") {
    alert ("Downloaded");
    //videosClassified[request.video_id] = {};
  }

  if (request.type == "rating" && request.rating > age) {
    console.log(request.rating);
    //notify("video is not safe for your age");
    blockVideoPerm("video is not safe for your age");
  }

  else if (request.type == "rating") {
    notify("video is safe for your age");
    console.log(request.rating);
    markVidSafe();
  }

  if (request.type == "classification") {
    console.log(request.second+' '+JSON.stringify(request.chance.porn));
    videosClassified[request.second] = request.chance;
  }

  if (request.type == "status" && request.status == "error") {
    //alert("Error: " + JSON.stringify(request));
    //blockVideoPerm(request.video_id);
    blockVideoPerm();
  }
});

