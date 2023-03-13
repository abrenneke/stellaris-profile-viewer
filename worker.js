importScripts('parser.js');

self.addEventListener('message', (event) => {
  const inputText = event.data.inputText;
  const rootItems = event.data.rootItems;

  try {
    const lines = inputText.replace(/\r\n/g, '\n').trim().split('\n').slice(1, -2);
    if (lines.length === 0) {
      throw new Error(`Failed to parse, 0 profiling lines were extracted.`);
    }

    const data = parse_profiling(lines, rootItems);
    const nested_data = build_tree(data);

    self.postMessage({
      type: 'SUCCESS',
      data: nested_data.slice(0, rootItems),
    });
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: err.message });
  }
});
