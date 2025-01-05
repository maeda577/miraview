import type { CDSTextInput } from '@carbon/web-components/es/index.d.ts';

function validateInputEndpoint() {
  const inputEndpoint = document.getElementById('input-endpoint') as CDSTextInput;
  inputEndpoint.warn = !inputEndpoint.value;
  inputEndpoint.invalid = !!inputEndpoint.value && !URL.canParse(inputEndpoint.value);
  return !inputEndpoint.invalid;
}

function saveConfig() {
  validateInputEndpoint();
}

// const currentConfig = loadConfig();

document.getElementById('input-endpoint')?.addEventListener('input', validateInputEndpoint);
document.getElementById('button-save')?.addEventListener('click', saveConfig);
