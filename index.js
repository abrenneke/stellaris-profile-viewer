import { renderTable } from './rendering.js';
import { build_tree, parse_profiling } from './parser.js';

const input = document.getElementById("file");
input.type = 'file';
input.accept = '.log';

input.addEventListener('change', function () {
    const file = input.files[0];

    const reader = new FileReader();

    reader.onload = function () {
        document.getElementById("error-container").style.display = 'none';
        const input_text = reader.result;

        const lines = input_text.replace(/\r\n/g, '\n').trim().split('\n').slice(1, -2);

        try {
            const data = parse_profiling(lines);

            if (data.length === 0) {
                throw new Error(`Failed to parse, 0 profiling lines were extracted.`);
            }

            const nested_data = build_tree(data);

            document.getElementById('entry-container').style.display = 'none';
            renderTable(document.getElementById('container'), nested_data.slice(0, 100));

            document.getElementById('toolbar-select-file-button').style.display = 'flex';
        } catch (err) {
            document.getElementById('entry-container').style.display = 'none';
            showError(err.message);
        }
    };

    reader.readAsText(file);
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
