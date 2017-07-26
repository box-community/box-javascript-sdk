import BOX_CONSTANTS from '../config/box-constants';
const PROGRESS_EVENT_NAME = "boxChunkedUploadProgress";
const FAILURE_EVENT_NAME = "boxChunkedUploadFailure";
const SUCCESS_EVENT_NAME = "boxChunkedUploadSuccess";
const START_EVENT_NAME = "boxChunkedUploadStart";
const FILE_COMMIT_EVENT_NAME = "boxChunkedUploadFileCommitted";
const COMPLETED_EVENT_NAME = "boxChunkedUploadCompleted";
export default class ChunkedUploader {
    constructor(filesManager, fileName, file, parentFolder, listeners) {
        this.filesManager = filesManager
        this.client = filesManager.client;
        this.file = file;
        this.fileName = fileName
        this.parts = [];
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
        this.getCompletedNotification = listeners.getCompletedNotification || null;
        this.handleProgressUpdates = listeners.handleProgressUpdates || null;
        this.progress = {
            isComplete: false,
            didStart: false,
            didFail: false,
            didSucceed: false,
            didFileCommit: false,
            didSessionStart: false,
            percentageProcessed: 0,
            percentageUploaded: 0,
            session: {}
        };
        this.retry = 0;
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
        if (this.getCompletedNotification !== null) {
            addEventListener(COMPLETED_EVENT_NAME, this.getCompletedNotification);
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
        if (this.getCompletedNotification !== null) {
            removeEventListener(COMPLETED_EVENT_NAME, this.getCompletedNotification);
        }
        if (this.handleProgressUpdates !== null) {
            removeEventListener(PROGRESS_EVENT_NAME, this.handleProgressUpdates);
        }
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
        options.url = `${this.filesManager.UPLOAD_PATH}/files/upload_sessions`;
        options.body = {
            folder_id: this.parentFolder.id,
            file_size: this.file.size,
            file_name: this.fileName
        }
        return this.client.makeRequest(null, options)
            .then(function (resp) {
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
                return self.commitUpload();
            })
            .then(function (result) {
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
                return result;
            })
            .catch(function (err) {
                if (self.getCompletedNotification !== null) {
                    self.progress.didFail = true;
                    self.progress.isComplete = true;
                    self.fireEvent(self.progress, COMPLETED_EVENT_NAME);
                }
                if (self.getFailureNotification !== null) {
                    self.fireEvent(self.progress, FAILURE_EVENT_NAME);
                }
                throw err;
            })
    }

    makeChunks() {
        let totalSize = this.file.size;
        let position = 0;
        let self = this;
        let part;
        while (position < totalSize) {
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
                uploaded: false
            })
            position += self.session.partSize;
        }
    }

    processChunks() {
        let self = this;
        let tasks = [];
        let uploadCount = 0;
        let processedCount = 0;
        self.retry++;

        this.parts.forEach(function (part) {
            let blob = part.part;
            if (!part.uploaded) {
                tasks.push(self.filesManager.createSHA1Hash(blob)
                    .then(function (hash) {
                        processedCount++;
                        if (self.handleProgressUpdates !== null) {
                            self.progress.percentageProcessed = (processedCount / (self.session.totalParts)).toFixed(2);
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
                        return self.client.makeRequest(null, options);
                    })
                    .then(function (resp) {
                        uploadCount++;
                        if (self.handleProgressUpdates !== null) {
                            self.progress.percentageUploaded = (uploadCount / (self.session.totalParts)).toFixed(2);
                            self.fireEvent(self.progress, PROGRESS_EVENT_NAME);
                        }
                        if (resp.data) {
                            resp = resp.data;
                        }
                        part.response = resp;
                        part.uploaded = true;
                    }));
            }
        });
        return Promise.all(tasks)
            .catch(function (e) {
                if (e && e.status && e.status !== 416) {
                    while (self.retry < 2) {
                        self.processChunks();
                    }
                } else {
                    throw e;
                }
            });

    }

    commitUpload() {
        let self = this;
        let orderedParts = [];
        return self.filesManager.createSHA1Hash(self.file)
            .then(function (hash) {
                self.parts.forEach(function (part) {
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
                return self.client.makeRequest(null, options);
            })
            .then(function (result) {
                return result;
            });
    }
}