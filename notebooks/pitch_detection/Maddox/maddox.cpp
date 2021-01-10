#include <iostream>
#include <fstream>
#include <experimental/filesystem>
#include <string>
#include <string.h>
#include "dywapitchtrack.h"

namespace fs = std::experimental::filesystem;
using namespace std;

dywapitchtracker pitchtracker;
int N, sr;
double duration;
int start_samples;
int sample_count;
double samples[10000000];

void read_and_write (string buffer_path, string pitch_path) {
  ifstream fin(buffer_path);
  ofstream fout(pitch_path);

  fin >> N >> sr;
  duration = (double)N/sr;
  for (int i = 0; i < 10000000; i++)
    if (i < N)
      fin >> samples[i];
    else
      samples[i] = 0;
    
  double thepitch;
  dywapitch_inittracking(&pitchtracker);
  sample_count = dywapitch_neededsamplecount(60, sr);

  for (double j = 0; j < duration; j += 0.01) {
      start_samples = (int)(j * sr);
      thepitch = dywapitch_computepitch(&pitchtracker, samples, start_samples, sample_count);
      thepitch *= (double)sr/44100;
      // cout << j << ' ' << thepitch << endl;
      fout << j << ' ' << thepitch << endl;
  }

  fin.close();
  fout.close();
}


int main(int argc, char** argv)
{
  const char *chk = "true";
  string path = "./data/";

  if (strcmp(argv[1], chk) == 0)
  {
    for (const auto & entry : fs::directory_iterator(path)) {
        cout << entry.path() << endl;
        string filename = fs::path(entry.path()).filename();
        read_and_write(entry.path(), "./pitches/" + filename);
    }
  }

  path = "./data2/";

  if (strcmp(argv[2], chk) == 0) {
    for (const auto &entry : fs::directory_iterator(path))
    {
      cout << fs::path(entry.path()).filename() << ' ' << entry.path() << endl;
      string filename = fs::path(entry.path()).filename();
      read_and_write(entry.path(), "./pitches2/" + filename);
    }
  }
    
  path = "./data3/";
    
  if (strcmp(argv[3], chk) == 0) {
    for (const auto &entry : fs::directory_iterator(path))
    {
      cout << fs::path(entry.path()).filename() << ' ' << entry.path() << endl;
      string filename = fs::path(entry.path()).filename();
      read_and_write(entry.path(), "./pitches3/" + filename);
    }
  }
}
