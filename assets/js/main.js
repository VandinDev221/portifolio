/**
 * Arquivo Principal
 * Inicializa todos os módulos
 */

import Navigation from './modules/navigation.js';
import Projects from './modules/projects.js';
import Animations from './modules/animations.js';
import Theme from './modules/theme.js';
import Contact from './modules/contact.js';
import Skills from './modules/skills.js';
import Experience from './modules/experience.js';
import Intro from './modules/intro.js';
import Interactions from './modules/interactions.js';
import { lazyLoadImages, measurePerformance } from './utils/performance.js';

// Aguarda DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  // Intro de apresentação (roda primeiro)
  new Intro();

  // Inicializa módulos
  const navigation = new Navigation();
  const projects = new Projects();
  const animations = new Animations();
  const interactions = new Interactions();
  const theme = new Theme();
  const contact = new Contact();
  const skills = new Skills();
  const experience = new Experience();

  // Performance
  lazyLoadImages();
  measurePerformance();

  // Console personalizado
  console.log('%c👋 Olá! Bem-vindo ao meu portfólio!', 
    'font-size: 20px; font-weight: bold; color: #64ffda;');
  console.log('%c💻 Desenvolvido com paixão e dedicação', 
    'font-size: 14px; color: #8892b0;');
  console.log('%c🔗 GitHub: https://github.com/seuuser', 
    'font-size: 12px; color: #64ffda;');

  // Easter egg
  let konamiCode = [];
  const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  
  document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    if (konamiCode.length > konamiSequence.length) {
      konamiCode.shift();
    }
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
      console.log('%c🎉 Código Konami ativado!', 'font-size: 24px; font-weight: bold; color: #64ffda;');
      document.body.style.animation = 'pulse 1s infinite';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 3000);
      konamiCode = [];
    }
  });

  // Exporta para uso global se necessário
  window.portfolio = {
    navigation,
    projects,
    animations,
    interactions,
    theme,
    contact,
    skills,
    experience
  };
});
