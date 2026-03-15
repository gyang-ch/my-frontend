const fs = require('fs');

const path = 'src/components/BookReader.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /grid-template-columns: \`1fr auto \$\{sidePanelWidth\}px\`/g,
  "gridTemplateColumns: `minmax(0, 1fr) auto ${sidePanelWidth}px`"
);

fs.writeFileSync(path, content);
