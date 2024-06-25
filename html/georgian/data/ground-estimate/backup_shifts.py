#!/opt/anaconda3/bin/python

import os
import shutil

collections = ["Teach Yourself Gurian Songs", "Teach Yourself Megrelian Songs"] #, "Scherbaum Mshavanadze"]

def main():
    for coll in collections:
        for song in os.listdir(coll):
            if os.path.exists(f"{coll}/{song}/shifts.txt") and (not os.path.exists(f"{coll}/{song}/shifts_pre_mix.txt")):
                shutil.copyfile(f"{coll}/{song}/shifts.txt", f"{coll}/{song}/shifts_pre_mix.txt")
                print(f"Copied {coll}/{song}/shifts.txt to shifts_pre_mix.txt.")

main()

