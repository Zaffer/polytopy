// Create a simple UI panel for controls
export function createControlsPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.style.position = 'absolute';
  panel.style.top = '10px';
  panel.style.left = '10px';
  panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  panel.style.padding = '10px';
  panel.style.borderRadius = '5px';
  panel.style.color = 'white';
  panel.style.fontFamily = 'Arial, sans-serif';
  panel.style.zIndex = '1000';
  panel.style.minWidth = '200px';

  // Title
  const title = document.createElement('h3');
  title.textContent = 'Neural Network Controls';
  title.style.margin = '0 0 10px 0';
  title.style.textAlign = 'center';
  panel.appendChild(title);

  return panel;
}

// Add a button to the control panel
export function addButton(panel: HTMLElement, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = label;
  button.style.display = 'block';
  button.style.width = '100%';
  button.style.margin = '5px 0';
  button.style.padding = '5px';
  button.style.backgroundColor = '#3498db';
  button.style.border = 'none';
  button.style.borderRadius = '3px';
  button.style.color = 'white';
  button.style.cursor = 'pointer';
  button.addEventListener('click', onClick);
  
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#2980b9';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#3498db';
  });
  
  panel.appendChild(button);
  return button;
}

// Add a slider control to the panel
export function addSlider(
  panel: HTMLElement, 
  label: string, 
  min: number, 
  max: number, 
  value: number, 
  step: number,
  onChange: (value: number) => void
): HTMLInputElement {
  const container = document.createElement('div');
  container.style.margin = '10px 0';
  
  const labelElement = document.createElement('label');
  labelElement.textContent = `${label}: ${value}`;
  labelElement.style.display = 'block';
  labelElement.style.marginBottom = '5px';
  container.appendChild(labelElement);
  
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min.toString();
  slider.max = max.toString();
  slider.step = step.toString();
  slider.value = value.toString();
  slider.style.width = '100%';
  
  slider.addEventListener('input', () => {
    const newValue = parseFloat(slider.value);
    labelElement.textContent = `${label}: ${newValue}`;
    onChange(newValue);
  });
  
  container.appendChild(slider);
  panel.appendChild(container);
  return slider;
}

// Add a checkbox to the panel
export function addCheckbox(
  panel: HTMLElement,
  label: string,
  checked: boolean,
  onChange: (checked: boolean) => void
): HTMLInputElement {
  const container = document.createElement('div');
  container.style.margin = '5px 0';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.style.marginRight = '5px';
  
  const labelElement = document.createElement('label');
  labelElement.textContent = label;
  
  checkbox.addEventListener('change', () => {
    onChange(checkbox.checked);
  });
  
  container.appendChild(checkbox);
  container.appendChild(labelElement);
  panel.appendChild(container);
  return checkbox;
}

// Add a separator line
export function addSeparator(panel: HTMLElement): void {
  const separator = document.createElement('hr');
  separator.style.margin = '10px 0';
  separator.style.border = '0';
  separator.style.borderTop = '1px solid rgba(255, 255, 255, 0.3)';
  panel.appendChild(separator);
}

// Add a text display that can be updated
export function addTextDisplay(panel: HTMLElement, label: string): { 
  container: HTMLElement, 
  update: (text: string) => void 
} {
  const container = document.createElement('div');
  container.style.margin = '5px 0';
  
  const labelElement = document.createElement('span');
  labelElement.textContent = `${label}: `;
  
  const valueElement = document.createElement('span');
  valueElement.style.fontWeight = 'bold';
  
  container.appendChild(labelElement);
  container.appendChild(valueElement);
  panel.appendChild(container);
  
  return {
    container,
    update: (text: string) => {
      valueElement.textContent = text;
    }
  };
}