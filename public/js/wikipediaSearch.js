async function searchInput(queryText){
    queryText = queryText.trim();
    var queryResult = "";
    
    try {
      queryResult = await searchWikipedia(queryText);
    } catch (err) {
      console.log(err);
      queryResult = 'Failed to search wikipedia';
    }

    return queryResult;
}

async function searchWikipedia(queryText) {
    // The link containing the information Wikipedia's API needs
    // Currently set up to return the first result in JSON format 
    const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=1&srsearch=${queryText}`;
    // Call the API and store the JSON results
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw Error(response.statusText);
    }
    // Parse the JSON file
    const JSONResult = await response.json();
    console.log(JSONResult);
    var queryResult = JSONResult.query.search[0].snippet;
    return removeHTMLSyntax(queryResult);
  }

function removeHTMLSyntax(text){
  // Function for properly formatting the Wikipedia snippet.
  while(true){
    var syntaxStart = text.indexOf('<');
    if (syntaxStart<0){
      return text;
    }
    var syntaxEnd = text.indexOf('>');

    text = text.replace(text.substr(syntaxStart,(syntaxEnd+1)-syntaxStart), "");
  }
}