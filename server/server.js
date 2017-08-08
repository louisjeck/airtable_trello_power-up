// server.js
// where your node app starts
var Promise = require('bluebird');
const airtableHelper = require('./airtableHelper')
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
  

   if (req.body.action === undefined) { //first Trello webhook call
       res.end();
       return;
   }
       
    if(checkDisableWebhook(req, res))
      return;
  
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello world');
  

  var airtable = new Airtable({apiKey: req.query.airtable_api_key}).base(req.query.airtable_base);
  
  var action = req.body.action
  var type = req.body.action.display.translationKey;
  console.log(type)

  switch(type){
    case "action_create_card" :
      console.log('creating card, with id "%s" and name "%s"', action.data.card.id, action.data.card.name)
      airtableHelper.createCard(airtable, action.data)
      break;
      
    case "action_move_card_from_list_to_list" :
    case "action_renamed_card" :
    case "action_changed_description_of_card" :

      console.log('updating card "%s" and name "%s"', action.data.card.id, action.data.card.name)
      airtableHelper.updateCard(airtable, action.data)
      break;

    case 'action_delete_card':
      console.log('deleting card with id "%s"', action.data.card.id)
      airtableHelper.deleteCard(airtable, action.data)
      break;
    
    case 'action_renamed_list':
      airtableHelper.updateList(airtable, action.data)
      break;
 
    default:
      console.log(action)
  }
});
app.engine('.html', require('ejs').renderFile);
app.get("/auth", function(req, res){
    
  res.render("auth.html", { APIKEY: process.env.APIKEY});

});


app.put("/createCards", function(req, res){
  var airtable = new Airtable({apiKey: req.query.airtable_api_key}).base(req.query.airtable_base);
  
  airtableHelper.massAddLists(airtable, req.body.lists).then(() =>
  airtableHelper.massAddCards(airtable, req.body.cards).then((r) => res.end('done')));
  
})

function deleteWebhook(res) {
    console.log('Refused webhook')
    res.status(410);
    res.end();
    return true;
}

function checkDisableWebhook(req, res) {
    var action = req.body.action;
    if (action.type === "disablePlugin" && action.data.plugin.url === "https://" + req.headers.host + "/manifest.json")
        return deleteWebhook(res)
    return false

}



//Return all cards id
app.get("/cards", function(req, res){
    res.setHeader('Content-Type', 'text/plain');
  
  var airtable = new Airtable({apiKey: req.query.airtable_api_key}).base(req.query.airtable_base);
  airtableHelper.getAllCardsId(airtable)
  .catch(err => res.end({ status : "error" }))
  .then(idList => {
    var resp = {}
    resp.status = "success"
    resp.content = idList
    res.end(JSON.stringify(resp));
  });

})


// listen for requests 
var listener = app.listen(process.env.PORT, function () {
  console.info(`Node Version: ${process.version}`);
  console.log('Trello Power-Up Server listening on port ' + listener.address().port);
});











//********* AIRTABLE MGMT ***********//


