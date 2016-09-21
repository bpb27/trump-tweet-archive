// How to get ALL the tweets (only way I know of)

/* 

	Following these steps will get you tweets in JSON form
	If you're unfamiliar with the format, go here to convert results to CSV (can open CSV in MS Excel)
	https://json-csv.com/

*/

/*

	open this link in chrome (replace the user name and date with whatever is applicable):
	https://twitter.com/search?q=from%3Arealdonaldtrump%20since%3A2015-01-01%20until%3A2015-12-31&src=typd&lang=en

	^^ this will get you all tweets from 2015
	
	open the console (Mac: cmd + option + j, PC: ctrl + shift + j)
	paste the setInterval line below and press enter

*/


setInterval(function(){ scrollTo(0, document.body.scrollHeight) }, 2500)


/*
	
	wait until the page has stopped scrolling (could be 2-15 minutes depending on how many there are)

	run the javascript below, and it will automatically copy it to your clipboard
	paste in a text editor and save
	run again for each year

	NB: any tweets from today won't have the date format you want, you'll have to manually change them

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
		retweet: text.indexOf('\"@') == 0 && s.split(' ')[0][s.split(' ')[0].length - 1] ? true : false
	});
}

copy(allTweets);