var input = document.getElementById("playerName");

input.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("goButton").click();
  }
});

async function go() {
    const playerName = document.getElementById("playerName").value;

    if (!playerName) {
        alert("Please enter a player name.");
        return;
    }

    try {
        const userResponse = await fetch(`https://api.mcsrranked.com/users/${playerName}`);
        const matchResponse = await fetch(`https://api.mcsrranked.com/users/${playerName}/matches`);

        var userdata = await userResponse.json();
        userdata = userdata.data;
        var usermatches = await matchResponse.json();
        usermatches = usermatches.data;
        
        const elo = userdata?.eloRate;
        const peakelo = userdata?.seasonResult?.highest;
        var pb = userdata?.statistics?.total?.bestTime?.ranked;
        pb = pb ? new Date(pb).toISOString().substring(11, 23) : "N/A";
        

        console.log(elo, peakelo, pb);

    } catch (error) {
        alert("Error fetching data:", error);
    }
}