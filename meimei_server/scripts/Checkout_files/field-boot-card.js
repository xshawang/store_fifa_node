// =============================
// Deobfuscated & Simplified Version
// Payment Card Fields SDK
// =============================

// -------- Card Type Definitions --------
const CARD_TYPES = [
  {
    type: "visa",
    pattern: /^4/,
    lengths: [13, 16, 19],
    cvcLength: [3]
  },
  {
    type: "mastercard",
    pattern: /^(5[1-5]|2[2-7])/,
    lengths: [16],
    cvcLength: [3]
  },
  {
    type: "jcb",
    pattern: /^35/,
    lengths: [16,17,18,19],
    cvcLength: [3]
  }
];

// -------- Utils --------
function cleanNumber(value) {
  return value.replace(/\D/g, "");
}

function detectCardType(number) {
  const num = cleanNumber(number);
  return CARD_TYPES.find(card => card.pattern.test(num));
}

// Luhn Check
function isValidLuhn(number) {
  const arr = cleanNumber(number).split('').reverse().map(n => parseInt(n));
  const sum = arr.reduce((acc, val, idx) => {
    if (idx % 2 !== 0) {
      let doubled = val * 2;
      if (doubled > 9) doubled -= 9;
      return acc + doubled;
    }
    return acc + val;
  }, 0);
  return sum % 10 === 0;
}

// -------- Messaging Layer --------
class Messenger {
  constructor(targetWindow, origin = "*") {
    this.target = targetWindow;
    this.origin = origin;
  }

  send(action, payload = {}) {
    this.target.postMessage({ action, ...payload }, this.origin);
  }
}

// -------- Field Base Class --------
class BaseField {
  constructor(input) {
    this.input = input;
    this.messenger = new Messenger(window.parent);
    this.init();
  }

  init() {
    this.input.addEventListener("input", (e) => {
      this.onInput(e.target.value);
    });
  }

  onInput(value) {}
}

// -------- Card Number Field --------
class CardNumberField extends BaseField {
  onInput(value) {
    const clean = cleanNumber(value);
    const card = detectCardType(clean);

    this.messenger.send("card_number_update", {
      value: clean,
      cardType: card?.type || null,
      valid: isValidLuhn(clean)
    });
  }
}

// -------- Expiry Field --------
class ExpiryField extends BaseField {
  onInput(value) {
    this.messenger.send("expiry_update", {
      value
    });
  }
}

// -------- CVV Field --------
class CvvField extends BaseField {
  onInput(value) {
    this.messenger.send("cvv_update", {
      value
    });
  }
}

// -------- Request Manager --------
class RequestManager {
  constructor() {
    this.requests = new Map();
  }

  create(requestId, fields) {
    this.requests.set(requestId, {
      fields,
      data: {}
    });
  }

  addFieldData(requestId, field, value) {
    const req = this.requests.get(requestId);
    if (!req) return;

    req.data[field] = value;

    return this.isComplete(requestId);
  }

  isComplete(requestId) {
    const req = this.requests.get(requestId);
    return req.fields.every(f => req.data[f]);
  }

  getData(requestId) {
    return this.requests.get(requestId)?.data;
  }
}

// -------- Payment Session API --------
async function createSession(cardData) {
  const res = await fetch("/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      credit_card: cardData,
      payment_session_scope: window.location.hostname
    })
  });

  const data = await res.json();
  return data.id;
}

// -------- Main Controller --------
class PaymentController {
  constructor() {
    this.requestManager = new RequestManager();
    this.listen();
  }

  listen() {
    window.addEventListener("message", async (e) => {
      const { action, requestId, field, value, fields } = e.data;

      switch (action) {
        case "start_payment":
          this.requestManager.create(requestId, fields);
          break;

        case "field_data":
          const complete = this.requestManager.addFieldData(requestId, field, value);

          if (complete) {
            const data = this.requestManager.getData(requestId);
            const token = await createSession(data);

            window.parent.postMessage({
              action: "payment_token",
              token,
              requestId
            }, "*");
          }
          break;
      }
    });
  }
}

// -------- Bootstrap --------
function init() {
  const numberInput = document.querySelector("#card-number");
  const expiryInput = document.querySelector("#expiry");
  const cvvInput = document.querySelector("#cvv");

  if (numberInput) new CardNumberField(numberInput);
  if (expiryInput) new ExpiryField(expiryInput);
  if (cvvInput) new CvvField(cvvInput);

  new PaymentController();
}

init();
