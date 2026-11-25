/* =================================
   TASKFLOW - DATA STORAGE
================================= */

let users = JSON.parse(localStorage.getItem("users")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let currentUser = JSON.parse(
    localStorage.getItem("currentUser")
) || null;

function saveData() {
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function todayDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/* =================================
   LOGIN AND SIGNUP
================================= */

function showAuth(type) {
    document.getElementById("loginForm")
        .classList.toggle("hidden", type !== "login");

    document.getElementById("signupForm")
        .classList.toggle("hidden", type !== "signup");
}

// SIGNUP
document.getElementById("signupForm")
.addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const role = document.getElementById("signupRole").value;

    if (users.some(u => u.email === email)) {
        alert("Email already registered!");
        return;
    }

    const user = {
        name: name,
        email: email,
        password: password,
        role: role
    };

    users.push(user);
    saveData();

    alert("Signup successful! Please login.");

    this.reset();
    showAuth("login");
});

// LOGIN
document.getElementById("loginForm")
.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const user = users.find(
        u => u.email === email && u.password === password
    );

    if (!user) {
        alert("Invalid email or password!");
        return;
    }

    currentUser = user;

    localStorage.setItem(
        "currentUser",
        JSON.stringify(currentUser)
    );

    openApp();
});

/* =================================
   OPEN WEBSITE
================================= */

function openApp() {
    if (!currentUser) return;

    document.getElementById("authPage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");

    document.getElementById("welcomeUser").textContent =
        currentUser.name;

    document.getElementById("sideUser").textContent =
        currentUser.name;

    document.getElementById("sideRole").textContent =
        currentUser.role;

    document.getElementById("adminMenu").classList.toggle(
        "hidden", currentUser.role !== "admin"
    );

    showSection("dashboard");
}

/* =================================
   NAVIGATION
================================= */

function showSection(id) {
    if (!currentUser) return;

    if (id === "users" && currentUser.role !== "admin") {
        alert("Admin access only!");
        return;
    }

    document.querySelectorAll(".section").forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(id).classList.remove("hidden");

    const titles = {
        dashboard: "Dashboard",
        tasks: "My Tasks",
        calendar: "Calendar",
        reminders: "Notifications",
        favorites: "Favorites",
        profile: "Profile",
        settings: "Settings",
        users: "Admin Panel"
    };

    document.getElementById("pageTitle").textContent = titles[id];

    if (id === "dashboard") updateDashboard();
    if (id === "tasks") displayTasks();
    if (id === "calendar") displayCalendar();
    if (id === "reminders") displayReminders();
    if (id === "favorites") displayFavorites();
    if (id === "profile") displayProfile();
    if (id === "users") displayAdmin();
}

/* =================================
   USER TASKS
================================= */

function myTasks() {
    if (currentUser.role === "admin") {
        return tasks;
    }

    return tasks.filter(
        t => t.owner === currentUser.email
    );
}

/* =================================
   ADD TASK
================================= */

document.getElementById("taskForm")
.addEventListener("submit", function(e) {
    e.preventDefault();

    const task = {
        id: Date.now(),
        title: document.getElementById("taskTitle").value.trim(),
        description: document.getElementById("taskDescription").value,
        date: document.getElementById("taskDate").value,
        priority: document.getElementById("taskPriority").value,
        status: "Pending",
        favorite: false,
        owner: currentUser.email
    };

    tasks.push(task);
    saveData();

    this.reset();

    alert("Task added successfully!");

    displayTasks();
    updateDashboard();
});

/* =================================
   DISPLAY TASKS
================================= */

function displayTasks() {
    const list = document.getElementById("taskList");

    const filter = document.getElementById("taskFilter").value;
    const search = document.getElementById("taskSearch").value.toLowerCase();

    const filtered = myTasks().filter(t =>
        (filter === "All" || t.status === filter) &&
        t.title.toLowerCase().includes(search)
    );

    list.innerHTML = "";

    if (filtered.length === 0) {
        list.textContent = "No tasks found.";
        return;
    }

    filtered.forEach(task => {
        const card = document.createElement("div");
        card.className = "task-card";

        const title = document.createElement("h4");
        title.textContent = task.title;

        const description = document.createElement("p");
        description.textContent = task.description || "No description";

        const info = document.createElement("p");
        info.className = "small-text";
        info.textContent =
            "Deadline: " + task.date +
            " | Priority: " + task.priority +
            (currentUser.role === "admin" ? " | Owner: " + task.owner : "");

        const status = document.createElement("p");
        status.className = "status";
        status.textContent = "Status: " + task.status;

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const statusSelect = document.createElement("select");

        ["Pending", "In Progress", "Completed"].forEach(s => {
            const option = document.createElement("option");
            option.value = s;
            option.textContent = s;
            statusSelect.appendChild(option);
        });

        statusSelect.value = task.status;

        statusSelect.addEventListener("change", () => {
            task.status = statusSelect.value;
            saveData();
            displayTasks();
            updateDashboard();
        });

        const edit = document.createElement("button");
        edit.textContent = "Edit";
        edit.addEventListener("click", () => editTask(task.id));

        const del = document.createElement("button");
        del.textContent = "Delete";
        del.className = "delete";
        del.addEventListener("click", () => deleteTask(task.id));

        const favorite = document.createElement("button");
        favorite.textContent = task.favorite ? "⭐ Favorited" : "☆ Favorite";
        favorite.addEventListener("click", () => toggleFavorite(task.id));

        actions.append(statusSelect, edit, del, favorite);

        card.append(title, description, info, status, actions);
        list.appendChild(card);
    });
}

/* =================================
   EDIT TASK
================================= */

function editTask(id) {
    const task = myTasks().find(t => t.id === id);
    if (!task) return;

    const title = prompt("Enter task title:", task.title);

    if (title === null) return;

    if (!title.trim()) {
        alert("Task title cannot be empty.");
        return;
    }

    task.title = title.trim();

    const description = prompt(
        "Enter description:", task.description
    );

    if (description !== null) {
        task.description = description;
    }

    saveData();
    displayTasks();
    updateDashboard();
}

/* =================================
   DELETE TASK
================================= */

function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    tasks = tasks.filter(t => t.id !== id);

    saveData();
    displayTasks();
    updateDashboard();
    displayFavorites();
}

/* SEARCH AND FILTER */

document.getElementById("taskSearch")
.addEventListener("input", displayTasks);

document.getElementById("taskFilter")
.addEventListener("change", displayTasks);

/* =================================
   DASHBOARD
================================= */

function updateDashboard() {
    const list = myTasks();

    const completed = list.filter(
        t => t.status === "Completed"
    ).length;

    const pending = list.filter(
        t => t.status !== "Completed"
    ).length;

    const overdue = list.filter(
        t => t.status !== "Completed" && t.date < todayDate()
    ).length;

    document.getElementById("totalTasks").textContent = list.length;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("overdueTasks").textContent = overdue;

    const recent = document.getElementById("recentTasks");
    recent.innerHTML = "";

    list.slice(-5).reverse().forEach(t => {
        const p = document.createElement("p");
        p.textContent = t.title + " - " + t.status + " - " + t.date;
        recent.appendChild(p);
    });

    if (!list.length) {
        recent.textContent = "No tasks available.";
    }
}

/* =================================
   CALENDAR
================================= */

function displayCalendar() {
    const list = document.getElementById("calendarList");
    list.innerHTML = "";

    const upcoming = myTasks().sort(
        (a, b) => a.date.localeCompare(b.date)
    );

    if (!upcoming.length) {
        list.textContent = "No tasks available.";
        return;
    }

    upcoming.forEach(t => {
        const p = document.createElement("p");
        p.textContent =
            "📅 " + t.date + " - " + t.title + " (" + t.status + ")";
        list.appendChild(p);
    });
}

/* =================================
   NOTIFICATIONS AND REMINDERS
================================= */

function displayReminders() {
    const list = document.getElementById("reminderList");
    list.innerHTML = "";

    const today = todayDate();

    const due = myTasks().filter(t =>
        t.status !== "Completed" && t.date <= today
    );

    if (!due.length) {
        list.textContent = "No due or overdue tasks.";
        return;
    }

    due.forEach(t => {
        const p = document.createElement("p");

        p.textContent =
            "🔔 " +
            (t.date < today ? "Overdue: " : "Due Today: ") +
            t.title;

        list.appendChild(p);
    });
}

/* =================================
   FAVORITES
================================= */

function toggleFavorite(id) {
    const task = myTasks().find(t => t.id === id);

    if (!task) return;

    task.favorite = !task.favorite;

    saveData();
    displayTasks();
    displayFavorites();
}

function displayFavorites() {
    const list = document.getElementById("favoriteList");
    list.innerHTML = "";

    const favorites = myTasks().filter(t => t.favorite);

    if (!favorites.length) {
        list.textContent = "No favorite tasks yet.";
        return;
    }

    favorites.forEach(t => {
        const card = document.createElement("div");
        card.className = "task-card";

        const title = document.createElement("h4");
        title.textContent = "⭐ " + t.title;

        const info = document.createElement("p");
        info.textContent = "Status: " + t.status + " | Deadline: " + t.date;

        const remove = document.createElement("button");
        remove.textContent = "Remove Favorite";
        remove.addEventListener("click", () => toggleFavorite(t.id));

        card.append(title, info, remove);
        list.appendChild(card);
    });
}

/* =================================
   PROFILE
================================= */

function displayProfile() {
    document.getElementById("profileName").value = currentUser.name;
    document.getElementById("profileEmail").value = currentUser.email;
    document.getElementById("profileRole").value = currentUser.role;
}

document.getElementById("profileForm")
.addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("profileName").value.trim();

    if (!name) return;

    const user = users.find(u => u.email === currentUser.email);

    user.name = name;
    currentUser = user;

    localStorage.setItem(
        "currentUser",
        JSON.stringify(currentUser)
    );

    saveData();
    openApp();

    alert("Profile updated successfully!");
});

/* =================================
   SETTINGS - THEME
================================= */

function toggleTheme() {
    document.body.classList.toggle("dark-theme");

    const theme = document.body.classList.contains("dark-theme")
        ? "dark"
        : "light";

    localStorage.setItem("taskflowTheme", theme);
}

// LOAD SAVED THEME
if (localStorage.getItem("taskflowTheme") === "dark") {
    document.body.classList.add("dark-theme");
}

/* =================================
   EXPORT DATA
================================= */

function exportData() {
    const data = {
        users: users,
        tasks: tasks
    };

    const file = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "TaskFlow_Data.json";
    link.click();

    URL.revokeObjectURL(url);
}

/* =================================
   BROWSER NOTIFICATIONS
================================= */

function enableNotifications() {
    if (!("Notification" in window)) {
        alert("Browser notifications are not supported.");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            alert("Browser notifications enabled!");
        } else {
            alert("Notification permission was not granted.");
        }
    });
}

/* =================================
   CLEAR ALL DATA
================================= */

function clearTaskFlowData() {
    const confirmClear = confirm(
        "Are you sure? All TaskFlow data will be deleted."
    );

    if (!confirmClear) return;

    localStorage.removeItem("users");
    localStorage.removeItem("tasks");
    localStorage.removeItem("currentUser");

    alert("TaskFlow data cleared.");

    location.reload();
}

/* =================================
   ADMIN PANEL
================================= */

function displayAdmin() {
    if (currentUser.role !== "admin") return;

    document.getElementById("userCount").textContent = users.length;
    document.getElementById("adminTaskCount").textContent = tasks.length;

    const userList = document.getElementById("userList");
    userList.innerHTML = "";

    users.forEach(u => {
        const p = document.createElement("p");
        p.textContent = u.name + " | " + u.email + " | " + u.role;
        userList.appendChild(p);
    });

    const taskList = document.getElementById("adminTaskList");
    taskList.innerHTML = "";

    tasks.forEach(t => {
        const p = document.createElement("p");
        p.textContent =
            t.title + " | " + t.owner + " | " + t.status;
        taskList.appendChild(p);
    });
}

/* =================================
   GLOBAL SEARCH
================================= */

document.getElementById("globalSearch")
.addEventListener("input", function() {
    document.getElementById("taskSearch").value = this.value;
    showSection("tasks");
    displayTasks();
});

/* =================================
   LOGOUT
================================= */

function logout() {
    currentUser = null;

    localStorage.removeItem("currentUser");

    document.getElementById("appPage").classList.add("hidden");
    document.getElementById("authPage").classList.remove("hidden");

    document.getElementById("loginForm").reset();

    showAuth("login");
}

/* =================================
   AUTO LOGIN AFTER REFRESH
================================= */

if (currentUser) {
    const savedUser = users.find(
        u => u.email === currentUser.email
    );

    if (savedUser) {
        currentUser = savedUser;
        openApp();
    } else {
        currentUser = null;
        localStorage.removeItem("currentUser");
    }
}