import tweepy
import json
import os
from tweepy import TweepError
from time import sleep
from pprint import pprint

api_keys_filepath = '/Users/brendanbrown27/Desktop/trumper/api_keys.json'
current_year_filepath = '/Users/brendanbrown27/Desktop/trumper/data/realdonaldtrump/2016.json'

with open(api_keys_filepath) as f:
    keys = json.load(f)

auth = tweepy.OAuthHandler(keys['consumer_key'], keys['consumer_secret'])
auth.set_access_token(keys['access_token'], keys['access_token_secret'])
api = tweepy.API(auth)

all_data = []

with open(current_year_filepath) as f:
    data = json.load(f)
    all_data += data

total = len(all_data)
results = api.user_timeline(user_id=25073877, since_id=int(all_data[0]['id_str']), count=100)

for tweet in results:
    tweet_dict = dict(tweet._json)
    if tweet_dict['user']['screen_name'].lower() != 'realdonaldtrump':
        tweet_dict['text'] = 'RT ' + tweet_dict['text']
    del tweet_dict['user']
    del tweet_dict['entities']
    all_data.append(tweet_dict)

full_dataset = []
all_ids = set()

def mt(str):
    if str[0:3] == 'RT ':
        return True
    return str[0:2] == '"@' and str.split(' ')[0][-1] == ':'

def src(entry):
    try:
        if '<' in entry["source"]:
            return entry["source"].split('>')[1].split('<')[0]
        else:
            return entry["source"]
    except KeyError:
        print("KeyError", entry)
        return "Unknown"
    except IndexError:
        print("IndexError", entry)

def place(entry):
    try:
        if entry["place"]:
            return entry["place"]["full_name"]
        return False
    except KeyError:
        return False

def gp(entry, prop):
    try:
        return entry[prop]
    except KeyError:
        return False

for entry in all_data:
    t = {
        "created_at": gp(entry, "created_at"),
        "text": gp(entry, "text"),
        "in_reply_to_screen_name": gp(entry, "in_reply_to_screen_name"),
        "retweet_count": gp(entry, "retweet_count"),
        "favorite_count": gp(entry, "favorite_count"),
        "source": src(entry),
        "place": gp(entry, "place"),
        "id_str": gp(entry, "id_str"),
        "manual_retweet": mt(entry["text"])
    }

    if t["id_str"] not in all_ids:
        full_dataset.append(t)
    all_ids.add(t["id_str"])

with open(current_year_filepath, 'w') as f:
    json.dump(full_dataset, f)

total_added = len(all_ids) - total
print("Added {}".format(total_added))
