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
    $scope.latest = [];
    $scope.media = [];

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

    $http.get('/data/realdonaldtrump/2017.json').then(function (results) {
        $scope.latest = results.data.sort(function (a, b) {
            return new Date(a.created_at) < new Date(b.created_at) ? 1 : -1;
        }).slice(0, 10);
    });

}]);


app.controller('archiveCtrl', ['$scope', '$http', '$timeout', '$sce', '$routeParams', '$filter', 'TweetService', function ($scope, $http, $timeout, $sce, $routeParams, $filter, TweetService) {
    document.querySelector('body').scrollTop = 0;

    $scope.account = $routeParams && $routeParams.account ? $routeParams.account : 'realdonaldtrump';
    $scope.all = [];
    $scope.dateRange = getDateRange();
    $scope.deepQuery = {};
    $scope.loaded = [];
    $scope.increment = 100;
    $scope.query = getQuery();
    $scope.settings = getSettings();
    $scope.showModal = false;
    $scope.showTips = false;
    $scope.sources = {
        source: getDevice(),
        options: []
    };
    $scope.times = {
        time: getTime(),
        options: appUtils.times
    };

    $scope.loadMore = function () {
        $scope.increment += 100;
    }

    $scope.removeDatesModal = function () {
        $scope.showModal = false;
    }

    $scope.requestTweets = function (years) {
        var baseUrl = '/data/' + $scope.account + '/';
        var loadedYears = 0;

        $scope.showModal = true;

        // condition is here for retries
        if (!$scope.loaded.length) {
            $scope.loaded = years.map(function (year) {
                return { 'year': year, 'url': baseUrl + year + '.json', 'status': 'loading' }
            });
        }

        years.forEach(function (year) {
            var url = baseUrl + year + '.json';
            TweetService.load($scope.account, url, year, function (data) {
                $scope.all = $scope.all.concat(data);
                $scope.sources.options = getSources(data, $scope.sources.options);
                $scope.increment += 1;
                $scope.showModal = true;
                $scope.loaded = removeExisting(url, $scope.loaded).concat({ year: year, url: url, status: 'success' });
                loadedYears += 1;
                if (loadedYears === years.length) {
                    $scope.removeDatesModal();
                }
            }, function (error) {
                $scope.loaded = removeExisting(url, $scope.loaded).concat({ year: year, url: url, status: 'failure' });
            });
        });

        function removeExisting(url, items) {
            return items.filter(function (item) {
                return item.url !== url;
            });
        }
    }

    $scope.retryUrl = function (year) {
        $scope.requestTweets([year]);
    }

    $scope.showUrlToPage = function () {
        var paramString = encodeURI(createParams());
        if ($scope.account.toLowerCase() === 'realdonaldtrump')
            prompt('Copy text below (PC: ctrl + c) (Mac: cmd + c)', 'http://www.trumptwitterarchive.com/archive/' + paramString);
        else
            prompt('Copy text below (PC: ctrl + c) (Mac: cmd + c)', 'http://www.trumptwitterarchive.com/archive/account/' + $scope.account + '/' + paramString);
    }

    $scope.$watch('query', function () {
        var query = $scope.query;
        $scope.showModal = false;
        $timeout(function () {
            if (query === $scope.query) {
                updateList(true);
            }
        }, 333);
    });

    $scope.$watch('dateRange.start', function () {
        var d = $scope.dateRange.start;
        if (!d) {
            updateList();
        }
        if (d && Object.prototype.toString.call(d) === '[object Date]' && d.getFullYear() > 2000) {
            updateList();
        }
    });

    $scope.$watch('dateRange.end', function () {
        var d = $scope.dateRange.start;
        if (!d) {
            updateList();
        }
        if (d && Object.prototype.toString.call(d) === '[object Date]' && d.getFullYear() > 2000) {
            updateList();
        }
    });

    $scope.$watchGroup([
			'increment',
      'settings.descending',
			'settings.retweets',
			'settings.caseSensitive',
			'settings.exactMatch',
      'times.time',
      'sources.source'
		], function () {
        updateList();
    });

    TweetService.getAccount($scope.account, function (account) {
        $scope.requestTweets(years(account.startingYear));
    });

    function createParams() {
        var params = ($scope.query || 'none') + '/';
        $scope.settings.descending ? params += 't' : params += 'f';
        $scope.settings.retweets ? params += 't' : params += 'f';
        $scope.settings.exactMatch ? params += 't' : params += 'f';
        $scope.settings.caseSensitive ? params += 't' : params += 'f';
        params += parseDateRange();

        if ($scope.times.time === 'any time' && $scope.sources.source === 'all devices') {
            return params;
        } else if (parseDateRange()) {
            return params + '/' + $scope.times.time + '/' + $scope.sources.source;
        } else {
            return params + '/none/' + $scope.times.time + '/' + $scope.sources.source;
        }

        function parseDateRange() {
            var str = '/' + parseDate($scope.dateRange.start) + '_' + parseDate($scope.dateRange.end);
            return str.length === 2 ? '' : str;

            function parseDate(d) {
                return !d ? '' : [d.getMonth() + 1, d.getDate(), d.getFullYear()].join('-');
            }
        }
    }

    function getDateRange() {
        var defaultDates = { start: null, end: null };
        if ($routeParams && $routeParams.dates && $routeParams.dates !== 'none') {
            try {
                var paramDates = $routeParams.dates.split('_');
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

    function getQuery() {
        if ($routeParams && $routeParams.search && $routeParams.search !== 'none')
            return $routeParams.search;
        return '';
    }

    function getSettings() {
        var defaultSettings = { descending: true, retweets: true, exactMatch: false, caseSensitive: false };

        if (!$routeParams)
            return defaultSettings;
        if (!$routeParams.params || $routeParams.params.length !== 4)
            return defaultSettings;

        var p = $routeParams.params;
        return { descending: parse(p[0]), retweets: parse(p[1]), exactMatch: parse(p[2]), caseSensitive: parse(p[3]) };

        function parse(letter) {
            return letter === 't';
        }
    }

    function getSources(data, previous) {
        var sources = {
            'all devices': true
        };
        previous.forEach(function (item) {
            if (item) sources[item] = true;
        });
        data.forEach(function (item) {
            if (item.source) sources[item.source] = true;
        });
        return Object.keys(sources).sort()
    }

    function getTime() {
        var defaultTime = 'any time';
        if ($routeParams && $routeParams.time && times.indexOf($routeParams.time) !== -1)
            return $routeParams.time;
        return defaultTime;
    }

    function getDevice() {
        var defaultDevice = 'all devices';
        if ($routeParams && $routeParams.device && sources.indexOf($routeParams.device) !== -1)
            return $routeParams.device;
        return defaultDevice;
    }

    function timeOutOfRange(date, time) {
        var s = $filter('date')(new Date(date), 'medium', '-0400');
        if (s[s.length - 2].toLowerCase() !== time[time.length - 2].toLowerCase())
            return true;
        if (s.split(' ')[3].split(':')[0] !== time.split(':')[0])
            return true;
    }

    function updateList(resetIncrement) {

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
            if ($scope.times.time !== 'any time' && timeOutOfRange(item.created_at, $scope.times.time))
                return
            if ($scope.sources.source !== 'all devices' && item.source !== $scope.sources.source)
                return
            if (!$scope.settings.retweets && item.is_retweet)
                return;
            if (!$scope.query)
                return true;

            var text = item.text.toLowerCase();

            if (deepQuery) {

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
            }

            return exact ? regEx.test(text) : text.indexOf(query) !== -1;

        });

        $scope.matches.sort(function (a, b) {
            if ($scope.settings.descending)
                return new Date(a.created_at) < new Date(b.created_at) ? 1 : -1;
            return new Date(a.created_at) > new Date(b.created_at) ? 1 : -1;
        });

        if (resetIncrement)
            $scope.increment = 100;
        $scope.displayed = $scope.matches.slice(0, $scope.increment);

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
                    this.loaded[user][year] = results.data;
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
    esc: function (str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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
    symbolsPresent: function (str) {
        return str.indexOf('&&') !== -1 || str.indexOf('||') !== -1 || str.indexOf('~~') !== -1;
    },
    times: [
      'any time',
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
    ]
}

console.log("Goddamn Looky Loo");
