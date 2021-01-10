import librosa
import numpy as np
import os
import shutil


# '''
# The conversion of wav files from Scherbhaum Mshavanandze folder to text files.
# '''

# data_dir = '/Akamai/voice/data/Scherbaum Mshavanadze'

def mp3_to_txt(from_path, to_path):
    if os.path.exists(to_path):
        return

    y, sr = librosa.load(from_path)
    with open(to_path, "w+") as fout:
        fout.write(f"{len(y)} {sr}\n")
        for e in y:
            fout.write(f"{e}\n")

# for collection in os.listdir(data_dir):
#     if collection[0] == 'G':
#         for recording in os.listdir(data_dir + '/' + collection):
#             if (recording[-3:] == 'wav'):
#                 mp3_to_txt(data_dir + '/' + collection + "/" + recording, "./data/" + recording[:-3] + "txt") 

# if len(os.listdir('pitches/')) == 0:
#     os.system('./maddox.out true false false')

# res_dir = '/Akamai/voice/data/pitches-raw/maddox/Scherbaum Mshavanadze/'
# for each_file in os.listdir('pitches'):
#     if not os.path.exists(res_dir + each_file[:-11]):
#         os.mkdir(res_dir + each_file[:-11])
    
#     shutil.copy2('pitches/' + each_file, res_dir + each_file[:-11] + '/' + each_file)


# '''
# The conversion of wav files from Teach Yourself Megrelian Songs folder to text files.
# '''

# data_dir = '/Akamai/voice/data/Teach Yourself Megrelian Songs'

# for collection in os.listdir(data_dir):
#     if collection[-3:] == 'zip':
#         continue
#     for recording in os.listdir(data_dir + '/' + collection):
#         if (recording[-3:] == 'wav'):
#             mp3_to_txt(data_dir + '/' + collection + "/" + recording, "./data2/" + recording[:-3] + "txt") 

# if len(os.listdir('pitches2/')) == 0:
#     os.system('./maddox.out false true false')

# res_dir = '/Akamai/voice/data/pitches-raw/maddox/Teach Yourself Megrelian Songs/'
# for each_file in os.listdir('pitches2'):
#     if each_file.find('_A') != -1:
#         c_path = res_dir + each_file[:each_file.find('_A')]
#     else:
#         c_path = res_dir + each_file[:each_file.find('.')]

#     if not os.path.exists(c_path):
#         os.mkdir(c_path)

#     print(c_path)
#     shutil.copy2('pitches2/' + each_file, c_path + '/' + each_file)
    
    
 

'''
The conversion of wav files from Teach Yourself Gurian Songs folder to text files.
'''

data_dir = '/Akamai/voice/data/Teach Yourself Gurian Songs'

for collection in os.listdir(data_dir):
    if collection[-3:] == 'zip':
        continue
    for recording in os.listdir(data_dir + '/' + collection):
        if (recording[-3:] == 'wav'):
            mp3_to_txt(data_dir + '/' + collection + "/" + recording, "./data3/" + recording[:-3] + "txt") 

if len(os.listdir('pitches3/')) == 0:
    print('running')
    os.system('./maddox.out false false true')

res_dir = '/Akamai/voice/data/pitches-raw/maddox/Teach Yourself Gurian Songs/'
for each_file in os.listdir('pitches3'):
    if each_file.find('_A') != -1:
        c_path = res_dir + each_file[:each_file.find('_A')]
    else:
        c_path = res_dir + each_file[:each_file.find('.')]

    if not os.path.exists(c_path):
        os.mkdir(c_path)

    print(c_path)
    shutil.copy2('pitches3/' + each_file, c_path + '/' + each_file)
    