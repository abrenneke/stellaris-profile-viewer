import { renderTable, handleClick } from './rendering.js';

const input = document.getElementById('file');
const rootItemsDropdown = document.getElementById('root-items-select');
const spinner = document.getElementById('spinner-container');
const tableContainer = document.getElementById('table-container');

let rootItems = parseInt(rootItemsDropdown.value, 10);
let inputText = '';
let parsedData = [];
let nestedData = [];

// Create a new worker
const worker = new Worker('worker.js');

function render() {
  while (tableContainer.firstChild) {
    tableContainer.removeChild(tableContainer.lastChild);
  }

  worker.postMessage({ inputText, rootItems, render: true });
  spinner.style.display = 'flex';

  document.getElementById('entry-container').style.display = 'none';
  document.getElementById('toolbar-select-file-button').style.display = 'flex';

  // Show the export JSON buttons when the table is present
  document.getElementById('export-json-button').style.display = 'flex';
  document.getElementById('export-nested-json-button').style.display = 'flex';
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

worker.addEventListener('message', (event) => {
  if (event.data.type === 'PARSING_SUCCESS') {
    parsedData = event.data.data;
  } else if (event.data.type === 'BUILDING_TREE_SUCCESS') {
    nestedData = event.data.data;
  } else if (event.data.type === 'DO_RENDER') {
    spinner.style.display = 'none';
    renderTable(tableContainer, nestedData);
  } else if (event.data.type === 'ERROR') {
    showError(event.data.message);
  } else if (event.data.type === 'DOWNLOAD_READY') {
    spinner.style.display = 'none';
    const { fileName, blob } = event.data;
    downloadJsonFile(blob, fileName);
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
  errorContainer.style.display = 'flex';
}

function downloadJsonFile(blob, fileName) {
  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
}

document.getElementById('export-json-button').addEventListener('click', () => {
  const rootItems = Number.MAX_SAFE_INTEGER;
  const download = 'JSON';
  const fileName = `profiling-data-${Date.now()}.json`;

  spinner.style.display = 'flex';

  // Trigger the worker to parse the input and prepare for download
  worker.postMessage({ inputText, rootItems, download, downloadType: '', fileName });
});

document.getElementById('export-nested-json-button').addEventListener('click', () => {
  const rootItems = Number.MAX_SAFE_INTEGER;
  const download = 'NESTED_JSON';
  const fileName = `nested-profiling-data-${Date.now()}.json`;

  spinner.style.display = 'flex';

  // Trigger the worker to parse the input and prepare for download
  worker.postMessage({ inputText, rootItems, download, downloadType: 'nested', fileName });
});
