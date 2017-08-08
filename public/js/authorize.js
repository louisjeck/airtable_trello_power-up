/* global TrelloPowerUp */


var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var apiKeyInput = document.getElementById('apiKey');
var appInput = document.getElementById('app');
var statusTextSpan = document.getElementById('statusText');
var authNode = document.getElementById('authNode');
var authDiv = document.getElementById('auth');
const trelloAPI = "https://api.trello.com";
const APIKey = "910aeb0b23c2e63299f8fb460f9bda36";

function done(err, token){
  if(err){
    t.closePopup();
    return;  
  }
  
  t.set('board', 'private', 'token', {token : token});

  Promise.all([
    t.board('id').get('id'),
    t.member('fullName', 'id'),
    t.get('board', 'shared', 'credentials')
  ])
  .spread(function(boardId, member, credentials){
    t.set('board', 'shared', 'auth', {
         member : member,
         boardId : boardId
    });  

        
    createWebhook(token, boardId, credentials)
      .then(() =>
        t.popup({
            title: 'Settings',
            url: './settings.html',
            height: 250, 
        }))
          
  });
  
}



t.render(function(){
  return Promise.all([
    t.get('board', 'shared', 'credentials'),
  ])
  .spread(function(credentials){
    if(credentials){
      apiKeyInput.value = credentials.apiKey;
      appInput.value = credentials.app;
    }
  })
  .then(function(){
    t.sizeTo('#content')
    .done();
  })
});


authNode.addEventListener('click', function(e) { //Node JS Auth popup (create Webhook)
  e.preventDefault();
  
  var authWindow = window.open(authNode.href, '_blank');
  authWindow.addEventListener('beforeunload', function(){
    
    var status = authWindow.document.getElementById('status');
    t.popup({
      title: 'Settings',
      url: './settings.html',
      height: 250, 
    });
  })
  
  return false;
})


function getMyWebhooks(token, model){
  const params = encodeParams({
    token : token,
    key : APIKey,
  })
  
  const url = window.location.hostname;
  
  return fetch(trelloAPI + "/1/tokens/" + token + "/webhooks?" + params)
    .then(resp => resp.json())
  
    .then(webhooks => {

      webhooks = webhooks.filter(webhook => {
        return (webhook.idModel == model && webhook.callbackURL.substr(8, url.length) == url);
      })
      return webhooks
    })  
  


}


function cleanWebooks(token, model){
  
  return getMyWebhooks(token, model)
    .then(webhooks => {
        var p = [];
        webhooks.forEach(webhook => p.push(deleteWebhook(token, webhook)));
        return Promise.all(p)
    })
  
}


function deleteWebhook(token, webhook){
  const params = encodeParams({
    token : token,
    key : APIKey,
  });
  
  return fetch(trelloAPI+'/1/webhooks/' + webhook.id + '?' + params, {method : 'DELETE'})
    .then(response => response.json());
}


function createWebhook(token, model, credentials){
  return cleanWebooks(token, model).then(() => {
    const params = encodeParams({
      token : token,
      key : APIKey,
      idModel : model,
      callbackURL : "https://" + window.location.hostname + "/webhooks"
                              + "?airtable_base=" + credentials.app
                              + "&airtable_api_key=" + credentials.apiKey
                              + "&token=" + token

    }) 
    return fetch(trelloAPI+'/1/webhooks?'+params, {method : 'POST'}).then(response => response.json());
  })
}


function encodeParams (params){
  var esc = encodeURIComponent;
  return Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&');
}







document.getElementById('save').addEventListener('click', function(){
  
    var airtableAPI = 'https://api.airtable.com/v0/'

    return fetch(airtableAPI+appInput.value+"/Cards", { 
    method: 'get', 
    headers: {
      'Authorization': 'Bearer '+apiKeyInput.value, 
     }, 
    }).then(function(response) {

      status = response.status; //get HTTP Status
      return response.json(); //get response content
      
    }).then(function(response){
      appInput.className="" //reset error classes (use div instead ?)
      apiKeyInput.className="";
      statusTextSpan.innerHTML="" //reset error message


      switch(parseInt(status)){ //check HTTP status
        case 404: //Not found
          statusTextSpan.innerHTML="Table not found";
          appInput.className="is-error";
          break;
        case 401: //Not authorized
          statusTextSpan.innerHTML="Authorization failed. Check your API Key";
          apiKeyInput.className="is-error";
          break;
        case 200: //OK
           return t.set('board', 'shared', 'credentials', { apiKey : apiKeyInput.value, app: appInput.value } )
            .then(function(){
             t.get('board', 'private', 'token').then(token => {
               if(token !== undefined)
                 return done(null, token.token)
              authDiv.style.display = "none"
              statusTextSpan.innerHTML="Your board is now connected to Airtable<br>Click on 'Authorize NodeJS' to connect Airtable to your board";
              authNode.style.display = 'block';
   
              return t.board('id').get('id').then(function(model){
                t.get('board', 'shared', 'credentials')
                  .then(function(credentials){
                    authNode.href="https://hypnotic-bay.glitch.me/auth";
                })
              })
             })
          .then(function(){

          })
        })

        break;

        default: 
          if(response.error.message != null) statusTextSpan.innerHTML=response.error.message
          else statusTextSpan.innerHTML="Unknown error.";
        break;

      } //switch
    })
})