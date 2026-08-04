function sendMail(name, email, subject, message) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.set('Authorization', 'Basic ' + btoa('4f922d4b788f691410d8f386972af34d'+":" +'<Secret Key>'));
  
    const data = JSON.stringify({
      "Messages": [{
        "From": {"Email": "<YOUR EMAIL>", "Name": "<YOUR NAME>"},
        "To": [{"Email": email, "Name": name}],
        "Subject": subject,
        "TextPart": message
      }]
    });
  
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: data,
    };
  
    fetch("https://api.mailjet.com/v3.1/send", requestOptions)
      .then(response => response.text())
      .then(result => console.log(result))
      .catch(error => console.log('error', error));
  }
  
//sendMail('Test Name',"<YOUR EMAIL>",'Test Subject','Test Message')

function recupererValeur() {
    var sujet = document.getElementById('sujet').value
    var description = document.getElementById('description').value

    console.log("Valeur de l'input - Sujet :", sujet);
    console.log("Valeur de l'input - Description :", description);
    request = 'mailto:classetonprof@tutanota.com?subject='+sujet+'&body='+description
    window.open(request);
}