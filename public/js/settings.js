/* global TrelloPowerUp */
var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var resetBtn = document.getElementById('reset');
var deleteBtn = document.getElementById('delete');
var syncBtn = document.getElementById('sync');
var div = document.getElementById('fieldsDiv');
var credentialsDiv = document.getElementById('credentials');

var airtableAPI = 'https://api.airtable.com/v0/'
  

t.render(function(){
  
  t.get('board', 'shared', 'credentials')
  .then(function(credentials){
    
  return fetch(airtableAPI+credentials.app+"/"+credentials.table+"?maxRecords=1", { //fetch first row to guess table model
      method: 'get', 
      headers: {
        'Authorization': 'Bearer '+credentials.apiKey, 
      }, 
  })
    
  }).then(function(response) {  
      status = response.status; //get HTTP Status
      return response.json(); //get response content
    
  }).then(function(response){ 
    var fields = Object.keys(response.records[0].fields);
    div.innerHTML=""
    return [fields, t.get('board', 'private', 'fieldsData', {})] 
    
  }).spread(function (fields, fieldsData){
    fields = fields.filter(function(field){ //ignore Trello fields 
      return field.substr(0,7) != "Trello_" //regex ?
    })    

    fields.forEach(function(field){
      var checked = fieldsData[field]?"checked":""; 
      div.innerHTML += "<input type='checkbox' name='fields' value='"+field+"'"+checked+"><span style='margin-left:1rem'>"+field+"</span><br>"; //print checkboxes     
    })
    
  }).then(function(){
    var checkboxes = document.getElementsByName('fields'); //add onclick event listener
    checkboxes.forEach(function(checkbox){
      checkbox.addEventListener('click', function(){
        t.get('board', 'private', 'fieldsData', {})
        .then(function(fields){
          fields[checkbox.value] = checkbox.checked;
          return t.set('board', 'private', 'fieldsData', fields)
        })    
      })    
    })

    
  })
  .then(function(){
    t.sizeTo('#content')
    .done();
  })
        
  });


t.board('id').get('id').then(function(model){
    t.get('board', 'shared', 'credentials').then(function(credentials){
       
      credentialsDiv.innerHTML += ("<b>API Key :</b> " + credentials.apiKey);
      credentialsDiv.innerHTML += ("<br><b>Base :</b> " + credentials.app);
      credentialsDiv.innerHTML += ("<br><b>Table :</b> " + credentials.table);
      
      
      
    })
})






syncBtn.addEventListener('click', function(){
  return t.popup({
      title: 'Sync',
      url: './sync.html',
      height: 250, // we can always resize later, but if we know the size in advance, its good to tell Trello
    });
  
})

deleteBtn.addEventListener('click', function(){
  
  t.remove('board', 'shared', 'credentials')
  .then(function(){
      t.closePopup();

  })

})

resetBtn.addEventListener('click', function(){

    t.remove('board', 'private', 'fieldsData')   
    .then(function(){
      return t.popup({
        title: 'Authozire AirTable',
        url: './authorize.html', // this page doesn't exist in this project but is just a normal page like settings.html
        height: 250,
      });
    })
})

