
$(document).ready(function(){

  var p = document.getElementById('p');
  var status = document.getElementById('status')
  

  
  
  var authenticationSuccess = function() { 
    console.log('Successful authentication'); 
    p.innerHTML += "Trello authentication : OK<br>"
    window.opener.done(false, Trello.token());
    close();

  };
  
  
  var authenticationFailure = function() { 
    window.opener.done(true);
    console.log('Failed authentication'); 
    close();
  };



  
  
  Trello.authorize({
    type: 'redirect',
    name: 'Trello Template',
    scope: {
      read: 'allowRead',
      write: 'allowWrite' },
    expiration: 'never',
    success: authenticationSuccess,
    error: authenticationFailure
  });
  
  })