console.log("taskbox online...");

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" type="text/css"
href="${import.meta.url.match(/.*\//)[0]}/taskbox.css"/>
<dialog>
  <span>&times;</span>
  <div>
    <div>Title:</div>
    <div>
      <input type="text" size="25" maxlength="80" placeholder="Task title" autofocus/>
    </div>
    <div>Status:</div><div><select></select></div>
  </div>
  <p><button type="submit">Add task</button></p>
</dialog>
`;

class TaskBox extends HTMLElement {
    #shadow;
    #dialog;
    #titleInput;
    #statusSelect;
    #addBtn;
    #closeBtn;
    #onNewTask;
    #onAddClick;
    #onCloseClick;

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: "closed" });
        this.#shadow.appendChild(template.content.cloneNode(true));

        this.#dialog = this.#shadow.querySelector("dialog");
        this.#titleInput = this.#shadow.querySelector("input");
        this.#statusSelect = this.#shadow.querySelector("select");
        this.#addBtn = this.#shadow.querySelector('button[type="submit"]');
        this.#closeBtn = this.#shadow.querySelector("span");
        this.#onNewTask = null;

        this.#onAddClick = (e) => {
            e.preventDefault();
            const task = {
                title: this.#titleInput.value.trim(),
                status: this.#statusSelect.value
            };
            if (task.title && this.#onNewTask) this.#onNewTask(task);
            this.close();
        };
        this.#onCloseClick = () => this.close();
    }

    connectedCallback() {
        this.#addBtn.addEventListener("click", this.#onAddClick);
        this.#closeBtn.addEventListener("click", this.#onCloseClick);
    }

    disconnectedCallback() {
        this.#addBtn.removeEventListener("click", this.#onAddClick);
        this.#closeBtn.removeEventListener("click", this.#onCloseClick);
    }

    setStatuseslist(statuses) {
        this.#statusSelect.textContent = "";
        (statuses || []).forEach(status => {
            const opt = document.createElement("option");
            opt.value = status;
            opt.textContent = status;
            this.#statusSelect.appendChild(opt);
        });
    }

    addNewtaskCallback(callback) {
        this.#onNewTask = callback;
    }

    show() {
        this.#titleInput.value = "";
        if (this.#statusSelect.options.length > 0) {
            this.#statusSelect.selectedIndex = 0;
        }
        this.#dialog.showModal();
    }

    close() {
        this.#dialog.close();
    }
}

customElements.define("task-box", TaskBox);