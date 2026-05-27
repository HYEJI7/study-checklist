
const STORAGE_KEY = "study-checklist-v2";

const users = ["혜지", "도윤", "선영"];

const days = ["mon","tue","wed","thu","fri","sat","sun"];

let state = loadState();

let currentUser = state.currentUser || users[0];

function defaultState(){

  const data = {};

  users.forEach(user=>{
    data[user] = {
      monthGoal:"",
      goals:[]
    };
  });

  return {
    currentUser:users[0],
    weekStart:"",
    weekEnd:"",
    data
  };
}

function loadState(){

  const saved = localStorage.getItem(STORAGE_KEY);

  if(!saved){
    return defaultState();
  }

  return JSON.parse(saved);
}

function saveState(){

  state.currentUser = currentUser;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

function renderTabs(){

  const tabs = document.getElementById("tabs");

  tabs.innerHTML = "";

  users.forEach(user=>{

    const btn = document.createElement("button");

    btn.className =
      "tab" +
      (user === currentUser ? " active" : "");

    btn.textContent = user;

    btn.onclick = ()=>{

      currentUser = user;

      saveState();

      render();
    };

    tabs.appendChild(btn);
  });
}

function render(){

  renderTabs();

  const userData = state.data[currentUser];

  document.getElementById("currentUserLabel").textContent =
    currentUser;

  document.getElementById("monthGoalInput").value =
    userData.monthGoal;

  document.getElementById("monthGoalView").textContent =
    userData.monthGoal || "아직 입력된 목표가 없어요.";

  document.getElementById("goalBody").innerHTML = "";

  if(userData.goals.length === 0){

    document.getElementById("goalBody").innerHTML =
      '<tr><td colspan="13">목표를 추가해줘!</td></tr>';

    return;
  }

  userData.goals.forEach((goal,index)=>{

    const total =
      days.filter(day=>goal.checks[day] === "O").length;

    const rate =
      Math.min(
        Math.round((total / goal.target) * 100),
        100
      );

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="left">${goal.category}</td>
      <td class="left">${goal.name}</td>

      ${days.map(day=>{

        const value = goal.checks[day] || "";

        let cls = "";

        if(value === "O") cls = "ok";
        if(value === "X") cls = "no";

        return `
          <td
            class="check ${cls}"
            onclick="toggleCheck(${index}, '${day}')">
            ${value}
          </td>
        `;
      }).join("")}

      <td>${total}</td>
      <td>${goal.target}</td>

      <td class="${rate >= 80 ? "rate-good" : "rate-bad"}">
        ${rate}%
      </td>

      <td>
        <button class="danger"
          onclick="deleteGoal(${index})">
          삭제
        </button>
      </td>
    `;

    document.getElementById("goalBody").appendChild(tr);
  });
}

function saveMonthGoal(){

  state.data[currentUser].monthGoal =
    document.getElementById("monthGoalInput").value;

  saveState();

  render();
}

function applyWeek(){

  state.weekStart =
    document.getElementById("weekStart").value;

  state.weekEnd =
    document.getElementById("weekEnd").value;

  saveState();

  render();
}

function addGoal(){

  const category =
    document.getElementById("categoryInput").value;

  const name =
    document.getElementById("goalInput").value;

  const target =
    Number(document.getElementById("targetInput").value);

  if(!category || !name || !target){

    alert("값을 입력해줘!");

    return;
  }

  state.data[currentUser].goals.push({
    category,
    name,
    target,
    checks:{
      mon:"",
      tue:"",
      wed:"",
      thu:"",
      fri:"",
      sat:"",
      sun:""
    }
  });

  saveState();

  render();

  document.getElementById("categoryInput").value = "";
  document.getElementById("goalInput").value = "";
}

function toggleCheck(index,day){

  const checks =
    state.data[currentUser].goals[index].checks;

  const current = checks[day];

  if(current === ""){
    checks[day] = "O";
  }
  else if(current === "O"){
    checks[day] = "X";
  }
  else{
    checks[day] = "";
  }

  saveState();

  render();
}

function deleteGoal(index){

  state.data[currentUser].goals.splice(index,1);

  saveState();

  render();
}

function resetCurrentUser(){

  state.data[currentUser] = {
    monthGoal:"",
    goals:[]
  };

  saveState();

  render();
}

render();
