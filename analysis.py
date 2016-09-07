import json
import re
from pprint import pprint

words = dict()
years = ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016']

for year in years:
    with open('./formatted/{}.json'.format(year)) as json_data:
        full_dataset = json.load(json_data)
        # coauthor_hash = dict()
        for entry in full_dataset:
            for word in entry['text'].split(' '):
                transformed = re.sub(r'[^\w\s]', '', word.lower())
                if words.get(transformed):
                    words[transformed] += 1
                else:
                    words[transformed] = 1

top = list()
for word in words:
    if words[word] > 20:
        top.append({"term": word, "value": words[word]})

sorted_top = list(sorted(top, key=lambda k: k['value']))
with open('analysis.json', 'w') as outfile:
    json.dump(sorted_top, outfile)

    # for entry in full_dataset:
    #     for author in entry['AU']:
    #         if coauthor_hash.get(author):
    #             coauthor_hash[author] += entry['AU']
    #         else:
    #             coauthor_hash[author] = entry['AU']
    #
    # for author in coauthor_hash:
    #     new_list = list(sorted(set(coauthor_hash[author])))
    #     new_list = [coauthor for coauthor in new_list if coauthor != author]
    #     coauthor_hash[author] = new_list
    #
    # pprint(coauthor_hash)
    #
    # with open('coauthor_network.json', 'w') as outfile:
    #     json.dump(coauthor_hash, outfile)
