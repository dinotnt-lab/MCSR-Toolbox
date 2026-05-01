import requests, json

user = 'blazemind'

uuid = requests.get(f'https://mc-api.io/uuid/{user}').json()['uuid'].replace('-', '')

usermatches = []
x = requests.get(f'https://api.mcsrranked.com/users/{user}/matches?count=100&type=2').json()['data']
y = 999999999999
for i in x:
    if y > i['id']:
        y = i['id']

while True:
    usermatches.extend(x)
    print(f'fetched {len(usermatches)} matches')
    x = requests.get(f'https://api.mcsrranked.com/users/{user}/matches?count=100&type=2&before={y}').json()['data']
    if len(x) == 0:
        break
    y = 999999999999
    for i in x:
        if y > i['id']:
            y = i['id']

for i in usermatches:
    for l in i['changes']:
        if l['uuid'] == uuid:
            elochange = l['change']

    print(elochange)
    if i == 30:
        break
