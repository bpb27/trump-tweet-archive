

/*
	Choose one of the links below, open the console, and paste the JS line below (use Chrome).
	Wait until everything has loaded, then paste the uncommented JS.
	This will copy JSON to your clipboard. Paste in a document and save.

	setInterval(function(){ scrollTo(0, document.body.scrollHeight) }, 2500)

	https://twitter.com/search?q=from%3Arealdonaldtrump%20since%3A2015-01-01%20until%3A2015-12-31&src=typd&lang=en
	https://twitter.com/search?q=from%3Arealdonaldtrump%20since%3A2014-01-01%20until%3A2014-12-31&src=typd&lang=en
	https://twitter.com/search?q=from%3Arealdonaldtrump%20since%3A2013-01-01%20until%3A2013-12-31&src=typd&lang=en
	https://twitter.com/search?q=from%3Arealdonaldtrump%20since%3A2012-01-01%20until%3A2012-12-31&src=typd&lang=en
	https://twitter.com/search?q=from%3Arealdonaldtrump%20since%3A2012-01-01%20until%3A2012-12-31&src=typd&lang=en
	https://twitter.com/search?q=from%3Arealdonaldtrump%20since%3A2011-01-01%20until%3A2011-12-31&src=typd&lang=en
	https://twitter.com/search?q=from%3Arealdonaldtrump%20since%3A2010-01-01%20until%3A2010-12-31&src=typd&lang=en
	https://twitter.com/search?q=from%3Arealdonaldtrump%20since%3A2009-01-01%20until%3A2009-12-31&src=typd&lang=en
*/


var allTweets = [];
var tweetElements = document.querySelectorAll('li.stream-item');

for (var i = 0; i < tweetElements.length; i++) {
	var el = tweetElements[i];
	var text = el.querySelector('.tweet-text').textContent;
	allTweets.push({
		id: el.getAttribute('data-item-id'),
		date: el.querySelector('.time a').textContent,
		text: text,
		link: el.querySelector('div.tweet').getAttribute('data-permalink-path'),
		retweet: text.indexOf('\"@') == 0 && text.includes(':') ? true : false
	});
}

copy(allTweets);


// https://www.allmytweets.net/

var allTweets = [];
var tweetElements = document.getElementsByTagName('li');

function pullText (el) {
	var text = ''; 
	el.childNodes.forEach(function(item, i){ 
		if (i < el.childNodes.length - 1) 
			text += item.textContent 
	});
	return text;
}

for (var i = 0; i < tweetElements.length; i++) {
	var el = tweetElements[i];
	var text = pullText(el);
	allTweets.push({
		id: el.childNodes[el.childNodes.length - 1].getAttribute('href').split('/').pop(),
		text: text,
		date: el.childNodes[el.childNodes.length - 1].textContent,
		link: el.childNodes[el.childNodes.length - 1].getAttribute('href').split('#!')[1],
		retweet: text.indexOf('\"@') == 0 && text.includes(':') ? true : false
	});
}

copy(allTweets);