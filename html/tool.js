
const audio_player = document.querySelector('audio');
const selectedPoints = {};
var plot = document.getElementById('main_plot');
var plot2 = document.getElementById('mad_plot');
var audio_timer = null;
var audio_shifts = null;
var first_sounds = null; //!! bad global - functions have obscure side effects
var collection_name = null;
var song_name = null;
var voice_name = null;
var lyrics_voice_name = null;
var selected_lyrics = 0;
var lyrics_y_value = -500;
var user_type = "singer"; // or scholar

//!! Something in get_voice_file_extension is broken
var voice_file_extensions = {"bass" : "AHDS1M", "mid" : "AHDS2M", "top" : "AHDS3M",
			     "Bass" : "AHDS1M", "Mid" : "AHDS2M", "Top" : "AHDS3M"};

/* Screen elements*/
var visible_elts = {"uploadLyricsForm":"block",
		    "audioPlayer":"block",
		    "merge_word_left_button":"inline",
		    "merge_word_right_button":"inline"
		   };


function get_voice_file_extension(voiceName) {
  console.log('[get_voice_file_extension]'); 
  let name = voiceName.toLowerCase();
  voiceExt = null;
  if(name == "bass") {
    voiceExt = "AHDS1M";
  } else if(name == "mid"){
    voiceExt = "AHDS2M";
  } else if(name == "top") {
    voiceExt = "AHDS3M";
  } else if(name == "mixed") {
    voiceExt = "";
  }
    console.log(voiceName + ': ' + voiceExt);  
    return voiceExt;
}

/**
 * Some type definitions for JSDoc which should significantly improve the experience of dealing with this code.
 */
/**
 * @todo Replace existing usage of time_blocks and plot.layout.annotations with this structure wherever possible.
 *       Example: When passing arguments to most of our written functions. Reading/writing of saves?
 *       - mergeAnnotation()
 *       - onButtonMergeAnnotation()
 * @typedef {Object} TimeSyllable - Represents a time block and its syllable within the internal data structure.
 * @property {number} syllableIndex - The syllable's index within the original syllable array.
 *                                      `-1` if no syllable exists at this position.
 * @property {number} timeBlockIndex - The time block's index within the time_blocks structure.
 * @property {string} text - The text content of the syllable.
 *                           Empty string if no syllable exists at this position.
 * @property {number} x - The time block's time, which serves as the syllable's x position if it exists.
 */

/**
 * Returns the index of the lyrics trace within `plot.data` based on the `lyricsID`.
 * This is typically passed `selected_lyrics`.
 * 
 * @param {number} lyricsID `1` for bass, `2` for middle, `3` for top.
 * @returns {number} The index of the lyrics trace within `plot.data`, or `-1` if an invalid `lyricsID` was passed.
 */
function getLyricsTraceIndex(lyricsID) {
  // Determine which lyrics trace to use based on the selected lyrics
  let lyricsTraceName;
  switch (lyricsID) {
    case 1:
      lyricsTraceName = 'Bass lyrics';
      break;
    
    case 2:
      lyricsTraceName = 'Middle lyrics';
      break;

    case 3:
      lyricsTraceName = 'Top lyrics';
      break;
    
    default:
      console.warn("No lyrics selected or invalid selection.");
      return -1;
  }
    
  // Find the lyrics trace index
  return plot.data.findIndex(trace => trace.name === lyricsTraceName);
}

/**
 * Splits a string into lines.
 * Cross platform: works for \r\n (Windows) and \n (Linux)
 * Returns an array of lines, each without newline characters.
 * Removes a terminal empty line.
 *
 * @param {string} s - the string
 * @returns {Array<string>} An array of strings
 */
function splitlines(s) {
    let lines = s.split(/\r?\n/);
    while (lines.length > 0 && lines[lines.length-1] == "") {
	lines.pop();
    }
    return lines;
}

 /**
 * Loads time blocks for a given voice from a text file.
 * Time blocks represent valid times for syllables.
 * 
 * If it fails for some reason, returns an array with `0` as the only element.
 *
 * @param {string} collectionName - The name of the collection of songs.
 * @param {string} songName - The name of the song for which to load time blocks.
 * @param {string} voiceName - The name of the voice (bass, mid, top) for which to load time blocks.
 * @returns {Promise<number[]>} A promise that resolves to an array of time blocks as numbers.
 */
async function load_time_blocks(collectionName, songName, voiceName) {
  // Determine the file extension based on the voice name
  let voiceFileExtension = get_voice_file_extension(voiceName);

  // Construct the path to the time blocks file
  let pathToTimeBlocksFile = "georgian/data/syllables/" + collectionName + "/" + songName + "/" + songName + "_" + voiceFileExtension + "_time_blocks.txt";
  
  let timeBlocksFromFile;
  try {
    // Perform an AJAX GET request to load the time blocks file
    timeBlocksFromFile = await $.ajax({
      url: pathToTimeBlocksFile,
      type:'GET',
      error: function(response) { console.log(response); }
    });

    // Log the loaded time blocks for debugging purposes
    //console.log("load_time_blocks(" + collectionName + ", " + songName + ",  " + voiceName + ") loaded:\n" + time_blocks_file);
    console.log("load_time_blocks() loaded:\n" + timeBlocksFromFile.slice(0, 10));

    // Split the file content by line breaks and convert each line to a float
    timeBlocksFromFile = splitlines(timeBlocksFromFile).map(parseFloat);
  } catch (error) {
    timeBlocksFromFile = [0];
    console.warn(`Failed to load ${pathToTimeBlocksFile}, defaulting to no time blocks.`);
  }

  // Return the array of time blocks
  return timeBlocksFromFile;
}

/**
 * Combines syllables and time blocks into a single data structure.
 * You should strive to manipulate this structure rather than the plot itself,
 * and then update the plot from your modified structure.
 * 
 * @param {string[]} syllablesFromFile The syllables as retrieved from `getLyricsFromFile()`.
 * @param {number[]} timeBlocks The time blocks as retrieved from `load_time_blocks()`.
 * @returns {TimeSyllable[]} An array of time blocks and their associated syllables. Refer to the typdef, or this function.
 */
function createTimeSyllableStructure(syllablesFromFile, timeBlocks) {
  // Initialize an array with the same length as time_blocks, filled with objects indicating no syllable
  let timeSyllables = timeBlocks.map((timeBlock, index) => ({
    syllableIndex: -1, // No syllable, so index is -1
    timeBlockIndex: index,
    text: "", // No syllable, so text is an empty string
    x: timeBlock
  }));

  for (let index = 0; index < timeSyllables.length; index++) {
    let syllable = syllablesFromFile[index];
    if (syllable != null) {
      timeSyllables[index] = {
        ...timeSyllables[index],
        syllableIndex: index,
        text: syllable
      };
    }
  }

  return timeSyllables;
}

/**
 * Updates the lyrics on the plot using the TimeSyllables structure.
 * 
 * @param {TimeSyllable[]} timeSyllables The internal data structure containing time blocks and their associated syllables.
 * @param {number} lyricsTraceIndex The index of the lyrics trace to update.
 */
function updateLyricsFromTimeSyllables(timeSyllables, lyricsTraceIndex) {
  // Package the update
  let update = {
    buttontype: 'IGNORE', // Prevent buttonManager() from mistakenly default-casing.
    x: [timeSyllables.map(timeSyllable => timeSyllable.x)], 
    text: [timeSyllables.map(timeSyllable => timeSyllable.text)]
  };
  
  // Send the update
  Plotly.restyle(plot, update, lyricsTraceIndex);
}

/**
 * Moves syllables in the plot based on the selected points and the specified direction.
 * The <direction>most selected syllable is moved to the next valid time block in the direction specified.
 * If the next time block is occupied by another syllable, it moves as well, recursively, until an
 * open space is filled.
 *
 * @param {number[]} chosenPoints - The indices of the selected points in the plot.
 * @param {TimeSyllable[]} timeSyllables - The internal data structure containing time blocks and their associated syllables.
 * @param {string} direction - The direction to move the syllables in, either "right" or "left".
 * @returns {boolean} False if anything explicitly prevented the move from happening. True otherwise.
 */
function shiftSyllables(chosenPoints, timeSyllables, direction) {

  // Find the index of the selected syllable.
  let preferredIndex = 0;
  if (direction == "right") {
    preferredIndex = chosenPoints.length - 1
  }
  let chosenSyllableIndex = timeSyllables.findIndex((timeSyllable) => (timeSyllable.x == plot.data[getLyricsTraceIndex(selected_lyrics)].x[chosenPoints[preferredIndex]]));

  // deselect points
  Plotly.restyle(plot, {buttontype: 'IGNORE', selectedpoints: [null]}); 

  // Don't go out of bounds.
  if ((chosenSyllableIndex === timeSyllables.length - 1 && direction == "right") || (chosenSyllableIndex === 0 && direction == "left")) {
    console.warn(`OUT OF BOUNDS CALL:\n\tshiftSyllables(${chosenPoints}, ${timeSyllables}, ${direction})\n\n\tSELECTED INDEX:\t${chosenSyllableIndex}`);
    return false;
  }

  // Try to move the chosen syllable
  let success = moveSyllableRecursively(chosenSyllableIndex, timeSyllables, direction);
  if (!success) {
    return false;
  }

  // Try to identify the trace index by name.
  let thisTraceIndex = getLyricsTraceIndex(selected_lyrics);

  if (thisTraceIndex != -1) {
    // Update the plot with the new syllables
    updateLyricsFromTimeSyllables(timeSyllables, thisTraceIndex);
    return true;
  } else {
    console.error(`Couldn't find the index of ${selected_lyrics}!`);
    return false;
  }
}

/**
 * Recursively moves a syllable to the next valid time block in the specified direction.
 * If the target time block is occupied, it moves the existing syllable there recursively
 * until an unoccupied block is found.
 * 
 * @param {number} targetIndex - The index of the syllable to move within `timeSyllables`.
 * @param {TimeSyllable[]} timeSyllables - The internal data structure containing time blocks and their associated syllables.
 * @param {string} direction - The direction to move the syllable, either "right" or "left".
 * @returns {boolean} True if the move was successful, false if the move failed (e.g., due to moving out of bounds or other issues).
 */
function moveSyllableRecursively(targetIndex, timeSyllables, direction) {
  // Don't go out of bounds.
  if ((targetIndex >= (timeSyllables.length - 1) && direction == "right") || (targetIndex <= 0 && direction == "left")) {
    console.warn(`OUT OF BOUNDS CALL:\n\tmoveSyllableRecursively(${targetIndex}, ${timeSyllables}, ${direction})\n`);
    return false;
  }

  let nextTargetIndex;
  if (direction === "right") {
    // Find the next time block to the right of the current syllable
    nextTargetIndex = targetIndex + 1;
  } else if (direction === "left") {
    // Find the last time block to the left of the current syllable
    nextTargetIndex = targetIndex - 1;
  }

  // If there's a syllable at the target time block, move it
  if (timeSyllables[targetIndex].text != "") {
    // Try to move the next syllable out of the way. If it's empty, this always succeeds.
    let success = moveSyllableRecursively(nextTargetIndex, timeSyllables, direction);
    if (!success) {
      return false;
    }
    
    // Move the syllable to the target time block
    timeSyllables[nextTargetIndex].syllableIndex = timeSyllables[targetIndex].syllableIndex;
    timeSyllables[nextTargetIndex].text = timeSyllables[targetIndex].text;
    timeSyllables[targetIndex].syllableIndex = -1;
    timeSyllables[targetIndex].text = "";
  }
  return true;
}

/**
 * This function is called when a button to shift syllables in a specific direction is clicked.
 * It moves the selected syllable to the next valid time block in the direction specified by the button,
 * as well as all syllables in that direction if the next time block is occupied.
 *
 * @param {string} direction - The direction in which to move the syllables, either "right" or "left".
 */
function onButtonShiftSyllables(direction) {
  // Check if any points have been selected
  if (Object.keys(selectedPoints).length > 0) {
    // Determine which time blocks to use based on the selected lyrics
    let timeBlocksTrace = plot.data[getLyricsTraceIndex(selected_lyrics)];

    let allTimeSyllables = [plot.bassTimeSyllables, plot.midTimeSyllables, plot.topTimeSyllables];
    
    // Get all selected points for the current lyrics trace
    let lyricsPoints = [];
    lyricsPoints.push(...selectedPoints[timeBlocksTrace.name]);

    // Call the shiftSyllables function to move the syllables in the specified direction
    shiftSyllables(lyricsPoints, allTimeSyllables[selected_lyrics - 1], direction);
  }
}

/**
 * Moves a syllable in the plot based on the selected points and the specified direction.
 * The <direction>most selected syllable is moved to the next valid time block in the direction specified.
 * If the next time block is occupied by another syllable, it merges the texts.
 *
 * @param {number[]} chosenPoints - The indices of the selected points in the plot.
 * @param {TimeSyllable[]} timeSyllables - The internal data structure containing time blocks and their associated syllables.
 * @param {string} direction - The direction to move the syllable in, either "right" or "left".
 * @returns {boolean} False if anything explicitly prevented the move from happening. True otherwise.
 */
function mergeSyllables(chosenPoints, timeSyllables, direction) {
  // Find the index of the selected syllable.
  let preferredIndex = 0;
  if (direction == "right") {
    preferredIndex = chosenPoints.length - 1
  }
  let chosenSyllableIndex = timeSyllables.findIndex((timeSyllable) => (timeSyllable.x == plot.data[getLyricsTraceIndex(selected_lyrics)].x[chosenPoints[preferredIndex]]));

  // deselect points
  Plotly.restyle(plot, {buttontype: 'IGNORE', selectedpoints: [null]}); 

  // Don't go out of bounds.
  if ((chosenSyllableIndex === timeSyllables.length - 1 && direction == "right") || (chosenSyllableIndex === 0 && direction == "left")) {
    console.warn(`OUT OF BOUNDS CALL:\n\tmergeSyllables(${chosenPoints}, ${timeSyllables}, ${direction})\n\n\tSELECTED INDEX:\t${chosenSyllableIndex}`);
    return false;
  }

  // Try to move the chosen syllable
  let success = mergeSyllable(chosenSyllableIndex, timeSyllables, direction);
  if (!success) {
    return false;
  }

  // Try to identify the trace index by name.
  let thisTraceIndex = getLyricsTraceIndex(selected_lyrics);

  if (thisTraceIndex != -1) {
    // Update the plot with the new syllables
    updateLyricsFromTimeSyllables(timeSyllables, thisTraceIndex);
    return true;
  } else {
    console.error(`Couldn't find the index of ${selected_lyrics}!`);
    return false;
  }
}

/**
 * Moves a syllable to the next valid time block in the specified direction.
 * If the target time block is occupied, it merges the texts.
 * 
 * @param {number} targetIndex - The index of the syllable to move within `timeSyllables`.
 * @param {TimeSyllable[]} timeSyllables - The internal data structure containing time blocks and their associated syllables.
 * @param {string} direction - The direction to move the syllable, either "right" or "left".
 * @returns {boolean} True if the move was successful, false if the move failed (e.g., due to moving out of bounds or other issues).
 */
function mergeSyllable(targetIndex, timeSyllables, direction) {
  // Don't go out of bounds.
  if ((targetIndex >= (timeSyllables.length - 1) && direction == "right") || (targetIndex <= 0 && direction == "left")) {
    console.warn(`OUT OF BOUNDS CALL:\n\tmergeSyllable(${targetIndex}, ${timeSyllables}, ${direction})\n`);
    return false;
  }

  let nextTargetIndex;
  if (direction === "right") {
    // Find the next time block to the right of the current syllable
    nextTargetIndex = targetIndex + 1;
  } else if (direction === "left") {
    // Find the last time block to the left of the current syllable
    nextTargetIndex = targetIndex - 1;
  }

  // If there's a syllable at the target time block, merge the texts
  if (timeSyllables[nextTargetIndex].text != "") {
    if (direction === "left") {
      timeSyllables[targetIndex].text = timeSyllables[nextTargetIndex].text + '-' + timeSyllables[targetIndex].text;
    } else {
      timeSyllables[targetIndex].text += '-' + timeSyllables[nextTargetIndex].text;
    }
  }

  // Move the syllable to the target time block
  timeSyllables[nextTargetIndex].syllableIndex = timeSyllables[targetIndex].syllableIndex;
  timeSyllables[nextTargetIndex].text = timeSyllables[targetIndex].text;
  timeSyllables[targetIndex].syllableIndex = -1;
  timeSyllables[targetIndex].text = "";

  return true;
}

/**
 * This function is called when a button to merge syllables in a specific direction is clicked.
 * It moves the selected syllable to the next valid time block in the direction specified by the button.
 * If an annotation is already present at the target time block, it merges the texts.
 * 
 * @param {string} direction - The direction in which to move the syllable, either "right" or "left".
 */
function onButtonMergeSyllables(direction) {
  // Check if any points have been selected
  if (Object.keys(selectedPoints).length > 0) {
    // Determine which time blocks to use based on the selected lyrics
    let timeBlocksTrace = plot.data[getLyricsTraceIndex(selected_lyrics)];

    let allTimeSyllables = [plot.bassTimeSyllables, plot.midTimeSyllables, plot.topTimeSyllables];
    
    // Get all selected points for the current lyrics trace
    let lyricsPoints = [];
    lyricsPoints.push(...selectedPoints[timeBlocksTrace.name]);

    // Call the mergeSyllables function to move the syllables in the specified direction
    mergeSyllables(lyricsPoints, allTimeSyllables[selected_lyrics - 1], direction);
  }
}

/**
 * Updates the `selected_lyrics` global variable.
 */
async function update_selected_lyrics() {
  // Get the active lyrics option from the plot layout
  selected_lyrics = plot.layout.updatemenus[0].active;

  // Log the active lyrics option for debugging purposes
  console.log("Active Lyrics set to:", selected_lyrics);
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

/** FOR TESTING ONLY
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
        buttontype: 'IGNORE', 
        y: [newData] //When sending an array as part of the update, it needs to be put inside another array.
      }

      Plotly.restyle(plot, update, traceIndex);
    }
  }
}

/**
 * Attempts to read the time-syllables file for the designated song/voice.
 * Returns the save parsed as an array of TimeSyllables if successful.
 * 
 * @param {string} collectionName The name of the collection of songs.
 * @param {string} songName The name of the song for which to load syllables.
 * @param {string} voiceName The name of the voice (bass, mid, top) for which to load time blocks.
 * @returns {TimeSyllables[]} An array of time blocks and their associated syllables. Refer to the typdef, or this function.
 * 
 * @throws An exception if the time-syllables file doesn't exist or otherwise failed to be loaded and parsed.
 */
async function readTimeSyllables(collectionName, songName, voiceName) {
    console.log('[readTimeSyllables]' + collectionName + ' - ' + songName + ' - ' + voiceName );
  // Determine the file extension based on the voice name
  let voiceFileExtension = get_voice_file_extension(voiceName);

  // The time-syllables file, if we find it.
  let timeSyllablesFile;
  
  // Construct the path to the time-syllables file
  let timeSyllablesPath = "georgian/data/syllables/" + collectionName + "/" + songName + "/" + songName + "_" + voiceFileExtension + "_time_syllables.txt";
  
  // Try to find the time-syllables file
  timeSyllablesFile = await $.ajax({
    type: 'GET',
    url: timeSyllablesPath,
    error: function(response) {console.log("Found no save for:\t" + voiceName + "\nReverting to default values.\n");}
  });
  
  // Parse it...
  parsedTimeSyllablesFile = splitlines(timeSyllablesFile).map(line => {
    const [time, text] = line.split('\t');
    return { time: parseFloat(time), text };
  });
  
  // Return the read times.
  let timeBlocksFromTimeSyllablesFile = [];
  let syllablesFromTimeSyllablesFile = [];
  for (let saveChunk of parsedTimeSyllablesFile) {
    timeBlocksFromTimeSyllablesFile.push(saveChunk.time);
    syllablesFromTimeSyllablesFile.push(saveChunk.text);
  }
  
  // Initialize an array with the same length as time_blocks, filled with objects indicating no syllable
  let timeSyllables = timeBlocksFromTimeSyllablesFile.map((timeBlock, index) => ({
    syllableIndex: -1, // No syllable, so index is -1
    timeBlockIndex: index,
    text: "", // No syllable, so text is an empty string
    x: timeBlock
  }));
  
  // Add in the syllables
  for (let index = 0; index < timeSyllables.length; index ++) {
    let syllable = syllablesFromTimeSyllablesFile[index];
    if (syllable != "") {
      timeSyllables[index] = {
        ...timeSyllables[index],
        syllableIndex: index,
        text: syllable
      };
    }
  }
  
  // Return the read save
  return timeSyllables;
}

/**
 * Attempts to write the currently selected lyrics position and points to a
 * server-side time-syllable file. Depends on save_time_syllables.php.
 */
async function writeTimeSyllables() {
  // No changing "None".
  if (selected_lyrics == 0) {
    console.log("You aren't supposed to try to edit the None option.");
    return;
  }

  // Determine which file extension to use based on the selected lyrics
  let voice_file_extension;
  if (selected_lyrics == 1) {
    voice_file_extension = get_voice_file_extension("bass");
  } else if (selected_lyrics == 2) {
    voice_file_extension = get_voice_file_extension("mid");
  } else if (selected_lyrics == 3) {
    voice_file_extension = get_voice_file_extension("top");
  }

  // Extract time blocks from the lyrics trace
  let time_blocks = plot.data[getLyricsTraceIndex(selected_lyrics)].x;

  // Extract syllables for the current trace
  let syllables = plot.data[getLyricsTraceIndex(selected_lyrics)].text;

  // Iterate through time blocks and pair each with its syllable text or an empty string if no syllable exists
  let saveData = time_blocks.map((time, index) => {
    let syllable = syllables[index];
    return [time, syllable];
  });

  // At this point, saveData contains pairs of [time, syllable]
  // Converting saveData to a string to write to a file
  let saveDataString = saveData.map(pair => pair.join('\t')).join('\n');
  
  // Construct the path to the time-syllable file (partially)
  let time_syllables_path = collection_name + "/" + song_name + "/" + song_name + "_" + voice_file_extension;

  // Log the voice we want to save
  console.log("Saving data to path\n", time_syllables_path);
  
  // Send the save data to be saved
  let data = new FormData();
  data.append("data", saveDataString);
  data.append("path", time_syllables_path)
  let xhr = new XMLHttpRequest();
  xhr.open( 'post', 'save_time_syllables.php', true );

  // https://fetch.spec.whatwg.org/#typedefdef-xmlhttprequestbodyinit:
  // - safely extracting a FormData ensures that the ContentType is multipart/form-data.
  // https://xhr.spec.whatwg.org/#the-send()-method:
  // - Step 4.3 ensures that this is the ContentType in the send() call
  // https://developer.mozilla.org/en-US/docs/Web/API/FormData#browser_compatibility
  // - shows which browser versions are required  
  xhr.send(data);
}

/**
 * Adds a point to the current lyrics trace based on the average of selected points
 * from different the corresponding voice trace.
 * 
 * Will not add duplicates.
 */
function addAveragePointToLyricsTrace() {
  console.log("[addAveragePointToLyricsTrace]");
  // Check if any points have been selected
  if (Object.keys(selectedPoints).length > 0) {
    // Determine which voice trace to use based on the selected lyrics
    let timeSyllables;
    let voice_trace_name;
    if (selected_lyrics == 1) {
        voice_trace_name = "Bass voice";  
	timeSyllables = plot.bassTimeSyllables;
    } else if (selected_lyrics == 2) {
        voice_trace_name = "Mid voice";  
	timeSyllables = plot.midTimeSyllables;
    } else if (selected_lyrics == 3) {
        voice_trace_name = "Top voice";  
	timeSyllables = plot.topTimeSyllables;
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

    
    // Find the lyrics trace index
    //let lyricsTrace = plot.data[getLyricsTraceIndex(selected_lyrics)];

    // No duplicates.
      if (timeSyllables.findIndex(ts => ts.x === averageX) !== -1) {
      console.warn("A point with the exact same x value already exists. Skipping insertion.");
      return;
    }

    // Find the correct position to insert the new point to keep the trace sorted
    //!! Consider binary search or reverse lookup table
    let insertIndex = 0;
      for (let tsPointIndex = 0; tsPointIndex <= timeSyllables.length; tsPointIndex++) {
	  if (tsPointIndex == 0 && averageX <= timeSyllables[0].x) {
	      insertIndex = 0;
	      break;
	  }
	  if (tsPointIndex == timeSyllables.length) {
	      insertIndex = tsPointIndex;
	      break;
          }
	  if (tsPointIndex > 0 && timeSyllables[tsPointIndex - 1].x <= averageX && averageX <= timeSyllables[tsPointIndex].x) {
              insertIndex = tsPointIndex;
              break;
	  }
      }
    
    // Insert the average x value and the fixed y value at the correct position in the lyrics trace
    elt = {syllableIndex: -1, timeBlockIndex: -1, text: "", x: averageX};
    timeSyllables.splice(insertIndex, 0, elt);
    updateLyricsFromTimeSyllables(timeSyllables, getLyricsTraceIndex(selected_lyrics));

    // deselect points
    Plotly.restyle(plot, {buttontype: 'IGNORE', selectedpoints: [null]}); 
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
      writeTimeSyllables();
      break;
    
    case 'addTime':
      addAveragePointToLyricsTrace();
      break;
    
    case 'shiftLeft':
      onButtonShiftSyllables('left');
      break;
    
    case 'shiftRight':
      onButtonShiftSyllables('right');
      break;

    case 'mergeLeft':
      onButtonMergeSyllables('left');
      break;

    case 'mergeRight':
      onButtonMergeSyllables('right');
      break;
    
    case 'IGNORE':
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
 * Loads the lyrics for a song from a text file as an array of syllables (strings).
 * If it fails for some reason, returns an array with an empty string as the only element.
 *
 * @param {string} collectionName - The name of the collection of songs.
 * @param {string} songName - The name of the song for which to load syllables.
 * @returns {Promise<string[]>} A promise that resolves to an array of syllables as strings.
 */
async function getLyricsFromFile(collectionName, songName) {
  // Construct the URL to the syllables file
  let pathToSyllablesFile = "georgian/data/syllables/" + collectionName + "/" + songName + "/syllables.txt";
  
  let syllablesFromFile;
  try {
    // Perform an AJAX GET request to load the syllables file
    syllablesFromFile = await $.ajax({
      url: pathToSyllablesFile,
      type: 'GET',
      error: function(response) { console.log(response); }
    });
    
    // Split the file content by spaces to create an array of syllables
    syllablesFromFile = syllablesFromFile.split(' ');
    
    // Log the loaded syllables for debugging purposes
    console.log(`getLyricsFromFile(${collectionName}, ${songName}) loaded:\n${syllablesFromFile}`);
  } catch (error) {
    // Failsafe.
    syllablesFromFile = [""];
    console.warn(`Failed to load ${pathToSyllablesFile}, defaulting to no lyrics.`);
  }

  // Return the array of syllables
  return syllablesFromFile;
}

async function get_audio_shift_file(collectionName, songName) {
  /*
  audio_shift_file = await $.ajax({
    url:"georgian/data/ground-estimate/" + collectionName + "/" + songName + "/shifts.txt",
    type:'GET'
  });
  voices = splitlines(audio_shift_file)
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
    url:"georgian/data/ground-estimate/" + collectionName + "/" + songName + "/first_sounds.txt",
    type:'GET'
  });
  first_sounds_file = first_sounds_file.split(' ');
  for(let voice_id = 0; voice_id <= 3; voice_id++) {
    first_sounds[voice_id] = parseFloat(first_sounds_file[voice_id]);
  }
}

function get_file(collectionName, songName, voice, dataType = "audio") {
 if(dataType == "audio") {
    console.log("georgian/data/ground-estimate/" + collectionName + "/" + songName + "/" + voice + "_shifted.txt");
    return $.ajax({
        url:"georgian/data/ground-estimate/" + collectionName + "/" + songName + "/" + voice + "_shifted.txt",
        type:'GET'
      });
 } else if(dataType == "mad") {
     return $.ajax({
	 url:"georgian/data/ground-estimate-statistics/mad/" + collectionName + "/" + songName + "/"
	     + voice + "_shifted.txt",
	 type:'GET'
     });
 } else if(dataType == "notes") {
     return $.ajax({
	 url:"georgian/data/pitches-postprocessed/crepe/" + collectionName + "/" + songName + "/"
	     + songName + "_" + voice + ".notes_shifted.txt",
	 type:'GET'
     });
 } else {
     console.log("[get_file] Could not retrieve data type " + dataType + " for song " + songName);
     return false;
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

// A2 = 110Hz = 0cents
function toCents(data) {
    let cents_data = [];
    for (const datum of data) {
	cents_data.push(datum.map(function(pt) {
	    if (pt >= 55.0) {
		return 1200 * Math.log2(pt / 110);
	    } else {
		return -1200 - 20*(55.0 - pt);
	    }
	}));
    }
    return cents_data;
}

/* Retrieves voice data from files, where pitches are in Hz
 * Converts Hz to cents
 */
async function get_voice(collectionName, songName, voiceName) {
    voice_file_extension = get_voice_file_extension(voiceName);
    await get_audio_shift_file(collectionName, songName); //!! fills first_sounds for this song only; overwritten each time
    data = await get_file(collectionName, songName, voice_file_extension, "audio");
    var dataX = splitlines(data).map(function(ln){
	return get_shifted_time(parseFloat(ln.split(' ')[0]/100), voiceName);
    });
    var dataY = splitlines(data).map(function(ln){
	return parseFloat(ln.split(' ')[1]);
    });
    mad = await get_file(collectionName, songName, voice_file_extension, "mad");
    var dataMad = splitlines(mad).map(function(ln){
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
    notes = await get_file(collectionName, songName, voice_file_extension, "notes");
    var dataNotes = splitlines(notes).map(function(ln){
	return parseFloat(ln.split(' ')[1]);
    });

    cents_data = toCents([dataY, data_mad_low, data_mad_high, dataNotes]);
    return [dataX, cents_data[0], cents_data[1], cents_data[2], cents_data[3]];
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

function changeVisibility(eltviz, viz_override = "") {
    console.log('[changeVisibility]');
    for (let eltname in eltviz) {
	let elt = document.getElementById(eltname);
	if (viz_override != "") {
	    elt.style.display = viz_override;
	}
	else {
	    elt.style.display = eltviz[eltname];
	}
    }
}

/* To be called when collection_name, song_name, and voice_name have values */
async function update_plot(collectionName, songName, voiceName) {
  console.log("[update_plot]");
  if(collection_name == null || song_name == null || voice_name == null) {
      return false
  }

  try {
    plot.bassTimeSyllables =  await readTimeSyllables(collectionName, songName, "bass");
  } catch (error) {
    plot.bassTimeSyllables = createTimeSyllableStructure(await getLyricsFromFile(collectionName, songName), await load_time_blocks(collectionName, songName, "bass"));
  }

  var bass_data = await get_voice(collectionName, songName, "bass");

  var bassLyricsTrace = {
    x: plot.bassTimeSyllables.map(timeSyllable => timeSyllable.x),
    y: plot.bassTimeSyllables.map(() => lyrics_y_value),
    textposition: 'top center',
    text: plot.bassTimeSyllables.map(timeSyllable => timeSyllable.text),
    textfont: {size: 16},
    mode: 'markers+text',
    name: 'Bass lyrics',
    visible: false,
    showlegend: false,
    type: 'scattergl',
    marker: {
      opacity: 0.1,
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

  var bass_notes_trace = {
    x: bass_data[0],
    y: bass_data[4],
    mode: 'markers',
    name: 'Bass notes',
    type: 'scattergl',
    marker: {
	    color: 'pink',
	    size: 3,
    }
  };

  try {
    plot.midTimeSyllables =  await readTimeSyllables(collectionName, songName, "mid");
  } catch (error) {
    plot.midTimeSyllables = createTimeSyllableStructure(await getLyricsFromFile(collectionName, songName), await load_time_blocks(collectionName, songName, "mid"));
  }

  var mid_data = await get_voice(collectionName, songName, "mid");

  var midLyricsTrace = {
    x: plot.midTimeSyllables.map(timeSyllable => timeSyllable.x),
    y: plot.midTimeSyllables.map(() => lyrics_y_value),
    textposition: 'middle center',
    text: plot.midTimeSyllables.map(timeSyllable => timeSyllable.text),
    textfont: {size: 16},
    mode: 'markers+text',
    name: 'Middle lyrics',
    visible: false,
    showlegend: false,
    type: 'scattergl',
    marker: {
      opacity: 0.1,
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

  var mid_notes_trace = {
    x: mid_data[0],
    y: mid_data[4],
    mode: 'markers',
    name: 'Mid notes',
    type: 'scattergl',
    marker: {
	    color: 'lightblue',
	    size: 3,
    }
  };

  try {
    plot.topTimeSyllables =  await readTimeSyllables(collectionName, songName, "top");
  } catch (error) {
    plot.topTimeSyllables = createTimeSyllableStructure(await getLyricsFromFile(collectionName, songName), await load_time_blocks(collectionName, songName, "top"));
  }

  var top_data = await get_voice(collectionName, songName, "top");

  var topLyricsTrace = {
    x: plot.topTimeSyllables.map(timeSyllable => timeSyllable.x),
    y: plot.topTimeSyllables.map(() => lyrics_y_value),
    textposition: 'middle center',
    text: plot.topTimeSyllables.map(timeSyllable => timeSyllable.text),
    textfont: {size: 16},
    mode: 'markers+text',
    name: 'Top lyrics',
    visible: false,
    showlegend: false,
    type: 'scattergl',
    marker: {
      opacity: 0.1,
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

  var top_notes_trace = {
    x: top_data[0],
    y: top_data[4],
    mode: 'markers',
    name: 'Top notes',
    type: 'scattergl',
    marker: {
	    color: 'lightgreen',
	    size: 3,
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

  var data = [bassLyricsTrace, midLyricsTrace, topLyricsTrace, bass_trace, mid_trace, top_trace, bass_notes_trace, mid_notes_trace, top_notes_trace];
  var scholar_data = [bass_mad_high_trace, bass_mad_low_trace, mid_mad_low_trace, mid_mad_high_trace, top_mad_low_trace, top_mad_high_trace];
  if (user_type == "scholar") {
      data = data.concat(scholar_data);
  }
  var data2 = [histogram_mid_trace, histogram_bass_trace, histogram_top_trace];

  var layout = {
    updatemenus: [
      {
        buttons: [
          {
            args: [{'buttontype': 'lyrics', 'visible': [false, false, false]}, [data.indexOf(bassLyricsTrace), data.indexOf(midLyricsTrace), data.indexOf(topLyricsTrace)]], // Indices of bassLyricsTrace, midLyricsTrace, topLyricsTrace
            label: 'Lyrics (None)',
            method: 'restyle'
          },
          {
            args: [{'buttontype': 'lyrics', 'visible': [true, false, false]}, [data.indexOf(bassLyricsTrace), data.indexOf(midLyricsTrace), data.indexOf(topLyricsTrace)]], // Indices of bassLyricsTrace, midLyricsTrace, topLyricsTrace
            label: 'Lyrics (Bass)',
            method: 'restyle'
          },
          {
            args: [{'buttontype': 'lyrics', 'visible': [false, true, false]}, [data.indexOf(bassLyricsTrace), data.indexOf(midLyricsTrace), data.indexOf(topLyricsTrace)]], // Indices of bassLyricsTrace, midLyricsTrace, topLyricsTrace
            label: 'Lyrics (Middle)',
            method: 'restyle'
          },
          {
            args: [{'buttontype': 'lyrics', 'visible': [false, false, true]}, [data.indexOf(bassLyricsTrace), data.indexOf(midLyricsTrace), data.indexOf(topLyricsTrace)]], // Indices of bassLyricsTrace, midLyricsTrace, topLyricsTrace
            label: 'Lyrics (Top)',
            method: 'restyle'
          }
        ],
          yanchor: 'top',
	  xanchor: 'left',
	  x: -0.4,
          y: 0.4,
          direction: 'down',
          showactive: true,
          type: 'dropdown',
      },
      {
        buttons: [
          {
            args: [{'buttontype': 'save'}], 
            label: 'Save Lyrics',
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
	  xanchor: 'left',
	  x: -0.4,
        direction: 'down',
        showactive: false,
        type: 'buttons',
      },
      {
        buttons: [
          {
            args: [{'buttontype': 'shiftLeft'}], 
            label: '<== Shift Left',
            method: 'restyle'
          },
          {
            args: [{'buttontype': 'shiftRight'}], 
            label: 'Shift Right ==>',
            method: 'restyle'
          },
          {
            args: [{'buttontype': 'mergeLeft'}], 
            label: '<== Merge Left',
            method: 'restyle'
          },
          {
            args: [{'buttontype': 'mergeRight'}], 
            label: 'Merge Right ==>',
            method: 'restyle'
          }
        ],
        yanchor: 'bottom',
        y: -0.4,
        xanchor: 'auto',
        direction: 'right',
        showactive: false,
        type: 'buttons',
      }
    ],
    xaxis: { 
	range:[-3,3],
	title: {
          text: "Time (sec.)",
          standoff: 10
	}
    }, 
    yaxis : {
	autorange: true,
	title: {
          text: "Cents (0 = A2)",
          standoff: 10
	}
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
    autosize: true,
    title: songName
  } 

  var layout2 = {
        autosize: true,  
	title: songName + "'s MAD Histogram",
	xaxis: {
		range: [0,10],
	}
  }

  Plotly.newPlot(plot, data, layout);
  if (user_type == "scholar") {
    Plotly.newPlot(plot2, data2, layout2);
  }

  song_name_ext = get_voice_file_extension(voiceName);
  if(song_name_ext != "") {
    songNameLast = songName + "_" + song_name_ext;
  } else {
    songNameLast = songName;
  }

  $("#audioPlayer").attr("src", "georgian/data/" + collectionName + "/" + songName + "/" + songNameLast + ".mp3");

  plot.on("plotly_selected", selection_fn)
  plot.on("plotly_restyle", buttonManager)
}

$( document ).ready(function() {
    audio_player.addEventListener('play', (event) => {
      startInterval()
    });

    audio_player.addEventListener('pause', (event) => {
      stopInterval()
    });
});

/* Enables lyrics file upload selector and populates voice options for selector
 * To be called when collection_name, song_name, and voice_name have values
 */
function enableLyricsUpload(voices) {
    if(collection_name != null && song_name != null && voice_name != null && voices.length > 0) {
	console.log('[enableLyricsUpload]');
	document.getElementById('uploadLyrics').disabled = false;
	$('<option/>').val('').html('').appendTo('#uploadLyrics');
	for (const voice of voices){
	    $('<option/>').val(get_voice_name(voice)).html(get_voice_name(voice)).appendTo('#uploadLyrics');
	    console.log(voice + ': ' + get_voice_name(voice));
	}
    }
}

/* Calls php script to
 * - set session variables from inputs
 * - return available voices
 */

/* Calls php script to get list of voice options for selector
 * To be called when collection_name, song_name, and voice_name have values
 */
// From https://stackoverflow.com/questions/18741554/maintain-selected-dropdown-values-across-multiple-pages-in-php
async function getVoicesNeedingLyrics(collectionName, songName, voiceName) {
    console.log('[getVoicesNeedingLyrics]');
    document.getElementById("uploadLyrics").disabled = true;
    console.log('calling [voices_needing_lyrics.php]');
    $.ajax({
        url: 'voices_needing_lyrics.php',
        type: 'POST',
	dataType: "json",
        data: {
            'collectionName' : collection_name,
	    'songName' : song_name,
	    'voiceName' : voice_name
        },
	success: function(response) {
	    enableLyricsUpload(response);
	}
    });
}

function updateScreen() {
    console.log("[updateScreen]");
    $( "#uploadLyrics" ).html("");
    document.getElementById('uploadLyrics').disabled = true;
    if(collection_name != null && song_name != null && voice_name != null) {
	getVoicesNeedingLyrics(collection_name, song_name, voice_name);
	update_plot(collection_name, song_name, voice_name);
	changeVisibility(visible_elts);
    } else {
	changeVisibility(visible_elts, "none");
    }
}

//// Input handling

$( "#collectionName" ).change(function() {
    collection_name = $("#collectionName").val();
    if (collection_name == "") {
	collection_name = null;
    }
  $("#songNameRow").show();
  $('#songName').html("");
  $('<option/>').val('').html('').appendTo('#songName');
  console.log("In tool.js, collection changed, main_plot: " + plot + "\n");
  console.log(collectionDirectories[collection_name]);
    if (collection_name != null) {
	for (const song of collectionDirectories[collection_name]){
	    $('<option/>').val(song).html(song).appendTo('#songName');
	    console.log(song);
	}
    }
    updateScreen();
});

$( "#songName" ).change(function() {
    song_name = $("#songName").val();
    if (song_name == "") {
	song_name = null;
    }
    $("#voiceNameRow").show();
    updateScreen();
});

$( "#voiceName" ).change(function() {
    voice_name = $("#voiceName").val();
    if (voice_name == "") {
	voice_name = null;
    }
    updateScreen();
});

$( "#uploadLyrics" ).change(function() {
    lyrics_voice_name = $("#uploadLyrics").val();
    if (lyrics_voice_name == "") {
	lyrics_voice_name = null;
    }
});

$("form#uploadLyricsForm").submit(function(event){
 
    //disable the default form submission
    event.preventDefault();
 
    //grab all form data  
    var formData = new FormData($(this)[0]);
    formData.append("collectionName", collection_name);
    formData.append("songName", song_name);
    formData.append("voiceName", lyrics_voice_name);
    console.log('[uploadLyrics submit] ' + lyrics_voice_name.toLowerCase() + ': voice ext = ' + voice_file_extensions[lyrics_voice_name]);
    formData.append("voiceExtension", voice_file_extensions[lyrics_voice_name]);

    if (lyrics_voice_name != null) {
	$.ajax({
	    url: 'upload_lyrics.php',
	    type: 'POST',
	    data: formData,
	    async: false,
	    cache: false,
	    contentType: false,
	    processData: false,
	    success: function (returndata) {
		console.log(returndata);
		alert(returndata);
	    }
	}); 
    }
    return false;
});


