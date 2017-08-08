var Promise = require('bluebird');


var createCard = (airtable, data) => {
  var card = data.card
  console.log(data.list.id);
  return getRecordIdFromTrelloId(airtable("Lists"), data.list,  "Trello_List_id")
    .catch(() => createList(airtable, data.list))
    .then(listId => {
      console.log(listId)
      airtable = airtable("Cards")
        return new Promise((resolve, reject) => {
        airtable.create(
          {
        "Trello_Card_id": card.id,
        "Trello_Card_name": card.name,
        "Trello_Card_desc": card.desc,
        "Trello_List_id" : [listId]

          }, function(err, record) {
            if (err) { console.error('card', err); return reject(err); }
            console.log("Card %s successfully created in AirTable", record.getId());
            return resolve(record.getId())
          });
        })
    })
  
}


 var massAddLists = (airtable, newListsList) => {
  var airtableLists = airtable('Lists')
  var len = newListsList.length
  if(len == 0) return Promise.resolve('done');
  
  
  var list = newListsList.pop()
  return getRecordIdFromTrelloId(airtableLists, list, "Trello_List_id")
    .catch(() => createList(airtable, list))
    .then(() => massAddLists(airtable, newListsList))
  
}

 var massAddCards = (airtable, newCardsList) => {
  
  var len = newCardsList.length
  if(len == 0) return Promise.resolve('done');
  const card = newCardsList.pop()
  var data = {}
  data.card = card;
  var list = {};
  list.id = card.idList;
  data.list = list;
  console.log(card.id)
  return createCard(airtable, data).then(() => massAddCards(airtable, newCardsList))
 
}



 var getRecordIdFromTrelloId = (airtable, obj, pk) => {
  if(obj === undefined) return Promise.reject('not found', pk)
    return new Promise(function(resolve, reject){
    airtable.select({ //fetch record ID
        maxRecords: 1,
        filterByFormula: "({"+pk+"}='"+obj.id+"')",
        view: "Grid view"
    }).firstPage(function(err, records) {
    if (err) { console.error('getRecord', pk, obj.name, 'err', err); return reject(err); }
    if(!records.length) return reject(new Error('Not Found'));
    else resolve(records[0].id)
    })
  })
  
}

var createList = (airtable, list) => {
  if(list === undefined) return Promise.reject('not found');
  console.log("creating list", list.name)
  airtable = airtable("Lists")
    return new Promise( (resolve, reject) => {
      console.log(list)
      airtable.create(
        {
        "Trello_List_id" : list.id,
        "Trello_List_name" : list.name
        }, function(err, record) {
          if (err) { console.error(err); return reject(err); }
          console.log("List %s created in AirTable", record.getId());
          return resolve(record.getId());
        });
    })
}
                       

var updateCard = (airtable, data) => {
  var card = data.card;
  var list = data.list === undefined ? data.listAfter : data.list
  if(list === undefined || card === undefined) return;
  var airtableCards = airtable('Cards')
  var airtableLists = airtable('Lists')
  Promise.all([
    getRecordIdFromTrelloId(airtableCards, card, "Trello_Card_id").catch(e => createCard(airtable, card)),
    getRecordIdFromTrelloId(airtableLists, list, "Trello_List_id").catch(e => createList(airtable, list) )
  ])
  
  .spread(function(cardId, listId){ //udpate ID
      console.log(listId)
      airtableCards.update(cardId, {
        "Trello_Card_name": card.name,
        "Trello_Card_desc": card.desc,
        "Trello_List_id": [listId]
        
      }, function(err, record) {
          if (err) { console.error('error updating', err); return; }
      });  
    
  })
}

var deleteCard = (airtable, data) => {
  const card = data.card
    return getRecordIdFromTrelloId(airtable, card, "Trello_Card_id")  
    .then(function(id){ //udpate ID
        airtable.destroy(id, function(err, record) {
            if (err) { console.error(err); return; }
        });  
    }, function(error){
    console.log("Could not delete card. Reason :")
    console.log(error)
  })
}


var updateList = (airtable, data) => {
  const list = data.list
  const airtableLists = airtable('Lists')
  return getRecordIdFromTrelloId(airtableLists, list, "Trello_List_id")
  .then(listId => {
      console.log('updating list')
      airtableLists.update(listId, {
        "Trello_List_name": list.name
        
      }, function(err, record) {
          if (err) { console.error('error updating', err); return; }
      }); 
  })
}
  
var getAllCardsId = (airtable) => {
  var idList = []
  const airtableCards = airtable("Cards")  
  return new Promise((resolve, reject) => {
    airtableCards.select({
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
      if (err) return reject(err)
      return resolve(idList)
      
      })
  })
}


module.exports = {
  createCard: createCard,
  massAddLists: massAddLists,
  massAddCards: massAddCards,
  getRecordIdFromTrelloId: getRecordIdFromTrelloId, 
  createList: createList,
  updateList: updateList,
  updateCard: updateCard,
  deleteCard: deleteCard,
  getAllCardsId: getAllCardsId

  
}
  
