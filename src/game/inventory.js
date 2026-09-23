export class InventorySystem {
  constructor(game) {
    this.game = game;
    this.maxSlots = 8;
    this.items = [];
    this.isOpen = false;
    this.selectedSlot = -1;
    
    // Item definitions
    this.itemTypes = {
      ammo: { name: 'Ammo', icon: '🔫', stackable: true, maxStack: 30 },
      health: { name: 'First Aid', icon: '💊', stackable: true, maxStack: 3 },
      battery: { name: 'Battery', icon: '🔋', stackable: true, maxStack: 5 },
      key_red: { name: 'Red Keycard', icon: '🔴', stackable: false },
      key_blue: { name: 'Blue Keycard', icon: '🔵', stackable: false },
      note: { name: 'Note', icon: '📄', stackable: true, maxStack: 10 }
    };
  }
  
  addItem(type, count = 1) {
    const itemType = this.itemTypes[type];
    if (!itemType) return false;
    
    // Check if stackable and already in inventory
    if (itemType.stackable) {
      const existing = this.items.find(item => item.type === type);
      if (existing) {
        const canAdd = Math.min(count, itemType.maxStack - existing.count);
        if (canAdd > 0) {
          existing.count += canAdd;
          this.showNotification(`+${canAdd} ${itemType.name}`);
          return canAdd;
        }
        return 0;
      }
    }
    
    // Check for empty slot
    if (this.items.length >= this.maxSlots) {
      this.showNotification('Inventory full!');
      return 0;
    }
    
    // Add new item
    this.items.push({ type, count });
    this.showNotification(`Found ${itemType.name}`);
    return count;
  }
  
  removeItem(type, count = 1) {
    const idx = this.items.findIndex(item => item.type === type);
    if (idx < 0) return false;
    
    const item = this.items[idx];
    item.count -= count;
    
    if (item.count <= 0) {
      this.items.splice(idx, 1);
    }
    
    return true;
  }
  
  getItem(type) {
    return this.items.find(item => item.type === type) || null;
  }
  
  hasItem(type) {
    return this.items.some(item => item.type === type);
  }
  
  useItem(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.items.length) return;
    
    const item = this.items[slotIndex];
    
    switch (item.type) {
      case 'health':
        this.game.player.heal(30);
        this.removeItem('health');
        if (this.game.audioSystem) {
          this.game.audioSystem.playHeal();
        }
        break;
        
      case 'battery':
        this.game.flashlightBattery = Math.min(100, this.game.flashlightBattery + 50);
        this.removeItem('battery');
        break;
    }
  }
  
  toggleUI() {
    this.isOpen = !this.isOpen;
    
    // Pause/unpause game
    if (this.isOpen) {
      document.exitPointerLock();
      this.game.isRunning = false;
    } else {
      document.getElementById('game-canvas').requestPointerLock();
      this.game.isRunning = true;
    }
    
    this.renderUI();
  }
  
  renderUI() {
    let container = document.getElementById('inventory-ui');
    
    if (!this.isOpen) {
      if (container) container.remove();
      return;
    }
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'inventory-ui';
      container.className = 'inventory-container';
      document.getElementById('react-root').appendChild(container);
    }
    
    let html = '<h2 class="inventory-title">INVENTORY</h2>';
    html += '<div class="inventory-grid">';
    
    for (let i = 0; i < this.maxSlots; i++) {
      const item = this.items[i];
      if (item) {
        const itemType = this.itemTypes[item.type];
        html += `<div class="inventory-slot has-item" data-slot="${i}" onclick="window.game.inventorySystem.useItem(${i})">
          <span>${itemType.icon}</span>
          ${itemType.stackable && item.count > 1 ? `<span style="position:absolute;bottom:2px;right:4px;font-size:0.7rem;">${item.count}</span>` : ''}
        </div>`;
      } else {
        html += `<div class="inventory-slot"></div>`;
      }
    }
    
    html += '</div>';
    html += '<p style="text-align:center;color:#666;font-size:0.8rem;">Press I to close</p>';
    
    container.innerHTML = html;
  }
  
  showNotification(text) {
    const notification = document.createElement('div');
    notification.className = 'pickup-notification';
    notification.textContent = text;
    document.getElementById('react-root').appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}
