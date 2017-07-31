// 'use strict';
import Rusha from 'rusha';
import CheckForFileReader from './check-for-file-reader';
export default (blob) => {
    return new Promise((resolve, reject) => {
        if (!CheckForFileReader()) reject(new Error("FileReader isn't usable in this browser."));
        try {
            let reader = new FileReader();
            reader.onload = (evt) => {
                if (!evt || !evt.target || !evt.target.result) {
                    reject();
                    return;
                }
                var rusha = new Rusha();
                resolve(base64ArrayBuffer(rusha.rawDigest(evt.target.result).buffer));

            };
            reader.readAsArrayBuffer(blob);
        } catch (e) {
            reject(e);
        }
    });
}

function base64ArrayBuffer(arrayBuffer) {
    var base64 = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes = new Uint8Array(arrayBuffer)
    var byteLength = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    for (var i = 0; i < mainLength; i = i + 3) {
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

        a = (chunk & 16515072) >> 18
        b = (chunk & 258048) >> 12
        c = (chunk & 4032) >> 6
        d = chunk & 63

        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    if (byteRemainder == 1) {
        chunk = bytes[mainLength]

        a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
        b = (chunk & 3) << 4 // 3   = 2^2 - 1
        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

        a = (chunk & 64512) >> 10
        b = (chunk & 1008) >> 4
        c = (chunk & 15) << 2
        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}
