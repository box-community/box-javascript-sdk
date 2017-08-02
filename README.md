# To Generate the Box Clientside SDK

1. Clone or fork this project.
2. Run `npm install`.
3. After `npm` installs all dependencies, run `npm run build`

After running these commands, a new directory (`lib`) should now be added to your project. Inside you'll find BoxSdk.min.js and BoxSdk.min.js.map. Add these assets to your HTML in a script tag. The .map file is optional for help with debugging in Google's Chrome Dev Tools.

# Using the Box Clientside SDK

## Getting Started
Currently the root of the Box Clientside SDK contains a `BasicBoxClient` property and a `PersistentBoxClient` property that contains Managers for interacting with the Box REST API.

To initialize the SDK, use the following:

```javascript
var box = new BoxSdk();
```

## Access Token Details
Once you have the base SDK object, you can call the `BasicBoxClient` or `PersistentBoxClient` constructor for calling Box APIs within a clientside application.

For building on Box Platform with App Users this would be an individual's access token. You should never pass the Enterprise token to the client for any reason.

The Box Clientside SDK does not handle any authentication and only accepts an access token. Authentication should be handled with your application server, a serverless API gateway and lambda service, a service like Okta or Auth0, or some combination of these.

## BasicBoxClient
The `BoxSdk` object can create a new `BasicBoxClient`. When creating a new `BasicBoxClient`, you can pass in several options in a configuration object.
The most common setting you'll use when creating a `BasicBoxClient` is an access token.
```javascript
var client = new box.BasicBoxClient({accessToken: "1234554321"});
```

## PersistentBoxClient
You can register a callback accessTokenHandler function with the `PersistentBoxClient` type if you have your own API endpoint to generate App User tokens. You should only use the `PersistentBoxClient` if you can create an API endpoint for generating Box App User tokens that is inaccessible to unauthorized users. 

To create your own service for generating App User tokens, you can utilize an identity provider service like [Auth0](https://auth0.com) for example. Auth0 has a service called [webtask](https://webtask.io/) that you can write a secured lambda microservice that can generate a Box App User token using Auth0's [id_token](https://auth0.com/docs/tokens/id_token) to secure the API endpoint webtask provides.

Additionally, Auth0 has a [guide](https://auth0.com/docs/integrations/aws-api-gateway) for implementing similar microservices within AWS and AWS Lambda.

Auth0 is not a requirement for this SDK and is only listed to give an example. Any identity provider service that can aid in securing your own REST API for generating Box App User tokens should be sufficient.  

The `BoxSdk` object can create a new `PersistentBoxClient`. You can register a function that returns a Promise or callback function that resolves to an access token and keep your `PersistentBoxClient` authorized to make calls to the Box API.
### Examples of Valid `accessTokenHandlers`
```javascript
function returnNewAccessToken(cb) {
  $.ajax({
    url: "http://localhost:3000/userToken",
    method: "GET",
    headers: { "Authorization": "Bearer identitfyTokenFrom3rdParyIdentityProvider" },
  })
    .done(function (data) {
      cb(null, data);
    });
}

function returnAccessTokenReturnsPromise() {
  return new Promise(function (resolve, reject) {
    $.ajax({
      url: "http://localhost:3000/userToken",
      method: "GET",
      headers: { "Authorization": "Bearer identitfyTokenFrom3rdParyIdentityProvider" },
      dataType: 'json'
    })
      .done(function (data) {
        resolve(data);
      });
  });
}

//Angular Service Example

//boxTokenService.js
//Used to register your secure token endpoint for retrieving new tokens on expiration.
//Utilizing Auth0's idToken for endpoint authentication.
(function () {
  'use strict';
  angular
    .module('authApp')
    .service('boxTokenSerivce', ['$q', '$http', 'APP_CONFIG', BoxTokenService]);

  function BoxTokenService($q, $http, APP_CONFIG) {
    this.getAccessToken = function () {
      var deferred = $q.defer();
      var idToken = localStorage.getItem(APP_CONFIG.VARIABLES.AUTH0_ID_TOKEN_STORAGE_KEY);
        $http({
          url: APP_CONFIG.VARIABLES.BOX_REFRESH_TOKEN_URL,
          type: 'GET',
          headers: { Authorization: 'Bearer ' + idToken }
        })
          .then(function (response) {
            deferred.resolve(response.data);
          }, function (response) {
            deferred.reject(response);
          });
      return deferred.promise;
    }
  }
})();

//boxApiService.js
//Used to create PersistentBoxClients and register your function to retrieve new tokens on expiration.
(function () {
  'use strict';
  angular
    .module('authApp')
    .service('boxApiService', BoxApiService);
  BoxApiService.$inject = ['$q', '$http', 'boxTokenSerivce', 'APP_CONFIG'];
  function BoxApiService($q, $http, boxToken, APP_CONFIG) {
    var box = new BoxSdk();
    this.persistentBoxClient = function () {
      //You can overwrite the built-in SDK httpService and Promise objects with Angular's services.
      //With this configuration, $scope will update from within the deferred .then methods returned by the SDK.  
      return new box.PersistentBoxClient({ accessTokenHandler: boxToken.getAccessToken, httpService: $http, Promise: $q });
    };
    this.persistentBoxClientOptionsOnly = function () {
      return new box.PersistentBoxClient({ accessTokenHandler: boxToken.getAccessToken, noRequestMode: true });
    }
  }
})();
```

### Register `accessTokenHandler` with a `PersistentBoxClient`
After defining your `accessTokenHandler`, you can register the handler function with the `PersistentBoxClient`.
```javascript
var box = new BoxSdk();
var persistClient = new box.PersistentBoxClient({ accessTokenHandler: returnAccessTokenReturnsPromise });
```

Please note, if you are utilizing a callback function as in `returnNewAccessToken`, you'll need to set the `callback` flag to true:
```javascript
var box = new BoxSdk();
var persistClient = new box.PersistentBoxClient({ accessTokenHandler: returnNewAccessToken, isCallback: true });
```
Before issuing an API call, the SDK will now make sure your access token is not expired and will refresh your token using this accessTokenHandler function if the access token is expired.

### Change Storage Option
By default, the `PersistentBoxClient` detects if HTML5 storage is available, and if so, uses `localStorage` to keep a token in browser cache to avoid making unnecessary AJAX calls.

You can change the storage option to `sessionStorage` with the following flag:
```javascript
var box = new BoxSdk();
var persistClient = new box.PersistentBoxClient({ accessTokenHandler: returnAccessTokenReturnsPromise, storage: "sessionStorage" });
```
### Modes
Additionally, you can set the `BasicBoxClient` and `PersistentBoxClient` to perform in a few different modes.
#### `noRequestMode`
```javascript
var client = new box.BasicBoxClient({accessToken: "1234554321", noRequestMode: true});
```
If you enable `noRequestMode`, the SDK will not process your method calls as actual AJAX requests and will instead format an `options` object according to the values within the SDK and the parameters you pass to each managers methods. The `options` object is returned directly from the method.
You can then use the returned `options` values with another HTTP service such as Angular's $http if needed or preferred.
**Example:**
```javascript
var box = new BoxSdk();
var client = new box.BasicBoxClient({accessToken: "1234554321", noRequestMode: true});
var options = client.folders.get({ id: "0"});
/*
The options object will contain these values:
{
  headers: 
  {
    Authorization: "Bearer 1MVXXj333PepuMVOWLT8wRUZU3Z2G9Pv"
  },
  method: "GET",
  url: "https://api.box.com/2.0/folders/0"
}
*/
```

#### `simpleMode`
```javascript
var client = new box.BasicBoxClient({accessToken: "1234554321", simpleMode: true});
```
If you enable `simpleMode`, the SDK will not process any validation against objects sent on calls requiring an options.body. 

#### `httpService`
```javascript
var client = new box.PersistentBoxClient({ httpService: $http });
```
You can change what service completes the AJAX HTTP requests completed by the SDK. Typically, this is useful for a framework like Angular.

#### `Promise`
```javascript
var client = new box.PersistentBoxClient({ Promise: $q });
```
You can change what service creates the Promises used by the SDK. Typically, this is useful for a framework like Angular.

#### Configuration for Angular 1
Before instantiating any of the Box clients within the Box SDK, you'll need access to `$http`. You'll also need `$q` if working with the `PersistentBoxClient`.

To use the `PersistentBoxClient` and emit changes to `$scope`, use the following configuration:
```javascript
var persistClient = new box.PersistentBoxClient({ accessTokenHandler: boxToken.getAccessToken, httpService: $http, Promise: $q });
```

To use the `BasicBoxClient` and emit changes to `$scope`, use the following configuration:
```javascript
var client = new box.BasicBoxClient({accessToken: "1234554321", httpService: $http});
```

## Example Usage

### Simple Upload
```javascript
var accessToken = "1234";
var boxClient = new box.BasicBoxClient({ accessToken: accessToken });
var form = document.getElementById('file-form');
var fileSelect = document.getElementById('file-select');
var uploadButton = document.getElementById('upload-button');

form.onsubmit = function (event) {
  event.preventDefault();

  uploadButton.innerHTML = 'Uploading...';
  var files = fileSelect.files;
  var formData = new FormData();

  formData.append(files[0].name, files[0]);
  formData.append('parent_id', '0');


  boxClient.files.upload({ body: formData })
    .then(function (file) {
      var newFile = file;
    })
    .catch(function (err) {
      console.log(err);
    });
}
```
### Get Root Folder
```javascript
var accessToken = "1234";
var boxClient = new box.BasicBoxClient({ accessToken: accessToken });
boxClient.folders.get({ id: "0", params: {fields: "name,item_collection"} })
  .then(function (folder) {
    var rootFolder = folder;
    var id = folder.id;
  })
  .catch(function (err) {
    console.log(err);
  });
```
### Create New Folder
```javascript
var accessToken = "1234";
var rootFolderId = "0";
var folderName = "New Folder";
var boxClient = new box.BasicBoxClient({ accessToken: accessToken });
boxClient.folders.create({ parent: { id: rootFolderId }, name: folderName })
  .then(function (folder) {
    var newFolder = folder;
  })
  .catch(function (err) {
    console.log(err);
  });
```
### Get File Info
```javascript
var accessToken = "1234";
var fileId = "8675309";
var boxClient = new box.BasicBoxClient({ accessToken: accessToken });
 boxClient.files.get({id: fileId})
  .then(function (file) {
    var file = file;
  })
  .catch(function (err) {
    console.log(err);
  });
```
### Get Comment Info
```javascript
var accessToken = "1234";
var commentId = "42";
var boxClient = new box.BasicBoxClient({ accessToken: accessToken });
 boxClient.comments.get({id: commentId})
  .then(function (comment) {
    var comment = comment;
  })
  .catch(function (err) {
    console.log(err);
  });
```
### Get Preview Link for File
```javascript
var accessToken = "1234";
var fileId = "8675309";
var boxClient = new box.BasicBoxClient({ accessToken: accessToken });
boxClient.files.getEmbedLink({ id: fileId })
  .then(function (url) {
    var file = url;
  });
  .catch(function (err) {
    console.log(err);
  });
```
### Create Metadata on File
```javascript
var accessToken = "1234";
var fileId = "8675309";
//scope is an optional parameter you can use in the object.
//If not set, scope will default to "enterprise".
var scope = "enterprise";
var box = new BoxSdk();
var client = new box.BasicBoxClient({ accessToken: accessToken });
client.metadata.createFileMetadata({
  fileId: fileId,
  scope: scope,
  body: {
    lineOfBusiness: "commercial"
  },
  templateKey: "customer"
})
```
### Upload with Preflight and MD5 check
#### Please note: This method has not undergone signficant testing. Please use at your own risk.
```javascript
var accessToken = "1234"; 
var form = document.getElementById('file-form');
var fileSelect = document.getElementById('file-select');
var uploadButton = document.getElementById('upload-button');

form.onsubmit = function(event){
  event.preventDefault();
  uploadButton.innerHTML = 'Uploading...';
  var files = fileSelect.files;
  var formData = new FormData();

  var box = new BoxSdk();
  var client = new box.BasicBoxClient({accessToken: accessToken});

  formData.append('files', files[0], files[0].name);
  formData.append('parent_id', '0');

  client.files.uploadWithPreflightAndMd5({ 
    body: formData, 
    name: files[0].name, 
    file: files[0], 
    parent: { id: "0"}, 
    size: files[0].size 
  })
  .then(function (file) {
    var newFile = file;
  })
  .catch(function (err) {
    console.log(err);
  });
```
### Upload New Version with Preflight and MD5 check
#### Please note: This method has not undergone signficant testing. Please use at your own risk.
```javascript
var accessToken = "1234"; 

var form = document.getElementById('file-form');
var fileSelect = document.getElementById('file-select');
var uploadButton = document.getElementById('upload-button');

form.onsubmit = function(event){
  event.preventDefault();
  uploadButton.innerHTML = 'Uploading...';
  var files = fileSelect.files;
  var formData = new FormData();

  var box = new BoxSdk();
  var client = new box.BasicBoxClient({accessToken: accessToken});

  formData.append('files', files[0], files[0].name);
  formData.append('parent_id', '0');
  formData.append('id', '204457430882');

  client.files.uploadNewFileVersionWithPreflightAndMd5({ 
    body: formData, 
    name: files[0].name, 
    file: files[0], 
    parent: { id: "0"}, 
    size: files[0].size 
  })
  .then(function (file) {
    var newFile = file;
  })
  .catch(function (err) {
    console.log(err);
  });
```
### Upload File Greater than 50MB with Chunking
#### Please note: This method has not undergone signficant testing. Please use at your own risk.
```javascript
var accessToken = "1234";
// Must be an HTML5 File object
var file = new File([], "test.iso");
var box = new BoxSdk();

// Uses XHR to perform chunked upload
var client = new box.BasicBoxClient({ accessToken: accessToken });

// If you want to use Angular services for chunked upload, you must include both the Angular HTTP service and the Angular Promise service:
var client = new box.PersistentBoxClient({ accessTokenHandler: accessTokenHandler, httpService: $http, Promise: $q });

// Cancel an upload by firing this event:
var abortEvt = new Event("boxChunkedUploadAbortUpload");
dispatchEvent(abortEvt);

client.files.chunkedUpload({
  file: file,
  name: "test.iso",
  parentFolder: { id: "0" },
  listeners: {
      // Register a listener for receiving a percentage of SHA1 processed parts and uploaded parts
      handleProgressUpdates: function (e) {
          console.log("Progress captured...");
          console.log("Percentage processed: ");
          console.log(e.detail.progress.percentageProcessed);
          console.log("Percentage uploaded: ");
          console.log(e.detail.progress.percentageUploaded);
      },
      // Starting event fired after cancelling work is complete
      getIsCancellingNotification: function (e) {
        console.log("Started cancelling!");
        console.log(e.detail.progress)
      },
      // Finish event fired after cancelling work is complete
      getIsCancelledNotification: function (e) {
        console.log("Finished cancelling!");
        console.log(e.detail.progress)
      },
      // Register a listener for a failure event
      getFailureNotification: function (e) {
          console.log("Failed!");
          console.log(e.detail.progress.didFail)
      },
      // Register a listener for a success event
      getSuccessNotification: function (e) {
          console.log("Success!");
          console.log(e.detail.progress.didSucceed)
      },
      // Register a listener for when the upload process starts
      getStartNotification: function (e) {
          console.log("Upload started!");
          console.log(e.detail.progress.didStart)
      },
      // Register a listener for when a commit has a retry needed
      getFileCommitRetryNotification: function (e) {
        console.log("File commit retry needed!");
      },
      // Register a listener for when all parts are uploaded and the entire file is committed to Box
      getFileCommitNotification: function (e) {
          console.log("File committed!");
          console.log(e.detail.progress.didFileCommit)
      },
      // Register a listener for the completion event -- with either a success or failure outcome
      getCompletedNotification: function (e) {
          console.log("Upload completed!");
          console.log(e.detail.progress.isComplete)
      }
  }
})
.then(function (fileCollection) {
    console.log(fileCollection);
  });
```

### Upload New Version of a File Greater than 50MB with Chunking
#### Please note: This method has not undergone signficant testing. Please use at your own risk.
```javascript
// Must be an HTML5 File object
var file = new File([], "test.iso");
var fileId = "8675309";

var box = new BoxSdk();
// Uses XHR to perform chunked upload
var client = new box.BasicBoxClient({ accessToken: accessToken });

// If you want to use Angular services for chunked upload, you must include both the Angular HTTP service and the Angular Promise service:
var client = new box.PersistentBoxClient({ accessTokenHandler: accessTokenHandler, httpService: $http, Promise: $q });
// chunkedUploadNewFileVersion uses the same upload abort event as chunkedUpload
var abortEvt = new Event("boxChunkedUploadAbortUpload");
dispatchEvent(abortEvt);

client.files.chunkedUploadNewFileVersion({
  file: uploadedFile,
  name: uploadedFile.name,
  id: fileId,
  listeners: {
    handleProgressUpdates: function (e) {
      console.log("Progress captured...");
      console.log("Percentage processed: ");
      console.log(e.detail.progress.percentageProcessed);
      console.log("Percentage uploaded: ");
      console.log(e.detail.progress.percentageUploaded);
    },
    getIsCancellingNotification: function (e) {
      console.log("Started cancelling!");
      console.log(e.detail.progress)
    },
    getIsCancelledNotification: function (e) {
      console.log("Finished cancelling!");
      console.log(e.detail.progress)
    },
    getFailureNotification: function (e) {
      console.log("Failed!");
      console.log(e.detail.progress.didFail)
    },
    getSuccessNotification: function (e) {
      console.log("Success!");
      console.log(e.detail.progress.didSucceed)
    },
    getStartNotification: function (e) {
      console.log("Upload started!");
      console.log(e.detail.progress.didStart)
    },
    getFileCommitRetryNotification: function (e) {
      console.log("File commit retry needed!");
      console.log(e.detail.progress);
    },
    getFileCommitNotification: function (e) {
      console.log("File committed!");
      console.log(e.detail.progress.didFileCommit)
    },
    getSessionCreatedNotification: function (e) {
      console.log("Session created!");
      console.log(e.detail.progress.didSessionStart)
    },
    getCompletedNotification: function (e) {
      console.log("Upload completed!");
      console.log(e.detail.progress.isComplete)
    }
  }
  });
```

### Chain Upload New File Version on Upload File for a File Greater than 50MB with Chunking  
#### Please note: This method has not undergone signficant testing. Please use at your own risk.
```javascript
// Must be an HTML5 File object
var file = new File([], "test.iso");
var fileId = "8675309";

var box = new BoxSdk();
// Uses XHR to perform chunked upload
var client = new box.BasicBoxClient({ accessToken: accessToken });

// If you want to use Angular services for chunked upload, you must include both the Angular HTTP service and the Angular Promise service:
var client = new box.PersistentBoxClient({ accessTokenHandler: accessTokenHandler, httpService: $http, Promise: $q });

client.files.chunkedUpload({
  file: uploadedFile,
  name: uploadedFile.name,
  parentFolder: { id: "0" },
  listeners: {
    handleProgressUpdates: function (e) {
      console.log("Progress captured...");
      console.log("Percentage processed: ");
      console.log(e.detail.progress.percentageProcessed);
      console.log("Percentage uploaded: ");
      console.log(e.detail.progress.percentageUploaded);
    },
    getIsCancellingNotification: function (e) {
      console.log("Started cancelling!");
      console.log(e.detail.progress)
    },
    getIsCancelledNotification: function (e) {
      console.log("Finished cancelling!");
      console.log(e.detail.progress)
    },
    getFailureNotification: function (e) {
      console.log("Failed!");
      console.log(e.detail.progress.didFail)
    },
    getSuccessNotification: function (e) {
      console.log("Success!");
      console.log(e.detail.progress.didSucceed)
    },
    getStartNotification: function (e) {
      console.log("Upload started!");
      console.log(e.detail.progress.didStart)
    },
    getFileCommitNotification: function (e) {
      console.log("File committed!");
      console.log(e.detail.progress.didFileCommit)
    },
    getSessionCreatedNotification: function (e) {
      console.log("Session created!");
      console.log(e.detail.progress.didSessionStart)
    },
    getCompletedNotification: function (e) {
      console.log("Upload completed!");
      console.log(e.detail.progress.isComplete)
    }
  }
})
  .then(function (resp) {
    // Uploads file if there is no name conflict in this folder.
    // Otherwise, a 409 error is thrown due to a file conflict.
  })
  .catch(function (e) {
    if (e.status === 409) {
      var fileId;
      if (e.data && e.data.context_info && e.data.context_info.conflicts && e.data.context_info.conflicts.id) {
        fileId = e.data.context_info.conflicts.id;
      } else if (e.response && e.response.context_info && e.response.context_info.conflicts && e.response.context_info.conflicts.id) {
        fileId = e.response.context_info.conflicts.id;
      }
      if (fileId) {
        // Try to upload the file as a new version of the existing file
        return client.files.chunkedUploadNewFileVersion({
          file: uploadedFile,
          name: uploadedFile.name,
          id: fileId
        });
      }
    }
  })
  .then(function (resp) {
    if (resp) {
      console.log("Uploaded new file version");
      console.log(resp);
    }
  });
```