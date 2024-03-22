let url="http://localhost:8000";

function getStats(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}


function generateChart(stats) {
    var video_count=stats.vid_number;
    var element=document.getElementById("video_count");
    element.innerHTML="number of videos in database:"+video_count;
    var age_ratings=stats.age_ratings;
    var labels = {"no restriction":0,"13":0, "16":0, "18":0};
    for (var i=0; i<age_ratings.length; i++){
        if (age_ratings[i]==0){
            labels["no restriction"]+=1;
        }
        else if (age_ratings[i]==13){
            labels["13"]+=1;
        }
        else if (age_ratings[i]==16){
            labels["16"]+=1;
        }
        else if (age_ratings[i]==18){
            labels["18"]+=1;
        }
    }
    var percentages = [];
    for (var key in labels) {
        percentages.push(labels[key]/age_ratings.length*100);
    }
    
    var ctx = document.getElementById("myChart").getContext("2d");
    var myChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(labels),
        datasets: [{
          data: percentages,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#2ecc71",
            "#3498db",
            "#f1c40f",
            "#e74c3c",
            "#9b59b6"
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true
      }
    });
}

function main(){
    var stats = getStats(); 
    stats = JSON.parse(stats.replace(/'/g, '"'));
    generateChart(stats);
    document.removeEventListener('DOMContentLoaded', main);
}

document.addEventListener('DOMContentLoaded', function() {
    main();
});