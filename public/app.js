var app = angular.module('myApp', ['ngRoute']);

app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "archive.html"
        })
        .when("/archive", {
            templateUrl: "archive.html"
        })
        .when("/archive/:search", {
            templateUrl: "archive.html"
        })
        .when("/highlights", {
            templateUrl: "highlights.html"
        })
        .otherwise({
            templateUrl: "archive.html"
        });
});

app.controller('highlightsCtrl', ['$timeout', function ($timeout) {

    $timeout(transformTweets, 500);

    function transformTweets() {
        if (window.twttr && window.twttr.widgets)
            window.twttr.widgets.load();
        else
            $timeout(transformTweets, 500);
    }

}]);

app.controller('archiveCtrl', ['$scope', '$http', '$sce', '$routeParams', function ($scope, $http, $sce, $routeParams) {

    $scope.all = [];
    $scope.dateRange = { start: null, end: null };
    $scope.loaded = [];
    $scope.increment = 100;
    $scope.query = $routeParams && $routeParams.search || '';
    $scope.settings = { descending: true, caseSensitive: false, exactMatch: false };
    $scope.showModal = false;

    $scope.loadMore = function () {
        $scope.increment += 100;
    }

    $scope.log = function (tweet) {
        console.log('<li><a href="https://twitter.com/realDonaldTrump/status/' + tweet.id + '">"' + tweet.text + '"</a></li>');
    }

    $scope.removeDatesModal = function () {
        $scope.showModal = false;
    }

    $scope.retryUrl = function (item) {
        requestTweets(item);
    }

    $scope.$watch('query', function () {
        updateList(true);
        checkForWarning();
    });

    $scope.$watchGroup([
			'increment',
			'settings.descending',
			'settings.caseSensitive',
			'settings.exactMatch',
			'dateRange.start',
			'dateRange.end'
		], function () {
        updateList();
        checkForWarning();
    });

    dataMap().forEach(function (item) {
        requestTweets(item);
    });

    function checkForWarning() {
        if ($scope.settings.exactMatch && $scope.query.split(' ').length > 1)
            $scope.warning = '(exact match searches for a single word)';
        else
            $scope.warning = '';
    }

    function dataMap() {
        return [
            { "year": 2016, "url": "/bins/1v0jv", "months": "jan-dec" },
            { "year": 2015, "url": "/bins/25qcr", "months": "jul-dec" },
            { "year": 2015, "url": "/bins/4llxn", "months": "jan-jul" },
            { "year": 2014, "url": "/bins/3gvvv", "months": "jan-dec" },
            { "year": 2013, "url": "/bins/17ni3", "months": "jul-dec" },
            { "year": 2013, "url": "/bins/3nj2z", "months": "jan-jul" },
            { "year": 2012, "url": "/bins/1xdff", "months": "jan-dec" },
            { "year": 2011, "url": "/bins/4yom3", "months": "jan-dec" },
            { "year": 2010, "url": "/bins/3tykb", "months": "jan-dec" },
            { "year": 2009, "url": "/bins/3ao4b", "months": "jan-dec" }
      ];
    }

    function requestTweets(item) {

        $http.get(addHostname(item.url)).then(function (results) {
            $scope.all = $scope.all.concat(results.data);
            $scope.increment += 1;
            $scope.showModal = true;
            $scope.loaded = removeExisting(item.url, $scope.loaded).concat({
                year: item.year,
                months: item.months,
                url: item.url,
                status: 'success'
            });
        }, function (error) {
            $scope.loaded = removeExisting(item.url, $scope.loaded).concat({
                year: item.year,
                months: item.months,
                url: item.url,
                status: 'failure'
            });
        });

        function removeExisting(url, items) {
            return items.filter(function (item) {
                return item.url !== url;
            });
        }

        function addHostname(url) {
            return location.hostname === 'localhost' ? url : 'https://api.myjson.com' + url;
        }
    }

    function updateList(resetIncrement) {

        var query = $scope.settings.caseSensitive ? $scope.query : $scope.query.toLowerCase();

        $scope.matches = $scope.all.filter(function (item) {

            if ($scope.dateRange.start && new Date(item.date) < $scope.dateRange.start)
                return;
            if ($scope.dateRange.end && new Date(item.date) > $scope.dateRange.end)
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

}]);

app.filter('highlight', function ($sce) {
    return function (tweet, phrase, exact) {
        if (phrase)
            return $sce.trustAsHtml(spanDate(tweet.date) + (tweet.text).replace(new RegExp('(' + esc(phrase) + ')', 'gi'), '<span class="highlighted">$1</span>') + tweetLink(tweet.id));
        return $sce.trustAsHtml(spanDate(tweet.date) + tweet.text + tweetLink(tweet.id));
    }
});

app.directive('whenScrolled', function () {
    return function (scope, elm, attr) {
        var raw = elm[0];
        elm.bind('scroll', function () {
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight)
                scope.$apply(attr.whenScrolled);
        });
    };
});

function esc(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function spanDate(d) {
    return '<span class="tweet-date">' + d + '</span>';
}

function tweetLink(id) {
    return '<a href="https://twitter.com/realDonaldTrump/status/' + id + '" target="_blank">↗</a>';
}
