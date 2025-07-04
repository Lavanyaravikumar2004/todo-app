// script.js
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
  const cat = document.getElementById("category").value;
  const priority = document.getElementById("priority").value;
  const repeat = document.getElementById("repeat").value;
  const imgFile = document.getElementById("imgInput")?.files[0];

  if (!input.value.trim()) return;

  const task = {
    text: input.value.trim(),
    date,
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

function displayTasks(filter = "all") {
  const list = document.getElementById("taskList");
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  list.innerHTML = "";

  const today = new Date().toISOString().split('T')[0];
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
      ${task.img ? `<br><img src="${task.img}" alt="Task Image" style="max-width:100px;"/>` : ""}
      ${task.repeat !== 'None' ? `<br><small>🔁 ${task.repeat}</small>` : ""}
      <button onclick="deleteTask(${i})">❌</button>
    `;
    list.appendChild(li);
  });
  updateStats();
}

function toggleTask(i) {
  tasks[i].done = !tasks[i].done;
  playSound("complete");

  if (tasks[i].done && tasks[i].repeat !== "None") {
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
    }, 300); // Wait for animation
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
// 🌗 Persist Light/Dark Theme
const toggleBtn = document.getElementById("toggleTheme");

// Load theme on start
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// Toggle theme on click
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const theme = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", theme);
});

function updateStats() {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  document.getElementById("stats").textContent = `✅ ${done} of ${total} tasks done.`;
}

function getNextDate(dateStr, repeatType) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  if (repeatType === "Daily") d.setDate(d.getDate() + 1);
  else if (repeatType === "Weekly") d.setDate(d.getDate() + 7);
  else if (repeatType === "Monthly") d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

function scheduleReminder(task) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') Notification.requestPermission();

  if (task.date === new Date().toISOString().split('T')[0]) {
    setTimeout(() => {
      new Notification("🔔 Reminder", {
        body: `${task.text} is due today!`
      });
    }, 3000);
  }
}

// Initial Load
displayTasks();
function startVoiceInput() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();
  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    document.getElementById("taskInput").value = speechResult;
  };

  recognition.onerror = (event) => {
    alert("🎤 Voice recognition failed. Try again.");
    console.error(event.error);
  };
}
// 🎤 Voice Input for Task Field
function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Your browser does not support Speech Recognition 😔");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("taskInput").value = transcript;
  };

  recognition.onerror = (event) => {
    alert("🎤 Voice input error: " + event.error);
  };
}

