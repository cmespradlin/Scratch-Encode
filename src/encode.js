'use strict';

var videoStringList = [];
var fileObjUrl; // we declare this globally so that the objectURL is not destroyed once it is out of context. This may be unnecessary.
var videoElement;
let canvas = document.getElementById("drawTarget");
let context = canvas.getContext("2d", {willReadFrequently: true});
let base256LookupTable = [ // used to convert to base94 string
    "Ā","ā","Ă","ă","Ą","ą","Ć","ć","Ĉ","ĉ","Ċ","ċ","Č","č","Ď","ď","Đ","đ","Ē","ē","Ĕ","ĕ","Ė","ė","Ę","ę","Ě","ě","Ĝ","ĝ","Ğ","ğ","Ġ","ġ","Ģ","ģ","Ĥ","ĥ","Ħ","ħ","Ĩ","ĩ","Ī","ī","Ĭ","ĭ","Į","į","İ","ı","Ĳ","ĳ","Ĵ","ĵ","Ķ","ķ","ĸ","Ĺ","ĺ","Ļ","ļ","Ľ","ľ","Ŀ","ŀ","Ł","ł","Ń","ń","Ņ","ņ","Ň","ň","ŉ","Ŋ","ŋ","Ō","ō","Ŏ","ŏ","Ő","ő","Œ","œ","Ŕ","ŕ","Ŗ","ŗ","Ř","ř","Ś","ś","Ŝ","ŝ","Ş","ş","Š","š","Ţ","ţ","Ť","ť","Ŧ","ŧ","Ũ","ũ","Ū","ū","Ŭ","ŭ","Ů","ů","Ű","ű","Ų","ų","Ŵ","ŵ","Ŷ","ŷ","Ÿ","Ź","ź","Ż","ż","Ž","ž","ſ","ƀ","Ɓ","Ƃ","ƃ","Ƅ","ƅ","Ɔ","Ƈ","ƈ","Ɖ","Ɗ","Ƌ","ƌ","ƍ","Ǝ","Ə","Ɛ","Ƒ","ƒ","Ɠ","Ɣ","ƕ","Ɩ","Ɨ","Ƙ","ƙ","ƚ","ƛ","Ɯ","Ɲ","ƞ","Ɵ","Ơ","ơ","Ƣ","ƣ","Ƥ","ƥ","Ʀ","Ƨ","ƨ","Ʃ","ƪ","ƫ","Ƭ","ƭ","Ʈ","Ư","ư","Ʊ","Ʋ","Ƴ","ƴ","Ƶ","ƶ","Ʒ","Ƹ","ƹ","ƺ","ƻ","Ƽ","ƽ","ƾ","ƿ","ǀ","ǁ","ǂ","ǃ","Ǆ","ǅ","ǆ","Ǉ","ǈ","ǉ","Ǌ","ǋ","ǌ","Ǎ","ǎ","Ǐ","ǐ","Ǒ","ǒ","Ǔ","ǔ","Ǖ","ǖ","Ǘ","ǘ","Ǚ","ǚ","Ǜ","ǜ","ǝ","Ǟ","ǟ","Ǡ","ǡ","Ǣ","ǣ","Ǥ","ǥ","Ǧ","ǧ","Ǩ","ǩ","Ǫ","ǫ","Ǭ","ǭ","Ǯ","ǯ","ǰ","Ǳ","ǲ","ǳ","Ǵ","ǵ","Ƕ","Ƿ","Ǹ","ǹ","Ǻ","ǻ","Ǽ","ǽ","Ǿ","ǿ"
//"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "\`", "~", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+", "[", "]", "\\", "|", ";", ":", "\'", "\"", ",", "<", ".", ">", "/", "?"
];
let videoDrop = document.getElementById("videoDrop");

function delay(n) {
    n = n || 2000;
    return new Promise(done => {
      setTimeout(() => {
        done();
      }, n);
    });
  }

async function enc(e) {
    //videoElement.play();
    await delay(3000);
    for (let i = 0; i < videoElement.duration; i += (1 / 15)) { // advance the video at 15 frames per second
        videoElement.currentTime = i;
        await delay(1);
        context.drawImage(videoElement, 0, 0, 120, 90); // draw the current frame in the video to a canvas element for direct manipulation of pixels
        let frame = context.getImageData(0, 0, 120, 90);
        let frameString = "";
        for (let j = 0; j < frame.data.length; j += 4) { // advance through all of the pixels in the current frame and convert their RGB color values into Scratch's decimal color format
            let toDecimal = (frame.data[j] * 65536) + (frame.data[j + 1] * 256) + frame.data[j + 2];
            let toBase256 = "";
            let k = 0;
            if (toDecimal < 65536) { // Now we convert Scratch's decimal system into a base 256 encoded string, with 3 characters representing a pixel. We can only use certain characters, as they have to also be able to be read from Scratch itself in order to properly decode it.
                toBase256 = toBase256 + "Ā";
            } else {
                while (toDecimal > 65535) {
                    toDecimal -= 65536;
                    k++;
                }
                toBase256 += base256LookupTable[k];
            }
            k = 0;
            if (toDecimal < 256) {
                toBase256 += "Ā";
            } else {
                while (toDecimal > 255) {
                    toDecimal -= 256;
                    k++;
                }
                toBase256 += base256LookupTable[k];
            }
            toBase256 += base256LookupTable[toDecimal];
            frameString += toBase256; // concatenate all pixels together into one big string that represents 1 encoded frame
        }
        videoStringList[videoStringList.length] = frameString;
        //console.log(frameString);
    }
    for (let i = 0; i < videoStringList.length; i++) {

    }
    videoDrop.innerHTML = "Done encoding!"
    console.log(videoStringList);
}

function encode(file) {
    videoElement = document.createElement("video"); // create a new video element to decode the mp4 file
    fileObjUrl = URL.createObjectURL(file); // turn the uploaded file into an object URL so that we can use it as the src for our video element
    videoElement.src = fileObjUrl;
    videoElement.width = "120";
    videoElement.height = "90";
    videoElement.preload = "auto";
    videoElement.load();
    videoElement.addEventListener('loadeddata', enc, false); // wait for the video element to finish loading
}

function getVideoFromDrop(e) { // function bound to a drop event on our drag-n-drop element in order to retrieve the file and validate that it is an .mp4 file
    e.preventDefault();
    let err = 0;
    for (let i = 0; i < e.dataTransfer.items.length; i++) { // check item list for correct file type, which is .mp4
        if (e.dataTransfer.items[i].type !== "video/mp4") {
            err++; // if any discrepancies are found, err gets ticked up by 1 and the loop stops
            break;
        }
    }
    if (err !== 0) { // check err and leave a notification to the user that they need to select a different file
        document.getElementById("videoDrop").innerHTML = "Please select a different file. Only .mp4 video files are allowed. You can use a program such as VLC to transcode to another format if necessary.";
    } else { // otherwise we're good to grab that data and start the fun stuff!
        document.getElementById("videoDrop").innerHTML = "encoding..."; // I'll add a queue later...
        encode(e.dataTransfer.items[0].getAsFile()); // getAsFile() returns the file as a blob, so it's pretty convenient to work with!
    }
}

window.addEventListener('dragover', function(e) { // stop browser from automatically opening dropped files, and stop the drop effect from saying it is ok to drop outside of our drop box
    e.dataTransfer.dropEffect = 'none';
    e.preventDefault();
}, false)
window.addEventListener('drop', function(e) {
    e.dataTransfer.dropEffect = 'none';
    e.preventDefault();
}, false)

videoDrop.addEventListener('dragover', function(e) { // change the drop effect when we are hovering over the drop box, to let the user know that this is indeed the right spot
    e.dataTransfer.dropEffect = 'copy';
    e.stopPropagation();
    e.preventDefault();
}, false);
videoDrop.addEventListener('drop', getVideoFromDrop, false); // process the dropped file using getVideoFromDrop


