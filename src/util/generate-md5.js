'use strict';
import crypto from 'crypto-js/core';
import SHA1 from 'crypto-js/sha1';
import WordArray from 'crypto-js/lib-typedarrays';
import CheckForFile from './check-object-is-file';
import CheckForFileReader from './check-for-file-reader';
export default (file) => {
  return new Promise((resolve, reject) => {
    if (!CheckForFileReader()) reject(new Error("FileReader isn't usable in this browser."));
    if (!CheckForFile(file)) reject(new Error("File object not detected."));
    try {
      let sha1 = crypto.algo.SHA1.create();
      let read = 0;
      let unit = 1024 * 1024;
      let blob;
      let reader = new FileReader();
      reader.readAsArrayBuffer(file.slice(read, read + unit));
      reader.onload = (e) => {
        let bytes = crypto.lib.WordArray.create(e.target.result);
        sha1.update(bytes);
        read += unit;
        if (read < file.size) {
          blob = file.slice(read, read + unit);
          reader.readAsArrayBuffer(blob);
        } else {
          let hash = sha1.finalize();
          let finalHash = hash.toString(crypto.enc.Hex);
          resolve(finalHash);
        }
      }
    } catch (e) {
      reject(e);
    }
  });
}