/**
 * Element Picker tool for selecting geometry and getting build123d selectors.
 */
export class ElementPicker {
  constructor(viewer) {
    this.viewer = viewer;
    this.contextEnabled = false;
    this.pickerOverlay = null;
    this.pickerOverlayTimeout = null;
  }

  enableContext() {
    this.contextEnabled = true;
  }

  disableContext() {
    this.contextEnabled = false;
    this.hideOverlay();
  }

  handleSelection(selectedObj, shift) {
    if (!selectedObj) return;
    // Convert | delimiter to / for backend compatibility
    const path = selectedObj.obj.name.replaceAll("|", "/");
    // Send to backend with picker action
    this.viewer.checkChanges(
      {
        selectedShapeIDs: [path, shift],
        pickerAction: "add",
      },
      true,
    );
  }

  handleResponse(response) {
    const latest = response.latest;
    if (!latest) return;

    this.showOverlay(latest);

    // Copy selector to clipboard if added
    if (latest.selector && latest.action === "added") {
      const expr = latest.selector.expression;
      navigator.clipboard.writeText(expr).then(() => {
        console.log("Selector copied:", expr);
      });
    }
  }

  showOverlay(info) {
    if (!this.pickerOverlay) {
      this.pickerOverlay = document.createElement("div");
      this.pickerOverlay.id = "picker-overlay";
      this.pickerOverlay.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(30, 30, 46, 0.95);
        color: #cdd6f4;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 13px;
        max-width: 400px;
        z-index: 10000;
        border: 1px solid #45475a;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(this.pickerOverlay);
    }

    const action = info.action === "added" ? "Selected" : "Deselected";
    const typeLabel = info.type.charAt(0).toUpperCase() + info.type.slice(1);
    const geom = info.geometry;
    const selector = info.selector;

    let details = "";
    if (info.type === "face") {
      if (info.normal) {
        details = `Normal: (${info.normal.join(", ")})`;
      }
      if (info.area) {
        details += ` | Area: ${info.area}mm²`;
      }
    } else if (info.type === "edge") {
      if (info.length) {
        details = `Length: ${info.length}mm`;
      }
    }
    if (info.radius) {
      details += ` | R: ${info.radius}mm`;
    }

    const confidence = selector.confidence === "low" ? " ⚠️" : "";
    const copied = info.action === "added" ? " 📋" : "";

    this.pickerOverlay.innerHTML = `
      <div style="color: #f9e2af; margin-bottom: 4px;">${action}: ${typeLabel} ${info.index}</div>
      <div style="color: #a6adc8; font-size: 11px; margin-bottom: 6px;">${geom} | ${details}</div>
      <div style="color: #89b4fa;">${selector.expression}${confidence}${copied}</div>
      <div style="color: #6c7086; font-size: 10px; margin-top: 4px;">${selector.description}</div>
    `;

    this.pickerOverlay.style.opacity = "1";

    // Auto-hide after 4 seconds
    clearTimeout(this.pickerOverlayTimeout);
    this.pickerOverlayTimeout = setTimeout(() => {
      this.pickerOverlay.style.opacity = "0";
    }, 4000);
  }

  hideOverlay() {
    if (this.pickerOverlay) {
      this.pickerOverlay.style.opacity = "0";
    }
  }

  clearBuffer() {
    this.viewer.checkChanges({ pickerAction: "clear" }, true);
    this.hideOverlay();
  }

  removeLastSelectedObj(force) {
    if (force) {
      this.clearBuffer();
    }
  }

  update() {}

  dispose() {
    this.disableContext();
    if (this.pickerOverlay && this.pickerOverlay.parentNode) {
      this.pickerOverlay.parentNode.removeChild(this.pickerOverlay);
    }
  }
}
