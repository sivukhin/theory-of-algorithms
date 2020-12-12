## Translator

Simple translator from JS-like language to the Turing-machine description

```js
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
```
