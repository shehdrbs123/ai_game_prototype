
export class DIContainer {
    constructor() { this.services = new Map(); }
    register(name, instance) { this.services.set(name, instance); return this; }
    get(name) { return this.services.get(name); }
}
