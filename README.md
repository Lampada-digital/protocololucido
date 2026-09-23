# PROTOCOLO LÚCIDO

## THE MEMORY IS LYING

Um survival horror psicológico em primeira pessoa inspirado em F.E.A.R., Silent Hill e Resident Evil.

---

## 🎮 SOBRE O JOGO

**Gênero:** First-Person Psychological Survival Horror  
**Protagonista:** Daniel Vale (Subject 034)  
**Ambientação:** Instalação subterrânea da Somnus Dynamics — Level -03  
**Premissa:** Daniel acorda sem memórias em uma instalação abandonada. Algo deu errado com o Protocol 12.

---

## 🎯 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ Sistemas Core
- **Controles FPS completos** (WASD + mouse + pointer lock)
- **Sistema de armas** com munição limitada e recarga
- **Inventário** para documentos e itens
- **Sistema NRL** (Neural Reconstruction Level) — realidade instável
- **HUD minimalista** e diegético
- **Sistema de saúde** com feedback visual

### ✅ Ambiente
- **Laboratório realista** com múltiplas salas conectadas
- **Iluminação cinematográfica** (fluorescente + emergência vermelha)
- **Props detalhados** (camas médicas, monitores, computadores, armários)
- **Documentos coletáveis** com narrativa ambiental
- **Corredores e salas** com escala realista

### ✅ Atmosfera
- **Névoa volumétrica** para profundidade
- **Film grain** cinematográfico
- **Vignette** para imersão
- **Iluminação PBR** com sombras dinâmicas
- **Materiais realistas** (roughness, metalness)

### ✅ Gameplay
- **Movimentação fluida** (andar, correr, agachar, pular)
- **Sistema de stamina** para sprint
- **Interação com objetos** (tecla E)
- **Coleta de armas** e munição
- **Leitura de documentos** com narrativa
- **Sistema de morte** cinematográfico

---

## 🎮 CONTROLES

| Tecla | Ação |
|-------|------|
| **W/A/S/D** | Mover |
| **Mouse** | Olhar |
| **Click Esquerdo** | Atirar |
| **R** | Recarregar |
| **E** | Interagir |
| **Shift** | Correr |
| **Ctrl** | Agachar |
| **Espaço** | Pular |

---

## 🏗️ ESTRUTURA DO PROJETO

```
lucid-protocol/
├── index.html              # HTML principal com menu
├── src/
│   ├── main.jsx           # Lógica do jogo (Three.js)
│   └── index.css          # Estilos cinematográficos
├── package.json           # Dependências
├── vite.config.js         # Configuração Vite
└── README.md              # Este arquivo
```

---

## 🚀 COMO JOGAR

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```
Abra: http://localhost:3000

### Build para Produção
```bash
npm run build
```

### Preview do Build
```bash
npm run preview
```

---

## 🎬 FLUXO DO JOGO

1. **Menu Principal** — Tela inicial da Somnus Dynamics
2. **Início** — Daniel acorda no laboratório
3. **Exploração** — Investigar o ambiente
4. **Descoberta** — Encontrar documentos e armas
5. **Sobrevivência** — Gerenciar recursos limitados
6. **Horror Psicológico** — Eventos NRL e distorções
7. **Combate** — Enfrentar ameaças (quando implementado)

---

## 🧠 SISTEMAS DE HORROR

### NRL (Neural Reconstruction Level)
- **100%** — Realidade estável
- **80%** — Pequenas anomalias
- **60%** — Memórias sobrepostas
- **40%** — Distorção ambiental
- **20%** — Realidade instável
- **10%** — Protocolo crítico
- **0%** — Lucid Breach

### Eventos Psicológicos
- Luzes piscando
- Sons inexplicáveis
- Objetos mudando de posição
- Sombras passageiras
- Distorções visuais
- Memórias falsas

---

## 🎨 DIREÇÃO ARTÍSTICA

### Paleta de Cores
- **Primária:** Azul ciano (#00aaff) — Somnus Dynamics
- **Alerta:** Vermelho emergência (#ff2200)
- **Ambiente:** Cinzas escuros (#1a1a20, #2a2a30)
- **Texto:** Branco suave com glow

### Iluminação
- **Fluorescente:** Branco frio (#ddeeff)
- **Emergência:** Vermelho pulsante (#ff2200)
- **Monitores:** Azul/verde emissivo
- **Atmosfera:** Névoa azul escura

### Materiais
- **PBR (Physically Based Rendering)**
- **Roughness:** 0.7-0.9 (superfícies desgastadas)
- **Metalness:** 0.1-0.8 (metais industriais)
- **Emissive:** Monitores e luzes

---

## 📋 PRÓXIMAS IMPLEMENTAÇÕES

### Fase 1 — Core Gameplay
- [ ] Sistema de inimigos com IA
- [ ] Combate tático
- [ ] Sistema de dano localizado
- [ ] Animações de armas

### Fase 2 — Horror Psicológico
- [ ] Horror Director (diretor de eventos)
- [ ] Sistema de distorção de realidade
- [ ] Eventos NRL dinâmicos
- [ ] Áudio espacial 3D

### Fase 3 — Narrativa
- [ ] Sistema de documentos expandido
- [ ] Gravações de áudio
- [ ] Cutscenes cinematográficas
- [ ] Flashbacks de memória

### Fase 4 — Ambientes
- [ ] Medical Wing expandido
- [ ] Security Wing
- [ ] Archives
- [ ] Generator Room
- [ ] Containment Area
- [ ] Lucid Core

### Fase 5 — Polimento
- [ ] Otimização de performance
- [ ] Efeitos de pós-processamento
- [ ] Sistema de save/checkpoint
- [ ] Menu de configurações

---

## 🎯 FILOSOFIA DE DESIGN

### Princípios Fundamentais
1. **Atmosfera > Jump Scares** — Terror psicológico, não sustos baratos
2. **Recursos Limitados** — Cada bala conta, cada decisão importa
3. **Narrativa Ambiental** — Conte a história através do ambiente
4. **Realidade Instável** — O jogador nunca sabe o que é real
5. **Silêncio é Poder** — Momentos de quietude criam tensão

### Inspirado em
- **F.E.A.R.** — Combate tático, tensão, ambientes industriais
- **Silent Hill** — Horror psicológico, simbolismo, realidade distorcida
- **Resident Evil** — Exploração, recursos limitados, inventário

### Identidade Própria
- **Somnus Dynamics** — Corporação de tecnologia neural
- **Protocol 12** — Reconstrução de memórias traumáticas
- **Daniel Vale** — Protagonista com memória fragmentada
- **NRL System** — Mecânica única de realidade instável

---

## 🔧 TECNOLOGIAS

- **Three.js** — Renderização 3D
- **Vite** — Build tool rápido
- **React** — UI (menu, HUD)
- **Tailwind CSS** — Estilização
- **Web Audio API** — Sistema de áudio (planejado)

---

## 📊 PERFORMANCE

### Otimizações Implementadas
- ✅ Shadow maps limitados (512x512)
- ✅ Pixel ratio capped (max 2x)
- ✅ Fog exponencial para culling natural
- ✅ Materiais PBR otimizados
- ✅ Geometria simples mas eficaz

### Targets
- **FPS:** 60 FPS em hardware moderno
- **Load Time:** < 5 segundos
- **Memory:** < 500MB
- **Bundle Size:** ~470KB JS (gzipped: ~120KB)

---

## 🎬 CRÉDITOS

**Design & Desenvolvimento:**  
Lead Technical Director & Game Designer

**Inspirado por:**  
F.E.A.R. (Monolith Productions)  
Silent Hill (Konami)  
Resident Evil (Capcom)

**Identidade Original:**  
Somnus Dynamics  
Protocol 12  
Daniel Vale (Subject 034)

---

## 📝 NOTAS DE DESENVOLVIMENTO

### Versão Atual: 0.1.0 — Alpha Prototype

**Implementado:**
- Sistema de movimento FPS completo
- Ambiente de laboratório básico
- Sistema de armas funcional
- HUD minimalista
- Menu principal cinematográfico
- Sistema de morte
- Documentos coletáveis

**Próximos Passos:**
- Implementar inimigos com IA
- Adicionar sistema de áudio espacial
- Criar eventos psicológicos dinâmicos
- Expandir ambiente com mais salas
- Implementar sistema de save

---

## 🐛 KNOWN ISSUES

- Áudio não implementado completamente
- Inimigos ainda não adicionados
- Eventos psicológicos básicos
- Animações de armas limitadas
- Sistema de save não implementado

---

## 📄 LICENÇA

Este é um projeto educacional/demonstração.

Todos os assets e código são originais.

Inspirado em jogos de survival horror, mas não afiliado a nenhuma empresa.

---

## 🎮 COMO JOGAR (RESUMO RÁPIDO)

1. **Clique em "NEW SESSION"** no menu principal
2. **Clique na tela** para ativar o controle do mouse
3. **Explore o laboratório** com WASD
4. **Procure documentos** e interaja com E
5. **Encontre a arma** na sala de segurança
6. **Gerencie sua munição** — é limitada!
7. **Sobreviva** aos eventos psicológicos
8. **Descubra a verdade** sobre o Protocol 12

---

**"THE MEMORY IS LYING."**

---

*Protocolo Lúcido — Um survival horror psicológico onde a realidade é a maior ameaça.*
