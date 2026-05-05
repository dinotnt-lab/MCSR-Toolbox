var longtime = false;

async function getcurrentseason() {
    const currentseasonresp = await fetch('https://api.mcsrranked.com/leaderboard');
    const currentseasonjson = await currentseasonresp.json();
    const currentseason = currentseasonjson.data.season.number;

    season = currentseason;
    numberInput.value = season;
    numberInput.max = season;

    return currentseason;
}

var season = 11;
var numberInput = document.getElementById("seasonInput");
var input = document.getElementById("playerName");

numberInput.addEventListener('input', function () {
    season = Number(numberInput.value);
    console.log("Season set to " + season);
});

input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("goButton").click();
    }
});

function formatTime(time) {
    if (Math.floor(time / 60000) < 1) {
        return `${Math.floor((time % 60000) / 1000)}.${(time % 1000).toString().padStart(3, '0')}`;
    }
    return `${Math.floor(time / 60000)}:${Math.floor((time % 60000) / 1000).toString().padStart(2, '0')}.${(time % 1000).toString().padStart(3, '0')}`;
}

function setMatchTable(matches) {
    const tbody = document.querySelector("#matchTable tbody");
    tbody.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        const row = document.createElement("tr");

        if (i < matches.length) {
            const match = matches[i];

            const timeCell = document.createElement("td");
            const stateCell = document.createElement("td");
            const eloCell = document.createElement("td");

            timeCell.textContent = match.time;
            stateCell.textContent = match.state;
            if (match.elochange > 0) {
                eloCell.style.color = "lime";
            } else if (match.elochange === 0) {
                eloCell.style.color = "lightblue";
            } else {
                eloCell.style.color = "rgb(255, 0,0)";
            }
            eloCell.textContent = match.elochange > 0 ? `+${match.elochange}` : `${match.elochange}`;

            row.appendChild(timeCell);
            row.appendChild(stateCell);
            row.appendChild(eloCell);
        } else {
            row.innerHTML = "<td>-</td><td>-</td><td>-</td>";
        }

        tbody.appendChild(row);
    }
}

async function toggleTimeFormat() {
    longtime = !longtime;
    const button = document.getElementById("toggleTimeFormat");
    button.textContent = longtime ? "Long" : "Short";
    go();
}

async function go() {
    const user = document.getElementById("playerName").value.trim();
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

        const userdataResp = await fetch(`https://api.mcsrranked.com/users/${user}?season=${season}`);
        const userdataJson = await userdataResp.json();
        const userdata = userdataJson.data;

        rankEl.textContent = `Elo: ${userdata.eloRate}`;
        peakEl.textContent = `Peak Elo: ${userdata.seasonResult.highest}`;

        let pb = userdata.statistics.total.bestTime.ranked;
        pbEl.textContent = `PB: ${formatTime(pb)}`;

        function formatdate(timestamp) {
            const d = new Date(timestamp * 1000);

            const pad = n => n.toString().padStart(2, '0');

            let day = pad(d.getDate());
            let month = pad(d.getMonth() + 1);
            let year = d.getFullYear().toString().slice(-2);
            if (longtime) {
                let hours = d.getHours();
                const minutes = pad(d.getMinutes());

                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;

                return `${day}/${month}/${year} ${pad(hours)}:${minutes} ${ampm}`;
            } else {
                return `${day}/${month}/${year}`;
            }
        }

        const lstq = userdata.timestamp.lastRanked;
        if (lstq) {
            document.getElementById("lstq").textContent = `Last Q: ${formatdate(lstq)}`;
        }

        const lston = userdata.timestamp.lastOnline;
        if (lston) {
            document.getElementById("lston").textContent = `Last Online: ${formatdate(lston)}`;
        }

        status.textContent = 'Fetching UUID...';

        const uuidResp = await fetch(`https://mc-api.io/uuid/${user}`);
        const uuidJson = await uuidResp.json();
        const uuid = uuidJson.uuid.replace(/-/g, '');

        status.textContent = 'Fetching matches...';

        let usermatches = [];

        let resp = await fetch(`https://api.mcsrranked.com/users/${user}/matches?count=100&type=2&season=${season}`);
        let json = await resp.json();
        let x = json.data;

        if (x.length === 0) {
            status.textContent = `No matches found for season ${season}`;
            setMatchTable([]);
            return;
        }

        let y = Number.MAX_SAFE_INTEGER;
        for (const i of x) {
            if (y > i.id) y = i.id;
        }

        while (true) {
            usermatches.push(...x);
            status.textContent = `Fetched ${usermatches.length} matches`;

            const nextResp = await fetch(`https://api.mcsrranked.com/users/${user}/matches?count=100&type=2&before=${y}&season=${season}`);
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
        let matchRows = [];

        for (const i of usermatches) {
            if (i.decayed) {
                decayed++;
                continue;
            }

            let state = 'Loss';
            let elochange = -1;

            for (const l of i.changes) {
                if (l.uuid === uuid) {
                    elochange = l.change;
                }
            }

            if (i.result.uuid == null) {state = 'Draw'; draws++};


            if (i.result.uuid === uuid) {
                state = 'Win';
                wins++;
                if (!i.forfeited) times.push(i.result.time);
            } else if (state !== 'Draw') {
                if (i.forfeited) ffs++;
            }

            matchRows.push({
                time: formatTime(i.result.time),
                state: state,
                elochange: elochange
            });

            if (matchRows.length === 6) break;
        }

        const losses = usermatches.length - wins - draws - decayed;

        wdlEl.textContent = `W/D/L: ${wins} / ${draws} / ${losses}`;

        const played = usermatches.length - draws - decayed;
        if (played > 0) {
            winrateEl.textContent = `Winrate: ${(wins / played * 100).toFixed(0)}%`;
        } else {
            winrateEl.textContent = `Winrate: 0%`;
        }

        const nonDecayed = usermatches.length - decayed;
        if (nonDecayed > 0) {
            ffrateEl.textContent = `FF Rate: ${(ffs / nonDecayed * 100).toFixed(1)}%`;
        } else {
            ffrateEl.textContent = `FF Rate: 0.0%`;
        }

        if (times.length > 0) {
            const avgmil = Math.floor(times.reduce((a, b) => a + b, 0) / times.length);
            avgEl.textContent = `Average: ${formatTime(avgmil)}`;
        } else {
            avgEl.textContent = `Average: N/A`;
        }

        status.textContent = 'Setting table...';
        setMatchTable(matchRows);
        status.textContent = 'Drawing graph...';
        drawEloGraph(usermatches, uuid, userdata.eloRate);
        status.textContent = 'success';
        setInterval(() => {
            if (status.textContent === 'success') {
                status.textContent = '-';
            }
        }, 3000);

    } catch (error) {
        alert("Error fetching data: " + error);
        status.textContent = 'Error';
    }
}

function drawEloGraph(matches, uuid, currentElo) {

    const canvas = document.getElementById('eloCanvas');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let changes = [];

    for (const match of matches) {
        for (const l of match.changes) {
            if (l.uuid === uuid && l.change != null) {
                changes.push(l.change);
                console.log(`Match ${match.id}: Elo change ${l.change}`);
            }
        }
    }

    if (changes.length === 0) return;

    //changes.reverse();

    let eloValues = [currentElo];
    for (const change of changes) {
        eloValues.push(eloValues[eloValues.length - 1] - change);
    }
    eloValues.reverse();

    let min = Math.min(...eloValues);
    let max = Math.max(...eloValues);

    if (max === min) {
        max += 1;
        min -= 1;
    }

    const padding = 10;
    const graphHeight = canvas.height - padding * 2;
    const graphWidth = canvas.width - padding * 2;
    const xStep = graphWidth / (eloValues.length - 1);
    const bottomY = canvas.height - padding;

    function yForElo(elo) {
        const normalized = (elo - min) / (max - min);
        return canvas.height - padding - normalized * graphHeight;
    }

    function getRankColor(elo, alpha = 1) {
        if (elo < 600) return `rgba(56, 56, 56,${alpha})`;
        if (elo < 900) return `rgba(150, 150, 150,${alpha})`;
        if (elo < 1200) return `rgba(255,215,0,${alpha})`;
        if (elo < 1500) return `rgba(133, 245, 64,${alpha})`;
        if (elo < 2000) return `rgba(60, 250, 221,${alpha})`;
        return `rgba(155, 60, 250,${alpha})`;
    }

    const bounds = [600, 900, 1200, 1500, 2000];

    function splitSegment(e1, e2) {
        let points = [{ t: 0, elo: e1 }, { t: 1, elo: e2 }];

        for (const b of bounds) {
            if ((e1 < b && e2 > b) || (e1 > b && e2 < b)) {
                const t = (b - e1) / (e2 - e1);
                points.push({ t, elo: b });
            }
        }

        points.sort((a, b) => a.t - b.t);
        return points;
    }

    // fill areas (50% opacity)
    for (let i = 1; i < eloValues.length; i++) {

        const e1 = eloValues[i - 1];
        const e2 = eloValues[i];

        const x1 = padding + (i - 1) * xStep;
        const x2 = padding + i * xStep;

        const segments = splitSegment(e1, e2);

        for (let j = 1; j < segments.length; j++) {

            const s1 = segments[j - 1];
            const s2 = segments[j];

            const sx1 = x1 + (x2 - x1) * s1.t;
            const sx2 = x1 + (x2 - x1) * s2.t;

            const sy1 = yForElo(s1.elo);
            const sy2 = yForElo(s2.elo);

            const midElo = (s1.elo + s2.elo) / 2;

            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
            ctx.lineTo(sx2, bottomY);
            ctx.lineTo(sx1, bottomY);
            ctx.closePath();

            ctx.fillStyle = getRankColor(midElo, 0.25);
            ctx.fill();
        }
    }

    // draw colored line (solid)
    for (let i = 1; i < eloValues.length; i++) {

        const e1 = eloValues[i - 1];
        const e2 = eloValues[i];

        const x1 = padding + (i - 1) * xStep;
        const x2 = padding + i * xStep;

        const segments = splitSegment(e1, e2);

        for (let j = 1; j < segments.length; j++) {

            const s1 = segments[j - 1];
            const s2 = segments[j];

            const sx1 = x1 + (x2 - x1) * s1.t;
            const sx2 = x1 + (x2 - x1) * s2.t;

            const sy1 = yForElo(s1.elo);
            const sy2 = yForElo(s2.elo);

            const midElo = (s1.elo + s2.elo) / 2;

            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);

            ctx.strokeStyle = getRankColor(midElo, 1);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

getcurrentseason();

// Settings menu behavior: toggle, close on outside click, keyboard support
(() => {
    const settingsButton = document.getElementById('settingsButton');
    const settingsMenu = document.getElementById('settingsMenu');

    if (!settingsButton || !settingsMenu) return;

    function openMenu() {
        settingsMenu.classList.remove('hidden');
        settingsButton.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
        settingsMenu.classList.add('hidden');
        settingsButton.setAttribute('aria-expanded', 'false');
    }

    settingsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = settingsButton.getAttribute('aria-expanded') === 'true';
        if (expanded) closeMenu(); else openMenu();
    });

    // close when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsMenu.contains(e.target) && e.target !== settingsButton) {
            closeMenu();
        }
    });

    // keyboard support: Esc to close, Enter/Space on button to toggle
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });

    settingsMenu.addEventListener('click', (e) => {
        // keep menu open when interacting with inputs, but stop propagation so document click doesn't close immediately
        e.stopPropagation();
    });
})();
function saveChecklistState() {
    const state = {};
    document.querySelectorAll('#checklistContainer input[type="checkbox"]').forEach(cb => {
        state[cb.id] = cb.checked;
    });
    localStorage.setItem('checklistState', JSON.stringify(state));
}

function loadChecklistState() {
    const state = JSON.parse(localStorage.getItem('checklistState') || "{}");

    document.querySelectorAll('#checklistContainer input[type="checkbox"]').forEach(cb => {
        cb.checked = !!state[cb.id];
        cb.addEventListener("change", saveChecklistState);
    });
}

loadChecklistState();