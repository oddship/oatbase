// src/js/base.js
function define(name, constructor) {
  if (!customElements.get(name))
    customElements.define(name, constructor);
}
function emit(element, name, detail) {
  element.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    composed: true,
    detail
  }));
}

// src/js/data-table.js
var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

class OtDataTable extends HTMLElement {
  #abort;
  #order = new WeakMap;
  #sort = { index: -1, direction: "none" };
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.table = this.querySelector(":scope > table, :scope > .scroll-area > table");
    if (!this.table)
      return;
    this.filter = this.querySelector("[data-table-filter]");
    this.selectAll = this.querySelector("[data-table-select-all]");
    this.status = this.querySelector("[data-table-status]");
    this.selectedStatus = this.querySelector("[data-table-selected]");
    this.empty = this.querySelector("[data-table-empty]");
    this.#prepareHeaders(signal);
    this.refresh();
    this.filter?.addEventListener("input", () => this.#filter(), { signal });
    this.table.addEventListener("change", (event) => {
      if (event.target.matches("[data-table-select-row]"))
        this.#selectionChanged(event.target);
      else if (event.target.matches("[data-table-select-all]"))
        this.#toggleVisible(event.target.checked);
    }, { signal });
    this.addEventListener("oatbase:refresh", () => this.refresh(), { signal });
    this.dataset.enhanced = "";
  }
  disconnectedCallback() {
    this.#abort?.abort();
  }
  get rows() {
    return [...this.table?.tBodies[0]?.rows || []];
  }
  get visibleRows() {
    return this.rows.filter((row) => !row.hidden);
  }
  get selectedRows() {
    return this.rows.filter((row) => row.querySelector("[data-table-select-row]:checked"));
  }
  refresh() {
    this.rows.forEach((row, index) => {
      if (!this.#order.has(row))
        this.#order.set(row, index);
    });
    this.#filter(false);
  }
  #prepareHeaders(signal) {
    [...this.table.tHead?.rows[0]?.cells || []].forEach((header, index) => {
      if (!header.hasAttribute("data-sort"))
        return;
      let button = header.querySelector(":scope > [data-table-sort]");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.dataset.tableSort = "";
        button.className = "ghost";
        button.append(...header.childNodes);
        header.append(button);
      }
      header.setAttribute("aria-sort", "none");
      button.addEventListener("click", () => this.#sortBy(header, index), { signal });
    });
  }
  #sortBy(header, index) {
    const direction = this.#sort.index !== index || this.#sort.direction === "none" ? "ascending" : this.#sort.direction === "ascending" ? "descending" : "none";
    this.#sort = { index, direction };
    [...this.table.tHead?.rows[0]?.cells || []].filter((cell) => cell.hasAttribute("data-sort")).forEach((cell) => cell.setAttribute("aria-sort", cell === header ? direction : "none"));
    const type = header.dataset.sort || "text";
    const rows = [...this.rows].sort((left, right) => {
      if (direction === "none")
        return this.#order.get(left) - this.#order.get(right);
      const result = this.#compare(this.#value(left, index), this.#value(right, index), type);
      return direction === "ascending" ? result : -result;
    });
    this.table.tBodies[0].append(...rows);
    emit(this, "oatbase:sort", { index, direction, type, header });
  }
  #value(row, index) {
    const cell = row.cells[index];
    return cell?.dataset.sortValue ?? cell?.textContent.trim() ?? "";
  }
  #compare(left, right, type) {
    if (type === "number")
      return (Number(left) || 0) - (Number(right) || 0);
    if (type === "date")
      return (Date.parse(left) || 0) - (Date.parse(right) || 0);
    return collator.compare(left, right);
  }
  #filter(announce = true) {
    const query = this.filter?.value.trim().toLocaleLowerCase() || "";
    this.rows.forEach((row) => {
      const haystack = (row.dataset.filterValue || row.textContent).toLocaleLowerCase();
      row.hidden = Boolean(query && !haystack.includes(query));
    });
    const visible = this.visibleRows.length;
    const total = this.rows.length;
    if (this.status)
      this.status.value = query ? `${visible} of ${total} rows` : `${total} rows`;
    if (this.empty)
      this.empty.hidden = visible > 0;
    this.#syncSelection();
    if (announce)
      emit(this, "oatbase:filter", { query, visible, total });
  }
  #toggleVisible(checked) {
    this.visibleRows.forEach((row) => {
      const input = row.querySelector("[data-table-select-row]:not(:disabled)");
      if (input)
        input.checked = checked;
    });
    this.#syncSelection();
    this.#emitSelection();
  }
  #selectionChanged(input) {
    input.closest("tr")?.toggleAttribute("data-selected", input.checked);
    this.#syncSelection();
    this.#emitSelection();
  }
  #syncSelection() {
    this.rows.forEach((row) => row.toggleAttribute("data-selected", Boolean(row.querySelector("[data-table-select-row]:checked"))));
    const visibleInputs = this.visibleRows.map((row) => row.querySelector("[data-table-select-row]:not(:disabled)")).filter(Boolean);
    const checked = visibleInputs.filter((input) => input.checked).length;
    if (this.selectAll) {
      this.selectAll.checked = visibleInputs.length > 0 && checked === visibleInputs.length;
      this.selectAll.indeterminate = checked > 0 && checked < visibleInputs.length;
    }
    if (this.selectedStatus)
      this.selectedStatus.value = `${this.selectedRows.length} selected`;
  }
  #emitSelection() {
    emit(this, "oatbase:select", {
      rows: this.selectedRows,
      values: this.selectedRows.map((row) => row.querySelector("[data-table-select-row]")?.value).filter((value) => value != null)
    });
  }
}
define("ot-data-table", OtDataTable);
export {
  OtDataTable
};
