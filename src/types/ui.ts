
/**
 * Interface for UI control elements
 */
export interface ControlElement {
  container: HTMLElement;
  valueElement?: HTMLElement;
  inputElement?: HTMLInputElement;
}

/**
 * Interface for slider control configuration
 */
export interface SliderOptions {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

/**
 * Interface for checkbox control configuration
 */
export interface CheckboxOptions {
  checked: boolean;
  onChange: (checked: boolean) => void;
}
