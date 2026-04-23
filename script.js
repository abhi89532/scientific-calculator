const display = document.getElementById("display");
const expression = document.getElementById("expression");
const buttons = document.querySelectorAll(".btn");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const themeToggle = document.getElementById("themeToggle");
const soundToggle = document.getElementById("soundToggle");
const historyToggle = document.getElementById("historyToggle");
const closeHistory = document.getElementById("closeHistory");
const historyModal = document.getElementById("historyModal");
const memoryButtons = document.querySelectorAll(".memory-btn");
const memoryIndicator = document.getElementById("memoryIndicator");

let currentInput = "";
let history = JSON.parse(localStorage.getItem("calculatorHistory")) || [];
let currentTheme = localStorage.getItem("calculatorTheme") || "dark";
let soundEnabled = JSON.parse(localStorage.getItem("calculatorSound")) ?? true;
let memoryValue = parseFloat(localStorage.getItem("calculatorMemory")) || 0;

function applyTheme() {
  if (currentTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("light");
    themeToggle.textContent = "🌙";
  }
}

function applySoundState() {
  soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
}

function updateMemoryIndicator() {
  memoryIndicator.textContent = `M: ${formatResult(memoryValue)}`;
}

function updateDisplay() {
  display.value = currentInput || "0";
  expression.textContent = currentInput;
}

function saveHistory() {
  localStorage.setItem("calculatorHistory", JSON.stringify(history));
}

function saveMemory() {
  localStorage.setItem("calculatorMemory", memoryValue.toString());
}

function renderHistory() {
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML = `<li class="empty-history">No calculations yet.</li>`;
    return;
  }

  history
    .slice()
    .reverse()
    .forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="history-expression">${item.expression}</div>
        <div class="history-result">${item.result}</div>
      `;

      li.addEventListener("click", () => {
        currentInput = item.result.toString();
        updateDisplay();
        closeHistoryModal();
        playClickSound();
      });

      historyList.appendChild(li);
    });
}

function appendValue(value) {
  const lastChar = currentInput.slice(-1);
  const operators = ["+", "-", "*", "/", "%"];

  if (operators.includes(value) && operators.includes(lastChar)) {
    currentInput = currentInput.slice(0, -1) + value;
  } else {
    currentInput += value;
  }

  updateDisplay();
}

function clearDisplay() {
  currentInput = "";
  updateDisplay();
}

function deleteLast() {
  currentInput = currentInput.slice(0, -1);
  updateDisplay();
}

function insertSqrt() {
  currentInput += "sqrt(";
  updateDisplay();
}

function insertPower() {
  currentInput += "^";
  updateDisplay();
}

function formatResult(result) {
  if (!Number.isFinite(result)) return "Error";
  return Number.isInteger(result)
    ? result.toString()
    : result.toFixed(6).replace(/\.?0+$/, "");
}

function preprocessExpression(input) {
  return input
    .replace(/sqrt\(/g, "Math.sqrt(")
    .replace(/\^/g, "**")
    .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
}

function calculateResult() {
  if (!currentInput) return;

  try {
    const sanitizedInput = preprocessExpression(currentInput);
    const result = Function(`"use strict"; return (${sanitizedInput})`)();
    const formatted = formatResult(result);

    if (formatted === "Error") {
      display.value = "Error";
      return;
    }

    history.push({
      expression: currentInput,
      result: formatted
    });

    if (history.length > 25) {
      history.shift();
    }

    saveHistory();
    renderHistory();

    expression.textContent = currentInput;
    currentInput = formatted;
    display.value = formatted;
  } catch (error) {
    display.value = "Error";
  }
}

function getCurrentNumericValue() {
  const value = parseFloat(display.value);
  return Number.isFinite(value) ? value : 0;
}

function handleMemory(action) {
  const currentValue = getCurrentNumericValue();

  if (action === "MC") {
    memoryValue = 0;
  } else if (action === "MR") {
    currentInput += formatResult(memoryValue);
  } else if (action === "M+") {
    memoryValue += currentValue;
  } else if (action === "M-") {
    memoryValue -= currentValue;
  }

  saveMemory();
  updateMemoryIndicator();
  updateDisplay();
}

function animateButton(button) {
  if (!button) return;
  button.classList.add("pressed");
  setTimeout(() => button.classList.remove("pressed"), 120);
}

function playClickSound() {
  if (!soundEnabled) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(520, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.05);
}

function openHistoryModal() {
  historyModal.classList.add("show");
}

function closeHistoryModal() {
  historyModal.classList.remove("show");
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.value;
    const action = button.dataset.action;

    animateButton(button);
    playClickSound();

    if (action === "sqrt") {
      insertSqrt();
      return;
    }

    if (action === "power") {
      insertPower();
      return;
    }

    if (value === "C") {
      clearDisplay();
    } else if (value === "DEL") {
      deleteLast();
    } else if (value === "=") {
      calculateResult();
    } else {
      appendValue(value);
    }
  });
});

memoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleMemory(button.dataset.memory);
    playClickSound();
  });
});

document.addEventListener("keydown", (event) => {
  const key = event.key;

  const keyButton = [...buttons].find((btn) => btn.dataset.value === key);

  if (!isNaN(key) || ["+", "-", "*", "/", ".", "(", ")", "%"].includes(key)) {
    appendValue(key);
    animateButton(keyButton);
    playClickSound();
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculateResult();
    const equalsButton = [...buttons].find((btn) => btn.dataset.value === "=");
    animateButton(equalsButton);
    playClickSound();
  } else if (key === "Backspace") {
    deleteLast();
    playClickSound();
  } else if (key === "Escape") {
    if (historyModal.classList.contains("show")) {
      closeHistoryModal();
    } else {
      clearDisplay();
    }
    playClickSound();
  } else if (key.toLowerCase() === "s") {
    insertSqrt();
    playClickSound();
  } else if (key === "^") {
    insertPower();
    playClickSound();
  } else if (key.toLowerCase() === "h") {
    openHistoryModal();
    playClickSound();
  }
});

clearHistoryBtn.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
  playClickSound();
});

themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("calculatorTheme", currentTheme);
  applyTheme();
  playClickSound();
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("calculatorSound", JSON.stringify(soundEnabled));
  applySoundState();
});

historyToggle.addEventListener("click", () => {
  openHistoryModal();
  playClickSound();
});

closeHistory.addEventListener("click", () => {
  closeHistoryModal();
  playClickSound();
});

historyModal.addEventListener("click", (event) => {
  if (event.target === historyModal) {
    closeHistoryModal();
  }
});

applyTheme();
applySoundState();
updateMemoryIndicator();
updateDisplay();
renderHistory();