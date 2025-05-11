import { ControlElement, SliderOptions } from '../../types/ui';

// Create a simple UI panel for controls
export function createControlsPanel(): HTMLElement {
  // Create a section element for better semantics
  const panel = document.createElement('section');
  
  // Add minimal positioning to make controls visible
  panel.style.position = 'absolute';
  panel.style.top = '10px';
  panel.style.left = '10px';
  panel.style.zIndex = '1000';
  panel.style.backgroundColor = 'white';
  panel.style.padding = '10px';
  panel.style.border = '1px solid black';
  panel.style.minWidth = '250px';
  panel.style.maxHeight = '90vh';
  panel.style.overflowY = 'auto';
  
  return panel;
}

// Add a button to the control panel
export function addButton(panel: HTMLElement, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = label;
  button.style.margin = '2px';
  button.style.padding = '4px 8px';
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
  container.style.margin = '6px 0';
  
  const sliderId = `slider-${Math.random().toString(36).substring(2, 9)}`;
  
  const labelElement = document.createElement('label');
  labelElement.htmlFor = sliderId;
  labelElement.textContent = `${label}: ${value}`;
  labelElement.style.display = 'block';
  labelElement.style.marginBottom = '3px';
  container.appendChild(labelElement);
  
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min.toString();
  slider.max = max.toString();
  slider.step = step.toString();
  slider.value = value.toString();
  slider.id = sliderId;
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
  container.style.margin = '4px 0';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.id = `checkbox-${Math.random().toString(36).substring(2, 9)}`;
  
  const labelElement = document.createElement('label');
  labelElement.htmlFor = checkbox.id;
  labelElement.textContent = label;
  labelElement.style.marginLeft = '4px';
  
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
  container.style.margin = '6px 0';
  
  const labelElement = document.createElement('label');
  labelElement.textContent = label;
  labelElement.style.display = 'block';
  labelElement.style.marginBottom = '4px';
  container.appendChild(labelElement);
  
  const radioGroup = document.createElement('div');
  
  const radioButtons: HTMLInputElement[] = [];
  
  // Create a unique group name for this set of radio buttons
  const groupName = `radio-group-${Math.random().toString(36).substring(2, 9)}`;
  
  options.forEach(option => {
    const radioContainer = document.createElement('div');
    radioContainer.style.margin = '3px 0';
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.id = option.id;
    radio.name = groupName;
    radio.checked = option.checked || false;
    
    const radioLabel = document.createElement('label');
    radioLabel.htmlFor = option.id;
    radioLabel.textContent = option.label;
    radioLabel.style.marginLeft = '4px';
    
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
  separator.style.margin = '10px 0';
  separator.style.borderTop = '1px solid #ddd';
  separator.style.borderBottom = 'none';
  panel.appendChild(separator);
}

// Add a text display that can be updated
export function addTextDisplay(panel: HTMLElement, label: string): { 
  container: HTMLElement, 
  valueElement: HTMLElement, 
  update: (text: string) => void 
} {
  const container = document.createElement('div');
  container.style.margin = '5px 0';
  
  const labelElement = document.createElement('label');
  labelElement.textContent = `${label}: `;
  labelElement.style.fontWeight = 'normal';
  
  const valueElement = document.createElement('span');
  valueElement.style.fontWeight = 'bold';
  
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