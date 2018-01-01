var app = angular.module('myApp', ['ngRoute']);

app.config(function ($routeProvider, $locationProvider) {
	$routeProvider
		.when("/", {
			templateUrl: "/highlights.html"
		})
		.when("/about", {
			templateUrl: "about.html"
		})
		.when("/archive", {
			templateUrl: "archive.html"
		})
		.when("/archive/account/:account", {
			templateUrl: "archive.html"
		})
		.when("/archive/account/:account/:search", {
			templateUrl: "archive.html"
		})
		.when("/archive/account/:account/:search/:params", {
			templateUrl: "archive.html"
		})
		.when("/archive/account/:account/:search/:params/:dates", {
			templateUrl: "archive.html"
		})
		.when("/archive/account/:account/:search/:params/:dates/:time/:device", {
			templateUrl: "archive.html"
		})
		.when("/archive/:search", {
			templateUrl: "archive.html"
		})
		.when("/archive/:search/:params", {
			templateUrl: "archive.html"
		})
		.when("/archive/:search/:params/:dates", {
			templateUrl: "archive.html"
		})
		.when("/archive/:search/:params/:dates/:time/:device", {
			templateUrl: "archive.html"
		})
		.when("/allaccounts", {
			templateUrl: "allaccounts.html"
		})
		.when("/highlights", {
			templateUrl: "highlights.html"
		})
		.when("/highlights/:template", {
			templateUrl: function (urlattr) {
				return '/highlights/' + urlattr.template + '.html';
			}
		})
		.otherwise({
			templateUrl: "highlights.html"
		});

	$locationProvider.html5Mode(true).hashPrefix('!');
});


app.controller('tweetPanelCtrl', ['TweetService', function (TweetService) {
	document.querySelector('body').scrollTop = 0;
	TweetService.transform();
}]);

app.controller('allAccountsCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
	$scope.accounts = [];
	$scope.goToAccount = function (account) {
		$location.path('/archive/account/' + account);
	}
	$http.get('/data/accounts.json').then(function (results) {
		$scope.accounts = results.data;
	});
}]);

app.controller('highlightsCtrl', ['$scope', '$http', 'TweetService', function ($scope, $http, TweetService) {

	$scope.accounts = [];
	$scope.days = Math.round((new Date() - new Date('01-20-2017'))/(1000*60*60*24));
	$scope.fakeNews = [];
	$scope.latest = [];
	$scope.media = [];
	$scope.mentions = [];
	$scope.count = {
		fake: 174,
		cnn: 33,
		nyt: 37,
		nbc: 31,
		fox: 164,
		russia: 98,
		deal: 67,
		nfl: 23,
		clinton: 76,
		obama: 58,
		obamacare: 73,
		maga: 100
	};

	$scope.showUrlToPage = function ($event) {
		prompt('Copy text below (PC: ctrl + c) (Mac: cmd + c)', 'http://www.trumptwitterarchive.com/#' + $event.srcElement.id);
	}

	TweetService.transform();

	$http.get('/data/media.json').then(function (results) {
		results.data.map(function (item) {
			item.date = new Date(item.date);
		});
		$scope.media = results.data;
	});

	$http.get('/data/realdonaldtrump/2018.json').then(function (results) {
		var tweets = results.data.sort(function (a, b) {
			return new Date(a.created_at) < new Date(b.created_at) ? 1 : -1;
		}).map(function (tweet) {
			tweet.text = tweet.text.replace('&amp;', '&');
			return tweet;
		});
		$scope.latest = tweets.slice(0, 10);
		$scope.fakeNews = tweets.filter(function (tweet) {
			text = tweet.text.toLowerCase();
			return text.indexOf('fake news') !== -1 || text.indexOf('fakenews') !== -1 || text.indexOf('fake media') !== -1;
		}).slice(0, 10);

		var tweetsAsPresident = tweets.filter(function (tweet) {
			return new Date('01-20-2017') < new Date(tweet.created_at);
		});

		$scope.mentions = appUtils.parseMentions(tweetsAsPresident);

		tweetsAsPresident.forEach(function (tweet) {
			if (new Date(tweet.created_at) < new Date('01-20-2017')) return;
			var text = tweet.text.toLowerCase();
			if (text.indexOf('fake news') !== -1 || text.indexOf('fakenews') !== -1 || text.indexOf('fake media') !== -1) $scope.count.fake++;
			if (text.indexOf('@fox') !== -1 || text.indexOf('@seanhannity') !== -1) $scope.count.fox++;
			if (text.indexOf('nytimes') !== -1 || text.indexOf('new york times') !== -1) $scope.count.nyt++;
			if (text.indexOf('cnn') !== -1) $scope.count.cnn++;
			if (text.indexOf('nbc') !== -1) $scope.count.nbc++;
			if (text.indexOf('russia') !== -1 || text.indexOf('putin') !== -1) $scope.count.russia++;
			if (text.indexOf('clinton') !== -1 || text.indexOf('hillary') !== -1) $scope.count.clinton++;
			if (text.indexOf('obama') !== -1 && text.indexOf('obamacare') === -1) $scope.count.obama++;
			if (text.indexOf('obamacare') !== -1) $scope.count.obamacare++;
			if (text.indexOf('deal') !== -1) $scope.count.deal++;
			if (text.indexOf('nfl') !== -1 && text.indexOf('influ') === -1 && text.indexOf('conflict') === -1) $scope.count.nfl++;
			if (text.indexOf('#maga') !== -1 || text.indexOf('make america') !== -1) $scope.count.maga++;
		});
	});

}]);


app.controller('archiveCtrl', ['$scope', '$http', '$timeout', '$sce', '$routeParams', '$filter', 'TweetService', function ($scope, $http, $timeout, $sce, $routeParams, $filter, TweetService) {
	document.querySelector('body').scrollTop = 0;

	$scope.account = $routeParams && $routeParams.account ? $routeParams.account : 'realdonaldtrump';
	$scope.all = [];
	$scope.dateRange = getDateRange($routeParams);
	$scope.deepQuery = {};
	$scope.exported = '';
	$scope.exportSeparator = ',';
	$scope.exportSettings = {source: true, text: true, created_at: true, retweet_count: true, favorite_count: true, is_retweet: true, id_str: true};
	$scope.hasRetweetsAndFavorites = $scope.account === 'realdonaldtrump';
	$scope.loaded = [];
	$scope.increment = 100;
	$scope.orderBy = 'created_at_date';
	$scope.query = getQuery($routeParams);
	$scope.settings = getSettings($routeParams);
	$scope.showExport = false;
	$scope.showModal = false;
	$scope.sources = {
		source: getDevice($routeParams),
		options: []
	};
	$scope.times = {
		time: getTime($routeParams),
		options: appUtils.times
	};

	$scope.export = function (format) {
		$scope.showExport = true;

		var requestedProps = Object.keys($scope.exportSettings).filter(function(setting){
			return $scope.exportSettings[setting];
		});

		if (format === 'CSV') {
			var separator = $scope.exportSeparator;
			var months = appUtils.months;
			var data = $scope.matches.map(function(item){
				return requestedProps.map(function(prop){
					if (prop === 'text')
						return separator === ',' ? item.text.replace(/,/g, '').replace(/\n/g, '') : item.text.replace(/\n/g, '');
					else if (prop === 'created_at')
						return appUtils.dateToExcelFormat(months, item[prop]);
					else
						return item[prop];
				}).join(separator);
			});
			$scope.exported = [requestedProps.join(separator)].concat(data).join('\n');
		}
		else if (format === 'JSON') {
			var parsedData = $scope.matches.map(function(item){
				var parsedItem = {};
				requestedProps.forEach(function(prop){
					parsedItem[prop] = item[prop];
				});
				return parsedItem;
			});
			$scope.exported = JSON.stringify(parsedData);
		}
	}

	$scope.missingProps = function (data) {
		return data && data.length && data[0]['favorite_count'] === undefined;
	}

	$scope.loadMore = function () {
		$scope.increment += 100;
		$scope.displayed = $scope.matches.slice(0, $scope.increment);
	}

	$scope.removeDatesModal = function () {
		$scope.showModal = false;
	}

	$scope.requestTweets = function (years) {
		var account = $scope.account;
		var loadedYears = 0;

		$scope.showModal = true;

		// condition is here for retries
		if (!$scope.loaded.length) {
			$scope.loaded = years.map(function (year) {
				return { 'year': year, 'url': buildDataRoute(year, account), 'status': 'loading' }
			});
		}

		years.forEach(function (year, i) {
			var url = buildDataRoute(year, account);
			TweetService.load(account, url, year, function (data) {
				$scope.all = $scope.all.concat(data);
				$scope.sources.options = getSources(data, $scope.sources.options);
				$scope.showModal = true;
				$scope.loaded = removeExisting(url, $scope.loaded).concat({ year: year, url: url, status: 'success' });
				loadedYears += 1;
				if (loadedYears === years.length) {
					$scope.removeDatesModal();
					$scope.updateList();
				} else if (i === years.length - 1) {
					$scope.updateList();
				}
				if ($scope.missingProps(data)) {
					$scope.hasRetweetsAndFavorites = false;
				}
			}, function (error) {
				$scope.loaded = removeExisting(url, $scope.loaded).concat({ year: year, url: url, status: 'failure' });
			});
		});

		function buildDataRoute(year, account) {
			var base = '/data/' + account + '/' + year + '.json';
			var aws = 'http://trumptwitterarchivedata.s3-website-us-east-1.amazonaws.com';
			return year === '2017' ? base : aws + base;
		}

		function removeExisting(url, items) {
			return items.filter(function (item) {
				return item.url !== url;
			});
		}
	}

	$scope.retryUrl = function (year) {
		$scope.requestTweets([year]);
	}

	$scope.setOrder = function (term) {
		if ($scope.orderBy === term) {
			$scope.orderBy = 'created_at_date';
		} else {
			$scope.orderBy = term;
		}
	}

	$scope.showUrlToPage = function () {
		var paramString = createParams($scope.query, $scope.settings, $scope.times, $scope.sources, $scope.dateRange);
		if ($scope.account.toLowerCase() === 'realdonaldtrump')
			prompt('Copy text below (PC: ctrl + c) (Mac: cmd + c)', 'http://www.trumptwitterarchive.com/archive/' + paramString);
		else
			prompt('Copy text below (PC: ctrl + c) (Mac: cmd + c)', 'http://www.trumptwitterarchive.com/archive/account/' + $scope.account + '/' + paramString);
	}

	$scope.updateList = function (resetIncrement) {

		var query = $scope.query.toLowerCase();
		var regEx = new RegExp('\\b' + query + '\\b', 'i');
		var deepQuery = null;
		var exact = $scope.settings.exactMatch;

		if (appUtils.symbolsPresent(query)) {
			deepQuery = appUtils.parser(query);
			$scope.deepQuery = deepQuery;
		} else {
			$scope.deepQuery = {};
		}

		$scope.matches = $scope.all.filter(function (item) {

			if ($scope.dateRange.start && new Date(item.created_at) < $scope.dateRange.start)
				return;
			if ($scope.dateRange.end && new Date(item.created_at) > $scope.dateRange.end)
				return;
			if ($scope.times.time !== 'Any time' && timeOutOfRange(item.created_at, $scope.times.time))
				return
			if ($scope.sources.source !== 'All devices' && item.source !== $scope.sources.source)
				return
			if (!$scope.settings.retweets && item.is_retweet)
				return;
			if (!$scope.settings.showManualRetweets && item.text.indexOf('"@') === 0)
				return;
			if (!$scope.query)
				return true;

			var text = item.text.toLowerCase();

			if (deepQuery) {
				return appUtils.deepQueryParse(deepQuery, text, exact);
			} else {
				return exact ? regEx.test(text) : text.indexOf(query) !== -1;
			}

		});

		var sortProp = $scope.orderBy;

		$scope.matches.sort(function (a, b) {
			if ($scope.settings.descending)
				return a[sortProp] < b[sortProp] ? 1 : -1;
			return a[sortProp] > b[sortProp] ? 1 : -1;
		});

		if (resetIncrement)
			$scope.increment = 100;
		$scope.displayed = $scope.matches.slice(0, $scope.increment);

	}

	$scope.$watch('query', function () {
		var query = $scope.query;
		$scope.showModal = false;
		$timeout(function () {
			if (query === $scope.query) {
				$scope.updateList(true);
			}
		}, 333);
	});

	$scope.$watch('dateRange.start', function () {
		var d = $scope.dateRange.start;
		if (!d) {
			$scope.updateList();
		}
		if (d && Object.prototype.toString.call(d) === '[object Date]' && d.getFullYear() > 2000) {
			$scope.updateList();
		}
	});

	$scope.$watch('dateRange.end', function () {
		var d = $scope.dateRange.end;
		if (!d) {
			$scope.updateList();
		}
		if (d && Object.prototype.toString.call(d) === '[object Date]' && d.getFullYear() > 2000) {
			$scope.updateList();
		}
	});

	$scope.$watchGroup([
      'settings.descending',
			'settings.retweets',
			'settings.caseSensitive',
			'settings.exactMatch',
			'settings.showManualRetweets',
      'orderBy',
      'times.time',
      'sources.source'
		], function () {
		$scope.updateList();
	});

	TweetService.getAccount($scope.account, function (account) {
		$scope.requestTweets(years(account.startingYear));
	});

	function createParams(query, settings, times, sources, dateRange) {
		var params = (query || 'none') + '/';
		settings.descending ? params += 't' : params += 'f';
		settings.retweets ? params += 't' : params += 'f';
		settings.exactMatch ? params += 't' : params += 'f';
		settings.caseSensitive ? params += 't' : params += 'f';
		params += parseDateRange();

		if (times.time === 'Any time' && sources.source === 'All devices') {
			return encodeURI(params);
		} else if (parseDateRange()) {
			return encodeURI(params + '/' + times.time + '/' + sources.source);
		} else {
			return encodeURI(params + '/none/' + times.time + '/' + sources.source);
		}

		function parseDateRange() {
			var str = '/' + parseDate(dateRange.start) + '_' + parseDate(dateRange.end);
			return str.length === 2 ? '' : str;

			function parseDate(d) {
				return !d ? '' : [d.getMonth() + 1, d.getDate(), d.getFullYear()].join('-');
			}
		}
	}

	function getDateRange(routeParams) {
		var defaultDates = { start: null, end: null };
		if (routeParams && routeParams.dates && routeParams.dates !== 'none') {
			try {
				var paramDates = routeParams.dates.split('_');
				defaultDates.start = createDate(paramDates[0]);
				defaultDates.end = createDate(paramDates[1]);
			} catch (error) {}
		}

		return defaultDates;

		function createDate(d) {
			if (!d) return null;
			if (d.length < 8) return null;
			if (!isNaN(new Date(d).getTime())) return new Date(d);
			return null;
		}
	}

	function getQuery(routeParams) {
		if (routeParams && routeParams.search && routeParams.search !== 'none')
			return routeParams.search;
		return '';
	}

	function getSettings(routeParams) {
		var defaultSettings = { descending: true, retweets: true, exactMatch: false, caseSensitive: false, showRetweetCount: false, showFavoriteCount: false, showManualRetweets: true };

		if (!$routeParams)
			return defaultSettings;
		if (!routeParams.params || routeParams.params.length !== 4)
			return defaultSettings;

		var p = routeParams.params;
		return { descending: parse(p[0]), retweets: parse(p[1]), exactMatch: parse(p[2]), caseSensitive: parse(p[3]) };

		function parse(letter) {
			return letter === 't';
		}
	}

	function getSources(data, previous) {
		var sources = {
			'All devices': true
		};
		previous.forEach(function (item) {
			if (item) sources[item] = true;
		});
		data.forEach(function (item) {
			if (item.source) sources[item.source] = true;
		});
		return Object.keys(sources).sort()
	}

	function getTime(routeParams) {
		return routeParams && routeParams.time ? routeParams.time : 'Any time';
	}

	function getDevice(routeParams) {
		return routeParams && routeParams.device ? routeParams.device : 'All devices';
	}

	function timeOutOfRange(date, time) {
		var s = $filter('date')(new Date(date), 'medium', '-0400');
		if (s[s.length - 2].toLowerCase() !== time[time.length - 2].toLowerCase())
			return true;
		if (s.split(' ')[3].split(':')[0] !== time.split(':')[0])
			return true;
	}

	function years(startingYear) {
		var all = ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017'];
		return all.indexOf(startingYear) ? all.slice(all.indexOf(startingYear)) : all;
	}

}]);


app.directive('whenScrolled', function () {
	return function (scope, elm, attr) {
		var raw = elm[0];
		elm.bind('scroll', function () {
			if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight)
				scope.$apply(attr.whenScrolled);
		});
	};
});


app.filter('highlight', function ($sce, $filter) {
	var esc = appUtils.esc;
	return function (tweet, phrase, deepQuery, exactMatch) {
		if (phrase) {
			if (Object.keys(deepQuery).length) {
				var text = tweet.text;
				deepQuery['and'].concat(deepQuery['or']).forEach(function (keyword) {
					var re = exactMatch ? new RegExp('(\\b' + esc(keyword) + '\\b)', 'gi') : new RegExp('(' + esc(keyword) + ')', 'gi');
					text = text.replace(re, '<span class="highlighted">$1</span>');
				});
				return $sce.trustAsHtml(text);
			} else if (exactMatch) {
				return $sce.trustAsHtml((tweet.text).replace(new RegExp('(\\b' + esc(phrase) + '\\b)', 'gi'), '<span class="highlighted">$1</span>'));
			} else {
				return $sce.trustAsHtml((tweet.text).replace(new RegExp('(' + esc(phrase) + ')', 'gi'), '<span class="highlighted">$1</span>'));
			}
		}
		return $sce.trustAsHtml(tweet.text);
	}
});

app.filter('dateformat', function ($sce, $filter) {
	return function (tweet) {
		return $sce.trustAsHtml($filter('date')(new Date(tweet.created_at), 'MMM d, y hh:mm:ss a', '-0500'));
	}
});


app.service('TweetService', ['$http', '$timeout', function ($http, $timeout) {

	this.accounts = [];
	this.loaded = {};

	this.getAccount = function (username, successHandler) {
		this.getAccounts(function (accounts) {
			var target = accounts.filter(function (account) {
				return account.account === username;
			})[0];
			successHandler(target);
		})
	}

	this.getAccounts = function (successHandler) {
		if (this.accounts.length) {
			successHandler(this.accounts);
		} else {
			setTimeout(function () {
				this.getAccounts(successHandler);
			}.bind(this), 100);
		}
	}

	this.load = function (user, url, year, successHandler, errorHandler) {
		this.getAccounts(function (accounts) {
			if (this.loaded[user] && this.loaded[user][year]) {
				successHandler(this.loaded[user][year]);
			} else {
				$http.get(url).then(function (results) {
					this.loaded[user][year] = appUtils.addDates('created_at', 'created_at_date', results.data);
					successHandler(results.data);
				}.bind(this), errorHandler);
			}
		}.bind(this));
	}

	this.transform = function () {

		var attempts = 100;
		$timeout(transformTweets, 100);

		function transformTweets() {
			if (window.twttr && window.twttr.widgets && window.twttr.widgets.load) {
				window.twttr.widgets.load();
			} else if (attempts) {
				attempts -= 1;
				$timeout(transformTweets, 100);
			}
		}
	}

	$http({ url: './data/accounts.json', method: 'GET', cache: false }).then(function (results) {
		this.accounts = results.data;
		results.data.forEach(function (account) {
			this.loaded[account.account] = {};
		}.bind(this));
	}.bind(this));

}]);

var appUtils = {
	addDates: function (prop, newProp, list) {
		return list.map(function (item) {
			item[newProp] = new Date(item[prop]);
			return item;
		});
	},
	esc: function (str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	},
	deepQueryParse: function (deepQuery, text, exact) {
		var andMatch = true;
		var orMatch = true;
		var notMatch = true;

		if (deepQuery['and'].length) {
			andMatch = appUtils.parseAndMatch(deepQuery, text, exact);
			if (deepQuery['not'].length) {
				notMatch = appUtils.parseNotMatch(deepQuery, text, exact);
				return andMatch && notMatch;
			}
			return andMatch;
		}

		if (deepQuery['or'].length) {
			orMatch = appUtils.parseOrMatch(deepQuery, text, exact);
			if (deepQuery['not'].length) {
				notMatch = appUtils.parseNotMatch(deepQuery, text, exact);
				return orMatch && notMatch;
			}
			return orMatch;
		}

		if (deepQuery['not'].length) {
			notMatch = appUtils.parseNotMatch(deepQuery, text, exact);
			return notMatch;
		}
	},
	parser: function (str) {

		str = andor(str)[1] + str;

		var hash = { 'and': [], 'or': [], 'not': [] };
		var symbol = andor(str)[0];
		var marker = 0;

		for (var i = 0; i < str.length; i++) {
			if (str[i] == '&' && str[i + 1] == '&') {
				step();
				symbol = 'and';
			} else if (str[i] == '|' && str[i + 1] == '|') {
				step();
				symbol = 'or';
			} else if (str[i] == '~' && str[i + 1] == '~') {
				step();
				symbol = 'not';
			} else if (i === str.length - 1) {
				step();
			}
		}

		hash['and'] = clean(hash['and']);
		hash['or'] = clean(hash['or']);
		hash['not'] = clean(hash['not']);

		function andor(str) {
			var or = ['or', '||'];
			var and = ['and', '&&'];

			if (str.indexOf('||') !== -1) {
				if (str.indexOf('&&') !== -1) {
					if (str.indexOf('||') < str.indexOf('&&')) {
						return or;
					} else {
						return and;
					}
				} else {
					return or;
				}
			} else {
				return and;
			}
		}

		function clean(list) {
			return list.map(function (item) {
				return item.replace(/[|&~]/g, '').trim();
			}).filter(function (item) {
				return item;
			});
		}

		function step() {
			hash[symbol].push(str.slice(marker, i + 1));
			marker = i + 1;
		}

		return hash;
	},
	parseAndMatch: function (deepQuery, text, exact) {
		return deepQuery['and'].filter(function (word) {
			if (exact)
				return (new RegExp('\\b' + word + '\\b', 'i')).test(text);
			return text.indexOf(word) !== -1;
		}).length === deepQuery['and'].length;
	},
	parseOrMatch: function (deepQuery, text, exact) {
		return deepQuery['or'].filter(function (word) {
			if (exact)
				return (new RegExp('\\b' + word + '\\b', 'i')).test(text);
			return text.indexOf(word) !== -1;
		}).length;
	},
	parseNotMatch: function (deepQuery, text, exact) {
		return deepQuery['not'].filter(function (word) {
			if (exact)
				return (new RegExp('\\b' + word + '\\b', 'i')).test(text);
			return text.indexOf(word) !== -1;
		}).length === 0;
	},
	parseMentions: function (list) {
	  var hash = this.mentionsYearOne();
	  list.forEach(function(tweet){
	    var parts = tweet.text.split(' ');
	    parts.forEach(function(x){
	      x = x.toLowerCase().replace(/[.!:]/g, '');
	      if (x[0] !== '@' || x.length < 2) return;
	      if (hash[x]) hash[x] = hash[x] + 1;
	      else hash[x] = 1;
	    });
	  });
	  return Object.keys(hash).map(function(key){
	    return {mention: key, number: hash[key]}
	  }).sort(function(a, b){
	    if (a.number > b.number) return 1;
	    else if (a.number < b.number) return -1;
	    else return 0;
	  }).reverse().slice(0, 20);
	},
	symbolsPresent: function (str) {
		return str.indexOf('&&') !== -1 || str.indexOf('||') !== -1 || str.indexOf('~~') !== -1;
	},
	dateToExcelFormat: function (ref, str) {
		var list = str.split(' ');
		return ref[list[1]] + '-' + list[2] + '-' + list[5] + ' ' + list[3];
	},
	times: [
    'Any time',
    '12:00am',
    '1:00am',
    '2:00am',
    '3:00am',
    '4:00am',
    '5:00am',
    '6:00am',
    '7:00am',
    '8:00am',
    '9:00am',
    '10:00am',
    '11:00am',
    '12:00pm',
    '1:00pm',
    '2:00pm',
    '3:00pm',
    '4:00pm',
    '5:00pm',
    '6:00pm',
    '7:00pm',
    '8:00pm',
    '9:00pm',
    '10:00pm',
    '11:00pm',
  ],
	months: {
		'Jan': '01',
		'Feb': '02',
		'Mar': '03',
		'Apr': '04',
		'May': '05',
		'Jun': '06',
		'Jul': '07',
		'Aug': '08',
		'Sep': '09',
		'Oct': '10',
		'Nov': '11',
		'Dec': '12'
	},
	mentionsYearOne: function () {
		return {
		  "@dcsheriff,": 1,
		  "@wsj": 2,
		  "@charliekirk11": 5,
		  "@cbs": 1,
		  "@foxbusiness": 8,
		  "@pot…": 1,
		  "@foxandfriends": 96,
		  "@realdonaldtrump": 71,
		  "@danscavino": 3,
		  "@pinstripebowl": 1,
		  "@hawkeyefootball": 1,
		  "@erictrump": 12,
		  "@ivankatrump": 19,
		  "@jamiejmcintyre": 2,
		  "@dcexaminer": 2,
		  "@foxandfrlends": 1,
		  "@shawgerald4": 1,
		  "@foxnews-fbi’s": 1,
		  "@foxnews": 45,
		  "@whitehouse": 49,
		  "@senatemajldr": 7,
		  "@washingtonpost": 7,
		  "@repkristinoem": 1,
		  "@speakerryan": 4,
		  "@presssec": 3,
		  "@potus": 36,
		  "@gopchairwoman": 3,
		  "@shopfloornam": 2,
		  "@nytimes,": 7,
		  "@daveweigel": 2,
		  "@usarmy": 2,
		  "@usnavy": 7,
		  "@philbryantms": 1,
		  "@cnn": 10,
		  "@usdol": 1,
		  "@flotus": 35,
		  "@whitehouse,": 2,
		  "@chuckgrassley": 2,
		  "@scavino45": 20,
		  "@abc": 6,
		  "@paulsperry_": 2,
		  "@govchristie": 1,
		  "@senorrinhatch": 2,
		  "@nytimes": 22,
		  "@theresa_may,": 1,
		  "@theresamay,": 1,
		  "@jba_nafw": 3,
		  "@jaydabf": 3,
		  "@foxandfriends,": 1,
		  "@tuckercarlson": 5,
		  "@seanhannity": 17,
		  "@narendramodi": 3,
		  "@ivankatrump,": 2,
		  "@ges2017": 1,
		  "@statedeptspox": 1,
		  "@cfpb": 1,
		  "@deptofdefense": 2,
		  "@usnationalguard": 2,
		  "@uscg": 3,
		  "@uscg,": 1,
		  "@theplumlinegs": 1,
		  "@ingrahamangle": 3,
		  "@realjmannarino": 1,
		  "@varneyco": 1,
		  "@greta": 2,
		  "@piersmorgan": 1,
		  "@cnn,": 3,
		  "@whitehouse…": 2,
		  "@pchowka": 2,
		  "@pacificcommand\n\nremember": 2,
		  "@ussarizona\n\na": 2,
		  "@randpaul": 2,
		  "@billygraham": 1,
		  "@edwgillespie": 4,
		  "@abeshinzo": 1,
		  "@usforcesjapan": 1,
		  "@pacificcommand": 2,
		  "@federalreserve": 1,
		  "@broadcom": 1,
		  "@astros,": 1,
		  "@cabinet": 3,
		  "@garyplayer,": 1,
		  "@senategop": 3,
		  "@nygovcuomo": 2,
		  "@nycmayor": 2,
		  "@luisriveramarin": 1,
		  "@theleegreenwood\n#flashbackfriday": 1,
		  "@flgovscott": 2,
		  "@theleegreenwood": 1,
		  "@leegreenwood83": 1,
		  "@joy_villa": 1,
		  "@speakerryan,": 2,
		  "@gopleader,": 2,
		  "@stevescalise": 3,
		  "@loudobbs": 9,
		  "@govabbott": 4,
		  "@danpatrick,\n\nthank": 1,
		  "@reince": 2,
		  "@bpolitics": 1,
		  "@iamvicky4trump": 1,
		  "@un\nsecretary-general": 1,
		  "@antonioguterres": 3,
		  "@geraldorivera": 2,
		  "@ricardorossello": 4,
		  "@usarmy333": 1,
		  "@804streetmedia": 1,
		  "@danaperino": 1,
		  "@bradthor,\nthank": 1,
		  "@nfl": 1,
		  "@nikkihaley": 2,
		  "@fema": 7,
		  "@heritage": 1,
		  "@nbcnews,": 2,
		  "@cbsnews,": 1,
		  "@abcnewsradio": 1,
		  "@mike_pence": 2,
		  "@judgejeanine": 5,
		  "@laraleatrump": 2,
		  "@rightlynews": 3,
		  "@usnavy\n#242navybday": 1,
		  "@billoreilly": 3,
		  "@nbcnews": 8,
		  "@israelusaforevr": 1,
		  "@vp": 18,
		  "@nypost": 1,
		  "@opinionsamerica": 1,
		  "@secondlady": 1,
		  "@govmikehuckabee": 1,
		  "@tbn": 1,
		  "@lvmpd": 1,
		  "@umcsn": 1,
		  "@jenniffer2012": 1,
		  "@fema,": 2,
		  "@presidentscup": 1,
		  "@slandinsocal": 2,
		  "@ricardorossello,": 1,
		  "@usairforce": 3,
		  "@uscgsoutheast": 1,
		  "@redcross,": 1,
		  "@kellyannepolls": 4,
		  "@potus'": 2,
		  "@impdnews": 1,
		  "@stevescalise\n#teamscalise": 1,
		  "@nytimes(apologized)": 1,
		  "@wapo": 1,
		  "@usun": 1,
		  "@marianorajoy": 1,
		  "@un": 2,
		  "@jaymaga45": 1,
		  "@donnawr8": 4,
		  "@twitterdata": 1,
		  "@ricardorossello-": 1,
		  "@franklin_graham": 1,
		  "@realeaglebites": 1,
		  "@realdona…": 1,
		  "@sushmaswaraj,": 1,
		  "@emmanuelmacron": 6,
		  "@netanyahu,": 1,
		  "@netanyahu": 4,
		  "@cia": 1,
		  "@markets": 2,
		  "@fuctupmind": 1,
		  "@team_trump45": 6,
		  "@glamourizes": 1,
		  "@dmartosko": 1,
		  "@natlparkservice": 1,
		  "@secretarysonny": 1,
		  "@travelgov": 1,
		  "@nypdnews": 1,
		  "@ericbolling": 2,
		  "@donaldjtrumpjr": 3,
		  "@cbpflorida": 1,
		  "@customsborder": 1,
		  "@flgovscott\n\n\"if": 1,
		  "@gop": 6,
		  "@dougburgum,": 1,
		  "@brentsanfordnd,": 1,
		  "@senjohnhoeven,": 1,
		  "@repkevincramer": 1,
		  "@senatorheitkamp": 1,
		  "@the_trump_train": 1,
		  "@nationalguard,": 1,
		  "@columbiabugle": 2,
		  "@sendrelief,": 1,
		  "@redcross": 1,
		  "@salvationarmyus": 1,
		  "@secshulkin": 2,
		  "@brazoriacounty": 1,
		  "@thefive": 3,
		  "@txmilitary": 1,
		  "@nwshouston": 1,
		  "@gregabbott_tx": 2,
		  "@inspire_us": 1,
		  "@katiepavlich": 1,
		  "@dineshdsouza": 1,
		  "@epascottpruitt": 2,
		  "@e…": 1,
		  "@dhsgov": 4,
		  "@fema_brock,": 1,
		  "@tombossert45": 1,
		  "@louisianagov": 1,
		  "@usmc": 2,
		  "@icegov": 1,
		  "@jerrytravone": 1,
		  "@americanlegion": 1,
		  "@marcorubio": 1,
		  "@marty_walsh": 1,
		  "@breitbartnewsmaybe": 1,
		  "@kissimmeepolice": 1,
		  "@hughhewitt": 2,
		  "@mayorgimenez": 1,
		  "@deptvetaffairs": 2,
		  "@jacobawohl": 3,
		  "@jessebwatters": 3,
		  "@harlan": 1,
		  "@clewandowski_": 1,
		  "@mikeholden42": 1,
		  "@jackposobiec": 1,
		  "@fiiibuster": 1,
		  "@merck": 1,
		  "@axios": 1,
		  "@alandersh": 2,
		  "@dailycaller": 1,
		  "@secretservice": 1,
		  "@vsppio": 1,
		  "@progresspolls": 1,
		  "@shochandra": 1,
		  "@ambjohnbolton": 1,
		  "@barackobama": 1,
		  "@paultdove": 1,
		  "@bet22325450ste": 1,
		  "@realjameswoods": 2,
		  "@suffolk_sheriff": 1,
		  "@townhallcom": 1,
		  "@lisamurkowski": 1,
		  "@senjohnmccain-thank": 1,
		  "@secretaryperry,": 2,
		  "@secretaryzinke,": 1,
		  "@secpricemd": 2,
		  "@usga": 4,
		  "@emmanuelmacron": 2,
		  "@usembassyfrance,": 1,
		  "@washtimes": 1,
		  "@jasoninthehouse": 1,
		  "@carriesheffield": 1,
		  "@reald…": 1,
		  "@senatordole,": 1,
		  "@polizeihamburg": 1,
		  "@nbc": 1,
		  "@comcast": 1,
		  "@justintrudeau": 3,
		  "@morning_joe": 2,
		  "@vp,": 3,
		  "@secretaryzinke": 1,
		  "@cubs": 1,
		  "@washingtonpost?": 1,
		  "@jefftutorials": 1,
		  "@narendramodi,": 1,
		  "@foxnation": 4,
		  "@sentedcruz": 1,
		  "@marineband…": 1,
		  "@sheriffclarke": 1,
		  "@joegooding": 1,
		  "@jc_varela": 1,
		  "@diamondandsilk": 2,
		  "@newtgingrich": 1,
		  "@wctc": 1,
		  "@govwalker": 1,
		  "@richardgrenell": 1,
		  "@corrynmb": 1,
		  "@clemsonfb": 1,
		  "@faithandfreedom": 1,
		  "@housegop": 2,
		  "@senatemajldr,": 2,
		  "@johncornyn…": 1,
		  "@secshulkin's": 1,
		  "@drudge_report": 7,
		  "@heytammybruce": 1,
		  "@lindseygrahamsc": 1,
		  "@reince45": 1,
		  "@gopleader": 1,
		  "@jim_jordan": 4,
		  "@commercegov": 1,
		  "@presidentruvi": 1,
		  "@presidentruvi-": 1,
		  "@uscgacademy": 1,
		  "@libertyu": 1,
		  "@pga_johndaly": 1,
		  "@israelipm": 2,
		  "@brunelldonald": 1,
		  "@turnbullmalcolm": 1,
		  "@kevincorke": 1,
		  "@usedgov": 2,
		  "@betsydevosed": 1,
		  "@facethenation": 1,
		  "@marthamaccallum": 1,
		  "@deptvetaffairs…": 1,
		  "@commercegov,": 1,
		  "@secretaryross": 1,
		  "@mauriciomacri": 1,
		  "@interior": 1,
		  "@flotus,": 2,
		  "@nasa's": 2,
		  "@astropeggy": 1,
		  "@realdonaldtrump,": 1,
		  "@foxfriendsfirst)": 2,
		  "@superbowl": 1,
		  "@patriots": 1,
		  "@ossoff,": 1,
		  "@ainsleyearhardt": 1,
		  "@mariabartiromo": 1,
		  "@wwp": 1,
		  "@vp…": 1,
		  "@fbi": 1,
		  "@jclayfield": 1,
		  "@repmarkmeadows,": 3,
		  "@raul_labrador": 1,
		  "@repkenbuck": 1,
		  "@glfop": 1,
		  "@mitchellvii": 2,
		  "@republicanstudy": 1,
		  "@americafirstpol": 2,
		  "@ushcc": 1,
		  "@endakennytd": 1,
		  "@snoopdogg,": 1,
		  "@mayorbowser": 1,
		  "@senateyouth": 1,
		  "@realdonaldtrump's": 1,
		  "@repcummings": 1,
		  "@exxonmobil": 3,
		  "@senschumer": 1,
		  "@abc,": 1,
		  "@cbs,": 1,
		  "@cnn)": 1,
		  "@liliantintori": 1,
		  "@marcorubio)": 1,
		  "@msnbc": 1,
		  "@betsydevos": 1,
		  "@thebig_easy,": 2,
		  "@senatorsessions": 1,
		  "@intel": 1,
		  "@nordstrom": 1,
		  "@oreillyfactor": 4,
		  "@samsung": 1,
		  "@thebrodyfile": 2,
		  "@cbnnews": 2,
		  "@senmajleader,": 1,
		  "@davidmuir": 2,
		  "@abcworldnews": 1,
		  "@abc2020": 1,
		  "@dhsgov…": 1
		}
	}
}

console.log("Goddamn Looky Loo");
