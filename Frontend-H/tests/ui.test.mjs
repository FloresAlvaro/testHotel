import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { parse, compileScript } from '@vue/compiler-sfc';
import { renderToString } from '@vue/server-renderer';
import * as Vue from 'vue';
import { createPinia } from 'pinia';

const require = createRequire(import.meta.url);
const source = path => readFileSync(new URL(`../app/${path}`, import.meta.url), 'utf8');
function evaluate(code, globals = {}) {
  const exports = {};
  const compiled = ts.transpileModule(code.replaceAll('import.meta.client', 'true'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(compiled, { exports, require, console, ...Vue, ...globals });
  return exports;
}
function component(path, globals) {
  const { descriptor } = parse(source(path));
  return evaluate(compileScript(descriptor, { id: path, inlineTemplate: true }).content, globals).default;
}
const render = (view, props) => renderToString(Vue.createSSRApp(view, props));

// A small Vue renderer exercises events without requiring a browser or a database.
const renderer = Vue.createRenderer({
  createElement: tag => ({ tag, props: {}, children: [], parent: null }),
  createText: text => ({ text }), createComment: text => ({ text }),
  setText: (node, text) => { node.text = text; },
  setElementText: (node, text) => { node.children = [{ text }]; },
  patchProp: (node, key, _old, value) => { node.props[key] = value; },
  insert: (node, parent, anchor) => {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node);
    node.parent = parent;
  },
  remove: node => { node.parent?.children.splice(node.parent.children.indexOf(node), 1); },
  parentNode: node => node.parent,
  nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1],
});
function find(node, tag) {
  if (node.tag === tag) return node;
  for (const child of node.children || []) { const match = find(child, tag); if (match) return match; }
}

test('CInput forwards native attributes, describes errors and keeps an empty number empty', async () => {
  const input = component('components/common/CInput.vue');
  const html = await render(input, { id: 'amount', modelValue: 5, type: 'number', name: 'amount', min: 1, error: 'Monto inválido' });
  assert.match(html, /<input[^>]*name="amount"[^>]*min="1"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="amount-error"/);
  let emitted;
  const root = { children: [] };
  const app = renderer.createApp(input, { modelValue: 5, type: 'number', 'onUpdate:modelValue': value => { emitted = value; } });
  app.mount(root);
  const node = find(root, 'input');
  node.props.onInput({ target: { value: '' } });
  assert.equal(emitted, '');
  node.props.onInput({ target: { value: '12.5' } });
  assert.equal(emitted, 12.5);
  app.unmount();
});

test('CButton defaults to button and preserves an explicit submit', async () => {
  const button = component('components/common/CButton.vue');
  assert.match(await render(button, {}), /type="button"/);
  assert.match(await render(button, { type: 'submit' }), /type="submit"/);
});

test('CTable handles zero results, loading and errors', async () => {
  const table = component('components/common/CTable.vue');
  const props = { columns: [{ key: 'name', label: 'Nombre', sortable: true }], rows: [], showPagination: true,
    pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
  const empty = await render(table, props);
  assert.match(empty, /Mostrando 0\s*-\s*0\s*de 0/);
  assert.match(empty, /Ordenar por Nombre/);
  assert.match(await render(table, { ...props, loading: true }), /Cargando/);
  assert.match(await render(table, { ...props, error: 'Sin conexión' }), /role="alert"[^>]*>Sin conexión/);
});

test('navigation preserves access by role', () => {
  const { getNavigationItems } = evaluate(source('utils/navigation.ts'));
  const admin = getNavigationItems('admin').map(item => item.id);
  const receptionist = getNavigationItems('receptionist').map(item => item.id);
  assert.ok(admin.includes('users'));
  assert.ok(!getNavigationItems('manager').some(item => item.id === 'users'));
  assert.ok(receptionist.includes('my-reservations'));
  assert.ok(!receptionist.includes('rooms'));
  assert.equal(getNavigationItems().length, 0);
});

test('UI store uses one sidebar state and applies theme at the document root', () => {
  const values = new Map();
  let dark = false;
  const { useUiStore } = evaluate(source('stores/ui.ts'), {
    document: { documentElement: { classList: { toggle: (_name, value) => { dark = value; } } } },
    localStorage: { setItem: (key, value) => values.set(key, value), getItem: key => values.get(key) },
    setTimeout: () => 1,
  });
  const store = useUiStore(createPinia());
  store.closeMobileMenu();
  assert.equal(store.sidebarOpen, false);
  store.toggleSidebar();
  assert.equal(store.mobileMenuOpen, true);
  store.setTheme('dark');
  assert.equal(dark, true);
  assert.equal(values.get('theme'), 'dark');
  store.toggleTheme();
  assert.equal(dark, false);
  store.error('No se pudo guardar', 0);
  assert.equal(store.notifications[0].message, 'No se pudo guardar');
  store.removeNotification(store.notifications[0].id);
  assert.equal(store.notifications.length, 0);
});

test('dialogs trap focus, close on Escape and preserve scroll with nested dialogs', async () => {
  const callbacks = [];
  const cleanup = [];
  const listeners = new Map();
  const document = {
    body: { style: { overflow: 'scroll' } }, activeElement: null,
    addEventListener: (name, handler) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(handler);
    },
    removeEventListener: (name, handler) => listeners.get(name)?.delete(handler),
  };
  class Element {
    constructor(children = []) { this.children = children; this.isConnected = true; }
    querySelectorAll() { return this.children; }
    getClientRects() { return [{}]; }
    closest() { return null; }
    contains(node) { return node === this || this.children.includes(node); }
    focus() {
      document.activeElement = this;
      for (const handler of listeners.get('focusin') || []) handler({ target: this });
    }
  }
  const { useDialogAccessibility } = evaluate(source('composables/useDialogAccessibility.ts'), {
    document, HTMLElement: Element, Node: Element,
    watch: (_source, callback) => { callbacks.push(callback); },
    nextTick: async () => {}, onBeforeUnmount: callback => cleanup.push(callback),
  });
  const trigger = new Element(); trigger.focus();
  const first = new Element(); const last = new Element();
  const dialog = new Element([first, last]);
  let open = true; let closes = 0;
  useDialogAccessibility({ value: dialog }, () => open, () => { closes++; });
  await callbacks[0](true);
  assert.equal(document.activeElement, first);
  assert.equal(document.body.style.overflow, 'hidden');
  let prevented = false;
  for (const handler of listeners.get('keydown')) handler({ key: 'Tab', shiftKey: true, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(document.activeElement, last);
  const nested = new Element([new Element()]);
  useDialogAccessibility({ value: nested }, () => true, () => { closes++; });
  await callbacks[1](true);
  for (const handler of listeners.get('keydown')) handler({ key: 'Escape', preventDefault() {} });
  assert.equal(closes, 1);
  cleanup[1]();
  assert.equal(document.body.style.overflow, 'hidden');
  open = false;
  await callbacks[0](false);
  assert.equal(document.body.style.overflow, 'scroll');
  assert.equal(document.activeElement, trigger);
});

test('room mutations preserve the original error and send one maintenance request', async () => {
  const originalError = new Error('API unavailable');
  let mutations = 0;
  let redundantCalls = 0;
  const { useRooms } = evaluate(source('composables/useRooms.ts'), {
    require: () => ({ useRoomsService: () => ({ markForMaintenance: () => { redundantCalls++; } }) }),
    useRoomsStore: () => ({ createRoom: async () => { throw originalError; }, updateRoomStatus: async () => { mutations++; } }),
    useUiStore: () => ({ success() {}, error() {} }),
  });
  const rooms = useRooms();
  await assert.rejects(rooms.createRoom({ number: '101', room_type_id: 1 }), error => error === originalError);
  await rooms.sendToMaintenance(1);
  assert.equal(mutations, 1);
  assert.equal(redundantCalls, 0);
});
