let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function playSound(id) {
  document.getElementById(id).play();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
  const input = document.getElementById("taskInput");
  const date = document.getElementById("dueDate").value;
  const time = document.getElementById("dueTime").value;
  const cat = document.getElementById("category").value;
  const priority = document.getElementById("priority").value;
  const repeat = document.getElementById("repeat").value;
  const imgFile = document.getElementById("imgInput")?.files[0];

  if (!input.value.trim()) return;

  const task = {
    text: input.value.trim(),
    date,
    time,
    cat,
    priority,
    repeat,
    img: imgFile ? URL.createObjectURL(imgFile) : null,
    done: false,
    created: new Date().toISOString()
  };

  tasks.push(task);
  input.value = "";
  document.getElementById("imgInput")?.value = "";
  saveTasks();
  displayTasks();
  playSound("ding");
  scheduleReminder(task);
}

function toggleCalendarView() {
  const container = document.getElementById("calendarContainer");
  container.style.display = container.style.display === "none" ? "block" : "none";
  renderCalendarView();
}

function renderCalendarView() {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";

  const grouped = {};
  tasks.forEach(task => {
    if (!grouped[task.date]) grouped[task.date] = [];
    grouped[task.date].push(task);
  });

  for (const date in grouped) {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${date}</strong><ul>${grouped[date].map(t => `<li>${t.text}</li>`).join("")}</ul>`;
    div.style.border = "1px solid #aaa";
    div.style.margin = "5px";
    div.style.padding = "5px";
    container.appendChild(div);
  }
}

function displayTasks(filter = "all") {
  const list = document.getElementById("taskList");
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  list.innerHTML = "";

  const filtered = tasks
    .filter(task => {
      if (filter === "completed") return task.done;
      if (filter === "pending") return !task.done;
      return true;
    })
    .filter(task => task.text.toLowerCase().includes(search));

  filtered.forEach((task, i) => {
    const li = document.createElement("li");
    li.classList.add("task-animate-in");
    li.className = `${task.done ? "completed" : ""} priority-${task.priority.toLowerCase()}`;

    li.innerHTML = `
      <span onclick="toggleTask(${i})" style="cursor:pointer;">
        ${task.done ? '✅' : '⬜'} ${task.text} (${task.date}) [${task.cat}] <strong>[${task.priority}]</strong>
      </span>
      ${task.img ? `<br><img src="${task.img}" alt="Task Image" />` : ""}
      ${task.repeat !== 'none' ? `<br><small>🔁 ${task.repeat}</small>` : ""}
      <button onclick="deleteTask(${i})">❌</button>
    `;
    list.appendChild(li);
  });
  updateStats();
}

function toggleTask(i) {
  tasks[i].done = !tasks[i].done;
  playSound("complete");

  if (tasks[i].done && tasks[i].repeat !== "none") {
    const next = getNextDate(tasks[i].date, tasks[i].repeat);
    if (next) {
      tasks.push({ ...tasks[i], done: false, date: next });
    }
  }

  saveTasks();
  displayTasks();
}

function deleteTask(i) {
  const taskItem = document.querySelectorAll("#taskList li")[i];
  if (taskItem) {
    taskItem.classList.add("task-animate-out");
    setTimeout(() => {
      tasks.splice(i, 1);
      playSound("delete");
      displayTasks();
    }, 300);
  }
}

function clearAll() {
  tasks = [];
  saveTasks();
  displayTasks();
}

function exportTasks(type) {
  const data = type === "json"
    ? JSON.stringify(tasks, null, 2)
    : tasks.map(t => `${t.text} - ${t.date} - ${t.cat} - ${t.priority}`).join("\n");
  const blob = new Blob([data], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `tasks.${type}`;
  a.click();
}

function filterTasks(type) {
  displayTasks(type);
}

document.getElementById("searchInput")?.addEventListener("input", () => displayTasks());

// 🌗 Theme toggle
const toggleBtn = document.getElementById("toggleTheme");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

function updateStats() {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  document.getElementById("stats").textContent = `✅ ${done} of ${total} tasks done.`;
}

function getNextDate(dateStr, repeatType) {
  const d = new Date(dateStr);
  if (repeatType === "daily") d.setDate(d.getDate() + 1);
  else if (repeatType === "weekly") d.setDate(d.getDate() + 7);
  else if (repeatType === "monthly") d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

function scheduleReminder(task) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') Notification.requestPermission();

  const now = new Date();
  const taskDateTime = new Date(`${task.date}T${task.time || "09:00"}`);
  const delay = taskDateTime.getTime() - now.getTime();

  if (delay > 0 && delay < 86400000) {
    setTimeout(() => {
      new Notification("🔔 Task Reminder", {
        body: `${task.text} is due now!`
      });
    }, delay);
  }
}

function startVoiceInput() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();
  recognition.onresult = (event) => {
    document.getElementById("taskInput").value = event.results[0][0].transcript;
  };

  recognition.onerror = (event) => {
    alert("🎤 Voice recognition failed. Try again.");
  };
}

// 🖼️ Optional: Toggle calendar modal
function toggleCalendar() {
  const calDiv = document.getElementById("calendarView");
  calDiv.style.display = calDiv.style.display === "none" ? "block" : "none";
  if (calDiv.style.display === "block") renderCalendar();
}

function renderCalendar() {
  const calDiv = document.getElementById("calendarView");
  const dates = {};

  tasks.forEach(task => {
    if (!dates[task.date]) dates[task.date] = [];
    dates[task.date].push(task);
  });

  let html = "<h3>📆 Task Calendar</h3><ul>";
  Object.keys(dates).sort().forEach(date => {
    html += `<li><strong>${date}</strong><ul>`;
    dates[date].forEach(t => {
      html += `<li>${t.done ? "✅" : "⬜"} ${t.text} [${t.cat}] (${t.priority})</li>`;
    });
    html += "</ul></li>";
  });
  html += "</ul>";
  calDiv.innerHTML = html;
}

// 📦 Initial Load
displayTasks();

// ✅ Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log("✅ Service Worker Registered"))
      .catch(err => console.error("SW Error", err));
  });
}
