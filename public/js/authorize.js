/* global TrelloPowerUp */


var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var apiKeyInput = document.getElementById('apiKey');
var appInput = document.getElementById('app');
var statusTextSpan = document.getElementById('statusText');
var authNode = document.getElementById('authNode');
var authDiv = document.getElementById('auth');

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
              authDiv.style.display = "none"
              statusTextSpan.innerHTML="Your board is now connected to Airtable<br>Click on 'Authorize NodeJS' to connect Airtable to your board";
              authNode.style.display = 'block';
   
              return t.board('id').get('id').then(function(model){
                t.get('board', 'shared', 'credentials')
                  .then(function(credentials){
                    authNode.href="https://hypnotic-bay.glitch.me/auth?airtable_api_key="+credentials.apiKey+"&airtable_base="+credentials.app+"&airtable_table="+credentials.table+"&trello_model="+model;
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