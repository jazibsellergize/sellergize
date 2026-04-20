// Interpolate variables logic replaced by unified interpolate()

/**
 * Check a condition
 */
globalThis.checkCondition = function (condition, variables) {
    if (!condition) return false;

    // Interpolate left and right operands
    let left = interpolate(condition.left, variables);
    let right = interpolate(condition.right, variables);

    // Convert to numbers if possible for numeric comparisons
    if (!isNaN(Number(left)) && !isNaN(Number(right))) {
        left = Number(left);
        right = Number(right);
    }

    switch (condition.operator) {
        case '<': return left < right;
        case '<=': return left <= right;
        case '>': return left > right;
        case '>=': return left >= right;
        case '==': return left == right;
        case '===': return left === right;
        case '!=': return left != right;
        case '!==': return left !== right;
        case 'includes':
            return String(left).includes(String(right));
        case '!':
            return !right || right === "" || right === "null" || right === "undefined";
        default:
            console.error(`Unknown operator: ${condition.operator}`);
            return false;
    }
};


globalThis.interpolate = function (input, variables) {

    if (
        input === null ||
        input === undefined ||
        typeof input === "number" ||
        typeof input === "boolean"
    ) {
        return input;
    }

    if (Array.isArray(input)) {
        return input.map(v => interpolate(v, variables));
    }

    if (typeof input === "object") {
        const out = {};
        for (const k in input) {
            out[k] = interpolate(input[k], variables);
        }
        return out;
    }

    if (typeof input !== "string") return input;

    // Exact "${...}" → preserve type, return "" if not found or null
    const exact = input.match(/^\$\{([^}]+)\}$/);
    if (exact) {
        const resolved = resolvePath(exact[1], variables);
        // Return "" for undefined OR null values
        return (resolved !== undefined && resolved !== null) ? resolved : "";
    }

    // Embedded replacements → string, use empty string if not found
    const interpolated = input.replace(/\$\{([^{}]+)\}/g, (_, expr) => {
        const v = resolvePath(expr, variables);
        return v !== undefined && v !== null ? String(v) : "";
    });

    if (interpolated !== input) {
        return interpolate(interpolated, variables);
    }

    return interpolated;
};

// 🔹 Safe resolver (NO eval)
function resolvePath(path, obj) {
    try {
        return path
            .replace(/\[(\d+)\]/g, '.$1') // arr[0] → arr.0
            .split('.')
            .reduce((o, k) => (o != null ? o[k] : undefined), obj);
    } catch {
        return undefined;
    }
}



