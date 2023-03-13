function parse_line(line, stack, i) {
    const match = line.match(/^(\s*)(.+)$/);
    if (!match) {
        throw new Error(line);
    }

    const num_spaces = match[1].length;
    line = match[2].trim();

    let parent_index = null;

    if (line) {
        let parts = line.split(' ').map(part => part.trim()).filter(part => part);

        if (parts.length < 6) {
            if (!parts.length) {
                return null;
            }

            return _handle_missing_operation(line, stack, i, parts);
        }

        let [operation] = line.split(/\s{2,}/);
        parts = line.slice(operation.length).split(/\s+/g).map(part => part.trim()).filter(part => part);

        let root_pct = NaN;
        let parent_pct = NaN;
        let other_pct = NaN;
        let total_time = NaN;
        let hits = NaN;
        let average = NaN;

        try {
            if (operation.replace('.', '').match(/^\d+$/) || operation.replace('%', '').replace('.', '').match(/^\d+$/)) {
                throw new Error(`Invalid operation name: ${operation}`);
            }

            root_pct = parseFloat(parts[0].replace('%', '')) / 100;
            parent_pct = parseFloat(parts[1].replace('%', '')) / 100;
            other_pct = parseFloat(parts[2].replace('%', '')) / 100;
            total_time = parseFloat(parts[3].replace('ms', ''));
            hits = parts.length > 4 && parts[4] !== '-' ? parseInt(parts[4]) : null;
            average = null;

        } catch (e) {
            throw new Error(`Error parsing line: ${line} - ${e}`);
        }

        if (num_spaces === 0) {
            parent_index = null;
            stack.length = 0;
        } else if (num_spaces > stack[stack.length - 1][0]) {
            parent_index = stack[stack.length - 1][1];
        } else {
            while (stack.length && stack[stack.length - 1][0] >= num_spaces) {
                stack.pop();
            }

            if (stack.length) {
                parent_index = stack[stack.length - 1][1];
            }
        }

        stack.push([num_spaces, i]);
        return [operation, root_pct, parent_pct, other_pct, total_time, hits, average, parent_index, i];

    } else {
        return null;
    }
}

function _handle_missing_operation(line, stack, i, parts) {
    let root_pct = NaN;
    let parent_pct = NaN;
    let other_pct = NaN;
    let total_time = NaN;
    let hits = NaN;
    let average = NaN;
    try {
        root_pct = parseFloat(parts[0].replace('%', '')) / 100;
        parent_pct = parseFloat(parts[1].replace('%', '')) / 100;
        other_pct = parseFloat(parts[2].replace('%', '')) / 100;
        total_time = parseFloat(parts[3].replace('ms', ''));
        hits = parts.length > 4 && parts[4] !== '-' ? parseInt(parts[4]) : null;
        average = null;

    } catch (e) {
        throw new Error(`Error parsing line: ${line} - ${e}`);
    }

    let parent_index, num_spaces;

    if (!stack.length) {
        parent_index = null;
        num_spaces = 0;
    } else {
        num_spaces = stack[stack.length - 1][0] + 2;
        parent_index = stack[stack.length - 1][1];
    }

    stack.push([num_spaces, i]);
    return ['(Unknown)', root_pct, parent_pct, other_pct, total_time, hits, average, parent_index, i];
}

export function parse_profiling(lines) {
    const data = [];
    const stack = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const line_data = parse_line(line, stack, i);

        if (line_data !== null) {
            if (line_data.length === 9) {
                data.push(line_data);
            } else {
                console.error(`Line ${i} data length is ${line_data.length}: ${line_data}`);
                process.exit(1);
            }
        }
    }

    return data;
}

export function build_tree(data) {
    // Create a map to keep track of each node by its index
    const nodes = new Map();
    for (const item of data) {
        const index = item[item.length - 1];
        const node = {
            data: item,
            children: []
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
        'operation': node.data[0],
        'root_pct': node.data[1],
        'parent_pct': node.data[2],
        'other_pct': node.data[3],
        'total_time': node.data[4],
        'hits': node.data[5],
        'children': []
    };

    for (const child_node of node.children) {
        const child_subtree = build_subtree(child_node);
        subtree.children.push(child_subtree);
    }

    return subtree;
}
