import tweepy
import json
import csv
import zipfile
import zlib
from dateutil import parser
from tweepy import TweepError
from time import sleep
from pprint import pprint

# external path for larger data archives
external_path = '/Users/brendanbrown27/Desktop/political_twitter_archive'
dir_path = '/Users/brendanbrown27/Desktop/trumper/'

compression = zipfile.ZIP_DEFLATED
fields = ["favorite_count", "source", "text", "in_reply_to_screen_name", "is_retweet", "created_at", "retweet_count", "id_str"]

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

with open(dir_path + 'api_keys.json') as f:
    keys = json.load(f)

auth = tweepy.OAuthHandler(keys['consumer_key'], keys['consumer_secret'])
auth.set_access_token(keys['access_token'], keys['access_token_secret'])
api = tweepy.API(auth)

user = 'realdonaldtrump'
user_id = 25073877
path_long = './data/realdonaldtrump/realdonaldtrump_long.json'
path_short = './data/realdonaldtrump/realdonaldtrump_short.json'
path_ids = external_path + '/realdonaldtrump/realdonaldtrump_ids.json'
path_csv = external_path + '/realdonaldtrump/realdonaldtrump.csv'
path_long_zip = external_path + '/realdonaldtrump/realdonaldtrump_long.zip'
path_short_zip = external_path + '/realdonaldtrump/realdonaldtrump_short.zip'

with open(path_long) as f:
    data = json.load(f)

data = list(sorted(data, key=lambda x: parser.parse(x['created_at']), reverse=True))
results = api.user_timeline(user_id=user_id, since_id=int(data[0]['id_str']), count=100)

print('new tweets found: {}'.format(len(results)))

if len(results):
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

    with open(path_long, 'w') as f:
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
    f = csv.writer(open(path_csv, 'w'))
    f.writerow(fields)
    for x in short_dataset:
        f.writerow([x["favorite_count"], x["source"], x["text"], x["in_reply_to_screen_name"], x["is_retweet"], x["created_at"], x["retweet_count"], x["id_str"]])

    print('Creating ZIP file for ', user)
    zf = zipfile.ZipFile(path_long_zip, mode='w')
    zf.write(path_long, compress_type=compression)
    zf.close()

    print('Creating short ZIP file for ', user)
    zf = zipfile.ZipFile(path_short_zip, mode='w')
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
        "2016": [],
        "2017": []
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
