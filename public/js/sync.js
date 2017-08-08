/* global TrelloPowerUp */
var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();
var airtableAPI = 'https://api.airtable.com/v0/'

function touch(credentials, card){
  
  var action = {}
  var data = {}
  var list = {}
 
  list.id = card.idList
  data.list = list
  data.card = card
  action.data = data
  action.type = "updateCard"
  payload = {}
  payload.action = action


  var payload = JSON.stringify(payload);      

  return fetch("https://hypnotic-bay.glitch.me/webhooks/?airtable_api_key="+credentials.apiKey+"&airtable_base="+credentials.app, { 
      method: 'put', 
      headers: {
        'Content-type': "application/json"
       }, 
      body: payload
  }).then(function(response) {
    return response.json();
  })
}


t.render(function(){
  var status = document.getElementById('status')
  var progressDiv = document.getElementById('progress')
  var count = document.getElementById('count')
  var progressBar = document.getElementById('progressBar')

  
  function print(html){
  status.innerHTML += html + "<br>"
 
  }


  


  
  
Promise.all([
  t.cards('id', 'name', 'desc', 'idList'),
  t.lists('id', 'name'),
  t.get('board', 'shared', 'credentials')
  
  ]).spread(function(cards, lists, credentials){
  
  print(cards.length + " cards found on your board")
  fetch("/cards?airtable_api_key="+credentials.apiKey+"&airtable_base="+credentials.app+"&airtable_table="+credentials.table, { 
      method: 'get',  
      }).then(function(response) {
    return response.json();
  }).then(function(response){
    var airtableIDs = response.content
    print(airtableIDs.length + " cards found in Airtable ")
    var newCardsList = []
  
    
    cards.forEach(function(card){
      if(airtableIDs.indexOf(card.id) == -1) newCardsList.push(card)
    })
    
    var len = newCardsList.length
    print("Creating "+len +" new records in Airtable")
    var payload = {}
    payload.cards = newCardsList;
    payload.lists = lists;
    return fetch("https://hypnotic-bay.glitch.me/createCards/?airtable_api_key="+credentials.apiKey+"&airtable_base="+credentials.app, { 
        method: 'put', 
        headers: {
          'Content-type': "application/json"
         }, 
        body: JSON.stringify(payload)
    })
    
  
     })
  })//fetch airtable card ids promise
  
}) //cards, credentials promise









