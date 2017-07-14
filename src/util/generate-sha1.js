'use strict';
import crypto from 'crypto-js/core';
import SHA1 from 'crypto-js/sha1';
import WordArray from 'crypto-js/lib-typedarrays';
import Base64 from 'crypto-js/enc-base64';
import CheckForBlob from './check-object-is-blob';
import CheckForFile from './check-object-is-file';
import CheckForFileReader from './check-for-file-reader';
export default (blob) => {
    return new Promise((resolve, reject) => {
        if (!CheckForFileReader()) reject(new Error("FileReader isn't usable in this browser."));
        if (CheckForFile(blob)) {
            try {
                let sha1 = crypto.algo.SHA1.create();
                let read = 0;
                let multiplier = blob.multiplier || 1;
                let unit = (1024 * 1024) * multiplier;
                let tempBlob;
                let reader = new FileReader();
                reader.readAsArrayBuffer(blob.slice(read, read + unit));
                reader.onload = (e) => {
                    let bytes = crypto.lib.WordArray.create(e.target.result);
                    sha1.update(bytes);
                    read += unit;
                    if (read < blob.size) {
                        tempBlob = blob.slice(read, read + unit);
                        reader.readAsArrayBuffer(tempBlob);
                    } else {
                        let hash = sha1.finalize();
                        let finalHash = hash.toString(crypto.enc.Base64);
                        resolve(finalHash);
                    }
                }
            } catch (e) {
                reject(e);
            }
        } else {
            try {
                let sha1 = crypto.algo.SHA1.create();
                let reader = new FileReader();
                let tempBlob;
                reader.readAsArrayBuffer(blob);
                reader.onload = (e) => {
                    let bytes = crypto.lib.WordArray.create(e.target.result);
                    sha1.update(bytes);
                    let hash = sha1.finalize();
                    let finalHash = hash.toString(crypto.enc.Base64);
                    resolve(finalHash);
                };
            } catch (e) {
                reject(e);
            }
        }
    });
}