console.log("taskview online...");
import "../components.taskbox/taskbox.js";
import "../components/tasklist/tasklist.js";

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" type="text/css"
href="${import.meta.url.match(/.*\//)[0]}/taskview.css"/>
<h1>Tasks</h1>
<div id="message"><p>Waiting for server data.</p></div>
<div id="newtask">
  <button type="button" disabled>New task</button>
</div>
<task-list></task-list>
<task-box></task-box>
`;

class TaskView extends HTMLElement {
      #shadow;
      #msgEl;
      #btnNew;
      #taskList;
      #taskBox;
      #baseUrl;
      #loading;
      #onBtnNewClick;

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: "closed" });
        this.#shadow.appendChild(template.content.cloneNode(true));

        this.#msgEl = this.#shadow.querySelector("#message");
        this.#btnNew = this.#shadow.querySelector("#newtask button");
        this.#taskList = this.#shadow.querySelector("task-list");
        this.#taskBox = this.#shadow.querySelector("task-box");

        this.#baseUrl = this.getAttribute("data-serviceurl") || "./api";
        this.#loading = true;

        this.#onBtnNewClick = (e) => this.#handleOpenTaskBox(e);
    }

    connectedCallback() {
        this.#taskList.addChangestatusCallback((id, s) => this.#handleStatusChange(id, s));
        this.#taskList.addDeletetaskCallback((id) => this.#handleDeleteTask(id));
        this.#btnNew.addEventListener("click", this.#onBtnNewClick);
        this.#taskBox.addNewtaskCallback((t) => this.#handleNewTask(t));

        this.#setMessage("Waiting for server data.");
        this.#loadData().catch(err => {
            console.error(err);
            this.#setMessage("Failed to load data from server.");
        });
    }

    disconnectedCallback() {
           this.#btnNew.removeEventListener("click", this.#onBtnNewClick);
    }

    #setMessage(text) {
        const p = this.#msgEl.querySelector("p") || document.createElement("p");
        p.textContent = text;
        if (p.parentNode === null) this.#msgEl.appendChild(p);
    }

    #updateCountMessage() {
        const n = this.#taskList.getNumtasks();
        if (this.#loading) {
            this.#setMessage("Waiting for server data.");
        } else if (n === 0) {
            this.#setMessage("No tasks in list.");
        } else {
            this.#setMessage(`Showing ${n} task${n === 1 ? "" : "s"}.`);
        }
    }

    async #loadData() {
        const resStatuses = await fetch(`${this.#baseUrl}/allstatuses`);
        if (!resStatuses.ok) throw new Error("Failed to fetch statuses");

        const dataStatuses = await resStatuses.json();
        if (dataStatuses.responseStatus === true && Array.isArray(dataStatuses.allstatuses)) {
            this.#taskList.setStatuseslist(dataStatuses.allstatuses);
            this.#taskBox.setStatuseslist(dataStatuses.allstatuses);
        } else {
            throw new Error("Invalid status data");
        }

        const resTasks = await fetch(`${this.#baseUrl}/tasklist`);
        if (!resTasks.ok) throw new Error("Failed to fetch tasks");

        const dataTasks = await resTasks.json();
        if (dataTasks.responseStatus === true && Array.isArray(dataTasks.tasks)) {
            dataTasks.tasks.forEach(task => this.#taskList.showTask(task));
        } else {
            throw new Error("Invalid task data");
        }

        this.#loading = false;
        this.#btnNew.disabled = false;
        this.#updateCountMessage();
    }

    async #handleStatusChange(id, newStatus) {
        try {
            const res = await fetch(`${this.#baseUrl}/task/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error("PUT failed");

            const data = await res.json();
            if (data.responseStatus === true) {
                this.#taskList.updateTask({ id, status: newStatus });
                this.#updateCountMessage();
            }
        } catch (err) {
            console.error(err);
            this.#setMessage(`Failed to update task #${id}.`);
        }
    }

    async #handleDeleteTask(id) {
        try {
            const res = await fetch(`${this.#baseUrl}/task/${id}`, {
                method: "DELETE",
                headers: { "Accept": "application/json" }
            });
            if (!res.ok) throw new Error("DELETE failed");

            const data = await res.json();
            if (data.responseStatus === true) {
                this.#taskList.removeTask(id);
                this.#updateCountMessage();
            }
        } catch (err) {
            console.error(err);
            this.#setMessage(`Failed to delete task #${id}.`);
        }
    }

    #handleOpenTaskBox() {
        this.#taskBox.show();
    }

    async #handleNewTask(task) {
        try {
            const res = await fetch(`${this.#baseUrl}/task`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(task)
            });
            if (!res.ok) throw new Error("POST failed");

            const data = await res.json();
            if (data.responseStatus === true) {
                const created = data.task ?? data;
                this.#taskList.showTask(created);
                this.#updateCountMessage();
            }
        } catch (err) {
            console.error(err);
            this.#setMessage("Failed to add new task.");
        } finally {
            this.#taskBox.close();
        }
    }
}

customElements.define("task-view", TaskView);