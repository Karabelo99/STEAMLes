// ===========================
// Teams
// ===========================
const teamsList = [
  {name:"J1", division:"J"}, {name:"J2", division:"J"}, {name:"J3", division:"J"},
  {name:"J4", division:"J"}, {name:"J5", division:"J"}, {name:"J6", division:"J"}, {name:"J7", division:"J"},
  {name:"S1", division:"S"}, {name:"S2", division:"S"}, {name:"S3", division:"S"},
  {name:"S4", division:"S"}, {name:"S5", division:"S"}, {name:"S6", division:"S"}, {name:"S7", division:"S"}
];

// ===========================
// Initialize Scores
// ===========================
function initScores() {
  let scores = JSON.parse(localStorage.getItem("scores")) || {};

  teamsList.forEach(t => {
    if(!scores[t.name]){
      scores[t.name] = {
        m1_correct_seed:0,
        m1_misplaced_seed:0,
        m1_correct_water:0,
        m1_wrong_water:0,
        m2_red_correct:0,
        m2_red_wrong:0,
        m2_black_correct:0,
        m2_black_wrong:0,
        penalties:0,
        dq:false
      };
    }
  });

  localStorage.setItem("scores", JSON.stringify(scores));
}

// Call initScores immediately
initScores();

// ===========================
// Points Table
// ===========================
const points = {
  J:{
    m1_correct_seed:10, 
    m1_misplaced_seed:-5, 
    m1_correct_water:30, 
    m1_wrong_water:0,
    m2_red_correct:5, 
    m2_red_wrong:-5, 
    m2_black_correct:10, 
    m2_black_wrong:-10
  },
  S:{
    m1_correct_seed:10, 
    m1_misplaced_seed:-5, 
    m1_correct_water:30, 
    m1_wrong_water:-10,
    m2_red_correct:5, 
    m2_red_wrong:-5, 
    m2_black_correct:10, 
    m2_black_wrong:-10
  }
};

// ===========================
// Judge Submit
// ===========================
function addScore() {
  const team = document.getElementById("team").value;
  const action = document.getElementById("action").value;
  
  if(!team || !action) {
    alert("Select team and action");
    return;
  }

  let data = JSON.parse(localStorage.getItem("scores"));
  if (!data) data = {};
  
  const teamInfo = teamsList.find(t => t.name === team);
  if (!teamInfo) return;

  // Initialize team data if it doesn't exist
  if (!data[team]) {
    data[team] = {
      m1_correct_seed: 0,
      m1_misplaced_seed: 0,
      m1_correct_water: 0,
      m1_wrong_water: 0,
      m2_red_correct: 0,
      m2_red_wrong: 0,
      m2_black_correct: 0,
      m2_black_wrong: 0,
      penalties: 0,
      dq: false
    };
  }

  // Handle actions
  if (action === "dq") {
    data[team].dq = true;
    document.getElementById("status").innerText = `⛔ ${team} DISQUALIFIED`;
  } 
  else if (action === "penalty_robot" || action === "penalty_field" || 
           action === "penalty_seeds" || action === "penalty_exit") {
    data[team].penalties = (data[team].penalties || 0) + 20;
    document.getElementById("status").innerText = `⚠️ Penalty added to ${team} (-20)`;
  }
  else if (action === "clear_dq") {
    data[team].dq = false;
    document.getElementById("status").innerText = `✅ ${team} disqualification removed`;
  }
  else if (action === "reset_team") {
    data[team] = {
      m1_correct_seed: 0,
      m1_misplaced_seed: 0,
      m1_correct_water: 0,
      m1_wrong_water: 0,
      m2_red_correct: 0,
      m2_red_wrong: 0,
      m2_black_correct: 0,
      m2_black_wrong: 0,
      penalties: 0,
      dq: false
    };
    document.getElementById("status").innerText = `🔄 ${team} scores reset`;
  }
  else {
    // Regular scoring actions
    const division = teamInfo.division;
    const pointValue = points[division][action];
    data[team][action] = (data[team][action] || 0) + pointValue;
    
    // Format status message
    let actionName = action.replace(/_/g, ' ');
    let sign = pointValue > 0 ? '+' : '';
    document.getElementById("status").innerText = `${team}: ${actionName} ${sign}${pointValue}`;
  }

  localStorage.setItem("scores", JSON.stringify(data));
  
  // Clear status after 3 seconds
  setTimeout(() => {
    if (document.getElementById("status")) {
      document.getElementById("status").innerText = "";
    }
  }, 3000);
}

// ===========================
// Subtotals & Total Calculations
// ===========================
function calculateM1Subtotal(t) {
  return (t.m1_correct_seed || 0) + (t.m1_misplaced_seed || 0) + 
         (t.m1_correct_water || 0) + (t.m1_wrong_water || 0);
}

function calculateM2Subtotal(t) {
  return (t.m2_red_correct || 0) + (t.m2_red_wrong || 0) + 
         (t.m2_black_correct || 0) + (t.m2_black_wrong || 0);
}

function calculateTotal(t) {
  if (t.dq) return -9999;
  return calculateM1Subtotal(t) + calculateM2Subtotal(t) - (t.penalties || 0);
}

// ===========================
// Sorting Functions
// ===========================
function sortTeamsByTotal(teams, data) {
  return [...teams].sort((a, b) => {
    const scoreA = calculateTotal(data[a.name]);
    const scoreB = calculateTotal(data[b.name]);
    
    // DQ teams go to bottom
    if (data[a.name].dq && !data[b.name].dq) return 1;
    if (!data[a.name].dq && data[b.name].dq) return -1;
    
    // Sort by score descending
    return scoreB - scoreA;
  });
}

function sortTeamsByMission(teams, data, mission) {
  return [...teams].sort((a, b) => {
    const scoreA = mission === 1 ? calculateM1Subtotal(data[a.name]) : calculateM2Subtotal(data[a.name]);
    const scoreB = mission === 1 ? calculateM1Subtotal(data[b.name]) : calculateM2Subtotal(data[b.name]);
    
    if (data[a.name].dq && !data[b.name].dq) return 1;
    if (!data[a.name].dq && data[b.name].dq) return -1;
    
    return scoreB - scoreA;
  });
}

// ===========================
// Master Update Function
// ===========================
function updateBoard() {
  let data = JSON.parse(localStorage.getItem("scores"));
  if (!data) return;
  
  // Update all display tables
  updateJuniorCompleteTable(data);
  updateSeniorCompleteTable(data);
  updateOverallSummaryTable(data);
  updateDetailedOverallBoard(data);
  
  // Also update legacy tables if they exist
  if (document.getElementById("board-m1-j")) updateJuniorLegacyBoards(data);
}

// ===========================
// Junior Complete Table (One table for everything)
// ===========================
function updateJuniorCompleteTable(data) {
  const boardElement = document.getElementById("board-junior-complete");
  if (!boardElement) return;
  
  const juniorTeams = teamsList.filter(t => t.division === 'J');
  const sortedTeams = sortTeamsByTotal(juniorTeams, data);
  
  let html = '';
  let rank = 1;
  
  sortedTeams.forEach(t => {
    const s = data[t.name];
    if (!s) return;
    
    if (s.dq) {
      html += `<tr class="dq-row">
                <td>${rank}</td>
                <td><strong>${t.name}</strong></td>
                <td colspan="4">-</td>
                <td>-</td>
                <td colspan="4">-</td>
                <td>-</td>
                <td>-</td>
                <td><span class="dq-badge">⛔ DQ</span></td>
              </tr>`;
    } else {
      const m1Sub = calculateM1Subtotal(s);
      const m2Sub = calculateM2Subtotal(s);
      const total = calculateTotal(s);
      
      let rankClass = '';
      if (rank === 1) rankClass = 'rank-1';
      else if (rank === 2) rankClass = 'rank-2';
      else if (rank === 3) rankClass = 'rank-3';
      
      html += `<tr class="${rankClass}">
                <td><strong>${rank}</strong></td>
                <td><strong>${t.name}</strong></td>
                
                <!-- Mission 1 Details -->
                <td>${s.m1_correct_seed || 0}</td>
                <td>${s.m1_misplaced_seed || 0}</td>
                <td>${s.m1_correct_water || 0}</td>
                <td>${s.m1_wrong_water || 0}</td>
                <td class="m1-subtotal">${m1Sub}</td>
                
                <!-- Mission 2 Details -->
                <td>${s.m2_red_correct || 0}</td>
                <td>${s.m2_red_wrong || 0}</td>
                <td>${s.m2_black_correct || 0}</td>
                <td>${s.m2_black_wrong || 0}</td>
                <td class="m2-subtotal">${m2Sub}</td>
                
                <!-- Penalties and Total -->
                <td class="penalty-column">${s.penalties || 0}</td>
                <td class="total-column">${total}</td>
              </tr>`;
    }
    rank++;
  });
  
  boardElement.innerHTML = html;
}

// ===========================
// Senior Complete Table
// ===========================
function updateSeniorCompleteTable(data) {
  const boardElement = document.getElementById("board-senior-complete");
  if (!boardElement) return;
  
  const seniorTeams = teamsList.filter(t => t.division === 'S');
  const sortedTeams = sortTeamsByTotal(seniorTeams, data);
  
  let html = '';
  let rank = 1;
  
  sortedTeams.forEach(t => {
    const s = data[t.name];
    if (!s) return;
    
    if (s.dq) {
      html += `<tr class="dq-row">
                <td>${rank}</td>
                <td><strong>${t.name}</strong></td>
                <td colspan="4">-</td>
                <td>-</td>
                <td colspan="4">-</td>
                <td>-</td>
                <td>-</td>
                <td><span class="dq-badge">⛔ DQ</span></td>
              </tr>`;
    } else {
      const m1Sub = calculateM1Subtotal(s);
      const m2Sub = calculateM2Subtotal(s);
      const total = calculateTotal(s);
      
      let rankClass = '';
      if (rank === 1) rankClass = 'rank-1';
      else if (rank === 2) rankClass = 'rank-2';
      else if (rank === 3) rankClass = 'rank-3';
      
      html += `<tr class="${rankClass}">
                <td><strong>${rank}</strong></td>
                <td><strong>${t.name}</strong></td>
                
                <!-- Mission 1 Details -->
                <td>${s.m1_correct_seed || 0}</td>
                <td>${s.m1_misplaced_seed || 0}</td>
                <td>${s.m1_correct_water || 0}</td>
                <td>${s.m1_wrong_water || 0}</td>
                <td class="m1-subtotal-senior">${m1Sub}</td>
                
                <!-- Mission 2 Details -->
                <td>${s.m2_red_correct || 0}</td>
                <td>${s.m2_red_wrong || 0}</td>
                <td>${s.m2_black_correct || 0}</td>
                <td>${s.m2_black_wrong || 0}</td>
                <td class="m2-subtotal-senior">${m2Sub}</td>
                
                <!-- Penalties and Total -->
                <td class="penalty-column">${s.penalties || 0}</td>
                <td class="total-column">${total}</td>
              </tr>`;
    }
    rank++;
  });
  
  boardElement.innerHTML = html;
}

// ===========================
// Overall Summary Table
// ===========================
function updateOverallSummaryTable(data) {
  const boardElement = document.getElementById("board-overall-summary");
  if (!boardElement) return;
  
  const sortedTeams = sortTeamsByTotal(teamsList, data);
  
  let html = '';
  let rank = 1;
  
  sortedTeams.forEach(t => {
    const s = data[t.name];
    if (!s) return;
    
    if (s.dq) {
      html += `<tr class="dq-row">
                <td>${rank}</td>
                <td><strong>${t.name}</strong></td>
                <td>${t.division}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td class="dq-text">DQ</td>
                <td>⛔</td>
              </tr>`;
    } else {
      const m1Sub = calculateM1Subtotal(s);
      const m2Sub = calculateM2Subtotal(s);
      const total = calculateTotal(s);
      
      let rankClass = '';
      if (rank === 1) rankClass = 'rank-1';
      else if (rank === 2) rankClass = 'rank-2';
      else if (rank === 3) rankClass = 'rank-3';
      
      html += `<tr class="${rankClass}">
                <td><strong>${rank}</strong></td>
                <td><strong>${t.name}</strong></td>
                <td>${t.division}</td>
                <td>${m1Sub}</td>
                <td>${m2Sub}</td>
                <td>${s.penalties || 0}</td>
                <td class="total-column">${total}</td>
                <td>✅</td>
              </tr>`;
    }
    rank++;
  });
  
  boardElement.innerHTML = html;
}

// ===========================
// Detailed Overall Board
// ===========================
function updateDetailedOverallBoard(data) {
  const boardElement = document.getElementById("board-all-detailed");
  if (!boardElement) return;
  
  const sortedTeams = sortTeamsByTotal(teamsList, data);
  
  let html = '';
  let rank = 1;
  
  sortedTeams.forEach(t => {
    const s = data[t.name];
    if (!s) return;
    
    if (s.dq) {
      html += `<tr class="dq-row">
                <td>${rank}</td>
                <td>${t.name}</td>
                <td>${t.division}</td>
                <td colspan="12" class="dq-text"><strong>⛔ DISQUALIFIED</strong></td>
               </tr>`;
    } else {
      html += `<tr>
                <td>${rank}</td>
                <td><strong>${t.name}</strong></td>
                <td>${t.division}</td>
                <td>${s.m1_correct_seed || 0}</td>
                <td>${s.m1_misplaced_seed || 0}</td>
                <td>${s.m1_correct_water || 0}</td>
                <td>${s.m1_wrong_water || 0}</td>
                <td class="m1-subtotal">${calculateM1Subtotal(s)}</td>
                <td>${s.m2_red_correct || 0}</td>
                <td>${s.m2_red_wrong || 0}</td>
                <td>${s.m2_black_correct || 0}</td>
                <td>${s.m2_black_wrong || 0}</td>
                <td class="m2-subtotal">${calculateM2Subtotal(s)}</td>
                <td class="penalty-column">${s.penalties || 0}</td>
                <td class="total-column">${calculateTotal(s)}</td>
               </tr>`;
    }
    rank++;
  });

  boardElement.innerHTML = html;
}

// ===========================
// Legacy Support for older displays
// ===========================
function updateJuniorLegacyBoards(data) {
  const juniorTeams = teamsList.filter(t => t.division === 'J');
  
  // Mission 1 Board
  const m1Board = document.getElementById("board-m1-j");
  if (m1Board) {
    const sortedJ1 = sortTeamsByMission(juniorTeams, data, 1);
    let html = '';
    let rank = 1;
    
    sortedJ1.forEach(t => {
      const s = data[t.name];
      if (s.dq) {
        html += `<tr class="dq-row"><td colspan="7">${t.name} - DQ</td></tr>`;
      } else {
        html += `<tr><td>${rank}</td><td>${t.name}</td>
                <td>${s.m1_correct_seed || 0}</td>
                <td>${s.m1_misplaced_seed || 0}</td>
                <td>${s.m1_correct_water || 0}</td>
                <td>${s.m1_wrong_water || 0}</td>
                <td>${calculateM1Subtotal(s)}</td></tr>`;
      }
      rank++;
    });
    m1Board.innerHTML = html;
  }
}

// ===========================
// Reset All Scores
// ===========================
function resetAllScores() {
  if (confirm("⚠️ WARNING: This will reset ALL scores for ALL teams. Are you sure?")) {
    localStorage.removeItem("scores");
    initScores();
    updateBoard();
    if (document.getElementById("status")) {
      document.getElementById("status").innerText = "🔄 All scores have been reset";
      setTimeout(() => {
        if (document.getElementById("status")) {
          document.getElementById("status").innerText = "";
        }
      }, 3000);
    }
  }
}

// ===========================
// Export Data
// ===========================
function exportScores() {
  let data = JSON.parse(localStorage.getItem("scores"));
  let csvContent = "Team,Division,Status,M1 Seed Corr,M1 Seed Mis,M1 Water Corr,M1 Water Wrong,M1 Subtotal,M2 Red Corr,M2 Red Wrong,M2 Black Corr,M2 Black Wrong,M2 Subtotal,Penalties,Total\n";
  
  teamsList.forEach(t => {
    const s = data[t.name];
    if (!s) return;
    
    let row = [
      t.name,
      t.division,
      s.dq ? "DQ" : "Active",
      s.m1_correct_seed || 0,
      s.m1_misplaced_seed || 0,
      s.m1_correct_water || 0,
      s.m1_wrong_water || 0,
      calculateM1Subtotal(s),
      s.m2_red_correct || 0,
      s.m2_red_wrong || 0,
      s.m2_black_correct || 0,
      s.m2_black_wrong || 0,
      calculateM2Subtotal(s),
      s.penalties || 0,
      calculateTotal(s)
    ];
    csvContent += row.join(",") + "\n";
  });
  
  let blob = new Blob([csvContent], { type: 'text/csv' });
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = `scoreboard_export_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ===========================
// Auto-refresh
// ===========================
setInterval(updateBoard, 1000);

// Initialize on load
window.addEventListener('load', function() {
  initScores();
  updateBoard();
});