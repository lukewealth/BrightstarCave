import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase';

/**
 * High-tier tracking for Brightstar Cave
 */
export const trackEvent = async (eventName: string, params?: Record<string, any>) => {
  const instance = await analytics;
  if (instance) {
    logEvent(instance, eventName, params);
  }
};

// Predefined Events for consistent tracking
export const Events = {
  ADD_TO_CART: 'add_to_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',
  VIEW_ITEM: 'view_item',
  SEARCH: 'search',
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  SELECT_CONTENT: 'select_content',
};

/**
 * Track Menu Item Interaction
 */
export const trackAddToCart = (item: any) => {
  trackEvent(Events.ADD_TO_CART, {
    currency: 'NGN',
    value: item.price,
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: 1
    }]
  });
};

/**
 * Track Successful Purchase
 */
export const trackPurchase = (orderId: string, total: number, items: any[]) => {
  trackEvent(Events.PURCHASE, {
    transaction_id: orderId,
    value: total,
    currency: 'NGN',
    items: items.map(i => ({
      item_id: i.id,
      item_name: i.name,
      item_category: i.category,
      item_variant: i.type, // kitchen or bar
      price: i.price,
      quantity: i.quantity
    }))
  });
};

/**
 * Track Portal Entry
 */
export const trackPortalEntry = (role: string, email: string) => {
  trackEvent(Events.LOGIN, {
    method: 'email',
    role: role,
    user_email: email
  });
};
