/**
 * View history management using localStorage
 */

const VIEW_HISTORY_KEY = 'afrikoni_view_history';
const MAX_HISTORY = 50;

export function addToViewHistory(itemId, itemType, metadata = {}) {
  try {
    const history = getViewHistory();
    if (!Array.isArray(history)) return [];
    
    const newEntry = {
      id: itemId,
      type: itemType,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    // Remove existing entry if present
    const filtered = history.filter(item => item && !(item.id === itemId && item.type === itemType));
    
    // Add to beginning
    const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY);
    
    localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    return [];
  }
}

export function getViewHistory(itemType = null) {
  try {
    const stored = localStorage.getItem(VIEW_HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    if (!Array.isArray(history)) return [];
    
    if (itemType) {
      return history.filter(item => item && item.type === itemType);
    }
    return history;
  } catch (error) {
    return [];
  }
}

export function clearViewHistory() {
  try {
    localStorage.removeItem(VIEW_HISTORY_KEY);
  } catch (error) {
    // Ignore
  }
}

