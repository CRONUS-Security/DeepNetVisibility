/**
 * Node type definitions for asset visualization
 */
export const NodeTypes = {
  CIDR: 'cidr',
  SERVER: 'server',
  PERSONAL_COMPUTER: 'pc',
  NETWORK_DEVICE: 'device',
};

/**
 * Server subtypes
 */
export const ServerSubTypes = {
  WEB: 'web',
  DATABASE: 'database',
  DOMAIN_CONTROLLER: 'dc',
  FILE_SERVER: 'file',
  MAIL_SERVER: 'mail',
  OTHER: 'other',
};

/**
 * Device subtypes
 */
export const DeviceSubTypes = {
  ROUTER: 'router',
  SWITCH: 'switch',
  FIREWALL: 'firewall',
  IDS_IPS: 'ids_ips',
  WAF: 'waf',
  OTHER: 'other',
};

/**
 * OS types
 */
export const OSTypes = {
  WINDOWS: 'windows',
  LINUX: 'linux',
  MACOS: 'macos',
  CISCO_IOS: 'ios',
  OTHER: 'other',
};

/**
 * Predefined label categories and options
 */
export const LabelCategories = {
  OS: {
    key: 'os',
    name: 'Operating System',
    options: [
      { value: OSTypes.WINDOWS, label: 'Windows', color: '#0078D4' },
      { value: OSTypes.LINUX, label: 'Linux', color: '#FCC624' },
      { value: OSTypes.MACOS, label: 'macOS', color: '#555555' },
      { value: OSTypes.CISCO_IOS, label: 'Cisco IOS', color: '#1BA0D7' },
    ],
  },
  DOMAIN: {
    key: 'domain',
    name: 'Domain Status',
    options: [
      { value: 'domain_controller', label: 'Domain Controller', color: '#E74C3C' },
      { value: 'domain_member', label: 'Domain Member', color: '#3498DB' },
      { value: 'workgroup', label: 'Workgroup', color: '#95A5A6' },
    ],
  },
  SERVICE: {
    key: 'service',
    name: 'Key Services',
    options: [
      { value: 'exchange', label: 'Exchange Server', color: '#0078D4' },
      { value: 'sqlserver', label: 'SQL Server', color: '#CC2927' },
      { value: 'sharepoint', label: 'SharePoint', color: '#0078D4' },
      { value: 'web_server', label: 'Web Server', color: '#F39C12' },
    ],
  },
  RISK: {
    key: 'risk',
    name: 'Risk Status',
    options: [
      { value: 'compromised', label: 'Compromised', color: '#E74C3C' },
      { value: 'unpatched', label: 'Unpatched', color: '#F39C12' },
      { value: 'exposed', label: 'Exposed', color: '#E67E22' },
      { value: 'secured', label: 'Secured', color: '#27AE60' },
    ],
  },
  CUSTOM: {
    key: 'custom',
    name: 'Custom Tags',
    options: [],
  },
};

/**
 * Asset node structure
 */
export const createNode = (id, type, data = {}) => ({
  id,
  type,
  position: data.position || { x: 0, y: 0 },
  data: {
    label: data.label || '',
    description: data.description || '',
    ip: data.ip || '',
    subType: data.subType || null,
    tags: data.tags || {}, // { categoryKey: ['tagValue1', 'tagValue2'] }
    metadata: data.metadata || {},
  },
});

/**
 * Edge (relationship) structure
 */
export const createEdge = (source, target, data = {}) => ({
  id: `edge-${source}-${target}`,
  source,
  target,
  data: {
    label: data.label || '',
    type: data.type || 'default', // 'connects', 'contains', 'depends_on'
  },
});
