# TODO — PROTOCOLO LÚCIDO

## Lista de Tarefas de Desenvolvimento

---

## 🔴 PRIORIDADE CRÍTICA

### FASE 1: Auditoria e Limpeza (Semana 1)

#### Código Morto
- [ ] Remover src/game/core.js (726 linhas - não utilizado)
- [ ] Remover src/game/player.js (237 linhas - não utilizado)
- [ ] Remover src/game/enemyAI.js (487 linhas - não utilizado)
- [ ] Remover src/game/environment.js (1012 linhas - não utilizado)
- [ ] Remover src/game/sanitySystem.js (243 linhas - não utilizado)
- [ ] Remover src/game/audioSystem.js (657 linhas - não utilizado)
- [ ] Remover src/game/inventory.js (154 linhas - não utilizado)
- [ ] Remover src/game/hallucinations.js (318 linhas - não utilizado)
- [ ] Remover src/game/network.js (200 linhas - não utilizado)
- [ ] Remover src/core/CinematicCamera.js (505 linhas - não utilizado)
- [ ] Remover src/systems/AdvancedAudio.js (485 linhas - não utilizado)
- [ ] Remover src/systems/NarrativeEngine.js (415 linhas - não utilizado)
- [ ] Remover src/systems/NeuralDegradationManager.ts (710 linhas - não utilizado)
- [ ] Remover src/ai/UtilityEnemyAI.ts (875 linhas - não utilizado)
- [ ] Remover src/network/ProtocolRoom.ts (787 linhas - não utilizado)
- [ ] Remover server/rooms/LucidRoom.js (291 linhas - não utilizado)

#### Entry Points
- [ ] Consolidar entry points (manter apenas main.jsx)
- [ ] Remover src/main.tsx (não utilizado)
- [ ] Remover src/App.tsx (não utilizado)
- [ ] Remover src/components/* (não utilizado)

#### Testes
- [ ] Testar build após limpeza
- [ ] Verificar se jogo funciona
- [ ] Verificar se não há erros no console
- [ ] Verificar performance

**Status:** ⏳ Pendente  
**Tempo Estimado:** 3-4 dias

---

### FASE 2: Arquitetura Base (Semana 2)

#### Core Systems
- [ ] Criar src/core/Game.js (game loop central)
- [ ] Criar src/core/EventManager.js (sistema de eventos)
- [ ] Criar src/core/InputManager.js (gerenciamento de input)
- [ ] Criar src/core/StateManager.js (gerenciamento de estado)
- [ ] Integrar Game Manager com Three.js
- [ ] Testar game loop

#### Player System
- [ ] Criar src/player/Player.js (player controller)
- [ ] Criar src/player/PlayerCamera.js (câmera do jogador)
- [ ] Criar src/player/components/HealthComponent.js
- [ ] Criar src/player/components/StaminaComponent.js
- [ ] Integrar player com game loop
- [ ] Testar movimento e câmera

**Status:** ⏳ Pendente  
**Tempo Estimado:** 4-5 dias

---

### FASE 3: Player Controller Avançado (Semana 3)

#### Animações
- [ ] Implementar head bob cinematográfico
- [ ] Implementar weapon sway
- [ ] Implementar breathing animation
- [ ] Implementar camera shake
- [ ] Implementar sprint com FOV change
- [ ] Implementar crouch com height change

#### Controles
- [ ] Implementar lean (Q/E)
- [ ] Implementar interaction animations
- [ ] Polir movimento e física
- [ ] Ajustar sensibilidade do mouse
- [ ] Testar game feel

**Status:** ⏳ Pendente  
**Tempo Estimado:** 5-6 dias

---

### FASE 4: Sistema de Armas Completo (Semana 4-5)

#### Weapon System
- [ ] Criar src/combat/WeaponSystem.js
- [ ] Criar src/combat/Weapon.js (classe base)
- [ ] Implementar sistema de recarga
- [ ] Implementar muzzle flash
- [ ] Implementar shell ejection
- [ ] Implementar recoil patterns
- [ ] Implementar weapon sway
- [ ] Implementar aiming (ADS)

#### Armas
- [ ] Implementar Pistol (9mm)
- [ ] Implementar Shotgun
- [ ] Implementar SMG
- [ ] Implementar Rifle
- [ ] Balancear armas

#### Combate
- [ ] Criar src/combat/DamageSystem.js
- [ ] Implementar hit detection
- [ ] Criar decals de impacto
- [ ] Implementar partículas de impacto
- [ ] Testar combate

**Status:** ⏳ Pendente  
**Tempo Estimado:** 10-12 dias

---

### FASE 5: IA de Inimigos (Semana 6-7)

#### Behavior Trees
- [ ] Criar src/ai/BehaviorTree.js
- [ ] Implementar Selector node
- [ ] Implementar Sequence node
- [ ] Implementar Condition node
- [ ] Implementar Action node
- [ ] Testar behavior trees

#### Enemy System
- [ ] Criar src/ai/EnemyBase.js
- [ ] Criar src/ai/EnemyAI.js
- [ ] Implementar PerceptionSystem (visão + audição)
- [ ] Implementar Pathfinding (A*)
- [ ] Implementar estados de IA (idle, patrol, chase, attack, etc)
- [ ] Implementar sistema de cobertura
- [ ] Implementar comunicação entre inimigos

#### Tipos de Inimigos
- [ ] Criar Host enemy (funcionário contaminado)
- [ ] Criar Subject enemy (experimento)
- [ ] Criar Memory enemy (entidade psicológica)
- [ ] Implementar flanking behavior
- [ ] Implementar retreat behavior
- [ ] Implementar reaction to damage
- [ ] Testar e balancear IA

**Status:** ⏳ Pendente  
**Tempo Estimado:** 10-12 dias

---

## 🟡 PRIORIDADE ALTA

### FASE 6: Ambiente Detalhado (Semana 8-9)

#### Environment Builder
- [ ] Criar src/environment/EnvironmentBuilder.js
- [ ] Criar src/environment/LevelLoader.js
- [ ] Implementar sistema de props
- [ ] Implementar sistema de portas
- [ ] Implementar sistema de iluminação

#### Áreas
- [ ] Modelar Main Laboratory
- [ ] Modelar Medical Wing
- [ ] Modelar Security Area
- [ ] Modelar Generator Room
- [ ] Modelar Archives
- [ ] Modelar Containment Area

#### Detalhes
- [ ] Adicionar decals (sangue, sujeira, desgaste)
- [ ] Criar props detalhados
- [ ] Implementar flickering lights
- [ ] Adicionar partículas (poeira, fumaça)
- [ ] Criar flashlight com bateria
- [ ] Adicionar detalhes ambientais

**Status:** ⏳ Pendente  
**Tempo Estimado:** 10-12 dias

---

### FASE 7: Áudio Completo (Semana 10)

#### Audio System
- [ ] Criar src/audio/AudioManager.js
- [ ] Implementar sistema de áudio espacial 3D
- [ ] Criar src/audio/SoundLibrary.js
- [ ] Implementar carregamento de sons

#### Sons
- [ ] Implementar footsteps (diferentes superfícies)
- [ ] Implementar weapon sounds
- [ ] Implementar enemy sounds
- [ ] Implementar ambient sounds
- [ ] Implementar door sounds
- [ ] Implementar interaction sounds

#### Música
- [ ] Criar src/audio/MusicSystem.js
- [ ] Implementar música dinâmica
- [ ] Implementar transições de música
- [ ] Adicionar reverb e efeitos
- [ ] Implementar audio zones
- [ ] Balancear volumes
- [ ] Testar imersão

**Status:** ⏳ Pendente  
**Tempo Estimado:** 6-7 dias

---

### FASE 8: Sistema de Horror (Semana 11-12)

#### Horror Director
- [ ] Criar src/horror/HorrorDirector.js
- [ ] Implementar sistema de tensão
- [ ] Implementar eventos psicológicos
- [ ] Criar src/horror/PsychologicalEvents.js
- [ ] Implementar distorção de realidade

#### Alucinações
- [ ] Criar src/neural/HallucinationSystem.js
- [ ] Implementar tipos de alucinações
- [ ] Implementar sistema de percepção
- [ ] Criar src/neural/PerceptionManager.js

#### Efeitos
- [ ] Implementar jump scares (raro)
- [ ] Criar atmosfera dinâmica
- [ ] Implementar NRL effects
- [ ] Criar entidade sobrenatural
- [ ] Testar e balancear horror

**Status:** ⏳ Pendente  
**Tempo Estimado:** 10-12 dias

---

### FASE 9: Inventário e Interação (Semana 13)

#### Inventory System
- [ ] Criar src/player/InventorySystem.js
- [ ] Implementar UI de inventário
- [ ] Implementar uso de itens
- [ ] Criar sistema de documentos
- [ ] Implementar Journal UI

#### Interação
- [ ] Criar sistema de interação
- [ ] Implementar prompts de interação
- [ ] Criar animações de interação
- [ ] Testar fluxo de inventário

**Status:** ⏳ Pendente  
**Tempo Estimado:** 5-6 dias

---

## 🟢 PRIORIDADE MÉDIA

### FASE 10: Narrativa (Semana 14-15)

#### História
- [ ] Escrever história completa
- [ ] Criar documentos (20+)
- [ ] Escrever diálogos
- [ ] Criar cutscenes

#### Narrative System
- [ ] Criar src/narrative/NarrativeManager.js
- [ ] Criar src/narrative/DialogueSystem.js
- [ ] Implementar flashbacks
- [ ] Criar visões
- [ ] Testar narrativa

**Status:** ⏳ Pendente  
**Tempo Estimado:** 10-12 dias

---

### FASE 11: Polimento (Semana 16-17)

#### Post-Processing
- [ ] Adicionar bloom
- [ ] Implementar chromatic aberration
- [ ] Implementar film grain
- [ ] Implementar vignette
- [ ] Adicionar partículas

#### Polish
- [ ] Polir animações
- [ ] Polir iluminação
- [ ] Polir áudio
- [ ] Balancear gameplay
- [ ] Testar exaustivamente

**Status:** ⏳ Pendente  
**Tempo Estimado:** 10-12 dias

---

### FASE 12: Otimização (Semana 18)

#### Performance
- [ ] Implementar LOD system
- [ ] Implementar occlusion culling
- [ ] Implementar object pooling
- [ ] Otimizar shaders
- [ ] Otimizar texturas
- [ ] Otimizar áudio
- [ ] Testar performance
- [ ] Profile e otimizar

**Status:** ⏳ Pendente  
**Tempo Estimado:** 5-6 dias

---

## 🔵 PRIORIDADE BAIXA

### FASE 13: QA e Testes (Semana 19)

#### Testes
- [ ] Testar todos os sistemas
- [ ] Testar todos os levels
- [ ] Testar todos os inimigos
- [ ] Testar todos os itens
- [ ] Testar save/load
- [ ] Testar performance
- [ ] Testar em diferentes browsers
- [ ] Corrigir bugs
- [ ] Balancear dificuldade

**Status:** ⏳ Pendente  
**Tempo Estimado:** 5-6 dias

---

### FASE 14: Build Final (Semana 20)

#### Release
- [ ] Build final
- [ ] Testar build
- [ ] Otimizar bundle size
- [ ] Documentar
- [ ] Preparar deploy
- [ ] Deploy para produção
- [ ] Monitorar

**Status:** ⏳ Pendente  
**Tempo Estimado:** 3-4 dias

---

## 📊 RESUMO DE TAREFAS

### Por Prioridade
- 🔴 **Crítica:** 2 fases (2 semanas)
- 🟡 **Alta:** 4 fases (8 semanas)
- 🟢 **Média:** 2 fases (4 semanas)
- 🔵 **Baixa:** 2 fases (2 semanas)

### Por Status
- ⏳ **Pendente:** 14 fases
- 🔄 **Em Progresso:** 0 fases
- ✅ **Concluído:** 0 fases

### Total
- **Total de Tarefas:** ~150 tarefas
- **Tempo Total:** 20 semanas (5 meses)
- **Progresso:** 0%

---

## 🎯 PRÓXIMAS AÇÕES

### Imediatas (Esta Semana)
1. [ ] Iniciar FASE 1: Auditoria e Limpeza
2. [ ] Remover código morto
3. [ ] Consolidar entry points
4. [ ] Testar build

### Curto Prazo (Próximas 2 Semanas)
5. [ ] Implementar EventManager
6. [ ] Implementar Game Manager
7. [ ] Modularizar Player
8. [ ] Testar integração

### Médio Prazo (Próximas 4 Semanas)
9. [ ] Implementar Weapon System
10. [ ] Implementar Enemy AI
11. [ ] Criar ambiente detalhado
12. [ ] Implementar áudio

---

## 📝 NOTAS

### Regras Importantes
1. **Não implementar tudo de uma vez** — Trabalhar em ciclos
2. **Testar frequentemente** — Build e jogar
3. **Documentar tudo** — Código e design
4. **Manter foco** — Não adicionar features desnecessárias
5. **Priorizar atmosfera** — É o que faz o jogo memorável

### Critérios de Qualidade
Antes de considerar uma tarefa concluída:
- [ ] Funciona sem erros
- [ ] Está integrado ao jogo
- [ ] Foi testado
- [ ] Está documentado
- [ ] Contribui para a experiência

---

**Lista de Tarefas**  
*PROTOCOLO LÚCIDO — Development TODO*  
*Lead Technical Director*  
*2024*

---

*Última atualização: 2024*
