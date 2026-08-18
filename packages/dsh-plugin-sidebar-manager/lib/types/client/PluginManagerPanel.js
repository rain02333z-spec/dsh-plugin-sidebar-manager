import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { IconChevronDownOutline14, IconPersonalizationOutline16, IconSearchOutline16, } from '@deepseek-ai/dsh-client-ui-primitives';
import { isProtectedModule } from "../protection.js";
import css from './PluginManagerPanel.module.css';
/** Short display name for a Loader module specifier. */
function moduleShortName(moduleName) {
    const unscoped = moduleName.startsWith('@') ? moduleName.slice(moduleName.indexOf('/') + 1) : moduleName;
    return unscoped
        .replace(/^cordis:/, '')
        .replace(/^cordis-plugin-/, '')
        .replace(/^dsh-(?:host-|client-)?/, '');
}
/** Categorize entirely from the stable module specifier supplied by pluginInventory.list(). */
function categoryOf(moduleName) {
    return moduleName.startsWith('@deepseek-ai/') || moduleName.startsWith('cordis:') ? 'builtin' : 'user';
}
/** Search module specifier, short name, and Loader tree id. */
function matches(entry, normalizedQuery) {
    if (normalizedQuery.length === 0)
        return true;
    return [entry.moduleName, moduleShortName(entry.moduleName), entry.entryId]
        .some(value => value.toLocaleLowerCase().includes(normalizedQuery));
}
function Toggle({ checked, busy, locked, label, onToggle }) {
    return (_jsx("button", { type: "button", role: "switch", "aria-checked": checked, "aria-label": label, title: locked ? label : undefined, className: css.switch, "data-on": checked ? 'true' : undefined, "data-locked": locked ? 'true' : undefined, disabled: busy || locked, onClick: onToggle, children: _jsx("span", { className: css.switchThumb }) }));
}
function CategorySection({ title, count, expanded, onToggle, emptyText, children, }) {
    return (_jsxs("section", { className: css.category, "data-expanded": expanded ? 'true' : undefined, children: [_jsxs("button", { type: "button", className: css.categoryHeader, "aria-expanded": expanded, onClick: onToggle, children: [_jsx(IconChevronDownOutline14, { className: css.categoryChevron, size: 12, "aria-hidden": "true" }), _jsx("span", { className: css.categoryTitle, children: title }), _jsx("span", { className: css.categoryCount, children: count })] }), expanded ? (count > 0 ? _jsx("ul", { className: css.rows, children: children }) : _jsx("p", { className: css.note, children: emptyText })) : null] }));
}
/** Sidebar button plus its fixed, searchable, collapsible plugin catalog. */
export function PluginManagerPanel({ wide, list, setEnabled, t }) {
    const panelId = useId();
    const layerRef = useRef(null);
    const searchRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [request, setRequest] = useState(0);
    const [state, setState] = useState({ status: 'loading' });
    const [pending, setPending] = useState(new Set());
    const [errors, setErrors] = useState(new Map());
    const [expanded, setExpanded] = useState({ builtin: true, user: true });
    useEffect(() => {
        let current = true;
        void Promise.resolve().then(() => list()).then((snapshot) => { if (current)
            setState({ status: 'ready', snapshot }); }, () => { if (current)
            setState({ status: 'error' }); });
        return () => { current = false; };
    }, [list, request]);
    useEffect(() => {
        if (!open)
            return;
        searchRef.current?.focus();
        const closeOnEscape = (event) => {
            if (event.key === 'Escape')
                setOpen(false);
        };
        const closeOnOutsidePointer = (event) => {
            if (event.target instanceof Node && layerRef.current?.contains(event.target) !== true)
                setOpen(false);
        };
        document.addEventListener('keydown', closeOnEscape);
        document.addEventListener('pointerdown', closeOnOutsidePointer);
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.removeEventListener('pointerdown', closeOnOutsidePointer);
        };
    }, [open]);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const entries = useMemo(() => state.status === 'ready' ? state.snapshot.entries : [], [state]);
    const filtered = useMemo(() => entries.filter(entry => matches(entry, normalizedQuery)), [entries, normalizedQuery]);
    const builtins = filtered.filter(entry => categoryOf(entry.moduleName) === 'builtin');
    const users = filtered.filter(entry => categoryOf(entry.moduleName) === 'user');
    const toggle = async (entry) => {
        if (pending.has(entry.entryId))
            return;
        setPending(current => new Set(current).add(entry.entryId));
        setErrors((current) => {
            const next = new Map(current);
            next.delete(entry.entryId);
            return next;
        });
        try {
            const result = await setEnabled(entry.entryId, !entry.enabled);
            if (!result.ok)
                setErrors(current => new Map(current).set(entry.entryId, result.message ?? t('operationError')));
        }
        catch (error) {
            setErrors(current => new Map(current).set(entry.entryId, error instanceof Error ? error.message : String(error)));
        }
        finally {
            setPending((current) => {
                const next = new Set(current);
                next.delete(entry.entryId);
                return next;
            });
            setRequest(value => value + 1);
        }
    };
    const renderEntry = (entry) => {
        const failure = errors.get(entry.entryId);
        const locked = isProtectedModule(entry.moduleName);
        return (_jsxs("li", { className: css.row, "data-plugin-entry": entry.entryId, children: [_jsxs("div", { className: css.rowHead, children: [_jsx("span", { className: css.rowName, title: entry.moduleName, children: moduleShortName(entry.moduleName) }), _jsx("span", { className: css.rowState, "data-enabled": entry.enabled ? 'true' : 'false', children: t(entry.enabled ? 'enabledTag' : 'disabledTag') }), _jsx(Toggle, { checked: entry.enabled, busy: pending.has(entry.entryId), locked: locked, label: t(locked ? 'protected' : entry.enabled ? 'disable' : 'enable'), onToggle: () => { void toggle(entry); } })] }), failure !== undefined ? _jsx("p", { className: css.rowError, role: "alert", children: failure }) : null] }, entry.entryId));
    };
    const total = state.status === 'ready' ? state.snapshot.entries.length : 0;
    const flipCategory = (category) => {
        setExpanded(current => ({ ...current, [category]: !current[category] }));
    };
    return (_jsxs("div", { ref: layerRef, className: wide ? css.layer : css.layer + ' ' + css.rail, children: [open ? (_jsxs("section", { id: panelId, role: "dialog", className: css.panel, "data-plugin-manager": true, "aria-label": t('panel.title'), children: [_jsxs("header", { className: css.header, children: [_jsx("span", { className: css.title, children: t('panel.title') }), _jsx("span", { className: css.count, children: t('panel.count', { count: total }) })] }), _jsxs("label", { className: css.search, children: [_jsx(IconSearchOutline16, { "aria-hidden": "true" }), _jsx("span", { className: css.visuallyHidden, children: t('search') }), _jsx("input", { ref: searchRef, type: "search", value: query, placeholder: t('search'), "aria-label": t('search'), onInput: (event) => { setQuery(event.currentTarget.value); } })] }), _jsxs("div", { className: css.body, children: [state.status === 'loading' ? _jsx("p", { className: css.note, children: t('loading') }) : null, state.status === 'error' ? (_jsxs("div", { className: css.failure, children: [_jsx("p", { role: "alert", children: t('error') }), _jsx("button", { type: "button", onClick: () => { setState({ status: 'loading' }); setRequest(value => value + 1); }, children: t('retry') })] })) : null, state.status === 'ready' && entries.length === 0 ? _jsx("p", { className: css.note, children: t('empty') }) : null, state.status === 'ready' && entries.length > 0 && filtered.length === 0 ? _jsx("p", { className: css.note, children: t('emptySearch') }) : null, state.status === 'ready' && entries.length > 0 && filtered.length > 0 ? (_jsxs(_Fragment, { children: [_jsx(CategorySection, { title: t('panel.builtin'), count: builtins.length, expanded: expanded.builtin, onToggle: () => { flipCategory('builtin'); }, emptyText: t('emptyCategory'), children: builtins.map(renderEntry) }), _jsx(CategorySection, { title: t('panel.user'), count: users.length, expanded: expanded.user, onToggle: () => { flipCategory('user'); }, emptyText: t('emptyCategory'), children: users.map(renderEntry) })] })) : null] })] })) : null, _jsx("div", { className: css.footerButtons, children: _jsxs("button", { type: "button", className: css.badge, "data-active": open || undefined, "aria-label": t('panel.aria'), "aria-expanded": open, "aria-controls": panelId, "aria-haspopup": "dialog", onClick: () => { setOpen(value => !value); }, children: [_jsx(IconPersonalizationOutline16, { size: 16, "aria-hidden": "true" }), wide ? (_jsxs(_Fragment, { children: [_jsx("span", { className: css.badgeLabel, children: t('panel.trigger') }), _jsx("span", { className: css.badgeCount, children: total })] })) : null] }) })] }));
}
//# sourceMappingURL=PluginManagerPanel.js.map