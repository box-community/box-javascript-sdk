import BOX_CONSTANTS from '../config/box-constants';
const PROGRESS_EVENT_NAME = "boxChunkedUploadProgress";
const FAILURE_EVENT_NAME = "boxChunkedUploadFailure";
const SUCCESS_EVENT_NAME = "boxChunkedUploadSuccess";
const START_EVENT_NAME = "boxChunkedUploadStart";
const FILE_COMMIT_EVENT_NAME = "boxChunkedUploadFileCommitted";
const FILE_COMMIT_RETRY_EVENT_NAME = "boxChunkedUploadFileCommitRetry";
const COMPLETED_EVENT_NAME = "boxChunkedUploadCompleted";
const START_CANCELLING_EVENT_NAME = "boxChunkedUploadStartCancelling";
const END_CANCELLING_EVENT_NAME = "boxChunkedUploadEndCancelling";
const ABORT_UPLOAD_EVENT_NAME = "boxChunkedUploadAbortUpload";
export default class ChunkedUploader {
    constructor(filesManager, fileName, file, parentFolder, listeners, newVersionFileId) {
        this.filesManager = filesManager
        this.client = filesManager.client;
        this.file = file;
        this.fileName = fileName;
        this.newVersionFileId = newVersionFileId || "";
        this.parts = [];
        this.tasks = [];
        this.partRequestCancellations = [];
        this.parentFolder = parentFolder;
        this.session = {
            id: "",
            endpoints: {
                listParts: "",
                commit: "",
                uploadPart: "",
                status: "",
                abort: ""
            },
            expiresAt: "",
            partSize: 0,
            totalParts: 0
        }
        this.getFailureNotification = listeners.getFailureNotification || null;
        this.getSuccessNotification = listeners.getSuccessNotification || null;
        this.getStartNotification = listeners.getStartNotification || null;
        this.getFileCommitNotification = listeners.getFileCommitNotification || null;
        this.getFileCommitRetryNotification = listeners.getFileCommitRetryNotification || null;
        this.getCompletedNotification = listeners.getCompletedNotification || null;
        this.getIsCancellingNotification = listeners.getIsCancellingNotification || null;
        this.getIsCancelledNotification = listeners.getIsCancelledNotification || null;
        this.handleProgressUpdates = listeners.handleProgressUpdates || null;
        this.progress = {
            isCancelled: false,
            isComplete: false,
            didStart: false,
            didFail: false,
            didSucceed: false,
            didFileCommit: false,
            didSessionStart: false,
            percentageProcessed: 0,
            percentageUploaded: 0,
            fileCommitRetryTime: 0,
            session: {}
        };
        this.retry = 0;
        this.uploadCount = 0;
        this.processedCount = 0;
        this.isCancelled = false;
        this.finishedCancelling = false;
        this.finishedUploading = false;
        this.retryCommitTimer = null;
        let self = this;
        this.abortUpload = function (evt) {
            if (self.retryCommitTimer) {
                clearTimeout(self.retryCommitTimer);
            }
            self.partRequestCancellations.forEach(function (part) {
                if (part.abort) {
                    part.abort();
                }
            })
            self.isCancelled = true;
            if (self.getIsCancellingNotification !== null) {
                self.progress.didFileCommit = false;
                self.progress.didSucceed = false;
                self.progress.didFail = false;
                self.fireEvent(self.progress, START_CANCELLING_EVENT_NAME);
            }
            if (self.session && self.session.endpoints && self.session.endpoints.abort) {
                let options = {};
                options.method = BOX_CONSTANTS.HTTP_VERBS.DELETE;
                options.url = self.session.endpoints.abort;
                return self.client.makeRequest(null, options)
                    .then(function (resp) {
                        if (self.getIsCancelledNotification !== null) {
                            self.fireEndCancellingEvent();
                        }
                        self.endSession();
                        self.finishedCancelling = true;
                    })
                    .catch(function (e) {
                        if (self.getIsCancelledNotification !== null) {
                            self.fireEndCancellingEvent();
                        }
                        self.endSession();
                        self.finishedCancelling = true;
                    });
            } else {
                if (self.getIsCancelledNotification !== null) {
                    self.fireEndCancellingEvent();
                }
                self.finishedCancelling = true;
                self.endSession();
            }
        }
        addEventListener(ABORT_UPLOAD_EVENT_NAME, this.abortUpload);
    }

    fireEndCancellingEvent() {
        let self = this;
        self.progress.didFileCommit = false;
        self.progress.didSucceed = false;
        self.progress.didFail = false;
        self.progress.isComplete = true;
        self.progress.isCancelled = true;
        self.fireEvent(self.progress, END_CANCELLING_EVENT_NAME);
    }

    endSession() {
        this.removeListeners();
        this.session = null;
        this.filesManager = null;
        this.client = null;
        this.file = null;
        this.fileName = null;
        this.parts = null;
        this.tasks = null;
        this.partRequestCancellations = null;
        this.parentFolder = null;
        this.retry = null;
        this.uploadCount = null;
        this.processedCount = null;
        this.isCancelled = null;
        this.finishedCancelling = null;
        this.finishedUploading = null;
        this.abortUpload = null;
    }

    addListeners() {
        if (this.getFailureNotification !== null) {
            addEventListener(FAILURE_EVENT_NAME, this.getFailureNotification);
        }
        if (this.getSuccessNotification !== null) {
            addEventListener(SUCCESS_EVENT_NAME, this.getSuccessNotification);
        }
        if (this.getStartNotification !== null) {
            addEventListener(START_EVENT_NAME, this.getStartNotification);
        }
        if (this.getFileCommitNotification !== null) {
            addEventListener(FILE_COMMIT_EVENT_NAME, this.getFileCommitNotification);
        }
        if (this.getFileCommitRetryNotification !== null) {
            addEventListener(FILE_COMMIT_RETRY_EVENT_NAME, this.getFileCommitRetryNotification);
        }
        if (this.getCompletedNotification !== null) {
            addEventListener(COMPLETED_EVENT_NAME, this.getCompletedNotification);
        }
        if (this.getIsCancellingNotification !== null) {
            addEventListener(START_CANCELLING_EVENT_NAME, this.getIsCancellingNotification);
        }
        if (this.getIsCancelledNotification !== null) {
            addEventListener(END_CANCELLING_EVENT_NAME, this.getIsCancelledNotification);
        }
        if (this.handleProgressUpdates !== null) {
            addEventListener(PROGRESS_EVENT_NAME, this.handleProgressUpdates);
        }
    }

    removeListeners() {
        if (this.getFailureNotification !== null) {
            removeEventListener(FAILURE_EVENT_NAME, this.getFailureNotification);
        }
        if (this.getSuccessNotification !== null) {
            removeEventListener(SUCCESS_EVENT_NAME, this.getSuccessNotification);
        }
        if (this.getStartNotification !== null) {
            removeEventListener(START_EVENT_NAME, this.getStartNotification);
        }
        if (this.getFileCommitNotification !== null) {
            removeEventListener(FILE_COMMIT_EVENT_NAME, this.getFileCommitNotification);
        }
        if (this.getFileCommitRetryNotification !== null) {
            removeEventListener(FILE_COMMIT_RETRY_EVENT_NAME, this.getFileCommitRetryNotification);
        }
        if (this.getCompletedNotification !== null) {
            removeEventListener(COMPLETED_EVENT_NAME, this.getCompletedNotification);
        }
        if (this.handleProgressUpdates !== null) {
            removeEventListener(PROGRESS_EVENT_NAME, this.handleProgressUpdates);
        }
        if (this.getIsCancellingNotification !== null) {
            removeEventListener(START_CANCELLING_EVENT_NAME, this.getCompletedNotification);
        }
        if (this.getIsCancelledNotification !== null) {
            removeEventListener(END_CANCELLING_EVENT_NAME, this.getCompletedNotification);
        }
        removeEventListener(ABORT_UPLOAD_EVENT_NAME, this.abortUpload);
    }

    fireEvent(progress, eventName) {
        var event = new CustomEvent(
            eventName,
            {
                detail: {
                    progress: progress
                },
                bubbles: true,
                cancelable: true
            }
        );
        dispatchEvent(event);
    }

    startSession() {
        this.addListeners();
        this.progress.didStart = true;
        if (this.getStartNotification !== null) {
            this.fireEvent(this.progress, START_EVENT_NAME);
        }
        let options = {};
        let self = this;
        options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
        if (self.newVersionFileId) {
            options.url = `${this.filesManager.UPLOAD_PATH}/files/${self.newVersionFileId}/upload_sessions`;
            options.body = {
                file_size: this.file.size,
                file_name: this.fileName
            }
        } else {
            options.url = `${this.filesManager.UPLOAD_PATH}/files/upload_sessions`;
            options.body = {
                folder_id: this.parentFolder.id,
                file_size: this.file.size,
                file_name: this.fileName
            }
        }

        if (!this.client.httpService.defaults) {
            options.useXHR = true;
        }
        return this.client.makeRequest(null, options)
            .then(function (resp) {
                if (self.isCancelled) throw new Error("Upload cancelled");
                if (resp.data) {
                    resp = resp.data;
                }
                self.session.id = resp.id;
                self.session.expiresAt = resp.session_expires_at;
                self.session.partSize = resp.part_size;
                self.session.totalParts = resp.total_parts;
                self.session.endpoints.listParts = resp.session_endpoints.list_parts;
                self.session.endpoints.commit = resp.session_endpoints.commit;
                self.session.endpoints.uploadPart = resp.session_endpoints.upload_part;
                self.session.endpoints.status = resp.session_endpoints.status;
                self.session.endpoints.abort = resp.session_endpoints.abort;
                self.progress.session = self.session;

                self.makeChunks();
                return self.processChunks();
            })
            .then(function (tasks) {
                if (self.isCancelled) return;
                return self.commitUpload();
            })
            .then(function (result) {
                if (self.isCancelled) return;
                if (self.getFileCommitNotification !== null) {
                    self.progress.didFileCommit = true;
                    self.fireEvent(self.progress, FILE_COMMIT_EVENT_NAME);
                }
                if (self.getCompletedNotification !== null) {
                    self.progress.didSucceed = true;
                    self.progress.isComplete = true;
                    self.fireEvent(self.progress, COMPLETED_EVENT_NAME);
                }
                if (self.getSuccessNotification !== null) {
                    self.fireEvent(self.progress, SUCCESS_EVENT_NAME);
                }
                self.removeListeners();
                self.session = {};
                return result;
            })
            .catch(function (err) {
                if (self.getCompletedNotification !== null) {
                    if (err.message !== "Upload cancelled") {
                        self.progress.didFail = true;
                        self.progress.isCancelled = true;
                    }
                    self.progress.isComplete = true;
                    self.fireEvent(self.progress, COMPLETED_EVENT_NAME);
                }
                if (self.getFailureNotification !== null) {
                    self.fireEvent(self.progress, FAILURE_EVENT_NAME);
                }
                if (!self.isCancelled) {
                    if (typeof self.abortUpload == "function") {
                        self.abortUpload();
                    } else {
                        throw err;
                    }
                }
                throw err;
            });
    }

    makeChunks() {
        let self = this;
        if (self.isCancelled) throw new Error("Upload cancelled");
        let totalSize = this.file.size;
        let position = 0;
        let part;
        while (position < totalSize) {
            if (self.isCancelled) throw new Error("Upload cancelled");
            let contentRangeLow = position;
            let contentRangeHigh = position + self.session.partSize - 1;
            if (contentRangeHigh > totalSize - 1) {
                contentRangeHigh = totalSize - 1;
            }
            part = self.file.slice(position, position + self.session.partSize);
            self.parts.push({
                part: part,
                contentRange: `bytes ${position}-${contentRangeHigh}/${self.file.size}`,
                digest: "",
                uploaded: false,
                retry: 0
            })
            position += self.session.partSize;
        }
    }

    processChunk(part) {
        let self = this;
        if (self.isCancelled) throw new Error("Upload cancelled");
        if (!part.uploaded) {
            part.retry++;
            let blob = part.part;
            return self.filesManager.createSHA1Hash(blob)
                .then(function (hash) {
                    if (self.isCancelled) throw new Error("Upload cancelled");
                    self.processedCount++;
                    if (self.handleProgressUpdates !== null) {
                        self.progress.percentageProcessed = (self.processedCount / (self.session.totalParts)).toFixed(2);
                        self.fireEvent(self.progress, PROGRESS_EVENT_NAME);
                    }
                    part.digest = hash;
                    let options = {};
                    options.method = BOX_CONSTANTS.HTTP_VERBS.PUT;
                    options.url = self.session.endpoints.uploadPart;
                    options.headers = {
                        "Digest": `sha=${hash}`,
                        "Content-Range": part.contentRange,
                        "Content-Type": "application/octet-stream"
                    };
                    options.body = part.part;
                    options.chunkedUpload = true;
                    options.returnsOnlyOptions = true;
                    if (!self.client.makeRequest(null, options).then) {
                        return new Promise(function (resolve, reject) {
                            try {
                                resolve(self.client.makeRequest(null, options));
                            } catch (e) {
                                reject(e);
                            }
                        })
                    } else {
                        return self.client.makeRequest(null, options);
                    }
                })
                .then(function (opts) {
                    if (self.isCancelled) throw new Error("Upload cancelled");
                    if (self.filesManager.client.httpService.defaults && self.filesManager.client.Promise.defer) {
                        let canceller = self.filesManager.client.Promise.defer();
                        let cancel = function (reason) {
                            canceller.resolve(reason);
                        };
                        self.partRequestCancellations.push({ abort: cancel });
                        return self.filesManager.client.httpService.put(opts.url, opts.body, {
                            headers: opts.headers,
                            timeout: canceller.promise
                        });
                    } else {
                        opts.useXHR = true;
                        opts.returnCancelToken = true;
                        let request = self.filesManager.client.httpService(opts);
                        self.partRequestCancellations.push({ abort: request.abort });
                        return request.promise;
                    }
                })
                .catch(function (e) {
                    if (e && e.status && e.status !== 416 && !self.isCancelled) {
                        if (part.retry < 2) {
                            return self.processChunk(part);
                        }
                    } else {
                        throw e;
                    }
                })
                .then(function (resp) {
                    if (self.isCancelled) throw new Error("Upload cancelled");
                    if (!resp) return;
                    self.uploadCount++;
                    if (self.handleProgressUpdates !== null) {
                        self.progress.percentageUploaded = (self.uploadCount / (self.session.totalParts)).toFixed(2);
                        self.fireEvent(self.progress, PROGRESS_EVENT_NAME);
                    }
                    if (resp.data) {
                        resp = resp.data;
                    }
                    part.response = resp;
                    part.uploaded = true;
                });

        } else {
            return new Promise.resolve();
        }
    }

    processChunks() {
        let self = this;
        if (self.isCancelled) throw new Error("Upload cancelled");
        this.parts.forEach(function (part) {
            if (self.isCancelled) throw new Error("Upload cancelled");
            self.tasks.push(self.processChunk(part));
        });
        return Promise.all(self.tasks);
    }

    commitUpload() {
        let self = this;
        self.finishedUploading = true;
        this.parts.forEach(function (part) {
            if (self.isCancelled) throw new Error("Upload cancelled");
            if (part.uploaded === false) {
                self.finishedUploading = false;
                self.abortUpload();
            }
        })
        if (self.isCancelled) throw new Error("Upload cancelled");
        let orderedParts = [];
        return self.filesManager.createSHA1Hash(self.file)
            .then(function (hash) {
                if (self.isCancelled) throw new Error("Upload cancelled");
                self.parts.forEach(function (part) {
                    if (!part || !part.response || !part.response.part) {
                        self.abortUpload();
                    }
                    orderedParts.push(part.response.part);
                });
                let options = {};
                options.method = BOX_CONSTANTS.HTTP_VERBS.POST;
                options.url = self.session.endpoints.commit;
                options.headers = {
                    "Digest": `sha=${hash}`
                };
                options.body = {
                    parts: orderedParts
                }
                if (self.filesManager.client.httpService.defaults) {
                    return self.client.makeRequest(null, options);
                } else {
                    options.useXHR = true;
                    return self.client.makeRequest(null, options);
                }
            })
            .then(function (resp) {
                if (resp.status && resp.status == 202) {
                    if (self.isCancelled) throw new Error("Upload cancelled");
                    let retrySeconds;
                    if (resp && resp.headers && typeof resp.headers === "function") {
                        retrySeconds = resp.headers()["retry-after"];
                    } else if (resp && resp.headers && resp.headers["retry-after"]) {
                        retrySeconds = resp.headers["retry-after"];
                    } else {
                        retrySeconds = 30;
                    }


                    retrySeconds *= 1000;
                    return self.delay(retrySeconds)
                        .then(function () { return self.commitUpload(); });
                } else {
                    return resp;
                }
            });
    }

    delay(t) {
        let self = this;
        if (self.getFileCommitRetryNotification !== null) {
            self.progress.fileCommitRetryTime = t / 1000;
            self.fireEvent(self.progress, FILE_COMMIT_RETRY_EVENT_NAME);
        }
        return new Promise(function (resolve) {
            self.retryCommitTimer = setTimeout(resolve, t);
        });
    }
}