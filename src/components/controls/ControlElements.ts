import { DrawingPad } from './DrawingPad';

// Create a simple UI panel for controls
export function createControlsPanel(): HTMLElement {
  // Create a section element for controls with minimal positioning
  const panel = document.createElement('section');
  
  // Add only the essential positioning to make controls visible
  panel.style.position = 'absolute';
  panel.style.top = '10px';
  panel.style.left = '10px';
  panel.style.zIndex = '1000';
  
  return panel;
}

// Add a button to the control panel
export function addButton(panel: HTMLElement, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = label;
  button.addEventListener('click', onClick);
  
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
  
  const sliderId = `slider-${Math.random().toString(36).substring(2, 9)}`;
  
  // Create the slider element first
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min.toString();
  slider.max = max.toString();
  slider.step = step.toString();
  slider.value = value.toString();
  slider.id = sliderId;
  
  // Put the slider first in the container
  container.appendChild(slider);
  
  // Create the label element and place it after the slider
  const labelElement = document.createElement('label');
  labelElement.htmlFor = sliderId;
  labelElement.textContent = `${label}: ${value}`;
  container.appendChild(labelElement);
  
  slider.addEventListener('input', () => {
    const newValue = parseFloat(slider.value);
    labelElement.textContent = `${label}: ${newValue}`;
    onChange(newValue);
  });
  
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
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.id = `checkbox-${Math.random().toString(36).substring(2, 9)}`;
  
  const labelElement = document.createElement('label');
  labelElement.htmlFor = checkbox.id;
  labelElement.textContent = label;
  
  checkbox.addEventListener('change', () => {
    onChange(checkbox.checked);
  });
  
  container.appendChild(checkbox);
  container.appendChild(labelElement);
  panel.appendChild(container);
  return checkbox;
}

// Add a group of radio buttons
export function addRadioGroup(
  panel: HTMLElement,
  label: string,
  options: Array<{ id: string, label: string, checked?: boolean }>,
  onChange: (selectedId: string) => void
): { radioGroup: HTMLElement, radioButtons: HTMLInputElement[] } {
  const container = document.createElement('div');
  
  const labelElement = document.createElement('label');
  labelElement.textContent = label;
  container.appendChild(labelElement);
  
  const radioGroup = document.createElement('div');
  
  const radioButtons: HTMLInputElement[] = [];
  
  // Create a unique group name for this set of radio buttons
  const groupName = `radio-group-${Math.random().toString(36).substring(2, 9)}`;
  
  options.forEach(option => {
    const radioContainer = document.createElement('div');
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.id = option.id;
    radio.name = groupName;
    radio.value = option.id;  // Set value to the option id
    radio.checked = option.checked || false;
    
    const radioLabel = document.createElement('label');
    radioLabel.htmlFor = option.id;
    radioLabel.textContent = option.label;
    
    radio.addEventListener('change', () => {
      if (radio.checked) {
        onChange(option.id);
      }
    });
    
    radioContainer.appendChild(radio);
    radioContainer.appendChild(radioLabel);
    radioGroup.appendChild(radioContainer);
    
    radioButtons.push(radio);
  });
  
  container.appendChild(radioGroup);
  panel.appendChild(container);
  
  return { radioGroup, radioButtons };
}

// Add a separator line
export function addSeparator(panel: HTMLElement): void {
  const separator = document.createElement('hr');
  panel.appendChild(separator);
}

// Add a text display that can be updated
export function addTextDisplay(panel: HTMLElement, label: string): { 
  container: HTMLElement, 
  valueElement: HTMLElement, 
  update: (text: string) => void 
} {
  const container = document.createElement('div');
  
  const labelElement = document.createElement('label');
  labelElement.textContent = `${label}: `;
  
  const valueElement = document.createElement('span');
  
  container.appendChild(labelElement);
  container.appendChild(valueElement);
  panel.appendChild(container);
  
  return {
    container,
    valueElement,
    update: (text: string) => {
      valueElement.textContent = text;
    }
  };
}

// Add a drawing pad canvas
export function addDrawingPad(
  panel: HTMLElement,
  width: number = 10,
  height: number = 10,
  onDataChange?: (data: number[][]) => void
): { 
  container: HTMLElement, 
  drawingPad: any, // We'll import DrawingPad type later
  clearButton: HTMLButtonElement,
  fillButton: HTMLButtonElement
} {
  const container = document.createElement('div');
  
  // Import and create drawing pad
  const drawingPad = new DrawingPad(width, height, 200, onDataChange);
  
  // Add canvas to container
  container.appendChild(drawingPad.getCanvas());
  
  // Create control buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '5px';
  buttonContainer.style.marginTop = '5px';
  
  const clearButton = document.createElement('button');
  clearButton.textContent = '🗑️ Clear';
  clearButton.addEventListener('click', () => drawingPad.clear());
  
  const fillButton = document.createElement('button');
  fillButton.textContent = '⬛ Fill';
  fillButton.addEventListener('click', () => drawingPad.fill());
  
  buttonContainer.appendChild(clearButton);
  buttonContainer.appendChild(fillButton);
  container.appendChild(buttonContainer);
  
  // Add instructions
  const instructions = document.createElement('small');
  instructions.textContent = 'Left click to draw, right click to erase';
  instructions.style.display = 'block';
  instructions.style.marginTop = '5px';
  instructions.style.color = '#666';
  container.appendChild(instructions);
  
  panel.appendChild(container);
  
  return {
    container,
    drawingPad,
    clearButton,
    fillButton
  };
}