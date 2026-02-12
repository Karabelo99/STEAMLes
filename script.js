// ===========================
// Teams
// ===========================
const teamsList = [
  {name:"Raiders", division:"J"},
  {name:"Youngs", division:"S"},
  {name:"Robo Sparks", division:"J"},
  {name:"Iron Kids", division:"J"},
  {name:"Alpha Tech", division:"S"}
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
function addScore(){
  const team = document.getElementById("team").value;
  const action = document.getElementById("action").value;

  if(!team || !action) return alert("Select team and action");

  let data = JSON.parse(localStorage.getItem("scores"));
  const teamInfo = teamsList.find(t=>t.name===team);

  if(action === "dq"){
    data[team].dq = true;
    localStorage.setItem("scores",JSON.stringify(data));
    return;
  }

  if(action.startsWith("penalty")){
    data[team].penalties += 20;
  }
  else{
    let value = points[teamInfo.division][action];
    data[team][action] += value;
  }

  localStorage.setItem("scores",JSON.stringify(data));
  document.getElementById("status").innerText = "Score Updated ✅";
}

// ===========================
// Subtotals
// ===========================
function calculateM1Subtotal(t){
  return t.m1_correct_seed + t.m1_misplaced_seed + t.m1_correct_water + t.m1_wrong_water;
}

function calculateM2Subtotal(t){
  return t.m2_red_correct + t.m2_red_wrong + t.m2_black_correct + t.m2_black_wrong;
}

// ===========================
// Total
// ===========================
function calculateTotal(t){
  return calculateM1Subtotal(t) + calculateM2Subtotal(t) - t.penalties;
}

// ===========================
// Update Board
// ===========================
function updateBoard(){
  let data = JSON.parse(localStorage.getItem("scores"));
  if(!data) return;

  let arr = teamsList.map(t=>{
    let s = data[t.name];
    let total = s.dq ? -9999 : calculateTotal(s);
    return {...s,name:t.name,division:t.division,total};
  });

  arr.sort((a,b)=>b.total-a.total);

  // Mission 1 Table
  let htmlM1 = "";
  arr.forEach((t,i)=>{
    if(t.dq){
      htmlM1+=`<tr style="background:red;color:white"><td>${i+1}</td><td>${t.name}</td><td colspan="5">DISQUALIFIED</td><td>-</td></tr>`;
      return;
    }
    htmlM1+=`<tr>
      <td>${i+1}</td>
      <td>${t.name}</td>
      <td>${t.division}</td>
      <td>${t.m1_correct_seed}</td>
      <td>${t.m1_misplaced_seed}</td>
      <td>${t.m1_correct_water}</td>
      <td>${t.m1_wrong_water}</td>
      <td>${calculateM1Subtotal(t)}</td>
    </tr>`;
  });
  document.getElementById("board-m1").innerHTML = htmlM1;

  // Mission 2 Table
  let htmlM2 = "";
  arr.forEach((t,i)=>{
    if(t.dq){
      htmlM2+=`<tr style="background:red;color:white"><td>${i+1}</td><td>${t.name}</td><td colspan="6">DISQUALIFIED</td><td>-</td></tr>`;
      return;
    }
    htmlM2+=`<tr>
      <td>${i+1}</td>
      <td>${t.name}</td>
      <td>${t.division}</td>
      <td>${t.m2_red_correct}</td>
      <td>${t.m2_red_wrong}</td>
      <td>${t.m2_black_correct}</td>
      <td>${t.m2_black_wrong}</td>
      <td>${calculateM2Subtotal(t)}</td>
    </tr>`;
  });
  document.getElementById("board-m2").innerHTML = htmlM2;

  // Total Table
  let htmlTotal = "";
  arr.forEach((t,i)=>{
    if(t.dq){
      htmlTotal+=`<tr style="background:red;color:white"><td>${i+1}</td><td>${t.name}</td><td colspan="4">DISQUALIFIED</td></tr>`;
      return;
    }
    htmlTotal+=`<tr>
      <td>${i+1}</td>
      <td>${t.name}</td>
      <td>${t.division}</td>
      <td>${calculateM1Subtotal(t)}</td>
      <td>${calculateM2Subtotal(t)}</td>
      <td>-${t.penalties}</td>
      <td>${t.total}</td>
    </tr>`;
  });
  document.getElementById("board-total").innerHTML = htmlTotal;
}

// Auto Refresh
if(document.getElementById("board-m1")){
  setInterval(updateBoard,1000);
  updateBoard();
}

// ===========================
// 2-Minute Stopwatch for Display Panel
// ===========================
let timeLeft = 2 * 60; // 2 minutes
let timerInterval = null;

function formatTime(t){
  let m = Math.floor(t/60).toString().padStart(2,'0');
  let s = (t%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function updateTimerDisplay(){
  const timerEl = document.getElementById("timer");
  if(!timerEl) return;

  if(timeLeft <= 0){
    timerEl.innerText = "00:00";
    timerEl.style.color = "red"; // show time up
  } else {
    timerEl.innerText = formatTime(timeLeft);
    timerEl.style.color = "green";
  }
}

function startTimer(){
  clearInterval(timerInterval);
  timeLeft = 2*60; // reset to 2 minutes
  updateTimerDisplay();

  timerInterval = setInterval(()=>{
    timeLeft--;
    if(timeLeft <= 0){
      clearInterval(timerInterval);
      updateTimerDisplay();
      alert("Time's up!");
      return;
    }
    updateTimerDisplay();
  }, 1000);
}

function resetTimer(){
  clearInterval(timerInterval);
  timeLeft = 2*60;
  updateTimerDisplay();
}
