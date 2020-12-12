export const Gamma = ['0', '1', '_'];
let sum = '0';
while (head != '_') {
    let current = sum;
    if (head == '1' && current == '0') {
        sum = '1';
    }
    if (head == '1' && current == '1') {
        sum = '0';
    }
    write('_');
    move_right();
}
write(sum);
/*
export const Gamma = ['0', '1', 'a', 'b', '*', '=', '_'];
move_left();
write('=');
move_left();
write('a');
move_right();
move_right();
while (head != '_') {
    move_right();
}
move_left();
if (head == '0') {
    write('a');
}
if (head == '1') {
    write('b');
}
while (head != '*') {
    move_left();
}
move_left();
while (head != '=') {
    if (head == '0') {
        write('_');
    }
    if (head == '1') {
        while (head != 'a' && head != 'b') {
            move_right();
        }
        if (head == 'b') {
            while (head != '=') {
                move_left();
            }
            while (head != 'a' && head != 'b') {
                move_left();
            }
            while (head == 'b' || head == '1') {
                if (head == 'b') {
                    write('a');
                }
                if (head == '1') {
                    write('0');
                }
                move_left();
            }
            if (head == 'a') {
                write('b');
            }
            if (head == '0' || head == '_') {
                write('1');
            }
        }
    }
    while (head != '=') {
        move_left();
    }
    while (head != 'a' && head != 'b') {
        move_left();
    }
    if (head == 'a') {
        write('0');
    }
    if (head == 'b') {
        write('1');
    }
    move_left();
    if (head == '0' || head == '_') {
        write('a');
    }
    if (head == '1') {
        write('b');
    }
    while (head != '_') {
        move_right();
    }
    move_left();
}
*/
/*
export const Gamma = ['a', 'b', 'x', '_', '0', '1'];
move_left();
move_left();
write('0');
move_right();
move_right();
let stop = '0';
while (stop == '0') {
    while (head != '_') {
        move_right();
    }
    move_right();
    if (head == 'a') {
        write('0');
    }
    if (head == 'b') {
        write('1');
    }
    if (head == '_') {
        stop = '1';
    }
    move_left();
    move_left();
    while (head != '_') {
        move_left();
    }
    move_right();
    if (stop == '0') {
        let match = '1';
        while (head != '_' && match == '1') {
            let current = head;
            write('x');
            while (head != '_') {
                move_right();
            }
            move_right();
            while (head != '0' && head != '1' && head != '_') {
                move_right();
            }
            if (head == '_' || (current == 'a' && head == '1') || (current == 'b' && head == '0')) {
                match = '0';
            }
            if (head == '0') {
                write('a');
            }
            if (head == '1') {
                write('b');
            }
            move_right();
            if (head == 'a') {
                write('0');
            }
            if (head == 'b') {
                write('1');
            }
            while (head != 'x') {
                move_left();
            }
            write(current);
            move_right();
        }
        while (head != '_') {
            move_right();
        }
        move_right();
        while (head != '_') {
            move_right();
            let capture = head;
            move_left();
            if (capture == '0' || capture == 'a') {
                write('a');
            }
            if (capture == '1' || capture == 'b') {
                write('b');
            }
            if (capture == '_') {
                write('_');
            }
            move_right();
        }
        while (head != '0' && head != '1') {
            move_left();
        }
        if (match == '1') {
            while (head == '1') {
                write('0');
                move_left();
            }
            write('1');
        }
        while (head != 'a' && head != 'b') {
            move_right();
        }
    }
}

while (head == 'a' || head == 'b') {
    write('_');
    move_right();
}
while (head == '_') {
    move_left();
}
while (head == '0' || head == '1') {
    move_left();
}
move_right();
*/

/*
export const Gamma = ['1', '0', '_'];
let power2 = '1';
let while_stop = '0';

while (head != '_' && power2 == '1' && while_stop == '0') {
    if (head == '1') {
        move_right();
        if (head == '_') {
            while_stop = '1';
        }
        move_left();
    }
    if (while_stop == '0') {
        while (head != '_') {
            move_right();
            if (head == '_') {
                power2 = '0';
            }
            if (head != '_') {
                write('0');
                move_right();
            }
        }
        move_left();
        if (power2 == '1') {
            while (head == '0') {
                write('_');
                move_right();
                while (head == '1') {
                    write('_');
                    move_left();
                    write('1');
                    move_right();
                    move_right();
                }
                move_left();
                move_left();
                while (head == '1') {
                    move_left();
                }
            }
            move_right();
        }
        if (power2 == '0') {
            while (head != '_') {
                write('_');
                move_left();
            }
        }
    }
}
write(power2);
*/
