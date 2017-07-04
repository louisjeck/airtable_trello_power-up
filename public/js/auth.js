
$(document).ready(function(){

  var p = document.getElementById('p');
  var status = document.getElementById('status')
  
  function createWebhooks(){
      Trello.rest("POST", "webhooks", 
              {'idModel': TRELLO_MODEL, 
               'description' : "AirTable webhook", 
               'callbackURL' : "https://hypnotic-bay.glitch.me/webhooks?airtable_api_key="+AIRTABLE_API_KEY+"&airtable_base="+AIRTABLE_BASE+"&airtable_table="+AIRTABLE_TABLE
              }, 
              function(){ 
                p.innerHTML+="Webhook creation : OK"
                status.innerHTML="ok"
                closeTab();
              },
              function(){ 
                p.innerHTML+="Webhook creation : Error (this webhook might already exist)"
                status.innerHTML="ko"
                console.log("error")  
                closeTab();
  });
  }
  
  function deleteWebhook(webhook, callback){
    return Trello.rest("DELETE", "webhooks/"+webhook.id, callback)
  }
  
  function getWebhooks(callback){
    return Trello.rest("GET", "tokens/"+Trello.token()+"/webhooks", callback)
  }
  
  function deleteWebhooks(){
      getWebhooks(function(webhooks){
        webhooks.forEach(function(webhook){
          deleteWebhook(webhook, function(){
            p.innerHTML+="Webhook "+webhook.id+" successfully deleted<br>"
          })  
        })
    
      })   
  }
  
  
  
  var authenticationSuccess = function() { 
    console.log('Successful authentication'); 
    p.innerHTML += "Trello authentication : OK<br>"
    if(window.location.hash == "#deauth")
      deleteWebhooks();
    else
      createWebhooks();

  };
  
  
  var authenticationFailure = function() { 
    p.innerHTML += "Authentication : Error"
    console.log('Failed authentication'); 
  };

function closeTab(){
  setTimeout(function(){
      close();

  }, 2000)
}


  
  
  Trello.authorize({
    type: 'redirect',
    name: 'Getting Started Application',
    scope: {
      read: 'true',
      write: 'true' },
    expiration: 'never',
    success: authenticationSuccess,
    error: authenticationFailure
  });
  
  })