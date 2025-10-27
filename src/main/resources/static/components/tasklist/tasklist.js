console.log("tasklist online...");



const template = document.createElement("template");
template.innerHTML = `
  <link rel="stylesheet" type="text/css" href="${import.meta.url.match(/.*\//)[0]}/tasklist.css"/>
  <div id="tasklist"></div>
`;

const tasktable = document.createElement("template");
tasktable.innerHTML = `
  <table>
    <thead>
      <tr><th>Task</th><th>Status</th><th>Modify</th><th>Remove</th></tr>
    </thead>
    <tbody></tbody>
  </table>
`;

const taskrow = document.createElement("template");
taskrow.innerHTML = `
  <tr>
    <td></td>
    <td></td>
    <td>
      <select>
        <option value="0" selected>&lt;Modify&gt;</option>
      </select>
    </td>
    <td><button type="button">Remove</button></td>
  </tr>
`;

class TaskList extends HTMLElement {

    //spørsmål: er det best å lage private objektvariabler eller bedre å lage
    //variablene i metoden.
    //eks: er det best å lage tbody i showTask() eller er det lurere å lage dette
    //i constructoren?
    //mer oversiktlig i metode, men raskere kode hvis vi lager i som objektvariabel
    //siden vi ikke må laste de inn hver gang metoden kjører??


    #shadow;
    #root;
    #statuses;
    #changeCb;
    #deleteCb;
    #onChange;
    #onRemove;

    constructor() {
        super();
        this.#shadow = this.attachShadow({mode: "closed"});
        this.#shadow.appendChild(template.content.cloneNode(true));
        this.#root = this.#shadow.querySelector("#tasklist");

        this.#statuses = [];
        this.#changeCb = null;
        this.#deleteCb = null;

        this.#onChange = (event) => {
            const target = event.target;
            if (!(target instanceof HTMLSelectElement)) return;

            const row = target.closest("tr");
            if (row === null) return;

            const id = Number(row.dataset.id);
            const title = (row.cells[0]?.textContent || "").trim();
            const currentStatus = (row.cells[1]?.textContent || "").trim();
            const newStatus = target.value;

            if (newStatus === "0") {
                return;
            }

            const ok = window.confirm(
                `Set '${title}' from '${currentStatus}' to '${newStatus}'?`
            );

            if (ok) {
                if (this.#changeCb) this.#changeCb(id, newStatus);
                target.value = "0";
            } else {
                target.value = "0";
            }
        };

        this.#onRemove = (event) => {
            const btn = event.target;
            if (!(btn instanceof HTMLButtonElement)) return;

            const row = btn.closest("tr");
            if (row === null) return;

            const id = Number(row.dataset.id);
            const title = (row.cells[0]?.textContent || "").trim();
            const ok = window.confirm(`Delete task '${title}' (#${id})?`);
            if (ok && this.#deleteCb) this.#deleteCb(id);
        };
    }

    connectedCallback() {
        this.#root.addEventListener("change", this.#onChange);
        this.#root.addEventListener("click", this.#onRemove);
    }

    disconnectedCallback() {
        this.#root.removeEventListener("change", this.#onChange);
        this.#root.removeEventListener("click", this.#onRemove);
    }

    setStatuseslist(allstatuses) {
        this.#statuses = Array.isArray(allstatuses) ? allstatuses : [];
    }

    addChangestatusCallback(callback) {
        this.#changeCb = callback;
    }

    addDeletetaskCallback(callback) {
        this.#deleteCb = callback;
    }

    showTask(task) {
        let table = this.#root.querySelector("table");
        if (table === null) {
            const frag = tasktable.content.cloneNode(true);
            this.#root.appendChild(frag);
            table = this.#root.querySelector("table");
        }

        const tbody = table.tBodies[0];
        const row = taskrow.content.cloneNode(true).firstElementChild;

        row.dataset.id = String(task.id);
        row.cells[0].textContent = task.title;
        row.cells[1].textContent = task.status;

        const selectEl = row.querySelector("select");
        this.#statuses.forEach(status => {
            const opt = document.createElement("option");
            opt.value = status;
            opt.textContent = status;
            selectEl.appendChild(opt);
        });
        selectEl.value = "0";

        tbody.prepend(row);
    }

    updateTask(task) {
        const row = this.#root.querySelector(`tr[data-id="${task.id}"]`);
        if (row === null) {
            console.error("No data for task", task.id);
            return;
        }
        row.cells[1].textContent = task.status;

        const selectEl = row.querySelector("select");
        if (selectEl !== null) {
            selectEl.value = "0";
        }
    }

    removeTask(id) {
        const row = this.#root.querySelector(`tr[data-id="${id}"]`);
        if (row !== null) {
            row.remove();
        } else {
            console.warn("No task found with id:", id);
        }
    }

    getNumtasks() {
        const table = this.#root.querySelector("table");
        if (table === null || !table.tBodies.length) return 0;
        return table.tBodies[0].rows.length;
    }
}

customElements.define("task-list", TaskList);