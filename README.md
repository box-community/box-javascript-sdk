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
Once you have the base SDK object, you can call the `BasicBoxClient` constructor and pass in a Box access token appropriate for use on a clientside application.

For building on Box Platform with App Users this would be an individual's access token. You should never pass the Enterprise token to the client for any reason.

The Box Clientside SDK does not handle any authentication and only accepts an access token. Authentication should be handled with your application server, a serverless API gateway and lambda service, a service like Okta or Auth0, or some combination of these.

Currently the SDK does not handle token refreshing automatically. Instead, when a call encounters an error, the error handler within the SDK passes the entire `options` object for the failed call so you can programmatically handle the error retry logic within your clientside application.

## BasicBoxClient
The `BoxSdk` object can create a new `BasicBoxClient`. When creating a new `BasicBoxClient`, you can pass in several options in a configuration object.
The most common setting you'll use when creating a `BasicBoxClient` is an access token.
```javascript
var client = new box.BasicBoxClient({accessToken: "1234554321"});
```

## PersistentBoxClient
The `BoxSdk` object can create a new `PersistentBoxClient`. You can register a Promise or callback that resolves to an access token and keep your `PersistentBoxClient` authorized to make calls to the Box API.
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

var returnAccessTokenPromise = new Promise(function (resolve, reject) {
  $.ajax({
    url: "http://localhost:3000/userToken",
    method: "GET",
    headers: { "Authorization": "Bearer identitfyTokenFrom3rdParyIdentityProvider" },
  })
    .done(function (data) {
      resolve(data);
    });
});
```

### Register `accessTokenHandler` with a `PersistentBoxClient`
After defining your `accessTokenHandler`, you can register the handler function with the `PersistentBoxClient`.
```javascript
var box = new BoxSdk();
var persistClient = new box.PersistentBoxClient({ accessTokenHandler: returnNewAccessToken });
```
Before issuing an API call, the SDK will now make sure your access token is not expired and will refresh your token using this accessTokenHandler function if the access token is expired.

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