/* global TrelloPowerUp */
var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();
var airtableAPI = 'https://api.airtable.com/v0/'

function addAirtableRow(credentials, card){
  
  var fields = {}
  fields.Trello_Card_id = card.id
  fields.Trello_Card_name = card.name
  fields.Trello_Card_desc = card.desc
  fields.Trello_List_id = card.idList

  var payload = {}
  payload.fields = fields
  var data = JSON.stringify(payload);      

  return fetch(airtableAPI+credentials.app+"/"+credentials.table, { 
      method: 'post', 
      headers: {
        'Authorization': 'Bearer '+credentials.apiKey, 
        'Content-type': "application/json"
       }, 
      body: data
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
  
  t.get('board', 'shared', 'credentials')
  
  ]).spread(function(cards, credentials){
  
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
    progressDiv.style.display="block"
    
    var j = 0
    function f(){
      for(var i = 5; i--; i==0){
        if(newCardsList.length != 0){
          j ++;
          let p = Math.ceil(j*100/len)
          count.innerHTML = j + " of " + len + " (" + p + "%)"
          progressBar.value = p
          var card = newCardsList.pop()
          addAirtableRow(credentials, card)
          console.log('new row', card.id) 
        }
        else return 0
      }
      console.log("---")
      setTimeout(f, 1100)
    }

    f()
  
     })
  })//fetch airtable card ids promise
  
}) //cards, credentials promise









