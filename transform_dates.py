import json
import re
from pprint import pprint

year = '2016'
full_dataset = []

def properDate (d):
    if len(d) == 1:
        d = '0'
    return d.replace(',', '')

with open('./data/{}.json'.format(year)) as json_data:
    full_dataset = json.load(json_data)
    for entry in full_dataset:
        if not entry['date'][0].isdigit():
            s = entry['date'].lstrip().rstrip().split(' ')
            entry['date'] = '{} {} {}'.format(properDate(s[1]), s[0], s[2])
        if entry['text'].startswith('"@') and ':' in entry['text'].lstrip().split(' ')[0]:
            entry['retweet'] = True
        else:
            entry['retweet'] = False

with open('./data/{}.json'.format(year), 'w') as outfile:
    json.dump(full_dataset, outfile)
