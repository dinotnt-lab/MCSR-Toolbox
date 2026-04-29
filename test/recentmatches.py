import requests, json

user = 'dinotnt_'

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

matches = []

for i in range(len(usermatches)):
    if usermatches[i]['decayed']:
        continue
    time = usermatches[i]['result']['time']
    time = f"{time//60000}:{(time%60000)//1000:02d}.{time%1000:03d}"
    state = 'Loss'
    elochange = -1
    for l in usermatches[i]['changes']:
        if l['uuid'] == uuid:
            elochange = l['change']
    if elochange == 0:
        state = 'Draw'
    if usermatches[i]['result']['uuid'] == uuid:
        state = 'Win'
        
    print(f" {time} | {state} | {elochange}")
    if i == 6:
        break

