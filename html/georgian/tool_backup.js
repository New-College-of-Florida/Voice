
const audio_player = document.querySelector('audio');
var plot = document.getElementById('plot')
var audio_timer = null;

function player_update(){
    var time = audio_player.currentTime;
    var update = {
        'xaxis.range': [Math.max(0,time-3), time+3],
        'yaxis.autorange': true,
        'shapes[0].x0': time-0.05,
        'shapes[0].x1': time+0.05,
    };
    Plotly.relayout(plot, update)
}
function startInterval()
{
  audio_timer = setInterval("player_update()", 100);
}
function stopInterval()
{
  clearInterval(audio_timer);
}

const collectionDirectories = {"Scherbaum Mzhavanadze":
    ["GVM009",
     "GVM017",
     "GVM019",
     "GVM031",
     "GVM097"],
    "Teach Yourself Gurian Songs":
    ["Adila-Alipasha",
     "Alaverdi",
     "Beri Ak'vans Epareba", 
     "Brevalo",             
     "Chven-Mshvidoba",    
     'Didi Khnidan',     
     "Gakhsovs, T'urpa",
     "Indi-Mindi",
     "K'alos Khelkhvavi",
     "Khasanbegura",     
     "Lat'aris Simghera",    
     "Manana",         
     "Maq'ruli",               
     "Masp'indzelsa Mkhiarulsa", 
     "Me-Rustveli",        
     'Mival Guriashi (1)' ,
     'Mival Guriashi (2)' , 
     "Mok'le Mravalzhamieri",
     "Mts'vanesa Da Ukudosa", 
     'Nanina (1)',      
     'Nanina (2)',          
     "Orira",
     "P'at'ara Saq'varelo",                
     'Pikris Simghera',
     "Sabodisho",
     'Sadats Vshobilvar',
     "Shermanduli",
     "Shvidk'atsa",
     'Supris Khelkhvavi',
     "Ts'amok'ruli"],
   "Teach Yourself Megrelian Songs":
    ["Vojanudi Chkim Jargvals",
     "Ak'a Si Rekisho",
     "Gepshvat Ghvini",
     "Io _ Chkin Kiana",
     "Mesishi Vardi",
     "Meureme",
     "Mi Re Sotsodali_",
     "Mole Chit'i Gilakhe",
     "O Da"]};


function get_file(collectionName, songName, voice, mad = false) {
  if(mad) {
    return $.ajax({
      url:"data/mad/" + collectionName + "/" + songName + "/" + voice + ".txt",
      type:'GET'
    });
  } else {
    return $.ajax({
        url:"data/ground-estimate/ground-estimate/" + collectionName + "/" + songName + "/" + voice + ".txt",
        type:'GET'
      });
  }
}

function get_voice_file_extension(voiceName) {
  voice = null;
  if(voiceName == "bass") {
    voice = "AHDS1M";
  } else if(voiceName == "mid"){
    voice = "AHDS2M";
  } else if(voiceName == "top") {
    voice = "AHDS3M";
  }
  return voice
}

async function get_voice(collectionName, songName, voiceName) {
  voice_file_extension = get_voice_file_extension(voiceName);
  data = await get_file(collectionName, songName, voice_file_extension);
  dataX = data.split('\n').map(function(ln){
          return parseFloat(ln.split(' ')[0]/100);
  });
  dataY = data.split('\n').map(function(ln){
    return parseFloat(ln.split(' ')[1]);
  });
  mad = await get_file(collectionName, songName, voice_file_extension, true);
  dataMad = mad.split('\n').map(function(ln){
    return parseFloat(ln.split(' ')[1]);
  });
  return [dataX, dataY, dataMad];
  
}

async function update_plot(collectionName, songName, voiceName) {

  if(collection_name == null || song_name == null || voice_name == null) {
    return false
  }

  console.log(collectionName,songName,voiceName);

  var bass_data = await get_voice(collectionName, songName, "bass");
  var bass_trace = {
    x: bass_data[0],
    y: bass_data[1],
    mode: 'markers',
    name: 'Bass voice',
    type: 'scattergl',
    marker: {color: 'red'}
  };

  var bass_mad_trace = {
    x: bass_data[0],
    y: bass_data[2],
    mode: 'markers',
    name: 'Bass MAD',
    type: 'scattergl',
    marker: {color: 'red'}
  };

  var mid_data = await get_voice(collectionName, songName, "mid");
  var mid_trace = {
    x: mid_data[0],
    y: mid_data[1],
    mode: 'markers',
    name: 'Middle voice',
    type: 'scattergl',
    marker: {color: 'blue'}
  };

  var mid_mad_trace = {
    x: mid_data[0],
    y: mid_data[2],
    mode: 'markers',
    name: 'Mid MAD',
    type: 'scattergl',
    marker: {color: 'blue'}
  };

  var top_data = await get_voice(collectionName, songName, "top");
  var top_trace = {
    x: top_data[0],
    y: top_data[1],
    mode: 'markers',
    name: 'Top voice',
    type: 'scattergl',
    marker: {color: 'green'},
  };

  var top_mad_trace = {
    x: top_data[0],
    y: top_data[2],
    mode: 'markers',
    name: 'Top MAD',
    type: 'scattergl',
    marker: {color: 'green'}
  };

  console.log(top_data);

  var data = [bass_trace, bass_mad_trace, mid_trace, mid_mad_trace, top_trace, top_mad_trace];

  var layout = {
    xaxis: { 
      range:[0,6]
    }, 
    yaxis : {
      autorange: true
    },
    shapes: [
    {
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: 0,
        y0: 0,
        x1: 0,
        y1: 1,
        fillcolor: '#d3d3d3',
        opacity: 0.6,
        line: {
            width: 0
        }
    }],
    width: 900, 
    height: 500, 
    title: songName
  } 

  Plotly.newPlot(plot, data, layout);
  if(collectionName == "Scherbaum Mzhavanadze") {
    songNameLast = songName + "_" + get_voice_file_extension(voiceName);
  } else {
    songNameLast = songName
  }
  $("#audioPlayer").attr("src", "/georgian/data/" + collectionName + "/" + songName + "/" + songNameLast + ".wav");
}

$( document ).ready(function() {
    audio_player.addEventListener('play', (event) => {
      startInterval()
    });

    audio_player.addEventListener('pause', (event) => {
      stopInterval()
    });
});


//// Input handling

collection_name = null
song_name = null
voice_name = null

$( "#collectionName" ).change(function() {
  collection_name = $("#collectionName").val();
  $("#songNameRow").show();
  $('#songName').html("");
  $('<option/>').val('').html('').appendTo('#songName');
  console.log(collectionDirectories[collection_name]);
  for (const song of collectionDirectories[collection_name]){
     $('<option/>').val(song).html(song).appendTo('#songName');
  }
  update_plot(collection_name, song_name, voice_name);
});

$( "#songName" ).change(function() {
  song_name = $("#songName").val();
  $("#voiceNameRow").show();
  update_plot(collection_name, song_name, voice_name);
});

$( "#voiceName" ).change(function() {
  voice_name = $("#voiceName").val();
  update_plot(collection_name, song_name, voice_name);
});


