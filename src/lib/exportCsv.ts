export function exportToCsv<T extends Record<string, any>>(data: T[], filename: string) {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  
  const csvRows = [];
  // Add headers
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
  
  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const strVal = val === null || val === undefined ? '' : String(val);
      return `"${strVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) { // feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
