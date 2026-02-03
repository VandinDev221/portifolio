# Portfólio Profissional Interativo

Portfólio web moderno, responsivo e altamente interativo desenvolvido com HTML5, CSS3 e JavaScript vanilla.

## 🚀 Características

- **Design Moderno**: Interface minimalista com paleta de cores profissional
- **Totalmente Responsivo**: Mobile-first, adaptável a todos os dispositivos
- **Animações Fluidas**: Transições suaves e animações baseadas em scroll
- **Modo Escuro/Claro**: Toggle de tema com persistência
- **Performance Otimizada**: Lazy loading, code splitting, otimizações de assets
- **Acessibilidade**: ARIA labels, navegação por teclado, contraste adequado
- **SEO Otimizado**: Meta tags, structured data, sitemap

## 📋 Pré-requisitos

- Node.js 16+ e npm
- Git (opcional)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seuuser/portfolio.git
cd portfolio
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra no navegador:
```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
portfolio/
├── index.html              # HTML principal
├── package.json            # Dependências e scripts
├── vite.config.js          # Configuração do Vite
├── assets/
│   ├── css/               # Estilos CSS modulares
│   │   ├── main.css       # Arquivo principal
│   │   ├── components/    # Estilos dos componentes
│   │   ├── utilities/     # Variáveis e utilitários
│   │   └── themes/        # Temas claro/escuro
│   ├── js/                # JavaScript modular
│   │   ├── main.js        # Arquivo principal
│   │   ├── modules/       # Módulos funcionais
│   │   └── utils/         # Funções auxiliares
│   └── images/            # Imagens e assets
├── data/                  # Dados JSON
│   ├── profile.json       # Informações pessoais
│   ├── projects.json      # Projetos
│   └── experience.json    # Experiências
└── public/                # Arquivos públicos
```

## ⚙️ Configuração

### Personalizar Dados

Edite os arquivos JSON em `data/`:

- **profile.json**: Informações pessoais, bio, redes sociais
- **projects.json**: Seus projetos com detalhes
- **experience.json**: Experiências profissionais e educacionais

### Personalizar Cores

Edite `assets/css/utilities/variables.css` para alterar a paleta de cores:

```css
:root {
  --color-primary: #0a192f;
  --color-accent: #64ffda;
  --color-text: #e6f1ff;
}
```

## 🎨 Funcionalidades

### Navegação
- Scroll suave para seções
- Highlight automático de seção ativa
- Menu mobile responsivo

### Projetos
- Filtragem por categoria
- Modal com detalhes
- Sistema de likes/visualizações

### Habilidades
- Barras de progresso animadas
- Tooltips informativos
- Categorias organizadas

### Experiência
- Timeline interativa
- Animações no scroll
- Cards informativos

### Contato
- Formulário com validação em tempo real
- Feedback visual
- Preparado para integração (Formspree, EmailJS, etc.)

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`.

## 🧪 Testes

Execute o linter:
```bash
npm run lint
```

## 🌐 Deploy

### Netlify
1. Conecte seu repositório
2. Build command: `npm run build`
3. Publish directory: `dist`

### Vercel
1. Conecte seu repositório
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

### GitHub Pages
```bash
npm run build
# Faça commit da pasta dist
```

## 📝 Licença

MIT License - sinta-se livre para usar este projeto!

## 👤 Autor

**Vanderson Carlos Andrade Lindoso**
- GitHub: [@seuuser](https://github.com/seuuser)
- LinkedIn: [seuuser](https://linkedin.com/in/seuuser)

## 🙏 Agradecimentos

- Google Fonts (Inter, Montserrat)
- Vite
- Comunidade open source

---

Desenvolvido com ❤️ e muito ☕
