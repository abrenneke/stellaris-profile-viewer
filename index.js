import { renderTable } from './rendering.js';
import { build_tree, parse_profiling } from './parser.js';

const input = document.getElementById("file");
const rootItemsDropdown = document.getElementById('root-items-select');
input.type = 'file';
input.accept = '.log';

let root_items = parseInt(rootItemsDropdown.value, 10);
let lines = [];

// Handle file selection
input.addEventListener('change', function () {
    const file = input.files[0];

    const reader = new FileReader();

    reader.onload = function () {
        document.getElementById("error-container").style.display = 'none';
        const input_text = reader.result;

        lines = input_text.replace(/\r\n/g, '\n').trim().split('\n').slice(1, -2);

        try {
            if (lines.length === 0) {
                throw new Error(`Failed to parse, 0 profiling lines were extracted.`);
            }

            const data = parse_profiling(lines, root_items);
            const nested_data = build_tree(data);
            renderTable(document.getElementById('table-container'), nested_data.slice(0, root_items));

            document.getElementById('entry-container').style.display = 'none';
            document.getElementById('toolbar-select-file-button').style.display = 'flex';
        } catch (err) {
            document.getElementById('entry-container').style.display = 'none';
            showError(err.message);
        }
    };

    reader.readAsText(file);
});

rootItemsDropdown.addEventListener('change', function () {
    root_items = parseInt(this.value, 10);
    const data = parse_profiling(lines, root_items);
    const nested_data = build_tree(data);
    renderTable(document.getElementById('table-container'), nested_data.slice(0, root_items));
});


const tryAgainButton = document.getElementById('try-again');

tryAgainButton.addEventListener('click', function () {
    input.click();
    document.getElementById('toolbar-select-file-button').style.display = 'none';
});

function showError(message) {
    const errorContainer = document.getElementById("error-container");
    const errorText = document.getElementById('error-message')
    errorText.innerText = message;
    errorContainer.style.display = "block";
}
