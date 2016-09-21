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
        .when("/archive/:search", {
            templateUrl: "archive.html"
        })
        .when("/archive/:search/:params", {
            templateUrl: "archive.html"
        })
        .when("/archive/:search/:params/:dates", {
            templateUrl: "archive.html"
        })
        .when("/highlights", {
            templateUrl: "highlights.html"
        })
        .when("/highlights/birtherism", {
            templateUrl: "birtherism.html"
        })
        .when("/highlights/women", {
            templateUrl: "women.html"
        })
        .when("/highlights/retaliation", {
            templateUrl: "retaliation.html"
        })
        .otherwise({
            templateUrl: "highlights.html"
        });
});


app.controller('tweetPanelCtrl', ['TweetService', function (TweetService) {
    document.querySelector('body').scrollTop = 0;
    TweetService.transform();
}]);


app.controller('highlightsCtrl', ['$scope', '$http', '$routeParams', 'TweetService', function ($scope, $http, $routeParams, TweetService) {

    $scope.media = [];
    $scope.showingReasons = false;
    $scope.showingQuicklinks = false;

    $scope.toggleQuicklinks = function () {
        $scope.showingQuicklinks = !$scope.showingQuicklinks;
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
    })

}]);


app.controller('archiveCtrl', ['$scope', '$http', '$timeout', '$sce', '$routeParams', 'TweetService', function ($scope, $http, $timeout, $sce, $routeParams, TweetService) {

    $scope.all = [];
    $scope.dateRange = getDateRange();
    $scope.loaded = [];
    $scope.increment = 100;
    $scope.query = getQuery();
    $scope.settings = getSettings();
    $scope.showModal = false;

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
        prompt('Copy text below (PC: ctrl + c) (Mac: cmd + c)', 'http://www.trumptwitterarchive.com/#/archive/' + encodeURI($scope.query) + createParams());
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
			'dateRange.end'
		], function () {
        updateList();
    });


    requestTweets(years()); // kick off


    function createParams() {
        var params = '/';
        $scope.settings.descending ? params += 't' : params += 'f';
        $scope.settings.retweets ? params += 't' : params += 'f';
        $scope.settings.exactMatch ? params += 't' : params += 'f';
        $scope.settings.caseSensitive ? params += 't' : params += 'f';
        params += parseDateRange();
        return params;
    }

    function getDateRange() {
        var defaultDates = { start: null, end: null };
        if ($routeParams && $routeParams.dates) {
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
        return $routeParams && $routeParams.search || '';
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

    function parseDateRange() {
        var str = '/' + parseDate($scope.dateRange.start) + '_' + parseDate($scope.dateRange.end);
        return str.length === 2 ? '' : str;

        function parseDate(d) {
            return !d ? '' : [d.getMonth() + 1, d.getDate(), d.getFullYear()].join('-');
        }
    }

    function requestTweets(years) {
        years.forEach(function (year) {
            var url = '/data/' + year + '.json';
            TweetService.load(url, year, function (data) {
                $scope.all = $scope.all.concat(data);
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

    function updateList(resetIncrement) {

        var query = $scope.settings.caseSensitive ? $scope.query : $scope.query.toLowerCase();

        $scope.matches = $scope.all.filter(function (item) {

            if ($scope.dateRange.start && new Date(item.date) < $scope.dateRange.start)
                return;
            if ($scope.dateRange.end && new Date(item.date) > $scope.dateRange.end)
                return;
            if (!$scope.settings.retweets && item.retweet)
                return;
            if (!$scope.query)
                return true;

            var text = $scope.settings.caseSensitive ? (item.date + ' ' + item.text) : (item.date + ' ' + item.text).toLowerCase();

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
                return new Date(a.date) < new Date(b.date) ? 1 : -1;
            return new Date(a.date) > new Date(b.date) ? 1 : -1;
        });

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


app.filter('highlight', function ($sce) {
    return function (tweet, phrase) {
        if (phrase)
            return $sce.trustAsHtml(spanDate(tweet.date) + (tweet.text).replace(new RegExp('(' + esc(phrase) + ')', 'gi'), '<span class="highlighted">$1</span>') + tweetLink(tweet.id));
        return $sce.trustAsHtml(spanDate(tweet.date) + tweet.text + tweetLink(tweet.id));
    }
});


app.service('TweetService', ['$http', '$timeout', function ($http, $timeout) {

    this.loaded = {};

    this.load = function (url, year, successHandler, errorHandler) {
        if (this.loaded[year]) {
            successHandler(this.loaded[year]);
        } else {
            $http.get(url).then(function (results) {
                this.loaded[year] = results.data;
                successHandler(results.data);
            }.bind(this), errorHandler);
        }
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


function spanDate(d) {
    return '<span class="tweet-date">' + d + '</span>';
}


function tweetLink(id) {
    return '<a href="https://twitter.com/realDonaldTrump/status/' + id + '" target="_blank">↗</a>';
}

console.log("Whoa there, Carla Console-Checker")
