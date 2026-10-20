// src/js/base.js
var id = 0;
var uid = (prefix = "oatbase") => `${prefix}-${++id}`;
function define(name, constructor) {
  if (!customElements.get(name))
    customElements.define(name, constructor);
}
function connectWhenReady(element, connect) {
  if (document.readyState !== "loading") {
    connect();
    return;
  }
  const controller = new AbortController;
  document.addEventListener("DOMContentLoaded", () => {
    if (element.isConnected)
      connect();
  }, { once: true, signal: controller.signal });
  return controller;
}
function emit(element, name, detail) {
  element.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    composed: true,
    detail
  }));
}

// src/js/carousel.js
class OtCarousel extends HTMLElement {
  #ready;
  #abort;
  #observer;
  #resize;
  #frame;
  connectedCallback() {
    this.#ready?.abort();
    this.#ready = connectWhenReady(this, () => this.#connect());
  }
  #connect() {
    this.#cleanup();
    this.track = this.querySelector(":scope > [data-carousel-track]");
    if (!this.track)
      return;
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.addEventListener("click", (event) => {
      if (event.target.closest("[data-carousel-next]"))
        this.goTo(this.index + 1);
      if (event.target.closest("[data-carousel-previous]"))
        this.goTo(this.index - 1);
    }, { signal });
    this.track.addEventListener("scroll", () => this.#schedule(), { signal, passive: true });
    this.track.addEventListener("keydown", (event) => {
      if (event.target !== this.track)
        return;
      const rtl = getComputedStyle(this).direction === "rtl";
      const step = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 }[event.key];
      if (step || ["Home", "End"].includes(event.key)) {
        event.preventDefault();
        this.goTo(event.key === "Home" ? 0 : event.key === "End" ? this.slides.length - 1 : this.index + step);
      }
    }, { signal });
    this.#observer = new MutationObserver(() => this.refresh());
    this.#observer.observe(this.track, { childList: true });
    this.#resize = new ResizeObserver(() => this.#schedule());
    this.#resize.observe(this.track);
    this.dataset.enhanced = "";
    this.refresh();
  }
  get slides() {
    return [...this.track?.querySelectorAll(":scope > [data-carousel-slide]") || []];
  }
  get index() {
    const edge = this.track?.getBoundingClientRect().left || 0;
    const distances = this.slides.map((slide) => Math.abs(slide.getBoundingClientRect().left - edge));
    return distances.length ? distances.indexOf(Math.min(...distances)) : -1;
  }
  goTo(index) {
    const slide = this.slides[Math.max(0, Math.min(index, this.slides.length - 1))];
    if (!slide)
      return;
    const rtl = getComputedStyle(this).direction === "rtl";
    const box = slide.getBoundingClientRect();
    const track = this.track.getBoundingClientRect();
    this.track.scrollBy({ left: rtl ? box.right - track.right : box.left - track.left, behavior: "instant" });
    this.refresh();
  }
  refresh() {
    const index = this.index, total = this.slides.length;
    this.querySelectorAll("[data-carousel-previous]").forEach((button) => {
      button.disabled = index <= 0;
    });
    this.querySelectorAll("[data-carousel-next]").forEach((button) => {
      button.disabled = index < 0 || index >= total - 1;
    });
    const status = this.querySelector("[data-carousel-status]");
    if (status)
      status.textContent = total ? `${index + 1} of ${total}` : "No slides";
    emit(this, "oatbase:change", { index, total });
  }
  #schedule() {
    if (!this.#frame)
      this.#frame = requestAnimationFrame(() => {
        this.#frame = 0;
        this.refresh();
      });
  }
  #cleanup() {
    this.#abort?.abort();
    this.#observer?.disconnect();
    this.#resize?.disconnect();
    if (this.#frame)
      cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }
  disconnectedCallback() {
    this.#ready?.abort();
    this.#cleanup();
    this.removeAttribute("data-enhanced");
  }
}
define("ot-carousel", OtCarousel);
// src/js/calendar.js
var date = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || ""))
    return;
  const result = new Date(`${value}T12:00:00`);
  return Number.isNaN(+result) || iso(result) !== value ? undefined : result;
};
var iso = (value) => `${String(value.getFullYear()).padStart(4, "0")}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
var civil = (year, month, day = 1) => {
  const result = new Date(0);
  result.setFullYear(year, month, day);
  result.setHours(12, 0, 0, 0);
  return result;
};
var shift = (value, days) => {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
};

class OtCalendar extends HTMLElement {
  #ready;
  #abort;
  #observer;
  #day;
  #panel;
  #resetFrame;
  connectedCallback() {
    this.#ready?.abort();
    this.#ready = connectWhenReady(this, () => this.#connect());
  }
  #connect() {
    this.#cleanup();
    this.input = this.querySelector(':scope > input[type="date"]');
    if (!this.input)
      return;
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.#panel = document.createElement("div");
    this.#panel.dataset.calendarPanel = "";
    this.append(this.#panel);
    this.#day = this.#clamp(date(this.input.value) || new Date);
    this.#panel.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || button.disabled || button.getAttribute("aria-disabled") === "true")
        return;
      if (button.dataset.day) {
        this.value = button.dataset.day;
        this.input.dispatchEvent(new Event("input", { bubbles: true }));
        this.input.dispatchEvent(new Event("change", { bubbles: true }));
        emit(this, "oatbase:change", { value: this.value });
        this.#focus();
      } else if (button.dataset.month) {
        this.#moveMonth(Number(button.dataset.month));
        this.refresh();
        this.#panel.querySelector(`[data-month="${button.dataset.month}"]`)?.focus();
      }
    }, { signal });
    this.#panel.addEventListener("keydown", (event) => {
      if (!event.target.matches("[data-day]"))
        return;
      const rtl = getComputedStyle(this).direction === "rtl";
      let delta = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (event.key === "Home")
        delta = -this.#day.getDay();
      if (event.key === "End")
        delta = 6 - this.#day.getDay();
      if (event.key === "PageUp" || event.key === "PageDown") {
        event.preventDefault();
        this.#moveMonth(event.key === "PageUp" ? -1 : 1);
      } else if (delta !== undefined) {
        event.preventDefault();
        this.#day = this.#clamp(shift(this.#day, delta));
      } else
        return;
      this.refresh();
      this.#focus();
    }, { signal });
    this.input.addEventListener("change", () => {
      const selected = date(this.value);
      if (selected)
        this.#day = this.#clamp(selected);
      this.refresh();
    }, { signal });
    this.input.form?.addEventListener("reset", () => {
      if (this.#resetFrame)
        cancelAnimationFrame(this.#resetFrame);
      this.#resetFrame = requestAnimationFrame(() => {
        this.#resetFrame = 0;
        if (this.isConnected) {
          this.#day = this.#clamp(date(this.value) || new Date);
          this.refresh();
        }
      });
    }, { signal });
    this.#observer = new MutationObserver(() => {
      this.#day = this.#clamp(this.#day);
      this.refresh();
    });
    this.#observer.observe(this.input, { attributes: true, attributeFilter: ["min", "max", "step", "disabled", "readonly"] });
    const fieldset = this.closest("fieldset");
    if (fieldset)
      this.#observer.observe(fieldset, { attributes: true, attributeFilter: ["disabled"] });
    this.dataset.enhanced = "";
    this.refresh();
  }
  get value() {
    return this.input?.value || "";
  }
  set value(value) {
    if (!this.input)
      return;
    this.input.value = value;
    const selected = date(this.value);
    if (selected)
      this.#day = this.#clamp(selected);
    this.refresh();
  }
  #clamp(value) {
    const min = date(this.input.min), max = date(this.input.max);
    return min && value < min ? min : max && value > max ? max : value;
  }
  #moveMonth(delta) {
    const day = this.#day.getDate();
    const target = civil(this.#day.getFullYear(), this.#day.getMonth() + delta);
    target.setDate(Math.min(day, civil(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
    this.#day = this.#clamp(target);
  }
  #focus() {
    this.#panel.querySelector(`[data-day="${iso(this.#day)}"]`)?.focus();
  }
  refresh() {
    if (!this.#panel)
      return;
    const focused = this.#panel.contains(document.activeElement);
    const active = this.#clamp(this.#day);
    this.#day = active;
    const year = active.getFullYear(), month = active.getMonth();
    const locale = this.lang || document.documentElement.lang || "en";
    let title, weekday, dayLabel;
    try {
      title = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(active);
      weekday = new Intl.DateTimeFormat(locale, { weekday: "short" });
      dayLabel = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
    } catch {
      title = new Intl.DateTimeFormat("en", { year: "numeric", month: "long" }).format(active);
      weekday = new Intl.DateTimeFormat("en", { weekday: "short" });
      dayLabel = new Intl.DateTimeFormat("en", { dateStyle: "full" });
    }
    const label = uid("calendar-month");
    const header = document.createElement("div");
    header.dataset.calendarHeader = "";
    const blocked = this.input.matches(":disabled") || this.input.readOnly;
    for (const [delta, text] of [[-1, "Previous month"], [1, "Next month"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "outline small";
      button.dataset.month = delta;
      button.textContent = delta < 0 ? "‹" : "›";
      button.setAttribute("aria-label", text);
      button.disabled = blocked;
      header.append(button);
    }
    const heading = document.createElement("strong");
    heading.id = label;
    heading.textContent = title;
    heading.setAttribute("aria-live", "polite");
    header.insertBefore(heading, header.lastChild);
    const table = document.createElement("table");
    table.setAttribute("aria-labelledby", label);
    const head = document.createElement("thead");
    const row = document.createElement("tr");
    for (let d = 0;d < 7; d++) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = weekday.format(new Date(2026, 0, 4 + d));
      row.append(th);
    }
    head.append(row);
    table.append(head);
    const body = document.createElement("tbody");
    let tr;
    const first = civil(year, month);
    const total = civil(year, month + 1, 0).getDate();
    for (let slot = 0;slot < Math.ceil((first.getDay() + total) / 7) * 7; slot++) {
      if (slot % 7 === 0) {
        tr = document.createElement("tr");
        body.append(tr);
      }
      const td = document.createElement("td");
      tr.append(td);
      const day = slot - first.getDay() + 1;
      if (day < 1 || day > total)
        continue;
      const candidate = civil(year, month, day);
      const value = iso(candidate);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ghost small";
      button.dataset.day = value;
      button.textContent = day;
      button.tabIndex = value === iso(active) ? 0 : -1;
      button.setAttribute("aria-label", dayLabel.format(candidate));
      button.setAttribute("aria-pressed", String(this.value === value));
      button.disabled = blocked;
      button.setAttribute("aria-disabled", String(Boolean(this.input.min && value < this.input.min || this.input.max && value > this.input.max || this.input.step !== "any" && !this.#stepValid(value))));
      td.append(button);
    }
    table.append(body);
    this.#panel.replaceChildren(header, table);
    if (focused)
      this.#focus();
  }
  #stepValid(value) {
    const step = Number(this.input.step || 1);
    if (!(step > 0))
      return true;
    const base = date(this.input.min) ? Date.parse(this.input.min) : date(this.input.defaultValue) ? Date.parse(this.input.defaultValue) : 0;
    return Math.abs((Date.parse(value) - base) / 86400000 / step % 1) < 0.00000001;
  }
  #cleanup() {
    this.#abort?.abort();
    this.#observer?.disconnect();
    this.#panel?.remove();
    if (this.#resetFrame)
      cancelAnimationFrame(this.#resetFrame);
    this.#resetFrame = 0;
  }
  disconnectedCallback() {
    this.#ready?.abort();
    this.#cleanup();
    this.removeAttribute("data-enhanced");
  }
}
define("ot-calendar", OtCalendar);
// src/js/popup-position.js
function watchPosition(popup, anchor, point) {
  const abort = new AbortController;
  const position = () => {
    const box = anchor.getBoundingClientRect();
    const x = point?.x ?? box.left;
    const y = point?.y ?? box.bottom;
    popup.style.left = `${Math.max(8, Math.min(x, innerWidth - popup.offsetWidth - 8))}px`;
    popup.style.top = `${Math.max(8, Math.min(y, innerHeight - popup.offsetHeight - 8))}px`;
  };
  position();
  window.addEventListener("resize", position, { signal: abort.signal });
  window.addEventListener("scroll", position, { signal: abort.signal, capture: true, passive: true });
  const observer = new ResizeObserver(position);
  observer.observe(popup);
  return () => {
    abort.abort();
    observer.disconnect();
  };
}

// src/js/context-menu.js
class OtContextMenu extends HTMLElement {
  #ready;
  #abort;
  #stop;
  #point;
  #returnTo;
  #pending;
  #frame;
  connectedCallback() {
    this.#ready?.abort();
    this.#ready = connectWhenReady(this, () => this.#connect());
  }
  #connect() {
    this.#abort?.abort();
    this.#stop?.();
    this.popup = this.querySelector(":scope > [popover]:not(.ot-tooltip)");
    this.target = this.querySelector(":scope > [data-context-target]");
    this.trigger = this.querySelector("[popovertarget]");
    if (!this.popup?.showPopover || !this.target || !this.trigger)
      return;
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.trigger.setAttribute("aria-expanded", "false");
    this.target.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.#pending?.abort();
      const point = { x: event.clientX, y: event.clientY };
      const open = () => {
        this.#frame = requestAnimationFrame(() => {
          this.#frame = 0;
          if (this.isConnected)
            this.open(point);
        });
      };
      if (event.buttons & 2) {
        this.#pending = new AbortController;
        const pending = this.#pending;
        window.addEventListener("pointerup", () => {
          pending.abort();
          open();
        }, { once: true, signal: pending.signal });
        window.addEventListener("pointercancel", () => pending.abort(), { once: true, signal: pending.signal });
        window.addEventListener("blur", () => pending.abort(), { once: true, signal: pending.signal });
      } else
        open();
    }, { signal });
    this.target.addEventListener("keydown", (event) => {
      if (event.key === "ContextMenu" || event.shiftKey && event.key === "F10") {
        event.preventDefault();
        this.open();
      }
    }, { signal });
    this.trigger.addEventListener("click", () => {
      this.#point = undefined;
    }, { signal });
    this.popup.addEventListener("beforetoggle", (event) => {
      if (event.newState === "open")
        this.#returnTo = document.activeElement;
    }, { signal });
    this.popup.addEventListener("toggle", (event) => {
      this.#stop?.();
      this.#stop = undefined;
      const open = event.newState === "open";
      this.trigger.setAttribute("aria-expanded", String(open));
      if (open) {
        this.#stop = watchPosition(this.popup, this.target, this.#point);
        this.items[0]?.focus();
      } else if (this.#returnTo?.isConnected && (this.popup.contains(document.activeElement) || document.activeElement === document.body))
        this.#returnTo.focus();
    }, { signal });
    this.popup.addEventListener("keydown", (event) => {
      const items = this.items, index = items.indexOf(event.target);
      let next;
      if (event.key === "ArrowDown")
        next = (index + 1) % items.length;
      if (event.key === "ArrowUp")
        next = (index - 1 + items.length) % items.length;
      if (event.key === "Home")
        next = 0;
      if (event.key === "End")
        next = items.length - 1;
      if (next !== undefined && items.length) {
        event.preventDefault();
        items[next].focus();
      }
      if (event.key === "Tab")
        this.close();
    }, { signal });
    this.popup.addEventListener("click", (event) => {
      const item = event.target.closest('[role="menuitem"]');
      if (!this.items.includes(item))
        return;
      const selected = new CustomEvent("oatbase:select", { bubbles: true, composed: true, cancelable: true, detail: { value: item.dataset.value || "", item } });
      if (this.dispatchEvent(selected))
        this.close();
    }, { signal });
  }
  get items() {
    return [...this.popup?.querySelectorAll('[role="menuitem"]') || []].filter((item) => !item.disabled && item.getAttribute("aria-disabled") !== "true" && !item.hidden);
  }
  open(point) {
    if (!this.popup?.showPopover)
      return;
    this.#point = point;
    this.popup.showPopover();
  }
  close() {
    if (this.popup?.matches(":popover-open"))
      this.popup.hidePopover();
  }
  disconnectedCallback() {
    this.#ready?.abort();
    this.#abort?.abort();
    this.#stop?.();
    this.#pending?.abort();
    if (this.#frame)
      cancelAnimationFrame(this.#frame);
  }
}
define("ot-context-menu", OtContextMenu);
// src/js/hover-card.js
class OtHoverCard extends HTMLElement {
  #ready;
  #abort;
  #timer;
  #stop;
  #pinned = false;
  connectedCallback() {
    this.#ready?.abort();
    this.#ready = connectWhenReady(this, () => this.#connect());
  }
  #connect() {
    this.#cleanup();
    this.trigger = this.querySelector(":scope > [popovertarget]");
    this.popup = this.querySelector(":scope > [popover]:not(.ot-tooltip)");
    if (!this.trigger || !this.popup || !this.popup.showPopover)
      return;
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (this.#pinned && this.popup.matches(":popover-open"))
        this.close();
      else {
        this.open();
        this.#pinned = true;
      }
    }, { signal });
    this.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch")
        this.open();
    }, { signal });
    this.addEventListener("pointerleave", () => this.#later(), { signal });
    this.addEventListener("focusin", () => {
      clearTimeout(this.#timer);
    }, { signal });
    this.addEventListener("focusout", () => this.#later(), { signal });
    this.popup.addEventListener("pointerenter", () => clearTimeout(this.#timer), { signal });
    this.popup.addEventListener("pointerleave", () => this.#later(), { signal });
    this.popup.addEventListener("toggle", (event) => {
      this.#stop?.();
      this.#stop = undefined;
      this.trigger.setAttribute("aria-expanded", String(event.newState === "open"));
      if (event.newState === "open")
        this.#stop = watchPosition(this.popup, this.trigger);
      else
        this.#pinned = false;
    }, { signal });
  }
  open() {
    clearTimeout(this.#timer);
    if (this.isConnected && this.popup?.showPopover && !this.popup.matches(":popover-open"))
      this.popup.showPopover();
  }
  close() {
    clearTimeout(this.#timer);
    if (this.popup?.matches(":popover-open"))
      this.popup.hidePopover();
  }
  #later() {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      if (!this.contains(document.activeElement))
        this.close();
    }, 150);
  }
  #cleanup() {
    clearTimeout(this.#timer);
    this.#stop?.();
    this.#abort?.abort();
  }
  disconnectedCallback() {
    this.#ready?.abort();
    this.#cleanup();
  }
}
define("ot-hover-card", OtHoverCard);
// src/js/menubar.js
class OtMenubar extends HTMLElement {
  #ready;
  #abort;
  connectedCallback() {
    this.#ready?.abort();
    this.#ready = connectWhenReady(this, () => this.#connect());
  }
  #connect() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.refresh();
    this.querySelectorAll("[popover]:not(.ot-tooltip)").forEach((popup) => popup.addEventListener("toggle", (event) => {
      if (event.newState === "open")
        popup.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
    }, { signal }));
    this.addEventListener("focusin", (event) => {
      if (this.items.includes(event.target))
        this.items.forEach((item) => {
          item.tabIndex = item === event.target ? 0 : -1;
        });
    }, { signal });
    this.addEventListener("keydown", (event) => {
      const popup = event.target.closest("[popover]:not(.ot-tooltip)");
      if (popup && ["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
        const items = [...popup.querySelectorAll('[role="menuitem"]')].filter((item) => !item.disabled && item.getAttribute("aria-disabled") !== "true" && !item.hidden);
        if (!items.length)
          return;
        const current = items.indexOf(event.target);
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
        event.preventDefault();
        event.stopPropagation();
        items[next].focus();
        return;
      }
      const trigger = this.items.find((item) => item === event.target || item.closest("ot-dropdown")?.contains(event.target));
      const index = this.items.indexOf(trigger);
      if (index < 0)
        return;
      const rtl = getComputedStyle(this).direction === "rtl";
      const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
      if (step || ["Home", "End"].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        const popup2 = trigger.closest("ot-dropdown")?.querySelector("[popover]:not(.ot-tooltip)");
        const wasOpen = popup2?.matches(":popover-open");
        if (wasOpen)
          popup2.hidePopover();
        const next = this.items[event.key === "Home" ? 0 : event.key === "End" ? this.items.length - 1 : (index + step + this.items.length) % this.items.length];
        setTimeout(() => {
          if (this.isConnected) {
            next.focus();
            if (wasOpen)
              next.closest("ot-dropdown")?.querySelector("[popover]:not(.ot-tooltip)")?.showPopover();
          }
        }, 0);
      } else if (event.target === trigger && ["ArrowDown", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        trigger.closest("ot-dropdown")?.querySelector("[popover]:not(.ot-tooltip)")?.showPopover();
      }
    }, { signal, capture: true });
  }
  get items() {
    return [...this.querySelectorAll(':scope > [role="menubar"] > ot-dropdown > [role="menuitem"]')].filter((item) => !item.disabled);
  }
  refresh() {
    this.items.forEach((item, index) => {
      item.tabIndex = index === 0 ? 0 : -1;
    });
  }
  disconnectedCallback() {
    this.#ready?.abort();
    this.#abort?.abort();
  }
}
define("ot-menubar", OtMenubar);
// src/js/questionnaire.js
class OtQuestionnaire extends HTMLElement {
  #ready;
  #abort;
  #index = 0;
  #noValidate;
  connectedCallback() {
    this.#ready?.abort();
    this.#ready = connectWhenReady(this, () => this.#connect());
  }
  #connect() {
    this.#abort?.abort();
    this.form = this.querySelector(":scope > form");
    if (!this.form)
      return;
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.#noValidate = this.form.noValidate;
    this.form.noValidate = true;
    this.addEventListener("click", (event) => {
      if (event.target.closest("[data-question-next]"))
        this.next();
      if (event.target.closest("[data-question-previous]"))
        this.previous();
      if (event.target.closest("[data-question-skip]") && this.items[this.index]?.hasAttribute("data-optional"))
        this.#show(this.index + 1);
    }, { signal });
    this.form.addEventListener("submit", (event) => {
      if (this.index < this.items.length - 1) {
        event.preventDefault();
        this.next();
        return;
      }
      const invalid = this.items.findIndex((item) => !this.#valid(item));
      if (invalid >= 0) {
        event.preventDefault();
        this.#show(invalid);
        this.#report(this.items[invalid]);
        return;
      }
      const submitted = new CustomEvent("oatbase:submit", { bubbles: true, composed: true, cancelable: true, detail: { data: new FormData(this.form) } });
      if (!this.dispatchEvent(submitted))
        event.preventDefault();
    }, { signal });
    this.form.addEventListener("reset", () => queueMicrotask(() => {
      if (this.isConnected)
        this.#show(0, false);
    }), { signal });
    this.dataset.enhanced = "";
    this.#show(0, false);
  }
  get items() {
    return [...this.form?.querySelectorAll("[data-question]") || []];
  }
  get index() {
    return this.#index;
  }
  next() {
    const item = this.items[this.index];
    if (!item)
      return;
    if (!this.#valid(item)) {
      this.#report(item);
      return;
    }
    this.#show(this.index + 1);
  }
  previous() {
    this.#show(this.index - 1);
  }
  #valid(item) {
    return [...item.querySelectorAll("input, textarea, select")].every((input) => !input.willValidate || input.checkValidity());
  }
  #report(item) {
    [...item.querySelectorAll("input, textarea, select")].find((input) => input.willValidate && !input.validity.valid)?.reportValidity();
  }
  #show(index, focus = true) {
    this.#index = Math.max(0, Math.min(index, this.items.length - 1));
    this.items.forEach((item, current) => {
      item.hidden = current !== this.index;
    });
    this.querySelectorAll("[data-question-actions]").forEach((element) => {
      element.hidden = false;
    });
    this.querySelectorAll("[data-question-previous]").forEach((button) => {
      button.disabled = this.index <= 0;
    });
    this.querySelectorAll("[data-question-next]").forEach((button) => {
      button.hidden = this.index === this.items.length - 1;
    });
    this.querySelectorAll("[data-question-skip]").forEach((button) => {
      button.hidden = !this.items[this.index]?.hasAttribute("data-optional") || this.index === this.items.length - 1;
    });
    this.querySelectorAll("[data-question-submit]").forEach((button) => {
      button.hidden = this.index !== this.items.length - 1;
    });
    const output = this.querySelector("[data-question-progress]");
    if (output)
      output.textContent = `Question ${this.index + 1} of ${this.items.length}`;
    if (focus)
      this.items[this.index]?.querySelector("input:not(:disabled), textarea:not(:disabled), select:not(:disabled)")?.focus();
    emit(this, "oatbase:step", { index: this.index, total: this.items.length });
  }
  disconnectedCallback() {
    this.#ready?.abort();
    this.#abort?.abort();
    if (this.form)
      this.form.noValidate = this.#noValidate;
    this.items.forEach((item) => {
      item.hidden = false;
    });
    this.querySelectorAll("[data-question-actions]").forEach((element) => {
      element.hidden = true;
    });
    this.querySelectorAll("[data-question-submit]").forEach((button) => {
      button.hidden = false;
    });
    this.removeAttribute("data-enhanced");
  }
}
define("ot-questionnaire", OtQuestionnaire);
export {
  OtQuestionnaire,
  OtMenubar,
  OtHoverCard,
  OtContextMenu,
  OtCarousel,
  OtCalendar
};
