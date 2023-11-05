
const audio_player = document.querySelector('audio');
const selectedPoints = {};
var plot = document.getElementById('plot');
var plot2 = document.getElementById('plot2');
var audio_timer = null;
var audio_shifts = null;
var first_sounds = null;
collection_name = null;
song_name = null;
voice_name = null;

/**
 * Sloppy no-sleep function to load in an array of pairs (word, x position).
 * Called by a button. The "load words from array" one. I don't know when would
 * really be best. Logs an error if no song has been chosen yet. Right after that,
 * I guess? I don't know.
 * 
 * the rapidly dwindling sanity of plotly programmers as expressed through code comments
 */
async function load_annotations(syllables, start_time, increment) {
  //const wordy_array = [['Thirteen', 13], ['Fourteen', 14] , ['Fifteen', 15]]; //this kills the other hardcoded ones i did by the way
  wordy_array = [];
  for (let syllableIndex = 0; syllableIndex < syllables.length; syllableIndex++) {
    wordy_array.push([syllables[syllableIndex], (start_time + (increment * syllableIndex))])
  }

  let update_words = { //setting up update_words like this seems simplest
    annotations: []
  }

  for (let word in wordy_array) { //i hardly understand the difference between let and var but i think let has smaller scope which i like
    let a_word = {
      x: wordy_array[word][1],
      y: 25,
      xref: 'x',
      yref: 'y',
      text: wordy_array[word][0],
      showarrow: false //all our annotation settings can be set here (maybe?)
    }
    update_words.annotations[update_words.annotations.length] = a_word; //not a terrible way to append
  }
  Plotly.relayout(plot, update_words); //i forgot the semicolon here but it worked anyway. i put the semicolon back just in case.
}

/**
 * Temporary (?) function to be called by the "move words" button.
 * Contrary to popular belief, does not move words. It changes one word into another.
 * Teleporting? Reconstructing? I leave that to you.
 */
function on_button_move_over() {
  let update_words = {
    annotations: [ //Relayout does not seem to demand putting arrays inside arrays.
      {
        x: 4.5,
        y: 5,
        xref: 'x',
        yref: 'y',
        text: 'One',
        showarrow: false
      },
      {
        x: 6.75,
        y: 5,
        xref: 'x',
        yref: 'y',
        text: 'Two',
        showarrow: false
      },
      {
        x: 12,
        y: 5,
        xref: 'x',
        yref: 'y',
        text: 'Three',
        showarrow: false //Only going to bother moving these three because the others do not seem to move much, if at all.
      },                 //We still need to INCLUDE them here, though. Or they just disappear.
      {
        xref: 'paper',
        yref: 'paper', //This location is not helpful.
        x: 0,
        xanchor: 'right',
        y: 1,
        yanchor: 'bottom',
        text: 'Four',
        showarrow: false
      },
      {
        xref: 'paper',
        yref: 'paper', //Not quite helpful, but may have potential for "hybrid" positioning?
        x: 1,
        xanchor: 'left',
        y: 0,
        yanchor: 'top',
        text: 'Five',
        showarrow: false
      },
      {
        xref: 'x',
        yref: 'paper', //"Hybrid" annotation positioning does not appear to work - docs don't seem to say why.
        x: 1,
        y: -1.5,
        yanchor: 'top',
        text: 'Six',
        showarrow: false
      }
    ]
  }
  
  Plotly.relayout(plot, update_words);
}

/**
 * Function called by plot.on() when a selection is made in the scatterplot.
 * Adds all points selected to the object selectedPoints, which can be used globally.
 * Intent is for use in buttons.
 * 
 * @param {*} eventData I don't really know what type this is. I treat it like an object. See
 * https://plotly.com/javascript/plotlyjs-events/#event-data
 */
function selection_fn(eventData) {

  //Start by clearing out selectedPoints so we aren't just adding on to it with each selection.
  for (let key in selectedPoints) {
    if (selectedPoints.hasOwnProperty(key)) { //Not sure why this is important?
        delete selectedPoints[key];
    }
  }

  //Various dev/debug logs (included in for loop below, too)
  ///console.log("POINTS: "+eventData.points);
  ///console.log("CURVE NUMBER: "+eventData.points[0].curveNumber);
  ///console.log("TRACE NAME: "+eventData.points[0].data.name);
  ///console.log("PLOT.DATA: "+plot.data[0]);

  //For each trace, if it's one of the actual(?) scatter traces, add the selected
  //points from that trace to selectedPoints using the name of the trace as the key.
  for (let trace = 0; trace < plot.data.length; trace++) {
    ///console.log("AT INDEX "+trace+": "+plot.data[trace].name);
    if (plot.data[trace].name.split(" ")[1] == "voice") {
      ///console.log("VOICE AT INDEX "+trace+": "+plot.data[trace].name);
      ///console.log("TRACE.SELECTEDPOINTS: "+plot.data[trace].selectedpoints);
      if (plot.data[trace].selectedpoints.length != 0) {              
        selectedPoints[plot.data[trace].name] = plot.data[trace].selectedpoints;
      }
      ///console.log("SELECTEDPOINTS AT "+trace+": "+selectedPoints[trace]);
    }
  }

  //Final log of selectedPoints for dev/debug purposes.
  for (let voice in selectedPoints) {
    console.log("SELECTED POINTS IN "+voice+": "+selectedPoints[voice]);
  }
}

/**
 * Function called by the button "delete_button" when clicked.
 * Changes the y value of all selected points to 0, effectively
 * "deleting" them.
 */
function on_button_delete() {

  //For each trace, if that trace is a key in selectedPoints, make a copy of the y value array for that trace
  for (let trace = 0; trace < plot.data.length; trace++) {
    if (selectedPoints.hasOwnProperty(plot.data[trace].name)) {
      ///console.log("VOICE_DEL: "+plot.data[trace].name);
      var newData = plot.data[trace].y
      //For every point in the selected points of that trace, find that index in newData and set it to 0.
      for (let point in selectedPoints[plot.data[trace].name]) {
        ///console.log("POINT_DEL: "+selectedPoints[plot.data[trace].name][point]);
        newData[selectedPoints[plot.data[trace].name][point]] = 0;
      }
      //Package up the new array of y values in an update, and send the update using restyle.
      var update = {
        y: [newData] //When sending an array as part of the update, it needs to be put inside another array.
      }
      Plotly.restyle(plot, update, trace);
    }
  }
}

function player_update(){
    var time = audio_player.currentTime;
    var update = {
        'xaxis.range': [Math.max(0,time-3), time+3],
        'yaxis.autorange': true,
        'shapes[0].x0': time-0.02,
        'shapes[0].x1': time+0.02,
    };
    Plotly.relayout(plot, update)
}
function startInterval()
{
  audio_timer = setInterval("player_update()", 50);
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

function get_shifted_time(time, voice) {
  /*
  shift_id = 0;
  while(shift_id+1 < audio_shifts[voice_names[voice]].length && audio_shifts[voice_names[voice]][shift_id]['end'] < time) {
    shift_id += 1
  }
  */
  voice_names = {"bass": 0, "mid": 1, "top": 2, "mixed": 3};
  return time + first_sounds[voice_names[voice_name]] - first_sounds[3];
}

async function get_annotation_syllables(collectionName, songName) {
  syllables_file = await $.ajax({
    url:"data/syllables/" + collectionName + "/" + songName + "/syllables.txt",
    type:'GET',
    error: function(response) { console.log(response); }
  });
  syllables_file = syllables_file.split(' ');
  
  console.log(syllables_file);
  /**
  for (let sylldex = 0; sylldex < syllables_file.length; sylldex++) {
    console.log(syllables_file[sylldex]);
  }
  **/

  return syllables_file;
}

async function get_audio_shift_file(collectionName, songName) {
  /*
  audio_shift_file = await $.ajax({
    url:"data/ground-estimate/" + collectionName + "/" + songName + "/shifts.txt",
    type:'GET'
  });
  voices = audio_shift_file.split('\n');
  shifts = [];
  for(let voice_id = 0; voice_id <= 2; voice_id++) {
    shifts[voice_id] = [];
    shift_split = voices[voice_id].split(' ').map(function(sec) { return parseFloat(sec); });
    for(let i = 0; i+3 <= shift_split.length; i++) {
      shifts[voice_id][i] = { "start": shift_split[i], "end": shift_split[i+1], "shift": shift_split[i+2]}
    }
  }
  audio_shifts = shifts;
  */
  first_sounds = [];
  first_sounds_file = await $.ajax({
    url:"data/ground-estimate/" + collectionName + "/" + songName + "/first_sounds.txt",
    type:'GET'
  });
  first_sounds_file = first_sounds_file.split(' ');
  for(let voice_id = 0; voice_id <= 3; voice_id++) {
    first_sounds[voice_id] = parseFloat(first_sounds_file[voice_id]);
  }
}

function get_file(collectionName, songName, voice, mad = false) {
  if(mad) {
    return $.ajax({
      url:"data/mad/" + collectionName + "/" + songName + "/" + voice + "_shifted.txt",
      type:'GET'
    });
  } else {
    console.log("data/ground-estimate/" + collectionName + "/" + songName + "/" + voice + "_shifted.txt");
    return $.ajax({
        url:"data/ground-estimate/" + collectionName + "/" + songName + "/" + voice + "_shifted.txt",
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
  } else if(voiceName == "mixed") {
    voice = "";
  }
  return voice
}

async function get_voice(collectionName, songName, voiceName) {
  voice_file_extension = get_voice_file_extension(voiceName);
  await get_audio_shift_file(collectionName, songName);
  data = await get_file(collectionName, songName, voice_file_extension);
  var dataX = data.split('\n').map(function(ln){
    return get_shifted_time(parseFloat(ln.split(' ')[0]/100), voiceName);
  });
  var dataY = data.split('\n').map(function(ln){
    return parseFloat(ln.split(' ')[1]);
  });
  mad = await get_file(collectionName, songName, voice_file_extension, true);
  var dataMad = mad.split('\n').map(function(ln){
    return parseFloat(ln.split(' ')[1]);
  });
  data_mad_low = [];
  for(var i = 0;i<dataY.length;i++) {
    data_mad_low.push(Math.max(0,dataY[i] - dataMad[i]));
  }
  data_mad_high = [];
  for(var i = 0;i<dataY.length;i++) {
    data_mad_high.push(dataY[i] + dataMad[i]);
  }
  
  return [dataX, dataY, data_mad_low, data_mad_high, dataMad];
  
}

function generate_mad(x1, y1, y2) {
	const ans_x = [...x1, ...x1.reverse()];
	const ans_y = [...y1, ...y1.reverse()];

	let j = x1.length;
	
	for (let i = 0; i < x1.length; i++) {
		ans_y[i] += y2[i];
//		if (ans_y[i] > 1000 || ans_y[i] < 1000)
//			console.log(ans_y[i]);
	}
	for (let i = x1.length-1; i >= 0; i--) {
		ans_y[j] -= y2[i];	
//		if (ans_y[i] > 1000 || ans_y[i] < 1000)
//			console.log(ans_y[i]);
		j++;
	}

	return [ans_x, ans_y];
 }

async function update_plot(collectionName, songName, voiceName) {

  if(collection_name == null || song_name == null || voice_name == null) {
    return false
  }

  var syllables = await get_annotation_syllables(collectionName, songName);
  
  var bass_data = await get_voice(collectionName, songName, "bass");
  var bass_trace = {
    x: bass_data[0],
    y: bass_data[1],
    mode: 'markers',
    name: 'Bass voice',
    type: 'scattergl',
    marker: {
	    color: 'red',
	    size: 3,
    }
  };

  var bass_mad_low_trace = {
    name: 'Bass MAD',
    x: bass_data[0],
    y: bass_data[2],
    visible: 'legendonly',
    type: 'scattergl',
    legendgroup: 'Bass MAD',
    opacity: 0.2,
    marker: {
      color: 'red',
      size: 1,
    }
  };

  var bass_mad_high_trace = {
    name: 'Bass MAD',
    x: bass_data[0],
    y: bass_data[3],
    visible: 'legendonly',
    showlegend: false,
    type: 'scattergl',
    legendgroup: 'Bass MAD',
    opacity: 0.2,
    marker: {
      color: 'red',
      size: 1,
    }
  };

  var mid_data = await get_voice(collectionName, songName, "mid");

  var mid_trace = {
    x: mid_data[0],
    y: mid_data[1],
    mode: 'markers',
    name: 'Middle voice',
    type: 'scattergl',
    marker: {
	    color: 'blue',
	    size: 3,
    }
  };

  var mid_mad_low_trace = {
    name: 'Middle MAD',
    x: mid_data[0],
    y: mid_data[2],
    visible: 'legendonly',
    type: 'scattergl',
    legendgroup: 'Middle MAD',
    opacity: 0.2,
    marker: {
      color: 'blue',
      size: 1,
    }
  };

  var mid_mad_high_trace = {
    name: 'Middle MAD',
    x: mid_data[0],
    y: mid_data[3],
    visible: 'legendonly',
    showlegend: false,
    type: 'scattergl',
    legendgroup: 'Middle MAD',
    opacity: 0.2,
    marker: {
      color: 'blue',
      size: 1,
    }
  };

  var top_data = await get_voice(collectionName, songName, "top");
  var top_trace = {
    x: top_data[0],
    y: top_data[1],
    mode: 'markers',
    name: 'Top voice',
    type: 'scattergl',
    marker: {
	    color: 'green',
	    size: 3,
    },
  };

  var top_mad_low_trace = {
    name: 'Top MAD',
    x: top_data[0],
    y: top_data[2],
    visible: 'legendonly',
    type: 'scattergl',
    legendgroup: 'Top MAD',
    opacity: 0.2,
    marker: {
      color: 'green',
      size: 1,
    }
  };

  var top_mad_high_trace = {
    name: 'Top MAD',
    x: top_data[0],
    y: top_data[3],
    visible: 'legendonly',
    showlegend: false,
    type: 'scattergl',
    legendgroup: 'Top MAD',
    opacity: 0.2,
    marker: {
      color: 'green',
      size: 1,
    }
  };
	

//-----------------------------------

  var histogram_mid_trace = {
	x: mid_data[2],
	name: "mid",
	type: "histogram",
	opacity: 0.5,
	marker: {
		color: "green"
	}
  };

  var histogram_top_trace = {
	x: top_data[2],
	name: "top",
	type: "histogram",
	opacity: 0.5,
	marker: {
		color: "red"
	}
  };

  var histogram_bass_trace = {
	x: bass_data[2],
	name: "bass",
	type: "histogram",
	opacity: 0.5,
	marker: {
		color: "blue"
	}
  };

  // console.log(top_data);

  var data = [bass_trace, bass_mad_high_trace, bass_mad_low_trace, mid_trace, mid_mad_low_trace, mid_mad_high_trace, top_trace, top_mad_low_trace, top_mad_high_trace];
  var data2 = [histogram_mid_trace, histogram_bass_trace, histogram_top_trace];

  var layout = {
    annotations: [
      {
        x: 2, //Very basic starting point. A bit hidden by the plot. We can manually adjust this, but I can see it being an issue.
        y: 5,
        xref: 'x',
        yref: 'y',
        text: 'One',
        showarrow: false //Annoyingly, this appears to default to true. I think that'd be very unpleasant for us to leave on.
      },
      {
        x: 4.5, //Second and third just to see if fractional values work.
        y: 5,
        xref: 'x',
        yref: 'y',
        text: 'Two',
        showarrow: false
      },
      {
        x: 6.75,
        y: 5,
        xref: 'x',
        yref: 'y',
        text: 'Three',
        showarrow: false
      },
      {
        xref: 'paper',
        yref: 'paper', //This location is not helpful.
        x: 0,
        xanchor: 'right',
        y: 1,
        yanchor: 'bottom',
        text: 'Four',
        showarrow: false
      },
      {
        xref: 'paper',
        yref: 'paper', //Not quite helpful, but may have potential for "hybrid" positioning?
        x: 1,
        xanchor: 'left',
        y: 0,
        yanchor: 'top',
        text: 'Five',
        showarrow: false
      },
      {
        xref: 'x',
        yref: 'paper', //"Hybrid" annotation positioning does not appear to work - docs don't seem to say why.
        x: 1,
        y: -1.5,
        yanchor: 'top',
        text: 'Six',
        showarrow: false
      }
    ],
    xaxis: { 
      range:[-3,3]
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

  var layout2 = {
	width: 500,
	height: 500,
	title: songName + "'s MAD Histogram",
	xaxis: {
		range: [0,10],
	}
  }

  Plotly.newPlot(plot, data, layout);
  Plotly.newPlot(plot2, data2, layout2);

  song_name_ext = get_voice_file_extension(voiceName);
  if(song_name_ext != "") {
    songNameLast = songName + "_" + song_name_ext;
  } else {
    songNameLast = songName;
  }

  $("#audioPlayer").attr("src", "data/" + collectionName + "/" + songName + "/" + songNameLast + ".wav");

  plot.on("plotly_selected", selection_fn)

  await load_annotations(syllables, 19, 1.5); //sabodisho specific
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


