const { parse, print, visit } = require("recast");
const { readFileSync } = require("fs");
const source = readFileSync("machine.js", { encoding: 'utf8' });
const ast = parse(source);
let gamma = [];
visit(ast, {
    visitExportNamedDeclaration(x) {
        const declaration = x.value.declaration.declarations[0];
        if (declaration.id.name == 'Gamma') {
           gamma = declaration.init.elements.map(x => x.value);
        }
        return false;
    }
});

let state_id = 0;

let states = [];
let transitions = [];

function formatLocation(location) {
    return `start: ${JSON.stringify(location.start)}, end: ${JSON.stringify(location.end)}`;
}

function validateArguments(body, arguments) {
    const expression = body.expression;
    if (expression.arguments.length !== arguments.length) {
        throw new Error(`Expected ${arguments.length} arguments, but given ${expression.arguments.length} arguments, ${formatLocation(body.loc)}`);
    }
    let argument_values = [];
    for (let i = 0; i < arguments.length; i++) {
        if (!arguments[i].includes(expression.arguments[i].value)) {
            throw new Error(`Unexpected argument value: ${expression.arguments[i].value} not contained in ${arguments[i]}, ${formatLocation(body.loc)}`);
        }
        argument_values.push(expression.arguments[i].value);
    }
    return argument_values;
}

function getState(prefix, fixed) {
    let state = `${prefix}_`;
    for (const x of fixed) {
        state = `${state}${x}`;
    }
    return state;
}

function* generateCombinations(count, fixed) {
    if (count === 0) {
        yield (fixed || []);
        return;
    }
    for (const x of gamma) {
        yield* generateCombinations(count - 1,  [...(fixed || []), x]);
    }
}

function createState(length) {
    const state = `q${state_id}`;
    state_id++;
    for (const combination of generateCombinations(length)) {
        states.push(getState(state, combination));
    }
    return state;
}

function testOperator(left, right, operator) {
    if (operator === '==') {
        return left === right;
    } else if (operator === '!=') {
        return left !== right;
    } else {
        throw new Error(`Unexpected operator: "${operator}"`);
    }
}

function translateCondition(test, start, variable_names) {
    const ok_state = createState(variable_names.length);
    const fail_state = createState(variable_names.length);
    if (test.type === 'LogicalExpression') {
        const [left_ok, left_fail] = translateCondition(test.left, start, variable_names);
        if (test.operator === '||') {
            const [right_ok, right_fail] = translateCondition(test.right, left_fail, variable_names);        
            for (const symbol of gamma) {
                for (const combination of generateCombinations(variable_names.length)) {
                    transitions.push([symbol, getState(left_ok, combination), symbol, getState(right_ok, combination), 'S']);
                }
            }
            return [right_ok, right_fail];
        } else if (test.operator === '&&') {
            const [right_ok, right_fail] = translateCondition(test.right, left_ok, variable_names);        
            for (const symbol of gamma) {
                for (const combination of generateCombinations(variable_names.length)) {
                    transitions.push([symbol, getState(left_fail, combination), symbol, getState(right_fail, combination), 'S']);
                }
            }
            return [right_ok, right_fail];
        } else {
            throw new Error(`Unexpected logical operator: "${test.operator}"`);
        }
    } else if (test.type === 'BinaryExpression' && (test.operator === '==' || test.operator === '!=')) {
        let left = test.left;
        let right = test.right;
        function validateIfArgument(argument) {
            if (argument.type !== 'Literal' && argument.type !== 'Identifier') {
                throw new Error(`Unexpected conditional operator operands: ${formatLocation(body.loc)}`);
            }
            if (argument.type === 'Literal' && !gamma.includes(argument.value)) {
                throw new Error(`Unexpected parameter of conditional operator: ${formatLocation(body.loc)}`);
            }
            if (argument.type === 'Identifier' && argument.name !== 'head' && !variable_names.includes(argument.name)) {
                throw new Error(`Unexpected variable in conditional operator: ${formatLocation(body.loc)}`);
            }
        }
        validateIfArgument(left);
        validateIfArgument(right);
        if (left.type === 'Literal' || (right.type === 'Identifier' && right.name === 'head')) {
            [left, right] = [right, left];
        }
        if (left.type === 'Literal') {
            throw new Error(`Useless conditional operator: ${formatLocation(body.loc)}`);
        }

        if (left.type === 'Identifier' && left.name === 'head') {
            if (right.type === 'Literal') {
                for (const symbol of gamma) {
                    for (const combination of generateCombinations(variable_names.length)) {
                        if (testOperator(symbol, right.value, test.operator)) {
                            transitions.push([symbol, getState(start, combination), symbol, getState(ok_state, combination), 'S']);
                        } else {
                            transitions.push([symbol, getState(start, combination), symbol, getState(fail_state, combination), 'S']);
                        }
                    }
                }
            } else if (right.type === 'Identifier') {
                const right_var = right.name;
                const right_index = variable_names.indexOf(right_var);
                for (const symbol of gamma) {
                    for (const combination of generateCombinations(variable_names.length)) {
                        if (testOperator(symbol, combination[right_index], test.operator)) {
                            transitions.push([symbol, getState(start, combination), symbol, getState(ok_state, combination), 'S']);
                        } else {
                            transitions.push([symbol, getState(start, combination), symbol, getState(fail_state, combination), 'S']);
                        }
                    }
                }
            }
        } else {
            const left_var = left.name;
            const left_index = variable_names.indexOf(left_var);
            if (right.type === 'Literal') {
                for (const symbol of gamma) {
                    for (const combination of generateCombinations(variable_names.length)) {
                        if (testOperator(combination[left_index], right.value, test.operator)) {
                            transitions.push([symbol, getState(start, combination), symbol, getState(ok_state, combination), 'S']);
                        } else {
                            transitions.push([symbol, getState(start, combination), symbol, getState(fail_state, combination), 'S']);
                        }
                    }
                }
            } else {
                const right_var = right.name;
                const right_index = variable_names.indexOf(right_var);
                for (const symbol of gamma) {
                    for (const combination of generateCombinations(variable_names.length)) {
                        if (testOperator(combination[left_index], combination[right_index], test.operator)) {
                            transitions.push([symbol, getState(start, combination), symbol, getState(ok_state, combination), 'S']);
                        } else {
                            transitions.push([symbol, getState(start, combination), symbol, getState(fail_state, combination), 'S']);
                        }
                    }
                }
            }
        }
    } else {
        throw new Error(`Unexpected conditional operator`);
    }
    return [ok_state, fail_state];
}

function translate(blocks, start, variable_names) {
    let current = start;
    let init_variables_len = variable_names.length;
    for (let block_id = 0; block_id < blocks.length; block_id++) {
        const body = blocks[block_id];
        if (body.type === 'ExportNamedDeclaration') {
            continue;
        } else if (body.type === 'VariableDeclaration') {
            if (body.declarations.length !== 1) {
                throw new Error(`Expected signel variable declaration but given ${body.declarations.length}, ${formatLocation(body.loc)}`);
            }
            const declaration = body.declarations[0];
            const name = declaration.id.name;
            if (name === 'head') {
                throw new Error(`Forbidden variable name, ${formatLocation(body.loc)}`);
            }
            if (declaration.init.type !== 'Literal' && declaration.init.type !== 'Identifier') {
                throw new Error(`Unexpected init expression type, ${formatLocation(body.loc)}`);
            }
            if (declaration.init.type === 'Literal' && !gamma.includes(declaration.init.value)) {
                throw new Error(`Unexpected init expression value: ${formatLocation(body.loc)}`);
            }
            if (declaration.init.type === 'Identifier' && declaration.init.name !== 'head' && !variable_names.includes(declaration.init.name)) {
                throw new Error(`Unexpected init expression variable: ${formatLocation(body.loc)}`);
            }
            const next_state = createState(variable_names.length + 1);
            if (declaration.init.type === 'Literal') {
                for (const symbol of gamma) {
                    for (const combination of generateCombinations(variable_names.length)) {
                        transitions.push([
                            symbol, getState(current, combination), 
                            symbol, getState(next_state, [...combination, declaration.init.value]), 'S'
                        ]);
                    }
                }
            } else if (declaration.init.type === 'Identifier' && declaration.init.name === 'head') {
                for (const symbol of gamma) {
                    for (const combination of generateCombinations(variable_names.length)) {
                        transitions.push([
                            symbol, getState(current, combination), 
                            symbol, getState(next_state, [...combination, symbol]), 'S'
                        ]);
                    }
                }
            } else {
                const init_var = declaration.init.name;
                const init_index = variable_names.indexOf(init_var);
                for (const symbol of gamma) {
                    for (const combination of generateCombinations(variable_names.length)) {
                        transitions.push([
                            symbol, getState(current, combination), 
                            symbol, getState(next_state, [...combination, combination[init_index]]), 'S'
                        ]);
                    }
                }
            }
            variable_names = [...variable_names, name];
            current = next_state;
        } else if (body.type === 'ExpressionStatement') {
            const expression = body.expression;
            if (expression.type === 'CallExpression') {
                const name = expression.callee.name;
                if (name === 'move_right' || name === 'move_left') {
                    validateArguments(body, []);
                    const next_state = createState(variable_names.length);
                    for (const symbol of gamma) {
                        for (const combination of generateCombinations(variable_names.length)) {
                            transitions.push([symbol, getState(current, combination), symbol, getState(next_state, combination), name == 'move_right' ? 'R' : 'L']);
                        }
                    }
                    current = next_state;
                } else if (name === 'write') {
                    if (expression.arguments.length !== 1) {
                        throw new Error(`Expected 1 argument, but given ${expression.arguments.length} arguments, ${formatLocation(body.loc)}`);
                    }
                    const next_state = createState(variable_names.length);
                    if (expression.arguments[0].type === 'Literal') {
                        const [next_symbol] = validateArguments(body, [gamma]);
                        for (const symbol of gamma) {
                            for (const combination of generateCombinations(variable_names.length)) {
                                transitions.push([symbol, getState(current, combination), next_symbol, getState(next_state, combination), 'S']);
                            }
                        }
                    } else if (expression.arguments[0].type === 'Identifier' && variable_names.includes(expression.arguments[0].name)) {
                        const name = expression.arguments[0].name;
                        const index = variable_names.indexOf(name);
                        for (const symbol of gamma) {
                            for (const combination of generateCombinations(variable_names.length)) {
                                transitions.push([
                                    symbol, getState(current, combination), 
                                    combination[index], getState(next_state, combination), 'S'
                                ]);
                            }
                        }
                    } else {
                        throw new Error(`Unexpected function argument, ${formatLocation(body.loc)}`);
                    }
                    current = next_state;
                }
            } else if (expression.type === 'AssignmentExpression') {
                if (expression.left.type !== 'Identifier' || !variable_names.includes(expression.left.name)) {
                    throw new Error(`Unexpected assignment operand type: ${formatLocation(body.loc)}`);
                }
                if (expression.right.type !== 'Literal' && expression.right.type !== 'Identifier') {
                    throw new Error(`Unexpected assignment operand type: ${formatLocation(body.loc)}`);
                }
                if (expression.right.type === 'Literal' && !gamma.includes(expression.right.value)) {
                    throw new Error(`Unexpected assignment operand value: ${formatLocation(body.loc)}`);
                }
                if (expression.right.type === 'Identifier' && expression.right.name !== 'head' && !variable_names.includes(expression.right.name)) {
                    throw new Error(`Unexpected assignment operand variable: ${formatLocation(body.loc)}`);
                }
                const left_var = expression.left.name;
                const left_index = variable_names.indexOf(left_var);
                const next_state = createState(variable_names.length);

                if (expression.right.type === 'Literal') {
                    const right_val = expression.right.value;
                    for (const symbol of gamma) {
                        for (const combination of generateCombinations(variable_names.length)) {
                            transitions.push([
                                symbol, getState(current, combination), 
                                symbol, getState(next_state, [...combination.slice(0, left_index), right_val, ...combination.slice(left_index + 1)]), 'S'
                            ]);
                        }
                    }
                } else if (expression.right.type === 'Identifier' && expression.right.name === 'head') {
                    for (const symbol of gamma) {
                        for (const combination of generateCombinations(variable_names.length)) {
                            transitions.push([
                                symbol, getState(current, combination), 
                                symbol, getState(next_state, [...combination.slice(0, left_index), symbol, ...combination.slice(left_index + 1)]), 'S'
                            ]);
                        }
                    }
                } else {
                    const right_var = expression.right.name;
                    const right_index = variable_names.indexOf(right_var);
                    for (const symbol of gamma) {
                        for (const combination of generateCombinations(variable_names.length)) {
                            transitions.push([
                                symbol, getState(current, combination), 
                                symbol, getState(next_state, [...combination.slice(0, left_index), combination[right_index], ...combination.slice(left_index + 1)]), 'S'
                            ]);
                        }
                    }
                }
                current = next_state;
            } else {
                throw new Error(`Unexpected expression type: ${expression.type}, ${formatLocation(body.loc)}`);
            }
        } else if (body.type === 'IfStatement') {
            const test = body.test;
            const [ok_state, fail_state] = translateCondition(test, current, variable_names);
            const final_if_state = translate(body.consequent.body, ok_state, variable_names);
            for (const symbol of gamma) {
                for (const combination of generateCombinations(variable_names.length)) {
                    transitions.push([
                            symbol, getState(fail_state, combination), 
                            symbol, getState(final_if_state, combination), 'S'
                    ]);
                }
            }
            current = final_if_state;
        } else if (body.type === 'WhileStatement') {
            const [ok_state, fail_state] = translateCondition(body.test, current, variable_names);
            const final_while_state = translate(body.body.body, ok_state, variable_names);
            for (const symbol of gamma) {
                for (const combination of generateCombinations(variable_names.length)) {
                    transitions.push([
                        symbol, getState(final_while_state, combination),
                        symbol, getState(current, combination), 'S'
                    ]);
                }
            }
            current = fail_state;
        }
    }
    const final_state = createState(init_variables_len);
    for (const symbol of gamma) {
        for (const combination of generateCombinations(variable_names.length)) {
            transitions.push([symbol, getState(current, combination), symbol, getState(final_state, combination.slice(0, init_variables_len)), 'S']);
        }
    }
    return final_state;
}

const start_state = createState(0);
const final_state = translate(ast.program.body, start_state, []);
console.info(states.length);
console.info(states.join(' '));
console.info(`${getState(start_state, [])} ${getState(final_state, [])}`);
console.info(transitions.length);
console.info(transitions.map(x => `${x[1]} ${x[0]} -> ${x[3]} ${x[2]} ${x[4]}`).join('\n'));
