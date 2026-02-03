/**
 * Módulo de Contato
 * Gerencia formulário com validação em tempo real
 */

class Contact {
  constructor() {
    this.form = document.querySelector('.contact__form');
    this.inputs = document.querySelectorAll('.contact__form-input, .contact__form-textarea');
    this.submitBtn = document.querySelector('.contact__form-submit');
    
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.setupValidation();
    this.setupSubmit();
  }

  /**
   * Configura validação em tempo real
   */
  setupValidation() {
    this.inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearError(input));
    });
  }

  /**
   * Valida campo individual
   */
  validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const name = field.name;
    let isValid = true;
    let errorMessage = '';

    // Remove classes anteriores e limpa erro
    field.classList.remove('error', 'success');
    const errEl = field.parentElement?.querySelector('.contact__form-error');
    if (errEl) {
      errEl.classList.remove('show');
      errEl.textContent = '';
    }

    // Validação de campo vazio
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'Este campo é obrigatório';
    }

    // Validação de email
    if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Email inválido';
      }
    }

    // Validação de telefone
    if (name === 'phone' && value) {
      const phoneRegex = /^[\d\s\(\)\-\+]+$/;
      if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
        isValid = false;
        errorMessage = 'Telefone inválido';
      }
    }

    // Validação de mensagem (obrigatório e mínimo 10 caracteres)
    if (name === 'message') {
      if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Este campo é obrigatório';
      } else if (value && value.length < 10) {
        isValid = false;
        errorMessage = 'A mensagem deve ter pelo menos 10 caracteres';
      }
    }

    // Aplica feedback visual
    if (isValid && value) {
      field.classList.add('success');
    } else if (!isValid) {
      field.classList.add('error');
      this.showError(field, errorMessage);
    }

    return isValid;
  }

  /**
   * Mostra mensagem de erro
   */
  showError(field, message) {
    let errorElement = field.parentElement.querySelector('.contact__form-error');
    
    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.className = 'contact__form-error';
      field.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }

  /**
   * Limpa erro do campo
   */
  clearError(field) {
    const errorElement = field.parentElement?.querySelector('.contact__form-error');
    if (errorElement) {
      errorElement.classList.remove('show');
      errorElement.textContent = '';
    }
    field.classList.remove('error', 'success');
  }

  /**
   * Valida formulário completo
   */
  validateForm() {
    let isValid = true;
    
    this.inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Configura submit do formulário
   */
  setupSubmit() {
    if (!this.submitBtn) return;

    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!this.validateForm()) {
        this.showFormMessage('Por favor, corrija os erros no formulário.', 'error');
        return;
      }

      // Simula envio
      this.setLoading(true);
      
      try {
        // Aqui você pode integrar com Formspree, EmailJS, ou sua API
        await this.submitForm();
        this.showFormMessage('Mensagem enviada com sucesso!', 'success');
        this.form.reset();
        this.inputs.forEach(input => {
          input.classList.remove('success', 'error');
        });
      } catch (error) {
        this.showFormMessage('Erro ao enviar mensagem. Tente novamente.', 'error');
      } finally {
        this.setLoading(false);
      }
    });
  }

  /**
   * Submete formulário (Formspree ou fallback)
   */
  async submitForm() {
    const formData = new FormData(this.form);
    let formId = this.form.getAttribute('data-formspree-id')?.trim() || '';
    // Aceita só o ID (ex: mpqlgrvn) ou URL completa; extrai o ID se for URL
    const idMatch = formId.match(/formspree\.io\/f\/([a-z0-9]+)/i);
    if (idMatch) formId = idMatch[1];

    if (formId && formId !== 'seu_id_formspree') {
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha no envio');
      return result;
    }

    // Sem Formspree configurado: simula envio (configure data-formspree-id no form)
    await new Promise(resolve => setTimeout(resolve, 1200));
    console.log('Dados do formulário:', Object.fromEntries(formData));
    return { success: true };
  }

  /**
   * Define estado de loading
   */
  setLoading(loading) {
    if (!this.submitBtn) return;

    this.submitBtn.disabled = loading;
    this.submitBtn.classList.toggle('loading', loading);
    this.submitBtn.textContent = loading ? 'Enviando...' : 'Enviar Mensagem';
  }

  /**
   * Mostra mensagem do formulário
   */
  showFormMessage(message, type) {
    let messageElement = this.form.querySelector('.contact__form-message');
    
    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.className = 'contact__form-message';
      this.form.insertBefore(messageElement, this.submitBtn);
    }
    
    messageElement.textContent = message;
    messageElement.className = `contact__form-message ${type} show`;
    
    // Remove mensagem após 5 segundos
    setTimeout(() => {
      messageElement.classList.remove('show');
    }, 5000);
  }
}

export default Contact;
