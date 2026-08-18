/** Copy dictionaries for the independent sidebar plugin manager. */

/** Simplified Chinese dictionary and key source of truth. */
export const zh = {
  loading: '正在读取插件…',
  error: '暂时无法读取插件。',
  operationError: '操作失败。',
  retry: '重试',
  search: '搜索插件',
  empty: '暂无插件。',
  emptySearch: '没有匹配的插件。',
  emptyCategory: '暂无',
  enabledTag: '已启用',
  disabledTag: '已停用',
  enable: '启用',
  disable: '停用',
  protected: '受保护插件不能修改',
  'panel.trigger': '插件',
  'panel.title': '插件',
  'panel.aria': '插件',
  'panel.builtin': '系统插件',
  'panel.user': '用户新增',
  'panel.count': '{count} 个插件',
} satisfies Record<string, string>

/** Plugin-manager locale key union. */
export type PluginManagerKey = keyof typeof zh

/** English dictionary checked against the Chinese key set. */
export const en = {
  loading: 'Reading plugins…',
  error: 'Plugins are temporarily unavailable.',
  operationError: 'Operation failed.',
  retry: 'Retry',
  search: 'Search plugins',
  empty: 'No plugins are available.',
  emptySearch: 'No matching plugins.',
  emptyCategory: 'None',
  enabledTag: 'Enabled',
  disabledTag: 'Disabled',
  enable: 'Enable',
  disable: 'Disable',
  protected: 'Protected plugin cannot be changed',
  'panel.trigger': 'Plugins',
  'panel.title': 'Plugins',
  'panel.aria': 'Plugins',
  'panel.builtin': 'System plugins',
  'panel.user': 'User-added plugins',
  'panel.count': '{count} plugins',
} satisfies Record<PluginManagerKey, string>
