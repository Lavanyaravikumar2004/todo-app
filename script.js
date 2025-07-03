// script.js
let tasks = [];

function playSound(id) {
  document.getElementById(id).play();
}

function addTask() {
  const input = document.getElementById("taskInput");
  const date = document.getElementById("dueDate").value;
  const cat = document.getElementById("category").value;
  const priority = document.getElementById("priority").value;
  const imgFile = document.getElementById("imgInput").files[0];
  const repeat = document.getElementById("repeatTask")?.value;

  if (!input.value.trim()) return;

  const task = {
    text: input.value.trim(),
    date,
    cat,
    priority,
    done: false,
    repeat,
    img: imgFile ? URL.createObjectURL(imgFile) : null,
    created: new Date().toISOString()
  };

  tasks.push(task);
  input.value = "";
  document.getElementById("imgInput").value = "";
  displayTasks();
  playSound("ding");
  scheduleReminder(task);
}

function displayTasks(filter = "all") {
  const list = document.getElementById("taskList");
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  list.innerHTML = "";

  const today = new Date().toISOString().split('T')[0];
  let filtered = tasks
    .filter(task => {
      if (filter === "completed") return task.done;
      if (filter === "pending") return !task.done;
      return true;
    })
    .filter(task => task.text.toLowerCase().includes(search));

  const focusIndex = filtered.findIndex(t => !t.done && t.date === today);

  filtered.forEach((task, i) => {
    const li = document.createElement("li");
    li.className = `${task.done ? "completed" : ""} priority-${task.priority}`;
    if (i === focusIndex) li.classList.add("focus");

    let content = `<span onclick="toggleTask(${tasks.indexOf(task)})" style="cursor:pointer;">
      ${task.done ? '✅' : '⬜'} ${task.text} (${task.date}) [${task.cat}] <strong>[${task.priority}]</strong>
    </span>`;

    if (task.img) {
      content += `<br><img src="${task.img}" alt="Task Image" />`;
    }

    if (task.repeat && task.repeat !== 'none') {
      content += `<br><small>🔁 Repeats: ${task.repeat}</small>`;
    }

    li.innerHTML = content + ` <button onclick="deleteTask(${tasks.indexOf(task)})">❌</button>`;
    list.appendChild(li);
  });

  updateStats();
}

function toggleTask(i) {
  tasks[i].done = !tasks[i].done;
  playSound("complete");

  if (tasks[i].repeat && tasks[i].done) {
    const next = getNextDate(tasks[i].date, tasks[i].repeat);
    if (next) {
      tasks.push({ ...tasks[i], done: false, date: next });
    }
  }

  displayTasks();
}

function deleteTask(i) {
  tasks.splice(i, 1);
  playSound("delete");
  displayTasks();
}

function filterTasks(type) {
  displayTasks(type);
}

function clearAll() {
  tasks = [];
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

document.getElementById("searchInput")?.addEventListener("input", () => displayTasks());
document.getElementById("toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

function updateStats() {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  document.getElementById("stats").textContent = `✅ ${done} of ${total} tasks done.`;
}

function getNextDate(dateStr, repeatType) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  if (repeatType === "daily") d.setDate(d.getDate() + 1);
  else if (repeatType === "weekly") d.setDate(d.getDate() + 7);
  else if (repeatType === "monthly") d.setMonth(d.getMonth() + 1);
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
