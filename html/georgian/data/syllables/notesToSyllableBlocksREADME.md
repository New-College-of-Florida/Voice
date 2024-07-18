# Using notesToSyllableBlocks.py<br>
At the time of writing, this script still involves a lot of manual work to use. It may improve in the future.<br>

To generate syllable time block files for a given song...<br>

1. Locate the shifted notes files for your song. In the case of Sabodisho, these are `Sabodisho_AHDS1M.notes_shifted.txt`, `Sabodisho_AHDS2M.notes_shifted.txt`, and `Sabodisho_AHDS3M.notes_shifted.txt`. Copy them into the same directory as this script.<br>

2. In `main()` at the bottom of the script, change the `filename` variable so it matches the name of the first notes file, i.e. `'Sabodisho_AHDS1M.notes_shifted.txt'`.<br>

3. Run the script, preferrably from an editor such as IDLE. It will print out the first 10 pairs read from the original file and the first 10 times that are to be written to the `*_time_blocks.txt` file. This is meant to help catch any glaringly obvious failures, and you should not expect these lists to be the same in most cases. If run without IDLE or similar, the program exits immediately upon completion, so you will not have time to review these lists if you so desire. This is intentional design meant to save time.<br>

4. Repeat steps 2 and 3 as needed, subsituting "the name of the first notes file" for the next notes file you wish to process, until you have done so for all notes files you wish to process.<br>

5. Ideally, delete the copies you made of the shifted notes files and move your new `*_time_blocks.txt` files to the appropriate directories.<br>
