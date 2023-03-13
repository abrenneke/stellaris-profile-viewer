import { renderTable, handleClick } from './rendering.js';

const input = document.getElementById('file');
const rootItemsDropdown = document.getElementById('root-items-select');
const spinner = document.getElementById('spinner-container');
const tableContainer = document.getElementById('table-container');

let rootItems = parseInt(rootItemsDropdown.value, 10);
let inputText = '';

// Create a new worker
const worker = new Worker('worker.js');

function render() {
  while (tableContainer.firstChild) {
    tableContainer.removeChild(tableContainer.lastChild);
  }

  worker.postMessage({ inputText, rootItems });
  spinner.style.display = 'flex';

  document.getElementById('entry-container').style.display = 'none';
  document.getElementById('toolbar-select-file-button').style.display = 'flex';
}

tableContainer.addEventListener('click', handleClick);

input.addEventListener('change', function () {
  const file = input.files[0];

  const reader = new FileReader();

  reader.onload = function () {
    document.getElementById('error-container').style.display = 'none';
    inputText = reader.result;

    render();
  };

  reader.readAsText(file);
});

// Listen for messages from the worker
worker.addEventListener('message', (event) => {
  spinner.style.display = 'none';
  if (event.data.type === 'SUCCESS') {
    renderTable(tableContainer, event.data.data);
  } else if (event.data.type === 'ERROR') {
    showError(event.data.message);
  }
});

rootItemsDropdown.addEventListener('change', function () {
  rootItems = parseInt(this.value, 10);
  render();
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
