/**
 * roles.js - OS Unified Role System
 * 
 * Provides centralized logic for mapping internal role slugs to 
 * human-readable outcomes and aesthetic badge colors.
 */

const ROLE_CONFIG = {
    admin: {
        label: 'System Admin',
        color: 'bg-os-accent',
    },
    merchant: {
        label: 'Trade Merchant',
        color: 'bg-emerald-600',
    },
    shipper: {
        label: 'Logistics Orchestrator',
        color: 'bg-blue-600',
    },
    bank: {
        label: 'Institutional Capital',
        color: 'bg-amber-600',
    },
    operator: {
        label: 'Mission Operator',
        color: 'bg-purple-600',
    },
    default: {
        label: 'Participant',
        color: 'bg-os-muted',
    }
};

/**
 * Returns a human-readable display name for a role slug.
 * @param {string} role - The internal role slug
 * @returns {string} - Human-readable label
 */
export function getRoleDisplayName(role) {
    if (!role) return 'Neutral';
    const slug = role.toLowerCase();
    return ROLE_CONFIG[slug]?.label || ROLE_CONFIG.default.label;
}

/**
 * Returns the CSS color class for a role's badge.
 * @param {string} role - The internal role slug
 * @returns {string} - Tailwing bg-class
 */
export function getRoleBadgeColor(role) {
    if (!role) return 'bg-os-muted';
    const slug = role.toLowerCase();
    return ROLE_CONFIG[slug]?.color || ROLE_CONFIG.default.color;
}
