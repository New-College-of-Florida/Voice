
const audio_player = document.querySelector('audio');
const selectedPoints = {};
var plot = document.getElementById('plot');
var plot2 = document.getElementById('plot2');
var audio_timer = null;
var audio_shifts = null;
var first_sounds = null;
var collection_name = null;
var song_name = null;
var voice_name = null;
var selected_lyrics = 0;

/**
 * Loads time blocks for a given voice from a text file.
 * Time blocks represent valid times for annotations.
 * Checks for a save file first.
 *
 * @param {string} collectionName - The name of the collection of songs.
 * @param {string} songName - The name of the song for which to load time blocks.
 * @param {string} voiceName - The name of the voice (bass, mid, top) for which to load time blocks.
 * @returns {Promise<Array<number>>} A promise that resolves to an array of time blocks as numbers.
 */
async function load_time_blocks(collectionName, songName, voiceName) {
  // Determine the file extension based on the voice name
  let voice_file_extension = get_voice_file_extension(voiceName);

  // The save file, if we find it.
  let saveFile;
  
  // There shouldn't be a save file for None, which sets voiceName to null.
  if (voiceName) {
    // Construct the path to the save file
    let voice_file_extension = get_voice_file_extension(voiceName);
    let save_path = "data/syllables/" + collection_name + "/" + song_name + "/" + song_name + "_" + voice_file_extension + "_save.txt";
    
    try {
      // Try to find the save file
      saveFile = await $.ajax({
        type: 'GET',
        url: save_path,
        error: function(response) {console.log("Found no save for:\t" + voiceName + "\nReverting to default values.\n");}
      });
    } catch (error) {  
    }
  }

  // If the save file exists...
  if (saveFile) {

    // Parse it...
    parsedSaveFile = saveFile.split(/\r?\n/).map(line => {
      const [time, text] = line.split('\t');
      return { time: parseFloat(time), text };
    });

    
    // Return the read times.
    let time_blocks = [];
    for (let annotation of parsedSaveFile) {
      time_blocks.push(annotation.time);
    }
    return time_blocks;
  }

  // Construct the path to the time blocks file
  let time_blocks_path = "data/syllables/" + collectionName + "/" + songName + "/" + songName + "_" + voice_file_extension + "_time_blocks.txt";
  
  // Perform an AJAX GET request to load the time blocks file
  let time_blocks_file = await $.ajax({
    url: time_blocks_path,
    type:'GET',
    error: function(response) { console.log(response); }
  });

  // Split the file content by line breaks and convert each line to a float
  time_blocks_file = time_blocks_file.split('\r\n').map(parseFloat);

  // Remove the last element, which is NaN due to how the file was written originally.
  time_blocks_file.pop();
  
  // Log the loaded time blocks for debugging purposes
  console.log("load_time_blocks() loaded:\n" + time_blocks_file);

  // Return the array of time blocks
  return time_blocks_file;
}

/**
 * Moves annotations in the plot based on the selected points and the specified direction.
 * The closest select annotation is moved to the next valid time block in the direction specified.
 * If the next time block is occupied by another annotation, all annotations in the direction
 * are moved to the next available time block.
 *
 * @param {Array<number>} chosenPoints - The indices of the selected points in the plot.
 * @param {Array<number>} time_blocks - The array of valid times for annotations.
 * @param {string} direction - The direction to move the annotations in, either "right" or "left".
 * @param {string} lyrics_trace_name - The name of the trace that contains the lyrics annotations.
 */
function shiftAnnotations(chosenPoints, time_blocks, direction, lyrics_trace_name) {
  // Get the current annotations
  let annotations = plot.layout.annotations;

  // Find the annotation closest to any of the selected points
  let closestAnnotationIndex = null;
  let closestDistance = Infinity;
  for (let annotationIndex =  0; annotationIndex < annotations.length; annotationIndex++) {
    for (let pointIndex =  0; pointIndex < chosenPoints.length; pointIndex++) {

      // Find the index of the trace that contains the lyrics annotations
      var trace_index = plot.data.findIndex(function(trace) {
        return trace.name == lyrics_trace_name
      });
      
      // Calculate the distance between the annotation and the selected point
      let distance = Math.abs(annotations[annotationIndex].x - plot.data[trace_index].x[chosenPoints[pointIndex]]);
      
      // Update the closest annotation index if the current annotation is closer
      if (distance < closestDistance) {
        closestDistance = distance;
        closestAnnotationIndex = annotationIndex;
      }
    }
  }
  
  // Determine the next valid time block in the specified direction
  let nextTimeBlock;
  if (direction == "right") {
    // Find the next time block that is greater than the x-coordinate of the closest annotation
    nextTimeBlock = time_blocks.find(block => block > annotations[closestAnnotationIndex].x);
  } else if (direction == "left") {
    // Find the last time block that is less than the x-coordinate of the closest annotation
    nextTimeBlock = time_blocks.slice(0, time_blocks.indexOf(annotations[closestAnnotationIndex].x)).pop();
  }

  // Check if the next valid time block is occupied by an annotation
  let isNextTimeBlockOccupied = annotations.some(annotation => annotation.x === nextTimeBlock);

  // If the next valid time block is occupied, move all annotations that are in the specified direction
  if (isNextTimeBlockOccupied) {
    let annotationsToMove = [];
    if (direction == "right") {
      // Collect all annotations to the right of the closest annotation
      for (let annotationIndex = closestAnnotationIndex + 1; annotationIndex < annotations.length; annotationIndex++) {
        annotationsToMove.push(annotations[annotationIndex]);
      }
    } else if (direction == "left") {
      // Collect all annotations to the left of the closest annotation
      for (let annotationIndex = 0; annotationIndex < closestAnnotationIndex; annotationIndex++) {
        annotationsToMove.push(annotations[annotationIndex]);
      }
    }
    
    // Move the annotations to the next available time block in the specified direction
    for (let annotationIndex = 0; annotationIndex < annotationsToMove.length; annotationIndex++) {
      if (annotationsToMove[annotationIndex]) {
        let nextAvailableTimeBlock;
        if (direction == "right") {
          // Find the next time block to the right of the current annotation
          nextAvailableTimeBlock = time_blocks.find(block => block > annotationsToMove[annotationIndex].x);
        } else if (direction == "left") {
          // Find the last time block to the left of the current annotation
          nextAvailableTimeBlock = time_blocks.slice(0, time_blocks.indexOf(annotationsToMove[annotationIndex].x)).pop();
        }
        
        // Update the annotation's x-coordinate if a next available time block is found
        if (nextAvailableTimeBlock) {
          annotationsToMove[annotationIndex].x = nextAvailableTimeBlock;
        }
      }
    }
  }
  
  // Move the selected annotation to the next available time block in the specified direction
  let nextAvailableTimeBlockForSelected;
  if (direction == "right") {
    // Find the next time block to the right of the closest annotation
    nextAvailableTimeBlockForSelected = time_blocks.find(block => block > annotations[closestAnnotationIndex].x);
  } else if (direction == "left") {
    // Find the last time block to the left of the closest annotation
    nextAvailableTimeBlockForSelected = time_blocks.slice(0, time_blocks.indexOf(annotations[closestAnnotationIndex].x)).pop();
  }
  
  // Update the closest annotation's x-coordinate if a next available time block is found
  if (nextAvailableTimeBlockForSelected) {
    annotations[closestAnnotationIndex].x = nextAvailableTimeBlockForSelected;
  }
  
  // Update the plot with the new annotations
  Plotly.relayout(plot, {annotations: annotations});
}

/**
 * This function is called when a button to shift annotations in a specific direction is clicked.
 * It moves the selected annotation to the next valid time block in the direction specified by the button,
 * as well as all annotations in that direction if the next time block is occupied.
 *
 * @param {string} direction - The direction in which to move the annotations, either "right" or "left".
 */
function onButtonShiftAnnotations(direction) {
  // Check if any points have been selected
  if (Object.keys(selectedPoints).length > 0) {
    // Determine which time blocks to use based on the selected lyrics
    let time_blocks;
    let lyrics_trace_name;
    if (selected_lyrics == 0) { 
      time_blocks = [0];
    } else if (selected_lyrics == 1) {
      time_blocks = plot.bass_time_blocks;
      lyrics_trace_name = 'Bass lyrics';
    } else if (selected_lyrics == 2) {
      time_blocks = plot.mid_time_blocks;
      lyrics_trace_name = 'Middle lyrics';
    } else if (selected_lyrics == 3) {
      time_blocks = plot.top_time_blocks;
      lyrics_trace_name = 'Top lyrics';
    }
    
    // Get all selected points for the current lyrics trace
    let lyricsPoints = [];
    lyricsPoints.push(...selectedPoints[lyrics_trace_name]);
    
    // Call the shiftAnnotations function to move the annotations in the specified direction
    shiftAnnotations(lyricsPoints, time_blocks, direction, lyrics_trace_name);
  }
}

/**
 * This function moves an annotation to the previous or next valid time block if possible.
 * If an annotation is already present at the target time block, it merges the texts.
 *
 * @param {Array<number>} chosenPoints - The indices of the selected points in the plot.
 * @param {Array<number>} time_blocks - The array of valid times for annotations.
 * @param {string} direction - The direction in which to move the annotation, either "right" or "left".
 * @param {string} lyrics_trace_name - The name of the trace that contains the lyrics annotations.
 */
function mergeAnnotation(chosenPoints, time_blocks, direction, lyrics_trace_name) {
  // Get the current annotations
  let annotations = plot.layout.annotations;
  
  // Find the annotation closest to any of the selected points
  let closestAnnotationIndex = null;
  let closestDistance = Infinity;
  for (var annotationIndex = 0; annotationIndex < annotations.length; annotationIndex++) {
    for (var pointIndex = 0; pointIndex < chosenPoints.length; pointIndex++) {

      // Find the index of the trace that contains the lyrics annotations
      var trace_index = plot.data.findIndex(function(trace) {
        return trace.name == lyrics_trace_name
      });

      // Calculate the distance between the annotation and the selected point
      var distance = Math.abs(annotations[annotationIndex].x - plot.data[trace_index].x[chosenPoints[pointIndex]]);
      
      // Update the closest annotation index if the current annotation is closer
      if (distance < closestDistance) {
        closestDistance = distance;
        closestAnnotationIndex = annotationIndex;
      }
    }
  }

  // If no annotation is found, log a warning and return
  if (closestAnnotationIndex === null) {
    console.warn("WARN: mergeAnnotation() found no annotation!");
    return;
  }
  
  // Determine the current time block index.
  let currentTimeBlockIndex = time_blocks.indexOf(annotations[closestAnnotationIndex].x);
  let targetTimeBlockIndex = currentTimeBlockIndex;

  // If the shift direction is "left"...
  if (direction === "left") {

    // Calculate the previous time block index
    targetTimeBlockIndex--;

    // If there's no previous time block, return
    if (targetTimeBlockIndex < 0) {
      console.warn("WARN: mergeAnnotation() found no previous time block!");
      return;
    }

  // Else, if the shift direction is "right"...
  } else if (direction === "right") {

    // Calculate the next time block index
    targetTimeBlockIndex++;

    // If there's no next time block, return
    if (targetTimeBlockIndex >= time_blocks.length) {
      console.warn("WARN: mergeAnnotation() found no next time block!");
      return;
    }

  // Else, there was no valid direction given, return.
  } else {
    console.warn("WARN: mergeAnnotation() was not given a valid direction!");
    return;
  }
  
  // Find if there's an annotation at the target time block
  let targetAnnotationIndex = annotations.findIndex(annotation => annotation.x === time_blocks[targetTimeBlockIndex]);
  
  // If there's an annotation at the target time block, merge the texts
  if (targetAnnotationIndex !== -1) {
    if (direction === "left") {
      annotations[targetAnnotationIndex].text += '-' + annotations[closestAnnotationIndex].text;
    } else {
      annotations[targetAnnotationIndex].text = annotations[closestAnnotationIndex].text + '-' + annotations[targetAnnotationIndex].text;
    }

    // Remove the closest annotation
    annotations.splice(closestAnnotationIndex, 1);
  } else {

    // Move the closest annotation to the target time block
    annotations[closestAnnotationIndex].x = time_blocks[targetTimeBlockIndex];
  }

  // Update the plot with the new annotations
  Plotly.relayout(plot, {annotations: annotations});
}

/**
 * This function is called when the "Merge" buttons are clicked.
 * It moves the selected annotation back/forward if possible.
 * If an annotation is already present at the target time block, it merges the texts.
 * 
 * @param {string} direction - - The direction in which to move the annotation, either "right" or "left".
 */
function onButtonMergeAnnotation(direction) {
  // Check if any points have been selected
  if (Object.keys(selectedPoints).length > 0) {
    // Get all selected points
    let allSelectedPoints = [];
    for (let selectedPoint in selectedPoints) {
      allSelectedPoints.push(...selectedPoints[selectedPoint]);
    }
    
    // Determine which time blocks to use based on the selected lyrics
    let time_blocks;
    let lyrics_trace_name;
    if (selected_lyrics == 0) { 
      time_blocks = [0];
    } else if (selected_lyrics == 1) {
      time_blocks = plot.bass_time_blocks;
      lyrics_trace_name = 'Bass lyrics';
    } else if (selected_lyrics == 2) {
      time_blocks = plot.mid_time_blocks;
      lyrics_trace_name = 'Middle lyrics';
    } else if (selected_lyrics == 3) {
      time_blocks = plot.top_time_blocks;
      lyrics_trace_name = 'Top lyrics';
    }
    
    // Call the mergeAnnotation function to merge the annotations
    mergeAnnotation(allSelectedPoints, time_blocks, direction, lyrics_trace_name);
  }
}

/**
 * Loads an array of words and an array of times as annotations, then displays them on the plot.
 * Checks for an existing save file first.
 * 
 * @param {Array<string>} syllables - The array of words (syllables) to be annotated.
 * @param {Array<number>} time_blocks - The array of valid times for the words, corresponding to the syllables.
 * @param {string} voiceName - The name of the voice (bass, mid, top) for which to load annotations.
 */
async function load_annotations(syllables, time_blocks, voiceName) {
  // Create an array to hold the syllables and their corresponding time blocks
  let wordy_array = [];

  // The save file, if we find it.
  let saveFile;
  
  // There shouldn't be a save file for None, which sets voiceName to null.
  if (voiceName) {
    // Construct the path to the save file
    let voice_file_extension = get_voice_file_extension(voiceName);
    let save_path = "data/syllables/" + collection_name + "/" + song_name + "/" + song_name + "_" + voice_file_extension + "_save.txt";
    
    try {
      // Try to find the save file
      saveFile = await $.ajax({
        type: 'GET',
        url: save_path,
        error: function(response) {console.log("Found no save for:\t" + voiceName + "\nReverting to default values.\n");}
      });
    } catch (error) {  
    }
  }

  // If the save file exists...
  if (saveFile) {

    // Parse it...
    parsedSaveFile = saveFile.split(/\r?\n/).map(line => {
      const [time, text] = line.split('\t');
      return { time: parseFloat(time), text };
    });

    // Push it to the wordy array.
    for (let annotation of parsedSaveFile) {
      if (annotation.text != ""){
        wordy_array.push([annotation.text, annotation.time]);
      }
    }

  // Else...  
  } else {
    // Construct the default wordy array.
    for (let syllableIndex = 0; syllableIndex < syllables.length; syllableIndex++) {
      wordy_array.push([syllables[syllableIndex], time_blocks[syllableIndex]])
    }
  }

  // Prepare the update object for the annotations
  let update_words = {
    annotations: []
  }

  // Iterate over the wordy_array to create annotation objects
  for (let word in wordy_array) {
    // Create an annotation object for each syllable
    let a_word = {
      x: wordy_array[word][1], //Time block for the syllable
      y: 25, // Y-coordinate for the annotation (fixed at 25 for all annotations)
      xref: 'x',
      yref: 'y',
      text: wordy_array[word][0], // The syllable text
      showarrow: false // No arrow is displayed for the annotation
    };

    // Append the annotation object to the update_words object
    update_words.annotations.push(a_word);
  }

  // Update the plot with the new annotations
  Plotly.relayout(plot, update_words);
}

/**
 * Updates the annotations displayed on the plot based on the selected lyrics option.
 * This function is called when the active lyrics option in the dropdown menu changes.
 * It loads the annotations for the selected lyrics and updates the plot accordingly.
 */
async function update_selected_lyrics() {
  // Get the active lyrics option from the plot layout
  selected_lyrics = plot.layout.updatemenus[0].active;

  // Log the active lyrics option for debugging purposes
  console.log("Active Lyrics set to:", selected_lyrics);

  // Load and display annotations based on the selected lyrics option
  if (selected_lyrics == 0) {
    await load_annotations([""], [0], null);
  } else if (selected_lyrics == 1) {
    await load_annotations(plot.bass_syllables, plot.bass_time_blocks, "bass");
  } else if (selected_lyrics == 2) {
    await load_annotations(plot.mid_syllables, plot.mid_time_blocks, "mid");
  } else if (selected_lyrics ==3) {
    await load_annotations(plot.top_syllables, plot.top_time_blocks, "top");
  }
}


/**
 * Function called by plot.on() when a selection is made in the scatterplot.
 * Adds all points selected to the object selectedPoints, which can be used globally.
 * Intent is for use in buttons.
 * 
 * @param {Object} eventData - The data object provided by [Plotly's selection event](https://plotly.com/javascript/plotlyjs-events/#event-data).
 */
function selection_fn(eventData) {
  // Clear out selectedPoints so we aren't just adding on to it with each selection.
  for (let key in selectedPoints) {
    if (selectedPoints.hasOwnProperty(key)) {
      delete selectedPoints[key];
    }
  }
  
  //For each trace, if it's one of the actual scatter traces, add the selected
  //points from that trace to selectedPoints using the name of the trace as the key.
  for (let trace = 0; trace < plot.data.length; trace++) {
    if (plot.data[trace].name.endsWith("voice") || plot.data[trace].name.endsWith("lyrics")) {
      if (plot.data[trace].selectedpoints && plot.data[trace].selectedpoints.length != 0) {              
        selectedPoints[plot.data[trace].name] = plot.data[trace].selectedpoints
      }
    }
  }

  // Log the selectedPoints for development and debugging purposes
  for (let voice in selectedPoints) {
    console.log("SELECTED POINTS IN " + voice + ": " + selectedPoints[voice]);
  }
}

/**
 * Function called by the button "delete_button" when clicked.
 * Changes the y value of all selected points to 0, effectively
 * "deleting" them.
 */
function on_button_delete() {
  //For each trace, if that trace is a key in selectedPoints, make a copy of the y value array for that trace
  for (let traceIndex = 0; traceIndex < plot.data.length; traceIndex++) {
    if (!plot.data[traceIndex].name.endsWith("lyrics") && selectedPoints.hasOwnProperty(plot.data[traceIndex].name)) {
      var newData = plot.data[traceIndex].y;
      
      //For every point in the selected points of that trace, find that index in newData and set it to 0.
      for (let point in selectedPoints[plot.data[traceIndex].name]) {
        newData[selectedPoints[plot.data[traceIndex].name][point]] = 0;
      }

      //Package up the new array of y values in an update, and send the update using restyle.
      var update = {
        y: [newData] //When sending an array as part of the update, it needs to be put inside another array.
      }

      Plotly.restyle(plot, update, traceIndex);
    }
  }
}

/**
 * Attempts to write the currently selected lyrics position and points to a
 * server-side save file. Depends on save.php.
 */
async function writeSave() {
  // No changing "None".
  if (selected_lyrics == 0) {
    console.log("You aren't supposed to try to edit the None option.");
    return;
  }

  // Log the which voice we want to save
  console.log("Saving data for:", selected_lyrics);

  // Determine which trace to use based on the selected lyrics
  let lyrics_trace_name;
  let voice_file_extension;
  if (selected_lyrics == 1) {
    lyrics_trace_name = 'Bass lyrics';
    voice_file_extension = get_voice_file_extension("bass");
  } else if (selected_lyrics == 2) {
    lyrics_trace_name = 'Middle lyrics';
    voice_file_extension = get_voice_file_extension("mid");
  } else if (selected_lyrics == 3) {
    lyrics_trace_name = 'Top lyrics';
    voice_file_extension = get_voice_file_extension("top");
  }

  // Find the trace that matches the selected lyrics
  let lyricsTrace = plot.data.find(trace => trace.name === lyrics_trace_name);
  if (!lyricsTrace) {
    console.error("Lyrics trace not found for selected lyrics:", lyrics_trace_name);
    return;
  }

  // Extract time blocks from the found trace
  let time_blocks = lyricsTrace.x;

  // Extract annotations for the current trace
  let annotations = plot.layout.annotations;

  // Create a map of annotations for quick lookup by time block
  let annotationMap = new Map();
  annotations.forEach(annotation => {
    annotationMap.set(annotation.x, annotation.text);
  });

  // Iterate through time blocks and pair each with its annotation text or an empty string if no annotation exists
  let saveData = time_blocks.map(time => {
    let annotationText = annotationMap.has(time) ? annotationMap.get(time) : "";
    return [time, annotationText];
  });

  // At this point, saveData contains pairs of [time, annotationText]
  // Converting saveData to a string to write to a file
  let saveDataString = saveData.map(pair => pair.join('\t')).join('\n');
  
  // Construct the path to the save file (partially)
  let save_path = collection_name + "/" + song_name + "/" + song_name + "_" + voice_file_extension;
  
  // Send the save data to be saved
  let data = new FormData();
  data.append("data" , saveDataString);
  data.append("path", save_path)
  let xhr = new XMLHttpRequest();
  xhr.open( 'post', 'save.php', true );

  // https://fetch.spec.whatwg.org/#typedefdef-xmlhttprequestbodyinit:
  // - safely extracting a FormData ensures that the ContentType is multipart/form-data.
  // https://xhr.spec.whatwg.org/#the-send()-method:
  // - Step 4.3 ensures that this is the ContentType in the send() call 
  xhr.send(data);
}

/**
 * Adds a point to the current lyrics trace based on the average of selected points
 * from different the corresponding voice trace.
 * 
 * Will not add duplicates.
 */
function addAveragePointToLyricsTrace() {
  // Check if any points have been selected
  if (Object.keys(selectedPoints).length > 0) {
    // Determine which voice trace to use based on the selected lyrics
    let voice_trace_name;
    if (selected_lyrics == 1) {
      voice_trace_name = 'Bass voice';
    } else if (selected_lyrics == 2) {
      voice_trace_name = 'Middle voice';
    } else if (selected_lyrics == 3) {
      voice_trace_name = 'Top voice';
    } else {
      console.warn("No points selected or invalid selection.");
      return;
    }

    let voiceTraceIndex = plot.data.findIndex(trace => trace.name === voice_trace_name);
    if (voiceTraceIndex === -1) {
      console.error("Voice trace not found:", voice_trace_name);
      return;
    }

    // Find the selected points for the current voice trace
    let selectedPointsForVoice = selectedPoints[voice_trace_name];
    if (!selectedPointsForVoice || selectedPointsForVoice.length === 0) {
      console.warn("No points selected for the current voice trace.");
      return;
    }

    // Calculate the average x value of the selected points
    let sumX = 0;
    for (let selectedIndex = 0; selectedIndex < selectedPointsForVoice.length; selectedIndex++) {
      // Ensure we're accessing the correct trace and point within that trace
      let pointIndex = selectedPointsForVoice[selectedIndex];
      if (plot.data[voiceTraceIndex].x[pointIndex] !== undefined) {
        sumX += plot.data[voiceTraceIndex].x[pointIndex];
      } else {
        console.warn("Point index out of bounds or incorrect trace structure.");
      }
    }
    let averageX = parseFloat((sumX / selectedPointsForVoice.length).toFixed(2));

    // Determine which lyrics trace to use based on the selected lyrics
    let lyrics_trace_name;
    if (selected_lyrics == 1) {
      lyrics_trace_name = 'Bass lyrics';
    } else if (selected_lyrics == 2) {
      lyrics_trace_name = 'Middle lyrics';
    } else if (selected_lyrics == 3) {
      lyrics_trace_name = 'Top lyrics';
    } else {
      console.warn("No lyrics selected or invalid selection.");
      return;
    }

    // Find the lyrics trace index
    let lyricsTraceIndex = plot.data.findIndex(trace => trace.name === lyrics_trace_name);
    if (lyricsTraceIndex === -1) {
      console.error("Lyrics trace not found:", lyrics_trace_name);
      return;
    }

    // No duplicates.
    if (plot.data[lyricsTraceIndex].x.findIndex(x => x === averageX) !== -1) {
      console.warn("A point with the exact same x value already exists. Skipping insertion.");
      return;
    }

    // Find the correct position to insert the new point to keep the trace sorted
    let insertIndex = -1;
    for (let lyricsPointIndex = 0; lyricsPointIndex < plot.data[lyricsTraceIndex].x.length; lyricsPointIndex++) {
      if (plot.data[lyricsTraceIndex].x[lyricsPointIndex - 1] <= averageX && averageX <= plot.data[lyricsTraceIndex].x[lyricsPointIndex]) {
        insertIndex = lyricsPointIndex;
        break;
      }
    }
    
    // Insert the average x value and the fixed y value at the correct position in the lyrics trace
    plot.data[lyricsTraceIndex].x.splice(insertIndex, 0, averageX);
    plot.data[lyricsTraceIndex].y.splice(insertIndex, 0, 25);
  }
}

/**
 * A function called whenever plot.on('plotly_restyle', ...) is called. It reads the event data to determine
 * which button made the call, then passes the data to the appropriate function.
 * 
 * @param {Object} eventData - The data object provided by [Plotly's restyle](https://plotly.com/javascript/plotlyjs-events/#event-data).
 */
function buttonManager(eventData) {
  switch (eventData[0].buttontype) {
    case 'lyrics':
      update_selected_lyrics(eventData);
      break;

    case 'save':
      writeSave();
      break;
    
    case 'addTime':
      addAveragePointToLyricsTrace();
      break;
    
    default:
      console.warn("An unrecognized button called plotly_restlye! Found button:\t" + eventData[0].buttontype + "\n");
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

/**
 * Loads the syllables for a song from a text file and converts them to an array.
 *
 * @param {string} collectionName - The name of the collection of songs.
 * @param {string} songName - The name of the song for which to load syllables.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of syllables as strings.
 */
async function get_annotation_syllables(collectionName, songName) {
  // Construct the URL to the syllables file
  let syllables_url = "data/syllables/" + collectionName + "/" + songName + "/syllables.txt";
  
  // Perform an AJAX GET request to load the syllables file
  let syllables_file = await $.ajax({
    url: syllables_url,
    type: 'GET',
    error: function(response) { console.log(response); }
  });

  // Split the file content by spaces to create an array of syllables
  syllables_file = syllables_file.split(' ');
  
  // Log the loaded syllables for debugging purposes
  console.log("get_annotation_syllables() loaded:\n" + syllables_file);

  // Return the array of syllables
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
      url:"data/ground-estimate-statistics/mad/" + collectionName + "/" + songName + "/" + voice + "_shifted.txt",
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

  plot.bass_syllables = await get_annotation_syllables(collectionName, songName);
  plot.bass_time_blocks = await load_time_blocks(collectionName, songName, "bass");
  var bass_data = await get_voice(collectionName, songName, "bass");

  var bass_annotation_trace = {
    x: plot.bass_time_blocks,
    y: plot.bass_time_blocks.map(() => 25),
    mode: 'markers',
    name: 'Bass lyrics',
    visible: false,
    showlegend: false,
    type: 'scattergl',
    opacity: 0.1,
    marker: {
      color: 'red', // Doesn't really matter what color I use... but eh!
      size: 10, // I need to see!!!
    }
  }

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

  plot.mid_syllables = await get_annotation_syllables(collectionName, songName);
  plot.mid_time_blocks = await load_time_blocks(collectionName, songName, "mid");
  var mid_data = await get_voice(collectionName, songName, "mid");

  var mid_annotation_trace = {
    x: plot.mid_time_blocks,
    y: plot.mid_time_blocks.map(() => 25),
    mode: 'markers',
    name: 'Middle lyrics',
    visible: false,
    showlegend: false,
    type: 'scattergl',
    opacity: 0.1,
    marker: {
      color: 'blue', // Doesn't really matter what color I use... but eh!
      size: 10, // I need to see!!!
    }
  }

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

  plot.top_syllables = await get_annotation_syllables(collectionName, songName); 
  plot.top_time_blocks = await load_time_blocks(collectionName, songName, "top");
  var top_data = await get_voice(collectionName, songName, "top");

  var top_annotation_trace = {
    x: plot.top_time_blocks,
    y: plot.top_time_blocks.map(() => 25),
    mode: 'markers',
    name: 'Top lyrics',
    visible: false,
    showlegend: false,
    type: 'scattergl',
    opacity: 0.1,
    marker: {
      color: 'green', // Doesn't really matter what color I use... but eh!
      size: 10, // I need to see!!!
    }
  }

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

  var data = [bass_trace, bass_annotation_trace, bass_mad_high_trace, bass_mad_low_trace, mid_trace, mid_annotation_trace, mid_mad_low_trace, mid_mad_high_trace, top_trace, top_annotation_trace, top_mad_low_trace, top_mad_high_trace];
  var data2 = [histogram_mid_trace, histogram_bass_trace, histogram_top_trace];

  var layout = {
    updatemenus: [
      {
        buttons: [
          {
            args: [{'buttontype': 'lyrics', 'visible': [false, false, false]}, [1, 5, 9]], // Indices of bass_annotation_trace, mid_annotation_trace, top_annotation_trace
            label: 'Lyrics (None)',
            method: 'restyle'
          },
          {
            args: [{'buttontype': 'lyrics', 'visible': [true, false, false]}, [1, 5, 9]], // Indices of bass_annotation_trace, mid_annotation_trace, top_annotation_trace
            label: 'Lyrics (Bass)',
            method: 'restyle'
          },
          {
            args: [{'buttontype': 'lyrics', 'visible': [false, true, false]}, [1, 5, 9]], // Indices of bass_annotation_trace, mid_annotation_trace, top_annotation_trace
            label: 'Lyrics (Middle)',
            method: 'restyle'
          },
          {
            args: [{'buttontype': 'lyrics', 'visible': [false, false, true]}, [1, 5, 9]], // Indices of bass_annotation_trace, mid_annotation_trace, top_annotation_trace
            label: 'Lyrics (Top)',
            method: 'restyle'
          }
        ],
        yanchor: 'top',
        y: 0.5,
        direction: 'down',
        showactive: true,
        type: 'dropdown',
      },
      {
        buttons: [
          {
            args: [{'buttontype': 'save'}], 
            label: 'Save Changes for Current Voice',
            method: 'restyle'
          },
          {
            args: [{'buttontype': 'addTime'}], 
            label: 'Add Selected Time',
            method: 'restyle'
          }
        ],
        yanchor: 'top',
        y: 1,
        direction: 'down',
        type: 'buttons',
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

  $("#audioPlayer").attr("src", "data/" + collectionName + "/" + songName + "/" + songNameLast + ".mp3");

  plot.on("plotly_selected", selection_fn)
  plot.on("plotly_restyle", buttonManager)

  if (selected_lyrics == 0) {
    await load_annotations([""], [0], null);
  } else if (selected_lyrics == 1) {
    await load_annotations(plot.bass_syllables, plot.bass_time_blocks, "bass");
  } else if (selected_lyrics == 2) {
    await load_annotations(plot.mid_syllables, plot.mid_time_blocks, "mid");
  } else if (selected_lyrics ==3) {
    await load_annotations(plot.top_syllables, plot.top_time_blocks, "top");
  }
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
