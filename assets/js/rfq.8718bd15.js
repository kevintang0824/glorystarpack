(function () {
  "use strict";

  const form = document.getElementById("rfq-form");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const productField = document.getElementById("product");
  const productParam = (params.get("product") || "").trim().slice(0, 120);
  if (productField && productParam) productField.value = productParam;

  function value(name) {
    const field = form.elements.namedItem(name);
    return field ? String(field.value || "").trim() : "";
  }

  function buildMessage() {
    const rows = [
      "Hello GloryStarPack, I would like to request a packaging quote.",
      value("name") ? `Name: ${value("name")}` : "",
      value("company") ? `Company: ${value("company")}` : "",
      value("email") ? `Email: ${value("email")}` : "",
      value("whatsapp") ? `WhatsApp / phone: ${value("whatsapp")}` : "",
      value("country") ? `Destination country: ${value("country")}` : "",
      value("product") ? `Product / application: ${value("product")}` : "",
      value("capacity") ? `Capacity / size: ${value("capacity")}` : "",
      value("quantity") ? `Estimated quantity: ${value("quantity")}` : "",
      value("closure") ? `Closure / dispensing: ${value("closure")}` : "",
      value("finish") ? `Decoration / finish: ${value("finish")}` : "",
      value("reference") ? `Reference link: ${value("reference")}` : "",
      value("requirements") ? `Requirements: ${value("requirements")}` : "",
      `Source page: ${window.location.href}`
    ].filter(Boolean);
    return rows.join("\n");
  }

  function recordIntent(channel) {
    const detail = {
      channel,
      product: value("product") || "unspecified",
      source: window.location.pathname
    };
    document.dispatchEvent(new CustomEvent("gsp:rfq-intent", { detail }));
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: "rfq_intent",
        rfq_channel: detail.channel,
        rfq_product: detail.product,
        page_path: detail.source
      });
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const channel = event.submitter && event.submitter.dataset.channel === "whatsapp"
      ? "whatsapp"
      : "email";
    const message = buildMessage();
    const subject = value("product")
      ? `Packaging RFQ - ${value("product")}`
      : "Packaging RFQ from GloryStarPack website";
    const status = document.getElementById("form-status");

    recordIntent(channel);
    if (status) {
      status.textContent = channel === "whatsapp"
        ? "Opening WhatsApp with your RFQ. Review the message before sending."
        : "Opening your email app with your RFQ. Review the message before sending.";
    }

    if (channel === "whatsapp") {
      window.open(
        `https://wa.me/8619577608248?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener"
      );
      return;
    }
    window.location.href =
      `mailto:kevin@glorystarpack.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  });
})();
