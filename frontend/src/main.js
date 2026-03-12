import './style.css';
import './app.css';

// --- State ---
let expression = '';   // full expression string e.g. "578+5801+5719"
let justEvaluated = false;

const valueEl = document.getElementById('value');
const expressionEl = document.getElementById('expression');
const clearBtn = document.getElementById('clear-btn');

function getLastNumber() {
    // Split by operators to get the last number being typed
    const parts = expression.split(/(?<=[0-9.])(?=[+\-×÷])|(?<=[+\-×÷])(?=[0-9.-])/);
    return parts[parts.length - 1] || '0';
}

function updateDisplay() {
    const last = expression ? getLastNumber() : '0';
    const num = parseFloat(last);
    let display = last || '0';

    // If number is too long, switch to exponential notation
    if (!isNaN(num) && (Math.abs(num) >= 1e10 || display.replace('-','').replace('.','').length > 10)) {
        display = parseFloat(num.toPrecision(4)).toExponential(2);
    }

    valueEl.textContent = display;
    expressionEl.scrollLeft = expressionEl.scrollWidth;

    const len = display.replace('-', '').replace('.', '').length;
    valueEl.classList.remove('medium', 'small');
    if (len >= 12) valueEl.classList.add('small');
    else if (len >= 7) valueEl.classList.add('medium');
}

function handleNumber(digit) {
    if (justEvaluated) {
        expression = digit;
        justEvaluated = false;
    } else {
        if (expression === '0') expression = digit;
        else expression += digit;
    }
    clearBtn.textContent = 'C';
    expressionEl.textContent = expression;
    updateDisplay();
}

function handleDecimal() {
    if (justEvaluated) {
        expression = '0.';
        justEvaluated = false;
    } else {
        // Only add decimal if last number doesn't already have one
        const parts = expression.split(/[+\-×÷]/);
        const last = parts[parts.length - 1];
        if (!last.includes('.')) expression += '.';
    }
    expressionEl.textContent = expression;
    updateDisplay();
}

function handleOperator(op) {
    if (justEvaluated) justEvaluated = false;

    // Replace trailing operator if user changes their mind
    const lastChar = expression.slice(-1);
    if (['+', '−', '×', '÷'].includes(lastChar)) {
        expression = expression.slice(0, -1) + op;
    } else if (expression !== '') {
        expression += op;
    }

    expressionEl.textContent = expression;
    updateDisplay();
}

function evaluate(expr) {
    const jsExpr = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-');
    try {
        const result = Function('"use strict"; return (' + jsExpr + ')')();
        if (!isFinite(result)) return 'Error';
        const num = parseFloat(result.toPrecision(12));
        // If number is too long, use exponential notation
        if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
            return num.toExponential(3);
        }
        return num.toString();
    } catch {
        return 'Error';
    }
}

function handleEquals() {
    if (!expression || justEvaluated) return;

    // Remove trailing operator before evaluating
    const cleaned = expression.replace(/[+\-×÷]$/, '');
    if (!cleaned) return;

    const result = evaluate(cleaned);
    expressionEl.textContent = cleaned + ' =';
    expressionEl.scrollLeft = 0; // reset scroll to show full expression
    valueEl.textContent = result;
    valueEl.classList.remove('medium', 'small');
    const len = result.replace('-', '').replace('.', '').length;
    if (len >= 12) valueEl.classList.add('small');
    else if (len >= 9) valueEl.classList.add('medium');

    expression = result;
    justEvaluated = true;
    clearBtn.textContent = 'AC';
}

// Backspace — deletes one character
function handleClear() {
    if (expression.length > 1) {
        expression = expression.slice(0, -1);
    } else {
        expression = '';
    }
    justEvaluated = false;
    expressionEl.textContent = expression;
    updateDisplay();
}

// AC — resets everything
function handleClearAll() {
    expression = '';
    justEvaluated = false;
    expressionEl.textContent = '';
    updateDisplay();
}

function handleSign() {
    if (!expression || expression === '0') return;
    // Negate the last number in the expression
    const match = expression.match(/^(.*[+×÷]|^)(−?\d*\.?\d+)$/);
    if (match) {
        const prefix = match[1];
        const num = match[2];
        expression = prefix + (num.startsWith('−') ? num.slice(1) : '−' + num);
        expressionEl.textContent = expression;
        updateDisplay();
    }
}

function handlePercent() {
    const match = expression.match(/^(.*[+\-×÷])?(\d*\.?\d+)$/);
    if (!match) return;
    const prefix = match[1] || '';
    const num = parseFloat(match[2]);
    const result = parseFloat((num / 100).toPrecision(12)).toString();
    expression = prefix + result;
    expressionEl.textContent = expression;
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
            case 'clearall': handleClearAll(); break;
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
    else if (e.key === 'Backspace') handleClear();
    else if (e.key === '%') handlePercent();
});

// Initial render
expressionEl.textContent = '';
updateDisplay();