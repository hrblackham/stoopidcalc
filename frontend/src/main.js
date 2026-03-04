import './style.css';
import './app.css';

// --- State ---
let currentValue = '0';
let previousValue = null;
let operator = null;
let waitingForOperand = false;
let justEvaluated = false;

const valueEl = document.getElementById('value');
const expressionEl = document.getElementById('expression');
const clearBtn = document.getElementById('clear-btn');

function updateDisplay() {
    valueEl.textContent = currentValue;
    const len = currentValue.replace('-', '').replace('.', '').length;
    valueEl.classList.remove('medium', 'small');
    if (len >= 12) valueEl.classList.add('small');
    else if (len >= 9) valueEl.classList.add('medium');
}

function setActiveOp(op) {
    document.querySelectorAll('.btn-operator').forEach(btn => {
        btn.classList.remove('active-op');
        if (btn.dataset.op === op) btn.classList.add('active-op');
    });
}

function clearActiveOp() {
    document.querySelectorAll('.btn-operator').forEach(btn => btn.classList.remove('active-op'));
}

function handleNumber(digit) {
    if (waitingForOperand) {
        currentValue = digit;
        waitingForOperand = false;
    } else if (justEvaluated) {
        currentValue = digit;
        justEvaluated = false;
        expressionEl.textContent = '';
    } else {
        currentValue = currentValue === '0' ? digit : currentValue + digit;
    }
    clearBtn.textContent = 'C';
    updateDisplay();
}

function handleDecimal() {
    if (waitingForOperand) {
        currentValue = '0.';
        waitingForOperand = false;
    } else if (!currentValue.includes('.')) {
        currentValue += '.';
    }
    updateDisplay();
}

function compute(a, op, b) {
    const x = parseFloat(a);
    const y = parseFloat(b);
    switch (op) {
        case '+': return x + y;
        case '−': return x - y;
        case '×': return x * y;
        case '÷': return y === 0 ? null : x / y;
        default: return y;
    }
}

function formatResult(num) {
    if (num === null) return 'Error';
    // Avoid floating point display issues
    const str = parseFloat(num.toPrecision(12)).toString();
    return str;
}

function handleOperator(op) {
    if (operator && !waitingForOperand) {
        // Chain: compute with existing op
        const result = compute(previousValue, operator, currentValue);
        expressionEl.textContent = `${previousValue} ${operator} ${currentValue} ${op}`;
        currentValue = formatResult(result);
        if (currentValue === 'Error') {
            operator = null;
            previousValue = null;
            waitingForOperand = false;
            clearActiveOp();
            updateDisplay();
            return;
        }
    } else {
        expressionEl.textContent = `${currentValue} ${op}`;
    }
    previousValue = currentValue;
    operator = op;
    waitingForOperand = true;
    justEvaluated = false;
    setActiveOp(op);
    updateDisplay();
}

function handleEquals() {
    if (!operator || previousValue === null) return;
    const b = waitingForOperand ? previousValue : currentValue;
    const result = compute(previousValue, operator, b);
    expressionEl.textContent = `${previousValue} ${operator} ${b} =`;
    currentValue = formatResult(result);
    operator = null;
    previousValue = null;
    waitingForOperand = false;
    justEvaluated = true;
    clearActiveOp();
    updateDisplay();
}

function handleClear() {
    if (clearBtn.textContent === 'C') {
        currentValue = '0';
        clearBtn.textContent = 'AC';
    } else {
        currentValue = '0';
        previousValue = null;
        operator = null;
        waitingForOperand = false;
        justEvaluated = false;
        expressionEl.textContent = '';
        clearActiveOp();
    }
    updateDisplay();
}

function handleSign() {
    if (currentValue === '0' || currentValue === 'Error') return;
    currentValue = currentValue.startsWith('-')
        ? currentValue.slice(1)
        : '-' + currentValue;
    updateDisplay();
}

function handlePercent() {
    const val = parseFloat(currentValue);
    if (isNaN(val)) return;
    if (operator && previousValue !== null) {
        // iOS-style: relative percent (e.g. 200 + 50% => 200 + 100)
        const base = parseFloat(previousValue);
        currentValue = formatResult((base * val) / 100);
    } else {
        currentValue = formatResult(val / 100);
    }
    updateDisplay();
}

// --- Wire up buttons ---
document.querySelectorAll('[data-num]').forEach(btn => {
    btn.addEventListener('click', () => handleNumber(btn.dataset.num));
});

document.querySelectorAll('[data-op]').forEach(btn => {
    btn.addEventListener('click', () => handleOperator(btn.dataset.op));
});

document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
        switch (btn.dataset.action) {
            case 'clear':   handleClear();   break;
            case 'sign':    handleSign();    break;
            case 'percent': handlePercent(); break;
            case 'decimal': handleDecimal(); break;
            case 'equals':  handleEquals();  break;
        }
    });
});

// --- Keyboard support ---
document.addEventListener('keydown', e => {
    if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
    else if (e.key === '.') handleDecimal();
    else if (e.key === '+') handleOperator('+');
    else if (e.key === '-') handleOperator('−');
    else if (e.key === '*') handleOperator('×');
    else if (e.key === '/') { e.preventDefault(); handleOperator('÷'); }
    else if (e.key === 'Enter' || e.key === '=') handleEquals();
    else if (e.key === 'Escape') handleClear();
    else if (e.key === 'Backspace') {
        if (currentValue.length > 1 && currentValue !== 'Error') {
            currentValue = currentValue.slice(0, -1) || '0';
            updateDisplay();
        } else {
            handleClear();
        }
    }
    else if (e.key === '%') handlePercent();
});

// Initial render
updateDisplay();
