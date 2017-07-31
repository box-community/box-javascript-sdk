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
                resolve((rusha.digestFromBuffer(evt.target.result)));

            };
            reader.readAsArrayBuffer(blob);
        } catch (e) {
            reject(e);
        }
    });
}