
const SUPABASE_URL = "https://ytlgamkgqsmswsbawndp.supabase.co";
const SUPABASE_KEY = "sb_publishable_CadAafBrDt9m4E4umtZY3Q_QBgg1E0N";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const users = ["혜지", "민영", "지은"];
const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

let currentUser = users[0];
let goals = [];
let monthGoals = {};

document.addEventListener("DOMContentLoaded", async () => {
  renderTabs();
  await loadAll();
  listenRealtime();
});

async function loadAll() {
  await loadGoals();
  await loadMonthGoals();
  render();
}

async function loadGoals() {
  const { data, error } = await db
    .from("study_goals")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    alert("목표 불러오기 실패: " + error.message);
    return;
  }

  goals = data || [];
}

async function loadMonthGoals() {
  const { data, error } = await db
    .from("month_goals")
    .select("*");

  if (error) {
    console.warn("월간 목표 테이블이 아직 없을 수 있어요:", error.message);
    monthGoals = {};
    return;
  }

  monthGoals = {};
  (data || []).forEach(row => {
    monthGoals[row.user_name] = row.goal_text || "";
  });
}

function listenRealtime() {
  db.channel("study-checklist-change")
    .on("postgres_changes", { event: "*", schema: "public", table: "study_goals" }, loadAll)
    .on("postgres_changes", { event: "*", schema: "public", table: "month_goals" }, loadAll)
    .subscribe();
}

function renderTabs() {
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = "";

  users.forEach(user => {
    const btn = document.createElement("button");
    btn.className = "tab" + (user === currentUser ? " active" : "");
    btn.textContent = user;

    btn.onclick = () => {
      currentUser = user;
      renderTabs();
      render();
    };

    tabs.appendChild(btn);
  });
}

function render() {
  document.getElementById("currentUserLabel").textContent = currentUser;
  document.getElementById("tableTitle").textContent = currentUser + " 체크리스트";

  const goalText = monthGoals[currentUser] || "";
  document.getElementById("monthGoalInput").value = goalText;
  document.getElementById("monthGoalView").textContent =
    goalText || "아직 입력된 목표가 없어요.";

  const userGoals = goals.filter(goal => goal.user_name === currentUser);
  const body = document.getElementById("goalBody");
  body.innerHTML = "";

  if (userGoals.length === 0) {
    body.innerHTML = '<tr><td colspan="13" class="muted">목표를 추가해줘!</td></tr>';
    return;
  }

  userGoals.forEach(goal => {
    const total = days.filter(day => goal[day] === "O").length;
    const target = Number(goal.target_count || 0);
    const rate = target > 0 ? Math.min(Math.round((total / target) * 100), 100) : 0;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="left">${escapeHtml(goal.category || "")}</td>
      <td class="left">${escapeHtml(goal.goal_name || "")}</td>
      ${days.map(day => {
        const value = goal[day] || "";
        const cls = value === "O" ? "ok" : value === "X" ? "no" : "";
        return `<td class="check ${cls}" onclick="toggleCheck(${goal.id}, '${day}')">${value}</td>`;
      }).join("")}
      <td>${total}</td>
      <td>${target}</td>
      <td class="${rate >= 80 ? "rate-good" : "rate-bad"}">${rate}%</td>
      <td><button class="danger" onclick="deleteGoal(${goal.id})">삭제</button></td>
    `;

    body.appendChild(tr);
  });
}

async function saveMonthGoal() {
  const text = document.getElementById("monthGoalInput").value.trim();

  const { error } = await db
    .from("month_goals")
    .upsert({
      user_name: currentUser,
      goal_text: text
    }, {
      onConflict: "user_name"
    });

  if (error) {
    alert("월간 목표 저장 실패: " + error.message);
    return;
  }

  await loadAll();
}

async function addGoal() {
  const category = document.getElementById("categoryInput").value.trim();
  const goalName = document.getElementById("goalInput").value.trim();
  const target = Number(document.getElementById("targetInput").value);

  if (!category || !goalName || !target) {
    alert("카테고리, 목표/습관, 주 목표 횟수를 입력해줘!");
    return;
  }

  const { error } = await db
    .from("study_goals")
    .insert({
      user_name: currentUser,
      category: category,
      goal_name: goalName,
      mon: "",
      tue: "",
      wed: "",
      thu: "",
      fri: "",
      sat: "",
      sun: "",
      target_count: target
    });

  if (error) {
    alert("목표 추가 실패: " + error.message);
    return;
  }

  document.getElementById("categoryInput").value = "";
  document.getElementById("goalInput").value = "";
  document.getElementById("targetInput").value = "3";

  await loadAll();
}

async function toggleCheck(id, day) {
  const goal = goals.find(item => item.id === id);
  if (!goal) return;

  const current = goal[day] || "";
  const next = current === "" ? "O" : current === "O" ? "X" : "";

  const updateData = {};
  updateData[day] = next;

  const { error } = await db
    .from("study_goals")
    .update(updateData)
    .eq("id", id);

  if (error) {
    alert("체크 저장 실패: " + error.message);
    return;
  }

  await loadAll();
}

async function deleteGoal(id) {
  if (!confirm("이 목표를 삭제할까?")) return;

  const { error } = await db
    .from("study_goals")
    .delete()
    .eq("id", id);

  if (error) {
    alert("삭제 실패: " + error.message);
    return;
  }

  await loadAll();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}
