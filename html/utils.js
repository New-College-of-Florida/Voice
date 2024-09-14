
function get_voice_name(fileExt) {
    console.log('[get_voice_name]'); 
    name = null;
    if (fileExt == "AHDS1M") {
	name = "Bass";
    } else if (fileExt == "AHDS2M") {
	name = "Mid";
    } else if (fileExt == "AHDS3M") {
	name = "Top";
    }
    return name;
}
