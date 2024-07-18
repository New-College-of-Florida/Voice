"""
Purpose: Read a note file and write a new file with start times for notes to place syllables at.
Date: November 16, 2023
"""

# Imports
import os

# Function Definitions
def readNoteFile(fileName: str) -> list[list[float]]:
	"""
    Reads a note file and returns a list of lists containing float values.

    This function reads a note file where each line contains a pair of float values.
    Each pair is converted into a list of floats and added to a list, which is then returned.

    Args:
        fileName (str): The name of the file to be read.

    Returns:
        list[list[float]]: A list of lists, where each inner list contains a pair of float values.
    """

	# Get the directory of the current script
	directoryPath = os.path.dirname(os.path.realpath(__file__))
	# Join the directory path and filename to get the full file path
	filePath = os.path.join(directoryPath, fileName)

	# Initialize an empty list to store the note pairs
	noteList = []

	# Open the file and read each line
	with open(filePath, 'r', encoding = 'UTF-8') as noteFile:
		for line in noteFile.readlines():
			# Split the line into a pair of values
			timePair = line.split()
			floatedPair = []
			# Convert each value in the pair to a float
			for value in timePair:
				floatedPair.append(float(value))
			# Add the pair of floats to the note list
			noteList.append(floatedPair)
	
	# Return the list of note pairs
	return noteList

def constructSyllableBlocks(noteList: list[list[float]]) -> list[list[float]]:
	"""
    Constructs syllable blocks from a list of note pairs.

    This function takes a list of note pairs, where each pair consists of a time and a pitch.
    It then constructs syllable blocks based on the sustain and minimum pitch values.
    A syllable block is created when a note with a pitch greater than or equal to the minimum pitch
    is sustained for a certain amount of time.

    Args:
        noteList (list[list[float]]): A list of note pairs, where each pair consists of a time and a pitch.

    Returns:
        list[list[float]]: A list of syllable blocks, where each block is a list of times.
    """

	# The minimum duration for a note to be considered sustained
	sustain = 7 # in centiseconds

	# The minimum pitch for a note to be considered
	minimumPitch = 60

	# Initialize an empty list to store the syllable blocks
	syllableBlocks = []

	# Initialize a streak counter
	streak = 1

	# Initialize a history of pair values
	pairHistory = [[-1, -1]]

	# Iterate over each time-pitch pair in the note list
	for timePair in noteList:
		# If the pitch of the current pair is the same as the last pair in the history
		if timePair[1] == pairHistory[-1][1]:
			# Increment the streak counter
			streak += 1
			# If the streak reaches the sustain value and the pitch is above the minimum pitch
			if streak == sustain and timePair[1] >= minimumPitch:
				# Add the start time of the streak to the syllable blocks
				syllableBlocks.append([pairHistory[0][0]])
		else:
			# If the pitch is not the same, reset the streak counter
			streak = 1

		# Add the current pair to the history
		pairHistory.append(timePair)

		# If the history becomes longer than the sustain value
		if len(pairHistory) >= sustain:
			# Remove the oldest pair from the history
			pairHistory.pop(0)
	
	# Return the list of syllable blocks
	return syllableBlocks

def writeNoteFile(syllableBlocks: list[list[float]], newFileName: str) -> None:
	"""
    Writes the syllable blocks to a new file.

    This function takes a list of syllable blocks and a filename as input. It writes each syllable block
    to a new line in the file. Each element in a block is separated by a space.

    Args:
        syllableBlocks (list[list[float]]): A list of syllable blocks, where each block is a list of times.
        newFileName (str): The name of the file to be written.

    Returns:
        None
    """

	# Get the directory of the current script
	directoryPath = os.path.dirname(os.path.realpath(__file__))
	# Join the directory path and filename to get the full file path
	filePath = os.path.join(directoryPath, newFileName)

	# Open the file in write mode
	with open(filePath, 'w', encoding = 'UTF-8') as noteFile:
		# Iterate over each syllable block
		for block in syllableBlocks:
			blockString = ''
			# Convert each element in the block to a string and join them with a space
			for element in block:
				blockString += str(element) + ' '
			# Write the block string to the file, removing trailing spaces
			noteFile.write(blockString.strip() + '\n')
			
	# The function does not return anything
	return None

# If standalone...
if __name__ == '__main__':
	# Define main()
	def main():
		# The filename. It should be in the same directory as the script.
		filename = 'Sabodisho_AHDS1M.notes_shifted.txt'

		# Split up the name to create the new file name.
		parts = filename.split('_')
		songName = parts[0]
		voiceFileExtension = parts[1].split('.')[0]
		newFilename = songName + "_" + voiceFileExtension + "_time_blocks.txt"
		
		# Create the note list and write to a new file.
		noteList = readNoteFile(filename)
		print(noteList[:10])
		syllableBlocks = constructSyllableBlocks(noteList)
		print(syllableBlocks[:10])
		writeNoteFile(syllableBlocks, newFilename)
		return 0
	
	# Call to main()
	main()