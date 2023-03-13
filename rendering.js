function renderChildren(data, row, parentName = '') {
  const isRoot = data.root_pct === 1 && parentName === '';

  if (data.children) {
    const childContainer = document.createElement('div');
    childContainer.classList.add('child-container');

    const sortedChildren = data.children.sort((a, b) => b.parent_pct - a.parent_pct);

    for (let i = 0; i < sortedChildren.length; i++) {
      const childData = sortedChildren[i];
      const childRow = renderRow(childData, isRoot ? '' : data.operation);
      childRow.classList.add('child-row');
      childContainer.appendChild(childRow);
    }

    row.appendChild(childContainer);

    childContainer.style.display = 'none'; // hide child rows by default
  }
}

function formatTime(ms) {
  if (ms < 10) {
    return `${ms.toFixed(3)}ms`;
  } else if (ms < 100) {
    return `${ms.toFixed(2)}ms`;
  } else if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  } else if (ms < 60 * 1000) {
    const seconds = Math.floor(ms / 1000);
    return `${seconds.toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}m`;
  }
}

export function renderRow(data, parentName = '') {
  const isRoot = data.root_pct === 1 && parentName === '';

  const row = document.createElement('div');
  row.classList.add('table-row');
  row.classList.add(data.children ? 'parent-row' : 'leaf-row');
  row.dataset.open = 'false';

  const dataContainer = document.createElement('div');
  dataContainer.classList.add('data-container');

  const operationCol = document.createElement('div');
  operationCol.classList.add('operation-col');
  operationCol.innerText = data.operation;
  if (!isRoot && data.parent_pct !== 1.0) {
    const dimness = 0.15 + 0.85 * data.parent_pct;
    operationCol.style.color = `rgba(255,255,255,${dimness})`;
  }

  const rootPctCol = document.createElement('div');
  rootPctCol.classList.add('root-pct-col');
  if (isRoot) {
    rootPctCol.innerText = 'ROOT';
    rootPctCol.classList.add('is-root');
  } else if (data.parent_pct === 1.0) {
    rootPctCol.innerText = `${(data.root_pct * 100).toLocaleString()}% of parent`;
  } else {
    const rootText = `${(data.root_pct * 100).toLocaleString()}%`;
    rootPctCol.innerText = rootText.length > 14 ? rootText.substring(0, 14) + '...' : rootText;
  }

  const parentPctCol = document.createElement('div');
  parentPctCol.classList.add('parent-pct-col');
  if (parentName && data.parent_pct !== 1.0) {
    const parentText = `${(data.parent_pct * 100).toLocaleString()}% of `;
    const parentNameSpan = document.createElement('span');
    parentNameSpan.innerText = parentName;
    parentNameSpan.style.fontFamily = 'monospace';
    const parentTextSpan = document.createElement('span');
    parentTextSpan.innerText = parentText;
    parentPctCol.appendChild(parentTextSpan);
    parentPctCol.appendChild(parentNameSpan);
    parentPctCol.title = parentText + parentName;
    parentPctCol.style.whiteSpace = 'nowrap';
  }

  const totalTimeCol = document.createElement('div');
  totalTimeCol.classList.add('total-time-col');
  totalTimeCol.innerText = isRoot ? `${formatTime(data.total_time)} total` : formatTime(data.total_time);

  const hitsCol = document.createElement('div');
  hitsCol.classList.add('hits-col');
  hitsCol.innerText = isRoot
    ? `${data.hits.toLocaleString()} hits`
    : data.hits.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const averageCol = document.createElement('div');
  averageCol.classList.add('average-col');
  const averageText = data.hits ? `avg ${formatTime(data.total_time / data.hits)}` : '';
  averageCol.innerText = averageText;

  const indicator = document.createElement('span');
  indicator.classList.add('indicator');
  indicator.innerText = data.children ? '' : '';

  dataContainer.appendChild(indicator);
  dataContainer.appendChild(operationCol);
  dataContainer.appendChild(rootPctCol);
  dataContainer.appendChild(parentPctCol);
  // dataContainer.appendChild(otherPctCol);
  dataContainer.appendChild(totalTimeCol);
  dataContainer.appendChild(hitsCol);
  dataContainer.appendChild(averageCol);

  row.appendChild(dataContainer);

  renderChildren(data, row, parentName);

  return row;
}

export function handleClick(event) {
  const row = event.target.closest('.table-row');
  if (!row) {
    return;
  }

  toggleRow(row);
}

function toggleRow(row) {
  const open = row.dataset.open === 'true';

  // toggle open state
  row.dataset.open = (!open).toString();

  // toggle visibility of child container
  const childContainer = row.querySelector('.child-container');
  if (childContainer) {
    childContainer.style.display = open ? 'none' : 'flex';

    // toggle child rows if there's only one child
    const children = Array.from(childContainer.children).filter((child) => child.classList.contains('table-row'));
    if (children.length === 1) {
      toggleRow(children[0]);
    }
  }
}

export function renderTable(container, data) {
  for (let i = 0; i < data.length; i++) {
    const rowData = data[i];
    const rowNode = renderRow(rowData);
    container.appendChild(rowNode);
  }
}
