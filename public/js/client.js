/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;

var CACHE_TIME = 2000;

var airtableAPI = 'https://api.airtable.com/v0/'



var data = [];
var lastRefresh = 0;

var dataAvailablePromise; //resolved if data is available


//Fetch data from AirTable API
function fetchAirtableData(credentials){
  return dataAvailablePromise = new Promise(function(resolve){
    
    
    if(Date.now() - lastRefresh > CACHE_TIME) { //if more than 2 seconds, refresh cache
      lastRefresh = Date.now();
      fetch(airtableAPI + credentials.app + "/Cards" , { 
      method: 'get', 
      headers: {
        'Authorization': 'Bearer ' + credentials.apiKey, 
       }, 
      }).then(function(response) {
        return response.json();
      }).then(function(response) {

        data = [];
        response.records.forEach(function(row){
          data[row.fields.Trello_Card_id] = row.fields;
        })
      }).then(function(){   
        console.log("no cache")
          resolve(); //data has been successfully fetched : resolve.
      })
    }
    

    else { //else use cache
      dataAvailablePromise.then(function(){ //wait for cache
        console.log("cache")
        resolve(); //using cache data : resolve
        })
    }
  });
}





//generate badge list for one card
function generateBadgeList(t){

  return Promise.all([ //get stored credentials & options
    t.get('board', 'shared', 'credentials'),
    t.get('board', 'private', 'fieldsData'),
  ])
  .spread(function(credentials, fieldsData){
   
    if(!credentials || !fieldsData)
      return [];
  
    var badgeList = [];
    return t.card('id')
      .then(function(cardID){ 
      
        var badgeTitleList = [];
        Object.getOwnPropertyNames(fieldsData).forEach(function (fieldData){
          
        if (!fieldsData[fieldData]) 
          return;
     
        badgeList.push({ 

            dynamic: function (t) //dynamic : Trello refreshes every 10sec or on focus
            {

              return fetchAirtableData(credentials)
                .then(function(){ //If global data promise is resolved 
                  return ({
                    title: fieldData, // for detail badges only
                    text: (data[cardID.id] !== undefined) ? data[cardID.id][fieldData] : "",
                    color: null,
                    refresh: 10,
                    })

                }); 
            }
        })
      })
      return badgeList
     })    
  })
}




// We need to call initialize to get all of our capability handles set up and registered with Trello
TrelloPowerUp.initialize({

  'board-buttons': function(t, options){
    return t.get('board', 'shared', 'credentials')
      .then(function(credentials){
        return [{
          text: 'Airtable',
          url: "https://airtable.com/" + (credentials.app ? (credentials.app) : ""),
          target: 'Base Airtable' // optional target for above url
        }]
      })
  },
  
  'card-badges': function(t, options){
    return generateBadgeList(t);
  },

  'card-detail-badges': function(t, options) {
    return generateBadgeList(t);
  },
  
  'authorization-status': function(t) {
    return t.get('board', 'shared', 'credentials')
    .then(function(credentials){
        return { authorized: (credentials !== undefined) }
    })
  },
  
  'show-authorization': function(t, options){
    // return what to do when a user clicks the 'Authorize Account' link
    // from the Power-Up gear icon which shows when 'authorization-status'
    // returns { authorized: false }
    // in this case we would open a popup
    return t.popup({
      title: 'Authozire AirTable',
      url: './authorize.html', // this page doesn't exist in this project but is just a normal page like settings.html
      height: 250,
    });
  },
  
  'show-settings': function(t, options){
    // when a user clicks the gear icon by your Power-Up in the Power-Ups menu
    // what should Trello show. We highly recommend the popup in this case as
    // it is the least disruptive, and fits in well with the rest of Trello's UX
    return t.popup({
      title: 'Settings',
      url: './settings.html',
      height: 250, // we can always resize later, but if we know the size in advance, its good to tell Trello
    });
  }
});

console.log('Loaded by: ' + document.referrer);
  
