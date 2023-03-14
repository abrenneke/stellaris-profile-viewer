function parse_line(line, stack, i) {
  try {
    let num_spaces = line.match(/^\s*/)[0].length;
    let value = line.match(/^\s*\S+/)[0];
    line = line.slice(value.length).trim();

    let operation = '';
    let root_pct = NaN;
    let parent_pct = NaN;
    let other_pct = NaN;
    let total_time = NaN;
    let hits = null;
    let average = null;

    while (!value.endsWith('%') && line.length > 0) {
      operation += value;
      value = line.match(/^\s*\S+/)[0];
      line = line.slice(value.length).trim();
    }

    operation = operation.trim();
    if (operation === '') {
      operation = '(Unknown)';
    }
    root_pct = parseFloat(value) / 100;

    const [parent_pct_str, other_pct_str, total_time_str, hits_str, average_str] = line.split(/\s+/);

    // Get the remaining values
    parent_pct = parseFloat(parent_pct_str.replace('%', '')) / 100;
    other_pct = parseFloat(other_pct_str.replace('%', '')) / 100;
    total_time = parseFloat(total_time_str.replace('ms', ''));
    hits = parseInt(hits_str);
    average = average_str ? parseFloat(average_str) : total_time / hits;

    // Handle stack
    let parent_index = null;
    if (operation !== '(Unknown)') {
      stack_top = stack[stack.length - 1];
      while (stack.length > 0 && stack_top?.[0] >= num_spaces) {
        stack.pop();
        stack_top = stack[stack.length - 1];
      }

      if (stack_top) {
        parent_index = stack_top[1];
      }
    } else {
      // Two unknowns in a row, keep same indentation
      if (stack[stack.length - 1][2] === '(Unknown)') {
        stack.pop();
      }

      // Unknown operation automatically indents one
      parent_index = stack[stack.length - 1][1];
      num_spaces = stack[stack.length - 1][0] + 2;
    }

    stack.push([num_spaces, i, operation, parent_index]);

    return [operation, root_pct, parent_pct, other_pct, total_time, hits, average, parent_index, i];
  } catch (e) {
    const operation = line.split(/\s{2,}/)[0];
    throw new Error(`Line ${i}:
${e.message}

Operation: ${operation}

line:
${line}


stack:
${e.stack}`);
  }
}

function parse_profiling(lines, maxRoots = Number.MAX_SAFE_INTEGER) {
  const data = [];
  const stack = [];
  let foundRoots = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }

    const line_data = parse_line(line, stack, i);

    if (line_data !== null) {
      if (line_data.length === 9) {
        if (line_data[7] === null) {
          foundRoots++;
        }

        if (foundRoots > maxRoots) {
          break;
        }

        data.push(line_data);
      } else {
        console.error(`Line ${i}: Data length is ${line_data.length}: ${line_data}`);
        process.exit(1);
      }
    }
  }

  return data;
}

function build_tree(data) {
  // Create a map to keep track of each node by its index
  const nodes = new Map();
  for (const item of data) {
    const index = item[item.length - 1];
    const node = {
      data: item,
      children: [],
    };
    nodes.set(index, node);

    // If the node has a parent, add it as a child of the parent
    const parent_index = item[item.length - 2];
    if (parent_index !== null) {
      const parent_node = nodes.get(parent_index);
      parent_node.children.push(node);
    }
  }

  // Find the root nodes (nodes with no parent)
  const root_nodes = [];
  for (const node of nodes.values()) {
    if (node.data[node.data.length - 2] === null) {
      root_nodes.push(node);
    }
  }

  // If there are multiple root nodes, return a list of trees
  if (root_nodes.length > 1) {
    const trees = [];
    for (const root_node of root_nodes) {
      trees.push(build_subtree(root_node));
    }
    return trees;
  }

  // Otherwise, return the single root node
  return build_subtree(root_nodes[0]);
}

function build_subtree(node) {
  // Recursively build the subtree rooted at the given node
  const subtree = {
    operation: node.data[0],
    root_pct: node.data[1],
    parent_pct: node.data[2],
    other_pct: node.data[3],
    total_time: node.data[4],
    hits: node.data[5],
    children: [],
  };

  for (const child_node of node.children) {
    const child_subtree = build_subtree(child_node);
    subtree.children.push(child_subtree);
  }

  return subtree;
}
