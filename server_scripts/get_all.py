#!/usr/bin/python

import tweepy
import json
import sys
import logging
from dateutil import parser
from time import gmtime, strftime
from tweepy import TweepError
from time import sleep

path_to_accounts = '/home/brendanbrown27/public_html/data/accounts.json'
path_to_api_keys = '/home/brendanbrown27/python_stuff/api_keys.json'
path_to_log = '/home/brendanbrown27/python_stuff/all_accounts.log'

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

with open(path_to_accounts) as f:
    all_accounts = json.load(f)
    users = list(filter(lambda x: not x['inactive'], all_accounts))

logging.basicConfig(filename=path_to_log,level=logging.INFO)
auth = tweepy.OAuthHandler(keys['consumer_key'], keys['consumer_secret'])
auth.set_access_token(keys['access_token'], keys['access_token_secret'])
api = tweepy.API(auth)

for user_obj in users:

    if user_obj['account'] == 'realdonaldtrump':
        continue

    sleep(5)

    user = user_obj['account']
    user_id = user_obj['id']
    path_to_master = '/home/brendanbrown27/python_stuff/data/' + user + '_long.json'
    path_to_year_file = '/home/brendanbrown27/public_html/data/' + user + '/2017.json'

    with open(path_to_master) as f:
        data = json.load(f)

    data = list(sorted(data, key=lambda x: parser.parse(x['created_at']), reverse=True))

    if not len(data):
        continue

    try:
        results = api.user_timeline(user_id=user_id, since_id=int(data[0]['id_str']), count=100)
    except TweepError as e:
        logging.info('Error: ' + e)
        continue

    logging.info(strftime("%Y-%m-%d %H:%M:%S", gmtime()) + ': ' + str(len(results)) + ' tweets found for ' + user)

    if not len(results):
        continue

    all_ids = set()
    unique_data = []
    short_dataset = []

    for tweet in results:
        tweet_dict = dict(tweet._json)
        data.append(tweet_dict)

    for tweet in data:
        if tweet['id_str'] not in all_ids:
            unique_data.append(tweet)
        all_ids.add(tweet['id_str'])

    with open(path_to_master, 'w') as f:
        json.dump(unique_data, f)

    for entry in unique_data:
        if entry['created_at'].split(' ')[5] == '2017':
            t = {
                "created_at": entry["created_at"],
                "text": entry["text"],
                "source": get_source(entry),
                "id_str": entry["id_str"],
                "is_retweet": is_retweet(entry)
            }
            short_dataset.append(t)

    with open(path_to_year_file, 'w') as outfile:
        json.dump(short_dataset, outfile)
