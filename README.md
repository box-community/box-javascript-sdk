# To Generate the Box Clientside SDK

1. Clone or fork this project.
2. Run `npm install`.
3. After `npm` installs all dependencies, run `npm run build`

After running these commands, a new directory (`lib`) should now be added to your project. Inside you'll find BoxSdk.min.js and BoxSdk.min.js.map. Add these assets to your HTML in a script tag. The .map file is optional for help with debugging in Google's Chrome Dev Tools.

# Using the Box Clientside SDK

## Getting Started
Currently the root of the Box Clientside SDK only contains a `BasicBoxClient` property that contains Managers for interacting with the Box REST API.

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
    .then(function (resp) {
      var newFile = resp.data;
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
  .then(function (resp) {
    var rootFolder = resp.data;
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
  .then(function (resp) {
    var newFolder = resp.data;
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
  .then(function (response) {
    var file = response.data;
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
  .then(function (response) {
    var comment = response.data;
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
  .then(function (response) {
    var file = response.data;
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