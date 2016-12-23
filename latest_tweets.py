import tweepy
import json
import csv
import zipfile
import zlib
from dateutil import parser
from tweepy import TweepError
from time import sleep
from pprint import pprint

compression = zipfile.ZIP_DEFLATED
fields = ["favorite_count", "source", "text", "in_reply_to_screen_name", "is_retweet", "created_at", "retweet_count", "id_str"]

def is_retweet(entry):
    return 'retweeted_status' in entry.keys()

def get_source(entry):
    if '<' in entry["source"]:
        return entry["source"].split('>')[1].split('<')[0]
    else:
        return entry["source"]

with open('./data/accounts.json') as f:
    users = json.load(f)

with open('api_keys.json') as f:
    keys = json.load(f)

auth = tweepy.OAuthHandler(keys['consumer_key'], keys['consumer_secret'])
auth.set_access_token(keys['access_token'], keys['access_token_secret'])
api = tweepy.API(auth)

for user_dict in users:
    user = user_dict['account']
    user_id = user_dict['id']
    print('Getting latest for ', user)
    sleep(6)
    path = './data/{}/{}_long.json'.format(user, user)
    path_short = './data/{}/{}_short.json'.format(user, user)
    path_ids = './data/{}/{}_ids.json'.format(user, user)

    with open(path) as f:
        data = json.load(f)

    data = list(sorted(data, key=lambda x: parser.parse(x['created_at']), reverse=True))
    results = api.user_timeline(user_id=user_id, since_id=int(data[0]['id_str']), count=100)

    print('new tweets found: {}'.format(len(results)))

    if not len(results):
        continue

    for tweet in results:
        tweet_dict = dict(tweet._json)
        data.append(tweet_dict)

    print('new total: {}'.format(len(data)))

    all_ids = set()
    unique_data = []

    for tweet in data:
        if tweet["id_str"] not in all_ids:
            unique_data.append(tweet)
        all_ids.add(tweet["id_str"])

    with open(path, 'w') as f:
        json.dump(unique_data, f)

    short_dataset = []
    with open(path_short, 'w') as f:
        for entry in unique_data:
            t = {
                "created_at": entry["created_at"],
                "text": entry["text"],
                "in_reply_to_screen_name": entry["in_reply_to_screen_name"],
                "retweet_count": entry["retweet_count"],
                "favorite_count": entry["favorite_count"],
                "source": get_source(entry),
                "id_str": entry["id_str"],
                "is_retweet": is_retweet(entry)
            }
            short_dataset.append(t)
        json.dump(short_dataset, f)

    print('Creating IDs file for ', user)
    with open(path_ids, 'w') as f:
        ids = list(map(lambda x: x['id_str'], unique_data))
        json.dump(ids, f)

    print('Creating CSV file for ', user)
    f = csv.writer(open('./data/{}/{}.csv'.format(user, user), 'w'))
    f.writerow(fields)
    for x in short_dataset:
        f.writerow([x["favorite_count"], x["source"], x["text"], x["in_reply_to_screen_name"], x["is_retweet"], x["created_at"], x["retweet_count"], x["id_str"]])

    print('Creating ZIP file for ', user)
    zf = zipfile.ZipFile('./data/{}/{}_long.zip'.format(user, user), mode='w')
    zf.write(path, compress_type=compression)
    zf.close()

    print('Creating short ZIP file for ', user)
    zf = zipfile.ZipFile('./data/{}/{}_short.zip'.format(user, user), mode='w')
    zf.write(path_short, compress_type=compression)
    zf.close()

    years = {
        "2009": [],
        "2010": [],
        "2011": [],
        "2012": [],
        "2013": [],
        "2014": [],
        "2015": [],
        "2016": []
    }

    for entry in short_dataset:
        year = entry['created_at'].split(' ')[5]
        if year in ['2006', '2007', '2008']:
            year = '2009'
        years[year].append(entry)

    print('Creating year specific files for ', user)
    for year in years.keys():
        with open('./data/{}/{}.json'.format(user, year), 'w') as outfile:
            json.dump(years[year], outfile)
