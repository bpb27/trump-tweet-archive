import json
from dateutil import parser

with open('./data/accounts.json') as f:
    users = json.load(f)

for user_obj in users:

    user = user_obj['account']
    master = []

    with open('./data/{}/{}_long.json'.format(user, user)) as f:
        data = json.load(f)

    for entry in data:
        if entry['created_at'].split(' ')[5] == '2017':
            master.append(entry)

    with open('./data/2017/{}_long.json'.format(user), 'w') as outfile:
        json.dump(master, outfile)
