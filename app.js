var input = document.getElementById("playerName");

input.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("goButton").click();
  }
});

async function go() {
    const user = document.getElementById("playerName").value;
    const status = document.getElementById("status");

    const rankEl = document.getElementById("rank");
    const peakEl = document.getElementById("peak");
    const pbEl = document.getElementById("pb");
    const avgEl = document.getElementById("avg");
    const wdlEl = document.getElementById("wdl");
    const winrateEl = document.getElementById("winrate");
    const ffrateEl = document.getElementById("ffrate");

    if (!user) {
        alert("Please enter a player name.");
        return;
    }

    try {
        status.textContent = 'Fetching user...';

        const userdataResp = await fetch(`https://api.mcsrranked.com/users/${user}`);
        const userdataJson = await userdataResp.json();
        const userdata = userdataJson.data;
    
        rankEl.textContent = `Elo: ${userdata.eloRate}`;
        peakEl.textContent = `Peak Elo: ${userdata.seasonResult.highest}`;

        let pb = userdata.statistics.total.bestTime.ranked;
        if (Math.floor(pb / 60000) < 1) {
            pb = `${Math.floor((pb % 60000) / 1000)}.${(pb % 1000).toString().padStart(3, '0')}`;
        } else {
            pb = `${Math.floor(pb / 60000)}:${Math.floor((pb % 60000) / 1000).toString().padStart(2, '0')}.${(pb % 1000).toString().padStart(3, '0')}`;
        }

        pbEl.textContent = `PB: ${pb}`;

        status.textContent = 'Fetching UUID...';

        const uuidResp = await fetch(`https://mc-api.io/uuid/${user}`);
        const uuidJson = await uuidResp.json();
        const uuid = uuidJson.uuid.replace(/-/g, '');

        status.textContent = 'Fetching matches...';

        let usermatches = [];

        let resp = await fetch(`https://api.mcsrranked.com/users/${user}/matches?count=100&type=2`);
        let json = await resp.json();
        let x = json.data;

        let y = Number.MAX_SAFE_INTEGER;
        for (const i of x) {
            if (y > i.id) y = i.id;
        }

        while (true) {
            usermatches.push(...x);
            status.textContent = `Fetched ${usermatches.length} matches`;

            const nextResp = await fetch(`https://api.mcsrranked.com/users/${user}/matches?count=100&type=2&before=${y}`);
            const nextJson = await nextResp.json();
            x = nextJson.data;

            if (x.length === 0) break;

            y = Number.MAX_SAFE_INTEGER;
            for (const i of x) {
                if (y > i.id) y = i.id;
            }
        }

        status.textContent = 'Calculating...';

        let wins = 0;
        let draws = 0;
        let decayed = 0;
        let ffs = 0;
        let times = [];

        for (const i of usermatches) {
            if (i.decayed) {
                decayed++;
                continue;
            }

            if (i.result.uuid === null) {
                draws++;
            } else if (i.result.uuid === uuid) {
                wins++;
                if (!i.forfeited) times.push(i.result.time);
            } else if (i.forfeited) {
                ffs++;
            }
        }

        const losses = usermatches.length - wins - draws - decayed;

        wdlEl.textContent = `W/D/L: ${wins} / ${draws} / ${losses}`;

        const played = usermatches.length - draws - decayed;
        winrateEl.textContent = `Winrate: ${(wins / played * 100).toFixed(0)}%`;

        ffrateEl.textContent = `FF Rate: ${(ffs / (usermatches.length - decayed) * 100).toFixed(1)}%`;

        if (times.length > 0) {
            const avgmil = Math.floor(times.reduce((a, b) => a + b, 0) / times.length);

            let avg;
            if (Math.floor(avgmil / 60000) < 1) {
                avg = `${Math.floor((avgmil % 60000) / 1000)}.${(avgmil % 1000).toString().padStart(3, '0')}`;
            } else {
                avg = `${Math.floor(avgmil / 60000)}:${Math.floor((avgmil % 60000) / 1000).toString().padStart(2, '0')}.${(avgmil % 1000).toString().padStart(3, '0')}`;
            }

            avgEl.textContent = `Average: ${avg}`;
        } else {
            avgEl.textContent = `Average: N/A`;
        }

        status.textContent = 'Done';

    } catch (error) {
        alert("Error fetching data: " + error);
        status.textContent = 'Error';
    }
}