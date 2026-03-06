
/**
 * Unity-like Animation System for Javascript
 * Supports State Machines, Transitions, and Parameters.
 */

export class AnimatorParameterType {
    static FLOAT = 'FLOAT';
    static INT = 'INT';
    static BOOL = 'BOOL';
    static TRIGGER = 'TRIGGER';
}

export class AnimatorConditionMode {
    static GREATER = 'GREATER';
    static LESS = 'LESS';
    static EQUALS = 'EQUALS';
    static NOTEQUALS = 'NOTEQUALS';
    static IF = 'IF';
    static IFNOT = 'IFNOT';
}

export class AnimatorTransition {
    constructor(targetStateName) {
        this.targetStateName = targetStateName;
        this.conditions = []; // Array of { parameterName, mode, threshold }
    }

    addCondition(parameterName, mode, threshold = null) {
        this.conditions.push({ parameterName, mode, threshold });
        return this;
    }

    check(parameters) {
        for (const condition of this.conditions) {
            const val = parameters[condition.parameterName];
            switch (condition.mode) {
                case AnimatorConditionMode.GREATER: if (!(val > condition.threshold)) return false; break;
                case AnimatorConditionMode.LESS: if (!(val < condition.threshold)) return false; break;
                case AnimatorConditionMode.EQUALS: if (!(val === condition.threshold)) return false; break;
                case AnimatorConditionMode.NOTEQUALS: if (!(val !== condition.threshold)) return false; break;
                case AnimatorConditionMode.IF: if (!val) return false; break;
                case AnimatorConditionMode.IFNOT: if (val) return false; break;
            }
        }
        return true;
    }
}

export class AnimatorState {
    constructor(name, animationClip = null) {
        this.name = name;
        this.animationClip = animationClip; // { duration, frames, etc }
        this.transitions = [];
    }

    addTransition(targetStateName) {
        const transition = new AnimatorTransition(targetStateName);
        this.transitions.push(transition);
        return transition;
    }
}

export class AnimatorController {
    constructor() {
        this.states = new Map();
        this.parameters = {}; // { name: { type, value } }
        this.initialState = null;
    }

    addState(name, clip = null) {
        const state = new AnimatorState(name, clip);
        this.states.set(name, state);
        if (!this.initialState) this.initialState = name;
        return state;
    }

    addParameter(name, type, defaultValue) {
        this.parameters[name] = { type, value: defaultValue };
    }
}

export class Animator {
    constructor(controller) {
        this.controller = controller;
        this.currentState = controller.states.get(controller.initialState);
        this.parameters = {};
        // Initialize parameters with default values
        for (const name in controller.parameters) {
            this.parameters[name] = controller.parameters[name].value;
        }
        this.timeInState = 0;
        this.normalizedTime = 0; // 0.0 to 1.0 (useful for looping)
    }

    update(dt) {
        this.timeInState += dt;
        
        // Update normalized time if clip exists
        if (this.currentState.animationClip && this.currentState.animationClip.duration > 0) {
            this.normalizedTime = (this.timeInState / this.currentState.animationClip.duration) % 1.0;
        }

        // Check transitions
        for (const transition of this.currentState.transitions) {
            if (transition.check(this.parameters)) {
                this.changeState(transition.targetStateName);
                
                // Reset triggers after transition
                for (const cond of transition.conditions) {
                    const paramDef = this.controller.parameters[cond.parameterName];
                    if (paramDef && paramDef.type === AnimatorParameterType.TRIGGER) {
                        this.parameters[cond.parameterName] = false;
                    }
                }
                break;
            }
        }
    }

    changeState(newStateName) {
        if (this.currentState.name === newStateName) return;
        const nextState = this.controller.states.get(newStateName);
        if (nextState) {
            this.currentState = nextState;
            this.timeInState = 0;
            this.normalizedTime = 0;
        }
    }

    setFloat(name, value) { if (this.parameters.hasOwnProperty(name)) this.parameters[name] = value; }
    setBool(name, value) { if (this.parameters.hasOwnProperty(name)) this.parameters[name] = value; }
    setInteger(name, value) { if (this.parameters.hasOwnProperty(name)) this.parameters[name] = value; }
    setTrigger(name) { if (this.parameters.hasOwnProperty(name)) this.parameters[name] = true; }
    
    getFloat(name) { return this.parameters[name]; }
    getBool(name) { return this.parameters[name]; }
    
    // Helper to get current animation frame index (if using sprites)
    getCurrentFrameIndex(frameCount) {
        return Math.floor(this.normalizedTime * frameCount);
    }
}
