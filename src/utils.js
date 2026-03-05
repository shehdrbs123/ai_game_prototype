
export function distance(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
export function rand(min, max) { return Math.random() * (max - min) + min; }
export function randInt(min, max) { return Math.floor(rand(min, max)); }
