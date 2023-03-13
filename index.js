import { renderTable } from './rendering.js';
import { build_tree, parse_profiling } from './parser.js';

const input = document.getElementById("file");
input.type = 'file';
input.accept = '.log';

input.addEventListener('change', function () {
    const file = input.files[0];

    const reader = new FileReader();

    reader.onload = function () {
        const input_text = reader.result;

        const lines = input_text.replace(/\r\n/g, '\n').trim().split('\n').slice(1, -2);

        const data = parse_profiling(lines);
        const nested_data = build_tree(data);

        document.getElementById('entry-container').remove();
        renderTable(document.getElementById('container'), nested_data.slice(0, 100));
    };

    reader.readAsText(file);
});

document.body.appendChild(input);
