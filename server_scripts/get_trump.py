#!/usr/bin/python

import tweepy
import json
import sys
import logging
from dateutil import parser
from time import gmtime, strftime
from tweepy import TweepError
from time import sleep

path_to_api_keys = '/home/brendanbrown27/python_stuff/api_keys.json'
path_to_log = '/home/brendanbrown27/python_stuff/you_devil.log'
path_to_master = '/home/brendanbrown27/python_stuff/realdonaldtrump_long.json'
path_to_year_file = '/home/brendanbrown27/public_html/data/realdonaldtrump/2017.json'

def is_retweet(entry):
    if entry['text'][0:2] == '"@' and entry['text'].split(' ')[0][-1] == ':':
        return True
    else:
        return 'retweeted_status' in entry.keys()

def get_source(entry):
    if '<' in entry["source"]:
        return entry["source"].split('>')[1].split('<')[0]
    else:
        return entry["source"]

with open(path_to_api_keys) as f:
    keys = json.load(f)

with open(path_to_year_file) as f:
    current_year_data = json.load(f)

logging.basicConfig(filename=path_to_log,level=logging.INFO)
auth = tweepy.OAuthHandler(keys['consumer_key'], keys['consumer_secret'])
auth.set_access_token(keys['access_token'], keys['access_token_secret'])
api = tweepy.API(auth)
user = 'realdonaldtrump'
user_id = 25073877
latest_tweet = list(sorted(current_year_data, key=lambda x: parser.parse(x['created_at']), reverse=True))[0]['id_str']
results = api.user_timeline(user_id=user_id, since_id=int(latest_tweet), count=100)
logging.info(strftime("%Y-%m-%d %H:%M:%S", gmtime()) + ': ' + str(len(results)) + ' tweets found')

if len(results):

    with open(path_to_master) as f:
        data = json.load(f)

    for tweet in results:
        tweet_dict = dict(tweet._json)
        data.append(tweet_dict)
        t = {
            "created_at": tweet_dict["created_at"],
            "text": tweet_dict["text"],
            "source": get_source(tweet_dict),
            "id_str": tweet_dict["id_str"],
            "is_retweet": is_retweet(tweet_dict)
        }
        current_year_data.append(t)

    with open(path_to_master, 'w') as f:
        json.dump(data, f)

    with open(path_to_year_file, 'w') as outfile:
        unique_data = list(map(lambda x: json.loads(x), set(map(lambda x: json.dumps(x), current_year_data))))
        json.dump(unique_data, outfile)
