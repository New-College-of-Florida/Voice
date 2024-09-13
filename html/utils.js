
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
    return voice;
}

function get_voice_name(file_ext) {
    name = null;
    if (file_ext == "AHDS1M") {
	name = "Bass";
    } else if (file_ext == "AHDS2M") {
	name = "Mid";
    } else if (file_ext == "AHDS3M") {
	name = "Top";
    }
    return name;
}
