import requests, json

user = 'fatchudlolcow'
print('fetching')

userdata = requests.get(f'https://api.mcsrranked.com/users/{user}').json()['data']
uuid = requests.get(f'https://api.minecraftservices.com/minecraft/profile/lookup/name/{user}').json()['id']

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

print('calculating stats')

pb = userdata['statistics']['total']['bestTime']['ranked']
if pb//60000 < 1:
    pb = f"{(pb%60000)//1000}.{pb%1000:03d}"
else:
    pb = f"{pb//60000}:{(pb%60000)//1000:02d}.{pb%1000:03d}"

wins = 0
draws = 0
decayed = 0
for i in usermatches:
    if not i['decayed']:
        if not i['result']['uuid'] == None:
            if i['result']['uuid'] == uuid:
                    wins += 1
        else:
            draws += 1
    else:
        decayed += 1

losses = len(usermatches) - wins - draws - decayed
ffs = 0
for i in usermatches:
    if not i['decayed']:
        if i['forfeited']:
            if not i['result']['uuid'] == None:
                if i['result']['uuid'] != uuid:
                    ffs += 1

times = []
for i in usermatches:
    if not i['decayed']:
        if not i['forfeited']:
            if not i['result']['uuid'] == None:
                if i['result']['uuid'] == uuid:
                    times.append(i['result']['time'])

avgmil = int(sum(times)/len(times))
if avgmil//60000 < 1:
    avg = f"{(avgmil%60000)//1000}.{avgmil%1000:03d}"
else:
    avg = f"{avgmil//60000}:{(avgmil%60000)//1000:02d}.{avgmil%1000:03d}"

print(f"Elo: {userdata['eloRate']}")
print(f"Peak Elo: {userdata['seasonResult']['highest']}")
print(f"PB: {pb}")
print(f'Average Time: {avg}')
print(f'Number of matches: {len(usermatches) - decayed}')
print(f'W/D/L: {wins}/{draws}/{losses}')
print(f'winrate: {wins/(len(usermatches) - draws - decayed) * 100:.0f}%')
print(f'ffrate: {ffs/(len(usermatches) - decayed) * 100:.1f}%')