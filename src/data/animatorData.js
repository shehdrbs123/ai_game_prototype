
import { AnimatorController, AnimatorParameterType, AnimatorConditionMode } from "../core/Animator.js";

export function createPlayerAnimatorController() {
    const controller = new AnimatorController();

    // 1. Parameters
    controller.addParameter('speed', AnimatorParameterType.FLOAT, 0);
    controller.addParameter('isAttacking', AnimatorParameterType.TRIGGER, false);
    controller.addParameter('isDashing', AnimatorParameterType.BOOL, false);
    controller.addParameter('isHurt', AnimatorParameterType.BOOL, false);
    controller.addParameter('isDead', AnimatorParameterType.BOOL, false);

    // 2. States
    const idle = controller.addState('Idle');
    const move = controller.addState('Move');
    const attack = controller.addState('Attack', { duration: 0.15 }); // 0.15s attack duration
    const dash = controller.addState('Dash', { duration: 0.2 });
    const hurt = controller.addState('Hurt');
    const dead = controller.addState('Dead');

    // 3. Transitions
    // Idle <-> Move
    idle.addTransition('Move').addCondition('speed', AnimatorConditionMode.GREATER, 0.1);
    move.addTransition('Idle').addCondition('speed', AnimatorConditionMode.LESS, 0.1);

    // Attacks (Any -> Attack) - simplified for now
    idle.addTransition('Attack').addCondition('isAttacking', AnimatorConditionMode.IF);
    move.addTransition('Attack').addCondition('isAttacking', AnimatorConditionMode.IF);

    // Attack -> Idle (Auto exit after duration can be handled in Animator update or by explicit trigger)
    // For now, we use a simple trigger or check time
    attack.addTransition('Idle').addCondition('speed', AnimatorConditionMode.LESS, 0.1);
    attack.addTransition('Move').addCondition('speed', AnimatorConditionMode.GREATER, 0.1);

    // Dash
    idle.addTransition('Dash').addCondition('isDashing', AnimatorConditionMode.IF);
    move.addTransition('Dash').addCondition('isDashing', AnimatorConditionMode.IF);
    dash.addTransition('Idle').addCondition('isDashing', AnimatorConditionMode.IFNOT);

    return controller;
}

export function createEnemyAnimatorController() {
    const controller = new AnimatorController();

    controller.addParameter('speed', AnimatorParameterType.FLOAT, 0);
    controller.addParameter('isAttacking', AnimatorParameterType.TRIGGER, false);
    controller.addParameter('isDead', AnimatorParameterType.BOOL, false);

    const idle = controller.addState('Idle');
    const move = controller.addState('Move');
    const attack = controller.addState('Attack', { duration: 0.5 });
    const dead = controller.addState('Dead');

    idle.addTransition('Move').addCondition('speed', AnimatorConditionMode.GREATER, 0.1);
    move.addTransition('Idle').addCondition('speed', AnimatorConditionMode.LESS, 0.1);
    
    idle.addTransition('Attack').addCondition('isAttacking', AnimatorConditionMode.IF);
    move.addTransition('Attack').addCondition('isAttacking', AnimatorConditionMode.IF);
    
    attack.addTransition('Idle').addCondition('speed', AnimatorConditionMode.LESS, 0.1);
    attack.addTransition('Move').addCondition('speed', AnimatorConditionMode.GREATER, 0.1);

    return controller;
}
