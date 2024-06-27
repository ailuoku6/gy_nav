export async function readFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    console.log('Text read from clipboard: ', text);
    return text;
  } catch (err) {
    console.error('Failed to read from clipboard: ', err);
  }
}

export async function writeToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Text copied to clipboard');
  } catch (err) {
    console.error('Failed to write to clipboard: ', err);
  }
}
