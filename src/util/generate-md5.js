'use strict';
import SHA1 from 'crypto-js/sha1';
import CheckForFile from './check-object-is-file';
import CheckForFileReader from './check-for-file-reader';
export default (file) => {
  if (CheckForFile(file) && CheckForFileReader()) {
    let sha1 = CryptoJS.algo.SHA1.create();
    let read = 0;
    let unit = 1024 * 1024;
    let blob;
    let reader = new FileReader();
    reader.readAsArrayBuffer(file.slice(read, read + unit));
    reader.onload = (e) => {
      let bytes = CryptoJS.lib.WordArray.create(e.target.result);
      sha1.update(bytes);
      read += unit;
      if (read < file.size) {
        blob = file.slice(read, read + unit);
        reader.readAsArrayBuffer(blob);
      } else {
        let hash = sha1.finalize();
        let finalHash = hash.toString(CryptoJS.enc.Hex);
      }
    }
  }
}