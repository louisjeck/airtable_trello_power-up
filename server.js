// server.js
// where your node app starts

var compression = require('compression');
var cors = require('cors');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');


// compress our client side content before sending it over the wire
app.use(compression());

// your manifest must have appropriate CORS headers, you could also use '*'
app.use(cors({ origin: 'https://trello.com' }));
app.use( bodyParser.json() );
app.use(express.static('public'));


var Airtable = require('airtable');
app.all('/webhooks', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello world');
  

  var airtable = new Airtable({apiKey: req.query.airtable_api_key}).base(req.query.airtable_base);
  airtable = airtable(req.query.airtable_table)
  
  var action = req.body.action
  switch(action.type){
    case 'createCard':
      console.log('creating card, with id "%s" and name "%s"', action.data.card.id, action.data.card.name)
      addCard(airtable, action.data.card)
      break;
    case 'updateCard':
      console.log('updating card "%s" and name "%s"', action.data.card.id, action.data.card.name)
      updateCard(airtable, action.data.card)
      break;
    case 'deleteCard':
      console.log('deleting card with id "%s"', action.data.card.id)
      deleteCard(airtable, action.data.card)
      break;
 
    default:
      console.log(action)
  }
});
app.engine('.html', require('ejs').renderFile);
app.get("/auth", function(req, res){
    
    res.render("auth.html", { AIRTABLE_API_KEY: req.query.airtable_api_key, AIRTABLE_BASE: req.query.airtable_base, TRELLO_MODEL: req.query.trello_model });
});



//Return all cards id
app.get("/cards", function(req, res){
    res.setHeader('Content-Type', 'text/plain');
  
  var airtable = new Airtable({apiKey: req.query.airtable_api_key}).base(req.query.airtable_base);
  airtable = airtable(req.query.airtable_table)  
  var idList = []
  airtable.select({
      // Selecting the first 3 records in Grid view:
      //view: "Grid view"
  }).eachPage(function page(records, fetchNextPage) {
      // This function (`page`) will get called for each page of records.

      records.forEach(function(record) {
          idList.push(record.get('Trello_Card_id'));
      });

      // To fetch the next page of records, call `fetchNextPage`.
      // If there are more records, `page` will get called again.
      // If there are no more records, `done` will get called.
      fetchNextPage();

  }, function done(err) {
    var resp = {}
    resp.status = "success"
    resp.content = idList
    res.end(JSON.stringify(resp));
      if (err) { console.error(err); res.end('{status: "error"}') }
  });

  
  
})



// listen for requests 
var listener = app.listen(process.env.PORT, function () {
  console.info(`Node Version: ${process.version}`);
  console.log('Trello Power-Up Server listening on port ' + listener.address().port);
});











//********* AIRTABLE MGMT ***********//
function addCard(airtable, card){
    airtable.create(
      {
    "Trello_Card_id": card.id,
    "Trello_Card_name": card.name,
    "Trello_Card_desc": card.desc,

      }, function(err, record) {
      if (err) { console.error(err); return; }
      console.log("Card %s successfully created in AirTable", record.getId());
  });
}

function getRecordIdFromTrelloId(airtable, card){
    return new Promise(function(resolve, reject){
    airtable.select({ //fetch record ID
        maxRecords: 1,
        filterByFormula: "({Trello_Card_id}='"+card.id+"')",
        view: "Grid view"
    }).firstPage(function(err, records) {
    if (err) { console.error(err); return; }
    if(!records.length) reject(new Error('Not Found'));
    else resolve(records[0].id)
    })
  })
  
}

function updateCard(airtable, card){
  getRecordIdFromTrelloId(airtable, card)  
  .then(function(id){ //udpate ID
      airtable.update(id, {
        "Trello_Card_name": card.name,
        "Trello_Card_desc": card.desc,
        
      }, function(err, record) {
          if (err) { console.error(err); return; }
      });  
    }, function(error){
    console.log("Could not update card. Reason :")
    console.log(error)
    console.log("Creating card :")
    addCard(airtable, card)
    
  })
}

function deleteCard(airtable, card)  {
    getRecordIdFromTrelloId(airtable, card)  
    .then(function(id){ //udpate ID
        airtable.destroy(id, function(err, record) {
            if (err) { console.error(err); return; }
        });  
    }, function(error){
    console.log("Could not delete card. Reason :")
    console.log(error)
  })
}


//***** TRELLO WEBHOOKS MGMT *****//


// Start the request
function createWebhook(model){

  var headers = {
      'Content-Type':     'application/x-www-form-urlencoded'
  }

  // Configure the request
  var options = {
      url: "https://api.trello.com/1/tokens/"+TRELLO_USER_TOKEN+"/webhooks/?key="+TRELLO_APPLICATION_KEY,
      method: 'POST',
      headers: headers,
      form: {'idModel': model, 'description' : "AirTable webhook", 'callbackURL' : "https://hypnotic-bay.glitch.me/webhooks"}
  }
  request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          // Print out the response body
          console.log(body)
      }
    else console.log(body)
  })

}


function deleteWebhook(webhook){
  
    var headers = {
      'Content-Type':     'application/x-www-form-urlencoded'
  }

  // Configure the request
  var options = {
      url: "https://api.trello.com/1/tokens/"+""+"/webhooks/"+webhook+"?key="+"",
      method: 'DELETE',
      headers: headers,
  }
  request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          // Print out the response body
        console.log("ok")
          console.log(body)
      }
    else console.log(body)
  })
  
}