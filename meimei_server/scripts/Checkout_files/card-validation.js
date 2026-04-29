// Credit Card Validation and Formatting Script
// This script provides real-time formatting and validation for credit card fields

(function() {
  'use strict';

  // Wait for DOM to be fully loaded
  function initValidation() {
    // Get form elements
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvvInput = document.getElementById('card-verification_value');
    const cardNameInput = document.getElementById('card-name');
    
    // Shipping address fields
    const firstNameInput = document.getElementById('TextField0');
    const lastNameInput = document.getElementById('TextField1');
    const addressInput = document.getElementById('shipping-address1');
    const postalCodeInput = document.getElementById('TextField3');
    const phoneInput = document.getElementById('TextField4');
    
    // Debug: Check if elements exist
    console.log('Card validation initialized');
    console.log('Card Number:', cardNumberInput ? 'Found' : 'NOT FOUND');
    console.log('First Name:', firstNameInput ? 'Found' : 'NOT FOUND');
    console.log('Last Name:', lastNameInput ? 'Found' : 'NOT FOUND');
    console.log('Address:', addressInput ? 'Found' : 'NOT FOUND');
    console.log('Postal Code:', postalCodeInput ? 'Found' : 'NOT FOUND');
    console.log('Phone:', phoneInput ? 'Found' : 'NOT FOUND');

  // Card type configuration
  const cardTypes = {
    visa: {
      pattern: /^4/,
      name: 'Visa',
      cvvLength: 3,
      numberLength: 16,
      color: '#1A1F71'
    },
    mastercard: {
      pattern: /^(5[1-5]|2[2-7])/,
      name: 'MasterCard',
      cvvLength: 3,
      numberLength: 16,
      color: '#EB001B'
    },
    amex: {
      pattern: /^3[47]/,
      name: 'American Express',
      cvvLength: 4,
      numberLength: 15,
      color: '#006FCF'
    },
    discover: {
      pattern: /^(6011|65|64[4-9])/,
      name: 'Discover',
      cvvLength: 3,
      numberLength: 16,
      color: '#FF6000'
    },
    jcb: {
      pattern: /^(?:2131|1800|35)/,
      name: 'JCB',
      cvvLength: 3,
      numberLength: 16,
      color: '#003B80'
    }
  };

  // Currently detected card type
  let currentCardType = null;

  /**
   * Detect card type based on number
   */
  function detectCardType(number) {
    const cleanNumber = number.replace(/\s/g, '');
    for (const [type, config] of Object.entries(cardTypes)) {
      if (config.pattern.test(cleanNumber)) {
        return { type, ...config };
      }
    }
    return null;
  }

  /**
   * Luhn algorithm for card number validation
   */
  function luhnCheck(number) {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.length < 13) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Format card number (add space every 4 digits)
   */
  function formatCardNumber(number) {
    const cleanNumber = number.replace(/\s/g, '').replace(/\D/g, '');
    const cardInfo = detectCardType(cleanNumber);
    
    let maxLength = 19; // Default max length (16 digits + 3 spaces)
    if (cardInfo && cardInfo.type === 'amex') {
      maxLength = 17; // AMEX: 15 digits + 2 spaces (4-6-5)
    }

    if (cardInfo && cardInfo.type === 'amex') {
      // AMEX format: 4-6-5
      if (cleanNumber.length > 4 && cleanNumber.length <= 10) {
        return cleanNumber.slice(0, 4) + ' ' + cleanNumber.slice(4);
      } else if (cleanNumber.length > 10) {
        return cleanNumber.slice(0, 4) + ' ' + cleanNumber.slice(4, 10) + ' ' + cleanNumber.slice(10, 15);
      }
    }

    // Other card types format: 4-4-4-4
    const matches = cleanNumber.match(/.{1,4}/g);
    return matches ? matches.join(' ') : cleanNumber;
  }

  /**
   * Format expiry date
   */
  function formatExpiryDate(value) {
    const cleanValue = value.replace(/\s/g, '').replace(/\//g, '').replace(/\D/g, '');
    
    if (cleanValue.length >= 2) {
      const month = cleanValue.slice(0, 2);
      const year = cleanValue.slice(2, 4);
      
      if (year) {
        return month + ' / ' + year;
      }
      return month;
    }
    
    return cleanValue;
  }

  /**
   * Show error message
   */
  function showError(input, message) {
    input.setCustomValidity(message);
    
    // Add red border to input
    input.style.borderBottom = '2px solid #e32c2b';
    
    // Find the parent wrapper
    const wrapper = input.closest('.Uq6Ln') || input.closest('.W16eS') || input.closest('._7ozb2u2') || input.parentElement;
    
    // Remove old error message (if exists)
    const existingError = wrapper.querySelector('.field-error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Add new error message below the input using absolute positioning
    if (message) {
      // Make wrapper positioned for absolute child
      const wrapperPosition = window.getComputedStyle(wrapper).position;
      if (wrapperPosition === 'static') {
        wrapper.style.position = 'relative';
      }
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error-message';
      errorDiv.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        color: #e32c2b;
        font-size: 1.2rem;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        line-height: 1.5;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 100;
        background: white;
      `;
      
      // Add error icon
      errorDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="14" height="14" fill="none" style="flex-shrink: 0;">
          <circle cx="7" cy="7" r="5.5" stroke="#e32c2b" stroke-width="1.4"/>
          <path stroke="#e32c2b" stroke-width="1.4" stroke-linecap="round" d="M7 4.5v3"/>
          <circle cx="7" cy="9.5" r="0.5" fill="#e32c2b"/>
        </svg>
        <span>${message}</span>
      `;
      
      // Insert after the input wrapper
      if (wrapper.classList.contains('W16eS') || wrapper.classList.contains('_7ozb2u6')) {
        wrapper.parentElement.style.position = 'relative';
        wrapper.parentElement.appendChild(errorDiv);
      } else {
        wrapper.appendChild(errorDiv);
      }
    }
  }

  /**
   * Clear error message
   */
  function clearError(input) {
    input.setCustomValidity('');
    
    // Remove red border
    input.style.borderBottom = '';
    
    // Find the parent wrapper - same logic as showError
    const wrapper = input.closest('.Uq6Ln') || input.closest('.W16eS') || input.closest('._7ozb2u2') || input.parentElement;
    
    // Remove error message from wrapper
    const existingError = wrapper.querySelector('.field-error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Also check parent element (for W16eS and _7ozb2u6 wrappers)
    if (wrapper.parentElement) {
      const parentError = wrapper.parentElement.querySelector('.field-error-message');
      if (parentError) {
        parentError.remove();
      }
    }
  }

  /**
   * Update card type icon display
   */
  function updateCardTypeIcon(cardInfo) {
    const visaIcon = document.getElementById('vt-962fed81aaaeb2a6883f64235d20bc64-VISA');
    const mcIcon = document.getElementById('vt-962fed81aaaeb2a6883f64235d20bc64-MASTERCARD');
    const amexIcon = document.getElementById('vt-962fed81aaaeb2a6883f64235d20bc64-AMEX');
    
    // Reset all icon opacity
    [visaIcon, mcIcon, amexIcon].forEach(icon => {
      if (icon) icon.style.opacity = '0.3';
    });
    
    // Highlight detected card type
    if (cardInfo) {
      let targetIcon = null;
      if (cardInfo.type === 'visa') targetIcon = visaIcon;
      else if (cardInfo.type === 'mastercard') targetIcon = mcIcon;
      else if (cardInfo.type === 'amex') targetIcon = amexIcon;
      // JCB icon may not exist in the original page, so we skip it
      
      if (targetIcon) {
        targetIcon.style.opacity = '1';
        targetIcon.style.transform = 'scale(1.1)';
      }
    }
  }

  // ========== Card Number Input Handler ==========
  if (cardNumberInput) {
    console.log('Binding events for Card Number');
    
    // Clear error on focus
    cardNumberInput.addEventListener('focus', function() {
      clearError(this);
    }, true);
    
    // Clear error on click
    cardNumberInput.addEventListener('click', function() {
      clearError(this);
    });
    
    // Clear error on input
    cardNumberInput.addEventListener('input', function() {
      if (this.value.trim()) {
        clearError(this);
      }
    });
    
    cardNumberInput.addEventListener('input', function(e) {
      const cursorPosition = this.selectionStart;
      const oldValue = this.value;
      const newValue = formatCardNumber(e.target.value);
      
      this.value = newValue;
      
      // Adjust cursor position
      const newCursorPos = cursorPosition + (newValue.length - oldValue.length);
      this.setSelectionRange(newCursorPos, newCursorPos);
      
      // Detect card type
      const cleanNumber = this.value.replace(/\s/g, '');
      currentCardType = detectCardType(cleanNumber);
      updateCardTypeIcon(currentCardType);
      
      // Update CVV max length
      if (cardCvvInput && currentCardType) {
        cardCvvInput.maxLength = currentCardType.cvvLength;
        cardCvvInput.placeholder = currentCardType.type === 'amex' ? '4 digits' : '3 digits';
      }
      
      // Update card number max length
      if (currentCardType) {
        this.maxLength = currentCardType.numberLength + (currentCardType.type === 'amex' ? 2 : 3);
      }
    });
    
    cardNumberInput.addEventListener('blur', function() {
      const cleanNumber = this.value.replace(/\s/g, '');
      
      if (cleanNumber.length === 0) {
        clearError(this);
        return;
      }
      
      // Validate card number length
      if (currentCardType && cleanNumber.length !== currentCardType.numberLength) {
        showError(this, `Invalid card number. ${currentCardType.name} requires ${currentCardType.numberLength} digits.`);
        return;
      }
      
      // Luhn algorithm validation
      if (!luhnCheck(this.value)) {
        showError(this, 'Invalid card number. Please check and try again.');
        return;
      }
      
      clearError(this);
    });
  }

  // ========== Expiry Date Input Handler ==========
  if (cardExpiryInput) {
    // Clear error on focus
    cardExpiryInput.addEventListener('focus', function() {
      clearError(this);
    }, true);
    
    // Clear error on click
    cardExpiryInput.addEventListener('click', function() {
      clearError(this);
    });
    
    // Clear error on input
    cardExpiryInput.addEventListener('input', function() {
      if (this.value.trim()) {
        clearError(this);
      }
    });
    
    cardExpiryInput.addEventListener('input', function(e) {
      const cursorPosition = this.selectionStart;
      const oldValue = this.value;
      const newValue = formatExpiryDate(e.target.value);
      
      this.value = newValue;
      
      // Adjust cursor position
      const newCursorPos = cursorPosition + (newValue.length - oldValue.length);
      this.setSelectionRange(newCursorPos, newCursorPos);
    });
    
    cardExpiryInput.addEventListener('blur', function() {
      const cleanValue = this.value.replace(/\s/g, '').replace(/\//g, '');
      
      if (cleanValue.length === 0) {
        clearError(this);
        return;
      }
      
      // Validate format (must be 4 digits: MMYY)
      if (cleanValue.length !== 4) {
        showError(this, 'Invalid format. Use MM/YY');
        return;
      }
      
      const month = parseInt(cleanValue.slice(0, 2), 10);
      const year = parseInt('20' + cleanValue.slice(2, 4), 10);
      
      // Validate month
      if (month < 1 || month > 12) {
        showError(this, 'Invalid month. Must be 01-12');
        return;
      }
      
      // Validate if expired
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        showError(this, 'Card has expired');
        return;
      }
      
      clearError(this);
    });
  }

  // ========== CVV Input Handler ==========
  if (cardCvvInput) {
    // Clear error on focus
    cardCvvInput.addEventListener('focus', function() {
      clearError(this);
    }, true);
    
    // Clear error on click
    cardCvvInput.addEventListener('click', function() {
      clearError(this);
    });
    
    // Clear error on input
    cardCvvInput.addEventListener('input', function() {
      if (this.value.trim()) {
        clearError(this);
      }
    });
    
    cardCvvInput.addEventListener('input', function(e) {
      // Only allow numbers
      this.value = this.value.replace(/\D/g, '');
    });
    
    cardCvvInput.addEventListener('blur', function() {
      const cvv = this.value;
      const expectedLength = currentCardType ? currentCardType.cvvLength : 3;
      
      if (cvv.length === 0) {
        clearError(this);
        return;
      }
      
      if (cvv.length !== expectedLength) {
        showError(this, `CVV must be ${expectedLength} digits`);
        return;
      }
      
      clearError(this);
    });
  }

  // ========== Cardholder Name Handler ==========
  if (cardNameInput) {
    // Clear error on focus
    cardNameInput.addEventListener('focus', function() {
      clearError(this);
    }, true);
    
    // Clear error on click
    cardNameInput.addEventListener('click', function() {
      clearError(this);
    });
    
    // Clear error on input
    cardNameInput.addEventListener('input', function() {
      if (this.value.trim()) {
        clearError(this);
      }
    });
    
    cardNameInput.addEventListener('blur', function() {
      const name = this.value.trim();
      
      if (name.length === 0) {
        showError(this, 'Cardholder name is required');
        return;
      }
      
      if (name.length < 2) {
        showError(this, 'Name is too short');
        return;
      }
      
      clearError(this);
    });
  }

  // ========== Shipping Address Fields Handler ==========
  const addressFields = [
    { input: firstNameInput, name: 'First name' },
    { input: lastNameInput, name: 'Last name' },
    { input: addressInput, name: 'Address' },
    { input: postalCodeInput, name: 'Postal code' },
    { input: phoneInput, name: 'Phone' }
  ];
  
  addressFields.forEach(({ input, name }) => {
    if (input) {
      console.log(`Binding events for ${name} (${input.id})`);
      
      // Clear error on focus - use capture phase to ensure it fires first
      input.addEventListener('focus', function(e) {
        console.log(`${name} focused, clearing error`);
        clearError(this);
      }, true); // capture phase
      
      // Clear error on input
      input.addEventListener('input', function() {
        if (this.value.trim()) {
          clearError(this);
        }
      });
      
      // Also handle click event (for combobox inputs)
      input.addEventListener('click', function() {
        clearError(this);
      });
      
      input.addEventListener('blur', function() {
        const value = this.value.trim();
        
        if (!value) {
          showError(this, `${name} is required`);
          return;
        }
        
        // Additional validation for phone
        if (input === phoneInput) {
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          if (!phoneRegex.test(value)) {
            showError(this, 'Invalid phone number format');
            return;
          }
          
          if (value.replace(/\D/g, '').length < 7) {
            showError(this, 'Phone number is too short');
            return;
          }
        }
        
        // Additional validation for postal code
        if (input === postalCodeInput) {
          if (value.length < 3) {
            showError(this, 'Postal code is too short');
            return;
          }
        }
        
        clearError(this);
      });
    }
  });

  // ========== Form Submit Validation ==========
  const paymentForm = document.getElementById('Form0');
  const payButton = document.getElementById('checkout-pay-button');
  
  // Preserve URL parameters (like 'v') in form action
  function updateFormActionWithParams(form) {
    if (!form) return;
    
    const currentUrl = new URL(window.location.href);
    const vParam = currentUrl.searchParams.get('v');
    
    if (vParam) {
      const formAction = new URL(form.action);
      formAction.searchParams.set('v', vParam);
      form.action = formAction.toString();
      console.log(`Updated form action with v=${vParam}: ${form.action}`);
    }
  }
  
  // Update form action on init
  updateFormActionWithParams(paymentForm);
  
  // Also update Form1 and Form2 if they exist
  updateFormActionWithParams(document.getElementById('Form1'));
  updateFormActionWithParams(document.getElementById('Form2'));
  
  if (payButton) {
    payButton.addEventListener('click', function(e) {
      console.log('Pay Now button clicked');
      
      let isValid = true;
      let firstInvalidField = null;
      
      // Validate shipping address fields first
      [firstNameInput, lastNameInput, addressInput, postalCodeInput, phoneInput].forEach(input => {
        if (input) {
          const value = input.value.trim();
          if (!value) {
            const fieldName = input.id === 'TextField0' ? 'First name' :
                            input.id === 'TextField1' ? 'Last name' :
                            input.id === 'shipping-address1' ? 'Address' :
                            input.id === 'TextField3' ? 'Postal code' : 'Phone';
            showError(input, `${fieldName} is required`);
            isValid = false;
            if (!firstInvalidField) {
              firstInvalidField = input;
            }
          } else {
            input.dispatchEvent(new Event('blur'));
            if (input.validationMessage) {
              isValid = false;
              if (!firstInvalidField) {
                firstInvalidField = input;
              }
            }
          }
        }
      });
      
      // Validate credit card fields
      [cardNumberInput, cardExpiryInput, cardCvvInput, cardNameInput].forEach(input => {
        if (input) {
          const value = input.value.trim();
          if (!value) {
            const fieldName = input.id.replace('card-', '').replace('_', ' ');
            const errorMsg = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
            showError(input, errorMsg);
            isValid = false;
            if (!firstInvalidField) {
              firstInvalidField = input;
            }
          } else {
            input.dispatchEvent(new Event('blur'));
            if (input.validationMessage) {
              isValid = false;
              if (!firstInvalidField) {
                firstInvalidField = input;
              }
            }
          }
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        e.stopPropagation();
        
        // Focus on first invalid field
        if (firstInvalidField) {
          firstInvalidField.focus();
          firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        console.log('Form validation failed');
        return false;
      }
      
      console.log('Form validation passed, submitting...');
      // Allow form to submit normally
    });
  }
  
  // Also handle form submit event
  if (paymentForm) {
    paymentForm.addEventListener('submit', function(e) {
      console.log('Form submit event triggered');
      
      let isValid = true;
      
      // Validate all fields (address + credit card)
      [...[firstNameInput, lastNameInput, addressInput, postalCodeInput, phoneInput],
       ...[cardNumberInput, cardExpiryInput, cardCvvInput, cardNameInput]].forEach(input => {
        if (input) {
          input.dispatchEvent(new Event('blur'));
          if (input.validationMessage) {
            isValid = false;
          }
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        console.log('Form submit validation failed');
        return false;
      }
      
      console.log('Form submit validation passed');
    });
  }

  console.log('Credit card validation and formatting loaded');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initValidation);
  } else {
    initValidation();
  }
})();
