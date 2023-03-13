import { renderTable } from './rendering.js';

// index.js

const input = document.getElementById('file');
const rootItemsDropdown = document.getElementById('root-items-select');
input.type = 'file';
input.accept = '.log';

let rootItems = parseInt(rootItemsDropdown.value, 10);
let inputText = '';

// Create a new worker
const worker = new Worker('worker.js');

// Handle file selection
input.addEventListener('change', function () {
  const file = input.files[0];

  const reader = new FileReader();

  reader.onload = function () {
    document.getElementById('error-container').style.display = 'none';
    inputText = reader.result;

    worker.postMessage({ inputText, rootItems });

    document.getElementById('entry-container').style.display = 'none';
    document.getElementById('toolbar-select-file-button').style.display = 'flex';
  };

  reader.readAsText(file);
});

// Listen for messages from the worker
worker.addEventListener('message', (event) => {
  if (event.data.type === 'SUCCESS') {
    renderTable(document.getElementById('table-container'), event.data.data);
  } else if (event.data.type === 'ERROR') {
    showError(event.data.message);
  }
});

rootItemsDropdown.addEventListener('change', function () {
  rootItems = parseInt(this.value, 10);
  worker.postMessage({ inputText, rootItems });
});

const tryAgainButton = document.getElementById('try-again');

tryAgainButton.addEventListener('click', function () {
  input.click();
  document.getElementById('toolbar-select-file-button').style.display = 'none';
});

function showError(message) {
  const errorContainer = document.getElementById('error-container');
  const errorText = document.getElementById('error-message');
  errorText.innerText = message;
  errorContainer.style.display = 'block';
}
