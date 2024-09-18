<?php
header("content-type: text/html; charset=UTF-8");

//!! Allow some non-plaintext English characters:
//   \xe2\x80\x99, ’
//!! Currently, uni2plain empties a string

// allowable characters and transcription
$englishChars = str_split("abcdefghijklmnopqrstuvwxyz'- \n");
$georgianChars = str_split("აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ- \n"); //!! should go up to e183bf
$englishGeorgian1 = array("ts'" => "წ",
                          "ch'" => "ჭ"
                         );
$englishGeorgian2 = array("k'" => "კ",
                          "p'" => "პ",
                          "zh" => "ჟ", 
                          "t'" => "ტ", 
                          "gh" => "ღ", 
                          "q'" => "ყ",
                          "sh" => "შ", 
                          "ch" => "ჩ", 
                          "ts" => "ც", 
                          "dz" => "ძ", 
                          "kh" => "ხ"
                         );
$englishGeorgian3 = array("a" => "ა",
                          "b" => "ბ",
                          "c" => "",
                          "d" => "დ",
                          "e" => "ე",
                          "f" => "",
                          "g" => "გ",
                          "h" => "ჰ",
                          "i" => "ი",
                          "j" => "ჯ",
                          "k" => "ქ",
                          "l" => "ლ",
                          "m" => "მ",
                          "n" => "ნ",
                          "o" => "ო",
                          "p" => "ფ",
                          "q" => "ყ",
                          "r" => "რ",
                          "s" => "ს",
                          "t" => "თ",
                          "u" => "უ",
                          "v" => "ვ",
                          "w" => "",
                          "x" => "",
                          "y" => "",
                          "z" => "ზ"
                         );
$georgianEnglish = array("ა" => "a",
                         "ბ" => "b",
                         "გ" => "g",
                         "დ" => "d",
                         "ე" => "e",
                         "ვ" => "v",
                         "ზ" => "z",
                         "თ" => "t",
                         "ი" => "i",
                         "კ" => "k'",
                         "ლ" => "l",
                         "მ" => "m",
                         "ნ" => "n",
                         "ო" => "o",
                         "პ" => "p'",
                         "ჟ" => "zh",
                         "რ" => "r",
                         "ს" => "s",
                         "ტ" => "t'",
                         "უ" => "u",
                         "ფ" => "p",
                         "ქ" => "k",
                         "ღ" => "gh",
                         "ყ" => "q'",
                         "შ" => "sh",
                         "ჩ" => "ch",
                         "ც" => "ts",
                         "ძ" => "dz",
                         "წ" => "ts'",
                         "ჭ" => "ch'",
                         "ხ" => "kh",
                         "ჯ" => "j",
                         "ჰ" => "h"
                        );

function uni2plain($s) {
    $s = str_replace("’", "'", $s);
}

function ge2en($s) {
    global $georgianEnglish;
    foreach ($georgianEnglish as $ge => $en) {
        $s = str_replace($ge,$en,$s);
    }
    return $s;
}

function en2ge($s) {
    global $englishGeorgian1, $englishGeorgian2, $englishGeorgian3;
    foreach ($englishGeorgian1 as $en => $ge) {
        $s = str_replace($en,$ge,$s);
    }
    foreach ($englishGeorgian2 as $en => $ge) {
        $s = str_replace($en,$ge,$s);
    }
    foreach ($englishGeorgian3 as $en => $ge) {
        $s = str_replace($en,$ge,$s);
    }
    return $s;
}
?>
