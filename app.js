var app = angular.module('myApp', ['ngRoute']);

app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "highlights.html"
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
        .when("/highlights", {
            templateUrl: "highlights.html"
        })
        .when("/highlights/:template", {
            templateUrl: function (urlattr) {
                return urlattr.template + '.html';
            }
        })
        .otherwise({
            templateUrl: "highlights.html"
        });
});


app.controller('tweetPanelCtrl', ['TweetService', function (TweetService) {
    document.querySelector('body').scrollTop = 0;
    TweetService.transform();
}]);


app.controller('highlightsCtrl', ['$scope', '$http', 'TweetService', function ($scope, $http, TweetService) {

    $scope.accounts = [];
    $scope.media = [];
    $scope.showingReasons = false;
    $scope.showingQuicklinks = false;

    $scope.showUrlToPage = function ($event) {
        prompt('Copy text below (PC: ctrl + c) (Mac: cmd + c)', 'http://www.trumptwitterarchive.com/#/highlights#' + $event.srcElement.parentElement.id);
    }

    $scope.toggleArchives = function () {
        $scope.showingArchives = !$scope.showingArchives;
        $scope.showingQuicklinks = false;
    }

    $scope.toggleQuicklinks = function () {
        $scope.showingQuicklinks = !$scope.showingQuicklinks;
        $scope.showingArchives = false;
    }

    $scope.toggleReasons = function () {
        $scope.showingReasons = !$scope.showingReasons;
    }

    TweetService.transform();

    $http.get('/data/media.json').then(function (results) {
        results.data.map(function (item) {
            item.date = new Date(item.date);
        });
        $scope.media = results.data;
    });

    TweetService.getAccounts(function (accounts) {
        $scope.accounts = accounts;
    });

}]);


app.controller('archiveCtrl', ['$scope', '$http', '$timeout', '$sce', '$routeParams', '$filter', 'TweetService', function ($scope, $http, $timeout, $sce, $routeParams, $filter, TweetService) {

    $scope.account = 'realdonaldtrump'
    $scope.all = [];
    $scope.dateRange = getDateRange();
    $scope.loaded = [];
    $scope.increment = 100;
    $scope.query = getQuery();
    $scope.settings = getSettings();
    $scope.showModal = false;
    $scope.sources = {
        source: getDevice(),
        options: []
    };
    $scope.times = {
        time: getTime(),
        options: times
    };

    $scope.loadMore = function () {
        $scope.increment += 100;
    }

    $scope.removeDatesModal = function () {
        $scope.showModal = false;
    }

    $scope.retryUrl = function (item) {
        requestTweets([item.year]);
    }

    $scope.showUrlToPage = function () {
        var paramString = encodeURI(createParams());
        if ($scope.account === 'realDonaldTrump')
            prompt('Copy text below (PC: ctrl + c) (Mac: cmd + c)', 'http://www.trumptwitterarchive.com/#/archive/' + paramString);
        else
            prompt('Copy text below (PC: ctrl + c) (Mac: cmd + c)', 'http://www.trumptwitterarchive.com/#/archive/account/' + $scope.account + '/' + paramString);
    }

    $scope.$watch('query', function () {
        var query = $scope.query;
        $scope.showModal = false;
        $timeout(function () {
            if (query === $scope.query) {
                updateList(true);
            }
        }, 120);
    });

    $scope.$watchGroup([
			'increment',
			'settings.descending',
			'settings.retweets',
			'settings.caseSensitive',
			'settings.exactMatch',
			'dateRange.start',
			'dateRange.end',
      'times.time',
      'sources.source'
		], function () {
        updateList();
    });


    requestTweets(years()); // kick off


    function createParams() {
        var params = ($scope.query || 'none') + '/';
        $scope.settings.descending ? params += 't' : params += 'f';
        $scope.settings.retweets ? params += 't' : params += 'f';
        $scope.settings.exactMatch ? params += 't' : params += 'f';
        $scope.settings.caseSensitive ? params += 't' : params += 'f';
        params += parseDateRange();

        if ($scope.times.time === 'any time' && $scope.sources.source === 'all devices')
            return params;
        else if (parseDateRange())
            return params + '/' + $scope.times.time + '/' + $scope.sources.source;
        else
            return params + '/none/' + $scope.times.time + '/' + $scope.sources.source;
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

    function getSources(data) {
        var sources = {};
        data.forEach(function (item) {
            sources[item.source] = true;
        });
        return Object.keys(sources).concat('all devices').sort()
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

    function parseDateRange() {
        var str = '/' + parseDate($scope.dateRange.start) + '_' + parseDate($scope.dateRange.end);
        return str.length === 2 ? '' : str;

        function parseDate(d) {
            return !d ? '' : [d.getMonth() + 1, d.getDate(), d.getFullYear()].join('-');
        }
    }

    function requestTweets(years) {
        if ($routeParams && $routeParams.account)
            $scope.account = $routeParams.account

        years.forEach(function (year) {
            var url = '/data/' + $scope.account + '/' + year + '.json';
            TweetService.load($scope.account, url, year, function (data) {
                $scope.all = $scope.all.concat(data);
                $scope.sources.options = getSources(data);
                $scope.increment += 1;
                $scope.showModal = true;
                $scope.loaded = removeExisting(url, $scope.loaded).concat({ year: year, url: url, status: 'success' });
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

    function timeOutOfRange(date, time) {
        var s = $filter('date')(new Date(date), 'medium', '-0400');
        if (s[s.length - 2].toLowerCase() !== time[time.length - 2].toLowerCase())
            return true;
        if (s.split(' ')[3].split(':')[0] !== time.split(':')[0])
            return true;
    }

    function updateList(resetIncrement) {

        var query = $scope.settings.caseSensitive ? $scope.query : $scope.query.toLowerCase();

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

            var text = $scope.settings.caseSensitive ? item.text : item.text.toLowerCase();

            if ($scope.settings.exactMatch) {
                return text.split(' ').map(function (word) {
                    return word.replace(/\W/g, '')
                }).indexOf(query) !== -1;
            } else {
                return text.indexOf(query) !== -1;
            }

        });

        $scope.matches.sort(function (a, b) {
            if ($scope.settings.descending)
                return new Date(a.created_at) < new Date(b.created_at) ? 1 : -1;
            return new Date(a.created_at) > new Date(b.created_at) ? 1 : -1;
        });

        if ($scope.matches.length < 400)
            console.log($scope.matches)

        if (resetIncrement)
            $scope.increment = 100;
        $scope.displayed = $scope.matches.slice(0, $scope.increment);

    }

    function years() {
        return [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016];
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
    return function (tweet, phrase) {
        if (phrase)
            return $sce.trustAsHtml((tweet.text).replace(new RegExp('(' + esc(phrase) + ')', 'gi'), '<span class="highlighted">$1</span>'));
        return $sce.trustAsHtml(tweet.text);
    }
});

app.filter('dateformat', function ($sce, $filter) {
    return function (tweet) {
        return $sce.trustAsHtml($filter('date')(new Date(tweet.created_at), 'medium', '-0400'));
    }
});


app.service('TweetService', ['$http', '$timeout', function ($http, $timeout) {

    this.accounts = [];
    this.loaded = {};

    this.getAccounts = function (successHandler) {
        if (this.accounts.length) {
            return successHandler(this.accounts);
        } else {
            $http.get('./accounts.json').then(function (results) {
                this.accounts = results.data;
                successHandler(results.data);
            }.bind(this));
        }
    }

    this.load = function (user, url, year, successHandler, errorHandler) {

        this.getAccounts(function (accounts) {
            var linkedAccount = findLinkedAccount(user, accounts);

            if (!Object.keys(this.loaded).length) {
                accounts.forEach(function (account) {
                    this.loaded[account.account] = {};
                }.bind(this));
            }

            if (linkedAccount) {
                var linked = linkedAccount.account;
                var linkedUrl = url.replace(user, linked);
                if (this.loaded[user][year] && this.loaded[linked][year]) {
                    successHandler(this.loaded[user][year].concat(this.loaded[linked][year]));
                } else {
                    $http.get(url).then(function (results) {
                        this.loaded[user][year] = results.data;
                        $http.get(linkedUrl).then(function (secondResults) {
                            this.loaded[linked][year] = secondResults.data;
                            successHandler(results.data.concat(secondResults.data));
                        }.bind(this), errorHandler);
                    }.bind(this), errorHandler);
                }
            } else if (this.loaded[user][year]) {
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
            if (window.twttr && window.twttr.widgets && window.twttr.widgets.load)
                window.twttr.widgets.load();
            else if (attempts) {
                attempts -= 1;
                $timeout(transformTweets, 100);
            }
        }
    }

}]);


function esc(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function findAccount(name, accounts) {
    return accounts.filter(function (item) {
        return item.account === name;
    })[0];
}

function findLinkedAccount(name, accounts) {
    return accounts.filter(function (item) {
        return item.linked.indexOf(name) !== -1;
    })[0];
}

function spanDate(d) {
    console.log(d);
    return '<span class="tweet-date">' + d + '</span>';
}


function tweetLink(id) {
    return '<a href="https://twitter.com/realDonaldTrump/status/' + id + '" target="_blank">↗</a>';
}

// var accounts = [
//     { account: "agscottpruitt", name: "Scott Pruitt", title: "Environmental Protection Agency", linked: ['scottpruittok'] },
//     { account: "donaldjtrumpjr", name: "Donald Trump Jr.", title: "son", linked: [] },
//     { account: "erictrump", name: "Eric Trump", title: "son", linked: [] },
//     { account: "genflynn", name: "Michael Flynn", title: "National Security Advisor", linked: [] },
//     { account: "ivankatrump", name: "Ivanka Trump", title: "daughter", linked: [] },
//     { account: "realbencarson", name: "Ben Carson", title: "Housing and Urban Development", linked: [] },
//     { account: "realdonaldtrump", name: "Donald Trump", title: "President", linked: [] },
//     { account: "reptomprice", name: "Tom Price", title: "Health and Human Services", linked: [] },
//     { account: "scottpruittok", name: "Scott Pruitt", title: "Environmental Protection Agency", linked: ['agscottpruitt'] },
//     { account: "seanhannity", name: "Sean Hannity", title: "conservative commentator", linked: [] },
//     { account: "sheriffclarke", name: "David A. Clarke", title: "sheriff / conservative personality", linked: [] },
//     { account: "stephenbannon", name: "Stephen Bannon", title: "Senior Advisor", linked: [] }
// ];

var times = [
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
];

console.log("Whoa there, Carla Console-Checker")

// function onlyUnique(value, index, self) {
//     if (self.indexOf(value) !== index) {
//         console.log(value);
//         return false;
//     } else {
//         return true;
//     }
// }
//
// function uniqueProps(data) {
//     var hash = {
//         "account": [],
//         "name": [],
//         "title": [],
//         "id": []
//     };
//     var fields = Object.keys(hash);
//     data.forEach(function (item) {
//         fields.forEach(function (field) {
//             hash[field].push(item[field])
//         });
//     });
//
//     fields.forEach(function (field) {
//         hash[field].filter(onlyUnique);
//     });
//     console.log(hash);
// }
