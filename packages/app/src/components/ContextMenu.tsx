/**
 * Canvas context menu. Adobe-style flyout: aligned icon, label and shortcut
 * columns, checked toggles, nested menus, and keyboard navigation.
 */
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckIcon } from "./Icons.js";

export interface ContextMenuItem {
  id: string;
  label?: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  checked?: boolean;
  header?: boolean;
  separatorBefore?: boolean;
  /** Color dot shown in the icon column. */
  swatch?: string;
  submenu?: ContextMenuItem[];
  onSelect?: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  label: string;
  items: ContextMenuItem[];
  onClose: () => void;
}

const GAP = 8;

function isSelectable(item: ContextMenuItem): boolean {
  return !item.header && !item.disabled;
}

export function ContextMenu({ x, y, label, items, onClose }: ContextMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId();
  const [pos, setPos] = useState({ x, y });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const nextX = Math.min(x, Math.max(GAP, window.innerWidth - box.width - GAP));
    const nextY = Math.min(y, Math.max(GAP, window.innerHeight - box.height - GAP));
    setPos({ x: nextX, y: nextY });
  }, [x, y, items.length]);

  useEffect(() => {
    const first = items.find(isSelectable);
    setActiveId(first?.id ?? null);
    rootRef.current?.focus();
  }, [items]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    const onWindowChange = () => onClose();
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("wheel", onWindowChange, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("wheel", onWindowChange);
    };
  }, [onClose]);

  const move = (direction: 1 | -1) => {
    const selectable = items.filter(isSelectable);
    if (selectable.length === 0) return;
    const index = selectable.findIndex((item) => item.id === activeId);
    const next =
      index < 0
        ? 0
        : (index + direction + selectable.length) % selectable.length;
    setActiveId(selectable[next]!.id);
    setOpenId(null);
  };

  const activate = (item: ContextMenuItem) => {
    if (!isSelectable(item)) return;
    if (item.submenu?.length) {
      setOpenId((current) => (current === item.id ? null : item.id));
      return;
    }
    item.onSelect?.();
    onClose();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        e.preventDefault();
        setActiveId(items.find(isSelectable)?.id ?? null);
        break;
      case "End": {
        e.preventDefault();
        const selectable = items.filter(isSelectable);
        setActiveId(selectable[selectable.length - 1]?.id ?? null);
        break;
      }
      case "ArrowRight": {
        const item = items.find((entry) => entry.id === activeId);
        if (item?.submenu?.length) {
          e.preventDefault();
          setOpenId(item.id);
        }
        break;
      }
      case "ArrowLeft":
        if (openId) {
          e.preventDefault();
          setOpenId(null);
        }
        break;
      case "Enter":
      case " ": {
        const item = items.find((entry) => entry.id === activeId);
        if (item) {
          e.preventDefault();
          activate(item);
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        if (openId) setOpenId(null);
        else onClose();
        break;
      case "Tab":
        onClose();
        break;
      default:
        break;
    }
  };

  const menu = (
    <div
      ref={rootRef}
      className="context-menu"
      role="menu"
      aria-label={label}
      tabIndex={-1}
      style={{ left: pos.x, top: pos.y }}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => {
        if (item.header) {
          return (
            <div key={item.id} className="context-header">
              {item.label}
            </div>
          );
        }
        const active = item.id === activeId;
        const submenuId = `${idPrefix}-${item.id}-submenu`;
        return (
          <div key={item.id}>
            {item.separatorBefore && <div className="context-separator" role="separator" />}
            <button
              type="button"
              id={`${idPrefix}-${item.id}`}
              role={item.checked === undefined ? "menuitem" : "menuitemcheckbox"}
              className={`context-item${active ? " is-active" : ""}${item.danger ? " is-danger" : ""}`}
              aria-disabled={item.disabled || undefined}
              aria-haspopup={item.submenu?.length ? "menu" : undefined}
              aria-expanded={item.submenu?.length ? openId === item.id : undefined}
              aria-controls={openId === item.id ? submenuId : undefined}
              aria-checked={item.checked === undefined ? undefined : item.checked}
              disabled={item.disabled}
              tabIndex={-1}
              onPointerEnter={() => {
                if (!item.disabled) {
                  setActiveId(item.id);
                  setOpenId(item.submenu?.length ? item.id : null);
                }
              }}
              onClick={() => activate(item)}
            >
              <span className="context-icon" aria-hidden="true">
                {item.swatch ? (
                  <span className="context-swatch" style={{ background: item.swatch }} />
                ) : item.checked ? (
                  <span className="context-check"><CheckIcon /></span>
                ) : (
                  item.icon
                )}
              </span>
              <span className="context-label">{item.label}</span>
              {item.shortcut && <span className="context-shortcut">{item.shortcut}</span>}
              {item.submenu?.length ? <span className="context-arrow">›</span> : null}
            </button>
            {item.submenu?.length && openId === item.id && (
              <Submenu
                id={submenuId}
                items={item.submenu}
                flip={pos.x + 240 > window.innerWidth - GAP}
                onSelect={(child) => {
                  child.onSelect?.();
                  onClose();
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return createPortal(menu, document.body);
}

function Submenu({
  id,
  items,
  flip,
  onSelect,
}: {
  id: string;
  items: ContextMenuItem[];
  flip: boolean;
  onSelect: (item: ContextMenuItem) => void;
}) {
  return (
    <div
      id={id}
      className={`context-submenu${flip ? " flips-left" : ""}`}
      role="menu"
    >
      {items.map((item) => (
        <div key={item.id}>
          {item.separatorBefore && <div className="context-separator" role="separator" />}
          <button
            type="button"
            id={`${id}-${item.id}`}
            role={item.checked === undefined ? "menuitem" : "menuitemcheckbox"}
            className={`context-item${item.danger ? " is-danger" : ""}`}
            aria-disabled={item.disabled || undefined}
            aria-checked={item.checked === undefined ? undefined : item.checked}
            disabled={item.disabled}
            tabIndex={-1}
            onClick={() => {
              if (!item.disabled) onSelect(item);
            }}
          >
            <span className="context-icon" aria-hidden="true">
              {item.swatch ? (
                <span className="context-swatch" style={{ background: item.swatch }} />
              ) : item.checked ? (
                <span className="context-check"><CheckIcon /></span>
              ) : (
                item.icon
              )}
            </span>
            <span className="context-label">{item.label}</span>
            {item.shortcut && <span className="context-shortcut">{item.shortcut}</span>}
          </button>
        </div>
      ))}
    </div>
  );
}
