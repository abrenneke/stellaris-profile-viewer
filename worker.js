importScripts('parser.js');

self.addEventListener('message', (event) => {
  const inputText = event.data.inputText;
  const rootItems = event.data.rootItems;
  const render = event.data.render;
  const download = event.data.download;
  const fileName = event.data.fileName;
  const downloadType = event.data.downloadType;

  try {
    const lines = inputText.replace(/\r\n/g, '\n').trim().split('\n').slice(1, -2);
    if (lines.length === 0) {
      throw new Error(`Failed to parse, 0 profiling lines were extracted.`);
    }

    const { data, numRoots, numEntries, totalTime } = parse_profiling(lines, rootItems);

    self.postMessage({
      type: 'PARSING_SUCCESS',
      data: data.slice(0, rootItems),
      numRoots,
      numEntries,
      totalTime
    });

    const nested_data = build_tree(data);

    self.postMessage({
      type: 'BUILDING_TREE_SUCCESS',
      data: nested_data.slice(0, rootItems)
    });

    if (render) {
      self.postMessage({
        type: 'DO_RENDER',
        data: true,
      });
    }

    if (download) {
      let fileData;
      if (downloadType === 'nested') {
        fileData = JSON.stringify(nested_data, null, 4);
      } else {
        const formatted = data.map(
          ([operation, root_pct, parent_pct, other_pct, total_time, hits, average, parent_index, i]) => ({
            operation,
            root_pct,
            parent_pct,
            other_pct,
            total_time,
            hits,
            average,
          })
        );
        fileData = JSON.stringify(formatted, null, 4);
      }
      if (fileData && fileName) {
        const blob = new Blob([fileData], { type: 'application/json;charset=utf-8' });
        self.postMessage({ type: 'DOWNLOAD_READY', blob: blob, fileName: fileName });
      }
    }
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: err.message });
  }
});
